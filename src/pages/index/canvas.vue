<template>
  <div class="canvas-container">
    <!-- Toolbar vertical a la derecha -->
    <div right permanent width="80" class="toolbar">
      <v-list dense>
        <v-list-item>
          <v-btn icon @click="mode = mode === 'move' ? 'select' : 'move'">
            <v-icon v-if="mode === 'move'" size="30">mdi-dots-square</v-icon>
            <v-icon v-else size="30">mdi-pan</v-icon>
          </v-btn>
        </v-list-item>
      </v-list>
    </div>
    <v-stage
      :config="stageConfig"
      ref="stageRef"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
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
          :ref="setPhotoRef(photo.id)"
          :config="{
            x: photo.config.x,
            y: photo.config.y,
            draggable: true,
            zIndex: photo.config.zIndex,
            opacity:
              photo.config.opacity !== undefined ? photo.config.opacity : 1,
          }"
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
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import { useImage } from "vue-konva";
import Konva from "konva";
import { useTheme } from "vuetify";
import axios from "axios";
import PhotoCanvasButton from "@/components/wrappers/PhotoCanvasButton.vue";

const stageRef = ref(null);
const stageConfig = reactive({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: { x: 1.5, y: 1.5 },
  draggable: false,
});

let currentZIndex = 1;

const photos = ref([
  {
    id: 125,
    src: `${
      import.meta.env.VITE_API_BASE_URL
    }/uploads/photos/1743057291726-DSC01069.jpg`,
    config: {
      x: 150,
      y: 100,
      width: 150,
      height: 100,
      opacity: 1,
      zIndex: currentZIndex,
    },
    image: null,
    selected: false,
    showButton: false,
  },
]);

// Referencias para cada v-group
const photoRefs = ref({});
const setPhotoRef = (id) => (el) => {
  if (el) {
    photoRefs.value[id] = el;
  }
};

const theme = useTheme();
const secondaryColor = theme.current.value.colors.secondary;

const mode = ref("select");
watch(mode, (newVal) => {
  stageConfig.draggable = newVal === "move";
});

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
  if (mode.value === "select" && !selectionRect.visible) {
    photo.selected = !photo.selected;
  }
};

const handleAddPhoto = async (photo, event) => {
  event.cancelBubble = true;
  const offsetX = 75;
  const offsetY = 50;

  // IDs de las fotos seleccionadas o la foto actual
  const selectedPhotoIds = photos.value
    .filter((p) => p.selected)
    .map((p) => p.id);
  if (!selectedPhotoIds.length) selectedPhotoIds.push(photo.id);

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/search/byPhotos`,
      {
        photoIds: selectedPhotoIds,
        currentPhotosIds: photos.value.map((p) => p.id),
        criteria: "semantic",
        opposite: false,
        tagsIds: null,
        descriptionCategory: "context",
        iteration: 1,
        pageSize: 1,
        withInsights: false,
      }
    );

    const backendPhotos = Array.isArray(response.data)
      ? response.data
      : [response.data];

    const newPhotosInfo = [];
    backendPhotos.forEach((backendPhoto, index) => {
      const src = `${import.meta.env.VITE_API_BASE_URL}/uploads/photos/${
        backendPhoto.name
      }`;
      currentZIndex++;
      const newPhoto = reactive({
        id: backendPhoto.id,
        src,
        config: {
          // Inicia en la posición de la carta principal con opacidad 0
          x: photo.config.x,
          y: photo.config.y,
          width: 150,
          height: 100,
          opacity: 0,
          zIndex: currentZIndex,
        },
        image: null,
        selected: false,
        showButton: false,
      });
      const [image] = useImage(newPhoto.src);
      newPhoto.image = image;
      photos.value.push(newPhoto);
      newPhotosInfo.push({ id: newPhoto.id, index });
    });

    // nextTick(() => {
    //   newPhotosInfo.forEach(({ id, index }) => {
    //     const groupNode = photoRefs.value[id].getNode();
    //     const targetX = photo.config.x + offsetX * (index + 1);
    //     const targetY = photo.config.y + offsetY * (index + 1);
    //     new Konva.Tween({
    //       node: groupNode,
    //       duration: 0.5,
    //       x: targetX,
    //       y: targetY,
    //       opacity: 1,
    //       easing: Konva.Easings.StrongEaseInOut,
    //     }).play();
    //   });
    // });
    nextTick(() => {
      const baseAngle = Math.PI / 4; // 45° hacia abajo-derecha
      const spread = Math.PI / 5; // separación angular entre fotos
      newPhotosInfo.forEach(({ id, index }) => {
        const groupNode = photoRefs.value[id].getNode();
        const totalPhotos = newPhotosInfo.length;
        // Centramos el abanico restando la mitad de las fotos
        const angle = baseAngle + (index - (totalPhotos - 1) / 2) * spread;
        const distance = 200; // distancia a la que se despliegan
        const targetX = photo.config.x + Math.cos(angle) * distance;
        const targetY = photo.config.y + Math.sin(angle) * distance;
        new Konva.Tween({
          node: groupNode,
          duration: 0.7,
          x: targetX,
          y: targetY,
          opacity: 1,
          easing: Konva.Easings.StrongEaseInOut,
        }).play();
      });
    });
  } catch (error) {
    console.error("Error al añadir foto:", error);
  }
};

const handleDeletePhoto = (photo, event) => {
  event.cancelBubble = true;
  if (photo.selected) {
    photos.value = photos.value.filter((p) => !p.selected);
  } else {
    photos.value = photos.value.filter((p) => p.id !== photo.id);
  }
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
  if (mode.value !== "select") return;
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
  if (mode.value !== "select" || !selectionRect.visible) return;
  const stage = stageRef.value.getStage();
  const pointer = stage.getPointerPosition();
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = transform.point(pointer);
  selectionRect.width = pos.x - selectionStart.x;
  selectionRect.height = pos.y - selectionStart.y;
};

const handleMouseUp = () => {
  if (mode.value !== "select" || !selectionRect.visible) return;
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
  stageConfig.draggable = mode.value === "move";
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
.toolbar {
  position: absolute;
  top: 75px;
  right: 10px;
  z-index: 100;
}
</style>
