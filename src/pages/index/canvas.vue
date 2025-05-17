<template>
  <div class="canvas-container">
    <!-- Toolbar vertical a la derecha -->
    <div class="toolbar">
      <CanvasToolbar
        v-model="toolbarState"
        @clearCanvas="handleClearCanvas"
        @openDialog="dialogVisible = true"
      />
    </div>
    <div ref="containerRef" class="canvas-wrapper">
      <!-- Floating Controls -->
      <div class="floating-controls">
        <v-btn @click="zoomTick(1)" icon size="small" class="outline">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn @click="zoomTick(-1)" icon size="small" class="outline">
          <v-icon>mdi-minus</v-icon>
        </v-btn>
        <v-btn @click="fitStageToPhotos" icon size="small" class="outline">
          <v-icon>mdi-crop-free</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          class="outline"
          @click="
            toolbarState.mouseMode =
              toolbarState.mouseMode === 'move' ? 'select' : 'move'
          "
        >
          <v-icon>
            {{
              toolbarState.mouseMode === "move"
                ? "mdi-cursor-move"
                : "mdi-selection-drag"
            }}
          </v-icon>
        </v-btn>
      </div>

      <v-stage
        :config="stageConfig"
        ref="stageRef"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        :style="{
          cursor:
            toolbarState.mouseMode === 'move'
              ? 'grab'
              : toolbarState.mouseMode === 'select'
              ? 'crosshair'
              : 'default',
        }"
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
              opacity: photo.config.opacity ?? 1,
              _isPhoto: true,
            }"
            @dragstart="handleDragStart(photo, $event)"
            @dragend="handleDragEnd(photo, $event)"
            @dragmove="handleDragMove(photo, $event)"
            @click="handleSelectPhoto(photo, $event)"
          >
            <v-group
              :config="{}"
              @mouseover="handleMouseOver(photo)"
              @mouseout="handleMouseOut(photo)"
            >
              <!-- Área de hover con padding invisible -->
              <v-rect
                :config="{
                  x: -10,
                  y: -10,
                  width: photo.config.width + 20,
                  height: photo.config.height + 20,
                  fill: 'transparent',
                }"
              />

              <!-- Imagen -->
              <v-image
                :config="{
                  x: 0,
                  y: 0,
                  width: photo.config.width,
                  height: photo.config.height,
                  image: photo.image,
                  stroke: getPhotoStrokeColor(photo),
                  strokeWidth: photo.selected ? 7 : 2.5,
                }"
              />
              <!-- Spinner de carga -->
              <v-group
                v-if="photo.loading"
                :config="{
                  x: photo.config.width / 2,
                  y: photo.config.height / 2,
                  opacity: 0.7,
                }"
                ref="spinnerRefs"
              >
                <v-arc
                  :config="{
                    innerRadius: 15,
                    outerRadius: 45,
                    angle: 270,
                    fill: 'transparent',
                    stroke: 'white',
                    strokeWidth: 3,
                    rotation: photo.spinnerRotation || 0,
                  }"
                />
              </v-group>
              <!-- Filtro rojo pre-borrado -->
              <v-rect
                v-if="photo.inTrash"
                :config="{
                  x: 0,
                  y: 0,
                  width: photo.config.width,
                  height: photo.config.height,
                  fill: 'rgba(255, 0, 0, 0.3)',
                }"
              />
              <!-- Tags y botones -->
              <template>
                <PhotoDetectionAreas
                  v-if="
                    toolbarState.expansion.type.criteria === 'composition' &&
                    photo.hovered
                  "
                  :photo="photo"
                  :detectionAreas="photo.detectionAreas"
                  :visible="photo.hovered"
                  >/</PhotoDetectionAreas
                >
                <TagPillsCanvas
                  v-if="
                    toolbarState.expansion.type.criteria === 'tags' &&
                    photo.hovered
                  "
                  :photo="photo"
                  :tags="photo.tags"
                  :visible="photo.hovered"
                />
                <ExpandPhotoButtons
                  :photo="photo"
                  :enableDiagonal="
                    toolbarState.photoOptions.spreadMode === 'circular'
                  "
                  v-if="
                    !photo.inTrash &&
                    photo.hovered &&
                    (toolbarState.expansion.type.criteria !== 'tags' ||
                      photo.tags.some((t) => t.tag.selected)) &&
                    (toolbarState.expansion.type.criteria !== 'composition' ||
                      photo.detectionAreas.some((dt) => dt.selected))
                  "
                  @click="handleAddPhotoFromPhoto"
                  :sizeFactor="dynamicSizeFactor"
                />
              </template>
            </v-group>
          </v-group>
        </v-layer>
      </v-stage>
    </div>

    <PhotoDialogCanvas
      v-model="dialogVisible"
      :isTrash="false"
      @add-photos="handleAddPhotos"
    />
    <PhotoDialogCanvas
      v-model="dialogTrashVisible"
      :isTrash="true"
      @add-photos="handleAddPhotos"
    />
    <div
      @click="dialogTrashVisible = true"
      :class="['trash-zone', { hovering: isHoveringTrash }]"
    >
      🗑️
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "CanvasPage" });

import { ref, onMounted, watch, computed } from "vue";
import {
  useCanvasStage,
  TOOLBAR_WIDTH,
  applyZoom,
} from "@/composables/canvas/useCanvasStage";
import { useCanvasPhoto } from "@/composables/canvas/useCanvasPhoto";
import { usePhotoAnimations } from "@/composables/canvas/usePhotoAnimations";
import { useTheme } from "vuetify";
import { storeToRefs } from "pinia";
import { useCanvasStore } from "@/stores/canvas";
import TagPillsCanvas from "@/components/canvas/TagPills/TagPillsCanvas.vue";
import ExpandPhotoButtons from "@/components/canvas/ExpandPhotoButtons.vue";
import PhotoDetectionAreas from "@/components/canvas/PhotoDetectionAreas.vue";
import CanvasToolbar from "@/components/canvas/CanvasToolbar.vue";
import PhotoDialogCanvas from "@/components/canvas/PhotoDialogCanvas.vue";
import { usePhotosStore } from "@/stores/photos";
import Konva from "konva";

const canvasStore = useCanvasStore();
const photosStore = usePhotosStore();
const { photos } = storeToRefs(canvasStore);

const toolbarState = ref({
  mouseMode: "move",
  zoomLevel: 0,
  expansion: {
    type: { criteria: "embedding" },
    inverted: false,
    opposite: false,
  },
  photoOptions: {
    count: 1,
    spreadMode: "perpendicular",
  },
});

const stageRef = ref(null);
const containerRef = ref(null);

const photoRefs = ref({});
const setPhotoRef = (id) => (el) => {
  if (el) photoRefs.value[id] = el;
};
const dialogVisible = ref(false);
const dialogTrashVisible = ref(false);

const theme = useTheme();
const secondaryColor = theme.current.value.colors.secondary;
const primaryColor = theme.current.value.colors.primary;

const {
  stageConfig,
  stageOffset,
  selectionRect,
  updateStageOffset,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} = useCanvasStage(stageRef, photos, toolbarState);

const {
  handleSelectPhoto,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  handleMouseOver,
  handleMouseOut,
  orderPhotos,
  autoAlignPhotos,
  isHoveringTrash,
} = useCanvasPhoto(stageRef, photos, photoRefs, stageConfig);

const { animatePhotoGroup, animatePhotoGroupExplosion } = usePhotoAnimations();

const dynamicSizeFactor = computed(() => {
  const baseSize = 1.25;
  const zoom = toolbarState.value.zoomLevel || 100;
  let newFactor = baseSize * (0.8 / zoom);
  return Math.min(Math.max(newFactor, 1), 5);
});

const handleAddPhotoFromPhoto = async (event) => {
  const { photo, position } = event;
  event.cancelBubble = true;
  const basePosition = { x: photo.config.x, y: photo.config.y };

  // Extraemos el margen y dimensiones para calcular offset
  const margin = 35;
  const photoWidth =
    photos.value.length > 0 ? photos.value[0].config.width : 200;
  const photoHeight =
    photos.value.length > 0 ? photos.value[0].config.height : 200;
  const offsetX = photoWidth + margin;
  const offsetY = photoHeight + margin;

  await canvasStore.addPhotosFromPhoto(
    [photo],
    toolbarState.value.expansion.type,
    toolbarState.value.photoOptions.count,
    basePosition,
    toolbarState.value.expansion.opposite,
    toolbarState.value.expansion.inverted
  );

  if (
    toolbarState.value.photoOptions.spreadMode == "linear" ||
    toolbarState.value.photoOptions.spreadMode == "perpendicular"
  ) {
    animatePhotoGroup(
      photoRefs,
      photos,
      basePosition,
      position,
      offsetX,
      offsetY,
      toolbarState.value.photoOptions.spreadMode
    );
  } else {
    animatePhotoGroupExplosion(photoRefs, photos, basePosition, position);
  }
};

const getPhotoStrokeColor = (photo) => {
  if (photo.inTrash) return "rgba(250, 11, 11, 0.5)";
  if (photo.selected) return secondaryColor;
  if (photo.hovered) return primaryColor;
  return "gray";
};

const handleClearCanvas = () => {
  // Limpiar fotos y descartados
  canvasStore.$patch({ photos: [] });
  canvasStore.$patch({ discardedPhotos: [] });

  // Resetear zoom y posición del stage
  const stage = stageRef.value.getStage();
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();

  // Resetear el zoomLevel del estado
  toolbarState.value.zoomLevel = 1;

  // Resetear offset
  updateStageOffset();
};

const fitStageToPhotos = () => {
  if (!photos.value.length) return;

  const stage = stageRef.value.getStage();
  const containerWidth = stage.width() - TOOLBAR_WIDTH; // Restamos el ancho de la toolbar
  const containerHeight = stage.height();
  const margin = 40;
  const extraPaddingRatio = 0.1; // 10% de padding

  // Bounding box de todas las fotos
  const bounds = photos.value.reduce(
    (acc, p) => {
      const { x, y, width, height } = p.config;
      acc.minX = Math.min(acc.minX, x);
      acc.minY = Math.min(acc.minY, y);
      acc.maxX = Math.max(acc.maxX, x + width);
      acc.maxY = Math.max(acc.maxY, y + height);
      return acc;
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );

  // Añadir padding adicional
  const paddingX = (bounds.maxX - bounds.minX) * extraPaddingRatio;
  const paddingY = (bounds.maxY - bounds.minY) * extraPaddingRatio;
  bounds.minX -= paddingX;
  bounds.maxX += paddingX;
  bounds.minY -= paddingY;
  bounds.maxY += paddingY;

  const photosWidth = bounds.maxX - bounds.minX + margin * 2;
  const photosHeight = bounds.maxY - bounds.minY + margin * 2;
  const targetZoom = Math.min(
    containerWidth / photosWidth,
    containerHeight / photosHeight,
    2
  );

  const targetX =
    (containerWidth - photosWidth * targetZoom) / 2 -
    bounds.minX * targetZoom +
    margin * targetZoom +
    TOOLBAR_WIDTH / 2; // Ajustamos el offset para centrar en el espacio disponible
  const targetY =
    (containerHeight - photosHeight * targetZoom) / 2 -
    bounds.minY * targetZoom +
    margin * targetZoom;

  // Tween para animar el zoom y el desplazamiento
  new Konva.Tween({
    node: stage,
    scaleX: targetZoom,
    scaleY: targetZoom,
    x: targetX,
    y: targetY,
    duration: 0.4,
    easing: Konva.Easings.EaseInOut,
    onFinish: () => {
      toolbarState.value.zoomLevel = targetZoom;
      updateStageOffset();
    },
  }).play();
};
async function handleAddPhotos(photoIds) {
  // Fetch todas las fotos necesarias en paralelo
  await Promise.all(photoIds.map((id) => photosStore.fetchPhoto(id)));

  const photosToAdd = photoIds
    .map((id) => photosStore.photos.find((p) => p.id === id))
    .filter(Boolean);

  canvasStore.addPhotos(photosToAdd);
  fitStageToPhotos();
}

function zoomTick(direction = 1) {
  const stage = stageRef.value.getStage();
  const scaleBy = 1.11;

  const oldScale = stage.scaleX();
  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  const pointer = {
    x: stage.width() / 2,
    y: stage.height() / 2,
  };

  applyZoom(stage, newScale, updateStageOffset, pointer);
}

onMounted(() => {
  stageConfig.width = containerRef.value.clientWidth;
  stageConfig.height = containerRef.value.clientHeight - 64; // restamos height del header
  const stage = stageRef.value.getStage();
  stage.on("dragmove", updateStageOffset);
  orderPhotos();
  updateStageOffset();
});

watch(
  () => photos.value.map((p) => p.src),
  () => {
    photos.value.forEach((photo) => {
      if (!photo.image) {
        const img = new Image();
        img.src = photo.src;
        photo.image = img;
      }
    });
  },
  { immediate: true }
);
</script>

<style scoped>
.v-stage {
  /* display: block; */
  outline: none;
  border: none !important;
}
.canvas-container {
  display: flex;
  width: 100%;
  height: 100%;
}
.toolbar {
  z-index: 200;
  display: flex;
  width: v-bind(TOOLBAR_WIDTH + "px");
  flex-shrink: 0;
}
.canvas-wrapper {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}
.tags-container {
  position: absolute;
  top: -40px;
  left: 0;
  display: flex;
  flex-wrap: wrap;
}
.trash-zone {
  position: absolute;
  width: 100px;
  height: 100px;
  bottom: 0px;
  display: flex;
  right: 1px;
  /* background-color: rgba(255, 0, 0, 0.1); */
  /* border: 1px solid rgba(250, 11, 11, 0.5); */
  border-radius: 8px;
  font-size: 40px;
  text-align: center;
  align-items: center;
  line-height: 90px;

  transition: background-color 0.2s, border-color 0.2s, transform 0.2s ease;
  transform: rotate(0deg) scale(1);
  align-content: center;
  justify-content: center;
  cursor: pointer;
}

.trash-zone.hovering {
  background-color: rgba(255, 0, 0, 0.25);
  border-color: darkred;
  transform: rotate(8deg) scale(1.08);
  transition: transform 0.2s ease, background-color 0.2s ease,
    border-color 0.2s ease;
}

.floating-controls {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  z-index: 300;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px;
}

.control-btn {
  min-width: 36px;
  height: 36px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
