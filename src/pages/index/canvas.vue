<template>
  <div class="canvas-container">
    <v-stage
      :config="stageConfig"
      ref="stageRef"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      style="border: 1px solid #ccc"
    >
      <v-layer>
        <!-- Rectángulo de selección -->
        <v-rect
          v-if="selectionRect.visible"
          :config="{
            x: selectionRect.x,
            y: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            stroke: secondaryColor,
            dash: [4, 4],
          }"
        />
        <!-- Fotos -->
        <v-group
          v-for="photo in photos"
          :key="photo.id"
          :config="{ x: photo.config.x, y: photo.config.y, draggable: true }"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd(photo, $event)"
          @click="handleSelectPhoto(photo, $event)"
          @mouseover="handleMouseOver(photo)"
          @mouseout="handleMouseOut(photo)"
        >
          <v-image
            :config="{
              x: 0,
              y: 0,
              width: photo.config.width,
              height: photo.config.height,
              image: photo.image,
              stroke: photo.selected ? secondaryColor : undefined,
              strokeWidth: photo.selected ? 4 : 0,
            }"
          />
          <template v-if="photo.showButton">
            <v-rect
              :config="{
                x: photo.config.width - 35,
                y: 5,
                width: 30,
                height: 20,
                fill: 'lightgrey',
                cornerRadius: 5,
              }"
              @click="handleAddPhoto(photo, $event)"
            />
            <v-text
              :config="{
                x: photo.config.width - 35,
                y: 5,
                width: 30,
                height: 20,
                text: '+',
                fontSize: 16,
                align: 'center',
                verticalAlign: 'middle',
              }"
              @click="handleAddPhoto(photo, $event)"
            />
          </template>
        </v-group>
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useImage } from "vue-konva";
import Konva from "konva";
import { useTheme } from "vuetify";

const stageRef = ref(null);
const stageConfig = reactive({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: { x: 1, y: 1 },
  draggable: true,
});

const photos = ref([
  {
    id: 1,
    src: `${
      import.meta.env.VITE_API_BASE_URL
    }/uploads/photos/1742647923741-1740648473927-DSC09839.jpg`,
    config: { x: 50, y: 50, width: 150, height: 100 },
    image: null,
    selected: false,
    showButton: false,
  },
  {
    id: 2,
    src: `${
      import.meta.env.VITE_API_BASE_URL
    }/uploads/photos/1742647923492-1740648472828-DSC07285.jpg`,
    config: { x: 250, y: 100, width: 150, height: 100 },
    image: null,
    selected: false,
    showButton: false,
  },
]);

const imageNames = [
  "1742648875207-DSC02238.jpg",
  "1742648875384-DSC02277.jpg",
  "1742648877582-DSC08287-2.jpg",
  "1742648879121-DSC09856.jpg",
];

const theme = useTheme();
const secondaryColor = theme.current.value.colors.secondary;

onMounted(() => {
  photos.value.forEach((photo) => {
    const [image] = useImage(photo.src);
    photo.image = image;
  });
});

let selectionStart = null;
const selectionRect = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  visible: false,
});

const handleMouseDown = (e) => {
  // Si se hace clic en el fondo (stage), iniciamos la selección
  if (e.target === stageRef.value.getStage()) {
    selectionStart = stageRef.value.getStage().getPointerPosition();
    selectionRect.x = selectionStart.x;
    selectionRect.y = selectionStart.y;
    selectionRect.width = 0;
    selectionRect.height = 0;
    selectionRect.visible = true;
    stageConfig.draggable = false;
  }
};

const handleMouseMove = (e) => {
  if (!selectionRect.visible) return;
  const pos = stageRef.value.getStage().getPointerPosition();
  selectionRect.width = pos.x - selectionStart.x;
  selectionRect.height = pos.y - selectionStart.y;
};

const handleMouseUp = () => {
  if (!selectionRect.visible) return;
  // Normalizamos el rectángulo
  const rect = {
    x: Math.min(selectionStart.x, selectionStart.x + selectionRect.width),
    y: Math.min(selectionStart.y, selectionStart.y + selectionRect.height),
    width: Math.abs(selectionRect.width),
    height: Math.abs(selectionRect.height),
  };

  // Selecciona las fotos que intersectan con el rectángulo
  photos.value.forEach((photo) => {
    const photoRect = {
      x: photo.config.x,
      y: photo.config.y,
      width: photo.config.width,
      height: photo.config.height,
    };
    photo.selected = Konva.Util.haveIntersection(photoRect, rect);
  });
  selectionRect.visible = false;
  stageConfig.draggable = true;
};

const handleSelectPhoto = (photo, event) => {
  // Si no se está dibujando el rectángulo, se alterna la selección con clic
  if (!selectionRect.visible) {
    photo.selected = !photo.selected;
  }
};

const handleAddPhoto = (photo, event) => {
  event.cancelBubble = true;
  const offsetX = 75;
  const offsetY = 50;
  const randomName = imageNames[Math.floor(Math.random() * imageNames.length)];
  const src = `${
    import.meta.env.VITE_API_BASE_URL
  }/uploads/photos/${randomName}`;
  const newPhoto = reactive({
    id: Date.now(),
    src,
    config: {
      x: photo.config.x + offsetX,
      y: photo.config.y + offsetY,
      width: 150,
      height: 100,
    },
    image: null,
    selected: false,
    showButton: false,
  });
  const [image] = useImage(newPhoto.src);
  newPhoto.image = image;
  photos.value.push(newPhoto);
};

const handleDragStart = (e) => {
  e.cancelBubble = true;
};

const handleDragEnd = (photo, e) => {
  photo.config.x = e.target.x();
  photo.config.y = e.target.y();
};

const handleMouseOver = (photo) => {
  photo.showButton = true;
};

const handleMouseOut = (photo) => {
  photo.showButton = false;
};

const handleWheel = (e) => {
  e.evt.preventDefault();
  const stage = stageRef.value.getStage();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  const scaleBy = 1.25;
  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  stage.scale({ x: newScale, y: newScale });
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
  stage.batchDraw();
};
</script>

<style scoped>
.canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.v-stage {
  display: block;
  outline: none;
  border: none !important;
}
</style>
