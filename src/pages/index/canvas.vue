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
          @dragstart="handleDragStart(photo, $event)"
          @dragend="handleDragEnd(photo, $event)"
          @dragmove="handleDragMove(photo, $event)"
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
            <PhotoCanvasButton
              :photo="photo"
              type="delete"
              fill="red"
              icon="X"
              :onClick="handleDeletePhoto"
            />
            <PhotoCanvasButton
              :photo="photo"
              type="add"
              :fill="secondaryColor"
              icon="+"
              :onClick="handleAddPhoto"
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
import axios from "axios";
import PhotoCanvasButton from "@/components/wrappers/PhotoCanvasButton.vue";

const stageRef = ref(null);
const stageConfig = reactive({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: { x: 1, y: 1 },
  draggable: true,
});

const photos = ref([
  {
    id: 103,
    src: `${
      import.meta.env.VITE_API_BASE_URL
    }/uploads/photos/1742647923741-1740648473927-DSC09839.jpg`,
    config: { x: 150, y: 150, width: 150, height: 100 },
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

const handleSelectPhoto = (photo, event) => {
  if (!selectionRect.visible) {
    photo.selected = !photo.selected;
  }
};

// Actualización: se usa axios para obtener fotos del backend
const handleAddPhoto = async (photo, event) => {
  event.cancelBubble = true;
  const offsetX = 75;
  const offsetY = 50;

  // Se obtienen los IDs de las fotos seleccionadas en ese momento
  const selectedPhotoIds = photos.value
    .filter((p) => p.selected)
    .map((p) => p.id);
  if (!selectedPhotoIds.length) selectedPhotoIds.push(photo.id);

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/search/byPhotos`,
      {
        photoIds: selectedPhotoIds,
        criteria: "semantic",
        opposite: false,
        tagsIds: null,
        descriptionCategory: "context",
        iteration: 1,
        pageSize: 1,
        withInsights: false,
      }
    );

    // Se asume que response.data devuelve un objeto o un array de objetos Photo
    const backendPhotos = Array.isArray(response.data)
      ? response.data
      : [response.data];
    backendPhotos.forEach((backendPhoto, index) => {
      const src = `${import.meta.env.VITE_API_BASE_URL}/uploads/photos/${
        backendPhoto.name
      }`;
      const newPhoto = reactive({
        id: backendPhoto.id,
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
    });
  } catch (error) {
    console.error("Error al añadir foto:", error);
  }
};

const handleDeletePhoto = (photo, event) => {
  event.cancelBubble = true;
  photos.value = photos.value.filter((p) => p.id !== photo.id);
};

let dragGroupStart = {};

const handleDragStart = (photo, e) => {
  e.cancelBubble = true;
  if (photo.selected) {
    dragGroupStart = {};
    photos.value.forEach((p) => {
      if (p.selected) {
        dragGroupStart[p.id] = { x: p.config.x, y: p.config.y };
      }
    });
  } else {
    dragGroupStart = { [photo.id]: { x: photo.config.x, y: photo.config.y } };
  }
};

const handleDragMove = (photo, e) => {
  const newX = e.target.x();
  const newY = e.target.y();
  const origin = dragGroupStart[photo.id];
  const deltaX = newX - origin.x;
  const deltaY = newY - origin.y;
  if (photo.selected) {
    photos.value.forEach((p) => {
      if (p.selected && dragGroupStart[p.id]) {
        p.config.x = dragGroupStart[p.id].x + deltaX;
        p.config.y = dragGroupStart[p.id].y + deltaY;
      }
    });
  } else {
    photo.config.x = newX;
    photo.config.y = newY;
  }
};

const handleMouseDown = (e) => {
  const stage = stageRef.value.getStage();
  if (e.target === stage) {
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    selectionStart = transform.point(pointer);
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
  const stage = stageRef.value.getStage();
  const pointer = stage.getPointerPosition();
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = transform.point(pointer);
  selectionRect.width = pos.x - selectionStart.x;
  selectionRect.height = pos.y - selectionStart.y;
};

const handleMouseUp = () => {
  if (!selectionRect.visible) return;
  const rect = {
    x: Math.min(selectionStart.x, selectionStart.x + selectionRect.width),
    y: Math.min(selectionStart.y, selectionStart.y + selectionRect.height),
    width: Math.abs(selectionRect.width),
    height: Math.abs(selectionRect.height),
  };

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

const handleDragEnd = (photo, e) => {};

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
