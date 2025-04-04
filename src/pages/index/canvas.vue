<template>
  <div class="main-container" ref="containerRef">
    <!-- Toolbar vertical a la derecha -->
    <div right permanent width="80" class="toolbar">
      <v-list dense>
        <v-list-item>
          <v-select
            v-model="similarityType"
            :items="similarityItems"
            item-title="label"
            item-value="data"
          ></v-select>
          <v-select v-model="resultLength" :items="[1, 2, 3, 4, 5]"></v-select>
        </v-list-item>
        <v-list-item>
          <v-switch
            v-model="spreadAligned"
            color="secondary"
            label="Aligned"
          ></v-switch>
        </v-list-item>
        <v-list-item>
          <v-switch
            v-model="opposite"
            color="secondary"
            label="Opposite"
          ></v-switch>
        </v-list-item>
        <v-list-item>
          <v-switch
            v-model="inverted"
            color="secondary"
            label="Inverted"
          ></v-switch>
        </v-list-item>
        <v-list-item>
          <v-btn icon @click="mode = mode === 'move' ? 'select' : 'move'">
            <v-icon v-if="mode === 'move'" size="30">mdi-dots-square</v-icon>
            <v-icon v-else size="30">mdi-pan</v-icon>
          </v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn icon @click="orderPhotos">
            <v-icon size="30">mdi-grid</v-icon>
          </v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn icon @click="handleDeletePhotos">
            <v-icon size="30">mdi-delete</v-icon>
          </v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn icon @click="fitStageToPhotos">
            <v-icon size="30">mdi-crop-free</v-icon>
          </v-btn>
        </v-list-item>
        <v-list-item>
          <!-- Slider de zoom -->
          <v-slider
            v-model="zoom"
            :min="0.5"
            :max="2"
            :step="0.01"
            hide-details
            style="width: 100px"
          ></v-slider>
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
                stroke: photo.selected
                  ? secondaryColor
                  : photo.hovered
                  ? primaryColor
                  : 'gray',
                strokeWidth: photo.selected ? 7 : 2.5,
              }"
            />

            <!-- Tags y botones -->
            <template>
              <PhotoDetectionAreas
                v-if="similarityType.criteria === 'composition'"
                :photo="photo"
                :detections="photo.detectionAreas"
                :visible="photo.hovered"
                >/</PhotoDetectionAreas
              >
              <TagPillsCanvas
                v-if="similarityType.criteria === 'tags'"
                :photo="photo"
                :tags="photo.tags"
                :visible="photo.hovered"
              />
              <ExpandPhotoButtons
                :photo="photo"
                v-if="
                  photo.hovered &&
                  (similarityType.criteria !== 'tags' ||
                    photo.tags.some((t) => t.tag.selected)) &&
                  (similarityType.criteria !== 'composition' ||
                    photo.detectionAreas.some((dt) => dt.selected))
                "
                @click="handleAddPhotoFromPhoto"
              />
            </template>
          </v-group>
        </v-group>
      </v-layer>
    </v-stage>

    <!-- Overlay de spinners -->
    <div v-if="photos.length">
      <div
        class="photo-spinner"
        v-for="photo in photos.filter((p) => p.loading)"
        :key="photo.id"
        :style="{
          position: 'absolute',
          left:
            (photo.config.x + photo.config.width / 2 + 2) * zoom +
            stageOffset.x +
            'px',
          top:
            (photo.config.y + photo.config.height / 2) * zoom +
            stageOffset.y +
            'px',
          transform: 'translate(-41%, -45%)',
          pointerEvents: 'none',
        }"
      >
        <v-progress-circular
          :size="80"
          indeterminate
          color="primary"
        ></v-progress-circular>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useCanvasStage } from "@/composables/canvas/useCanvasStage";
import { useCanvasPhoto } from "@/composables/canvas/useCanvasPhoto";
import { usePhotoAnimations } from "@/composables/canvas/usePhotoAnimations";
import { useTheme } from "vuetify";
import { storeToRefs } from "pinia";
import { useCanvasStore } from "@/stores/canvas";
import TagPillsCanvas from "@/components/canvas/TagPills/TagPillsCanvas.vue";
import ExpandPhotoButtons from "@/components/canvas/ExpandPhotoButtons.vue";
import PhotoDetectionAreas from "@/components/canvas/PhotoDetectionAreas.vue";

const canvasStore = useCanvasStore();
const { photos } = storeToRefs(canvasStore);

const stageRef = ref(null);
const containerRef = ref(null);
const zoom = ref(1);
const mode = ref("move");
const spreadAligned = ref(true);
const opposite = ref(false);
const inverted = ref(false);

const similarityType = ref({ criteria: "embedding" });
const resultLength = ref(1);
const similarityItems = [
  { label: "General", data: { criteria: "embedding" } },
  { label: "Context", data: { criteria: "semantic", fields: ["context"] } },
  { label: "Story", data: { criteria: "semantic", fields: ["story"] } },
  { label: "Tags", data: { criteria: "tags" } },
  { label: "Composition", data: { criteria: "composition" } },
  { label: "Geometrical", data: { criteria: "geometrical" } },
  { label: "Chromatic", data: { criteria: "chromatic" } },
];

const photoRefs = ref({});
const setPhotoRef = (id) => (el) => {
  if (el) photoRefs.value[id] = el;
};

const theme = useTheme();
const secondaryColor = theme.current.value.colors.secondary;
const primaryColor = theme.current.value.colors.primary;

// Composable del stage (se le pasa similarityType para el comportamiento especial en wheel)
const {
  stageConfig,
  stageOffset,
  selectionRect,
  updateStageOffset,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} = useCanvasStage(stageRef, photos, mode, zoom, similarityType);

// Composable de las fotos: eventos de drag, selección, mouseover/out y ordenación
const {
  handleSelectPhoto,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  handleMouseOver,
  handleMouseOut,
  orderPhotos,
} = useCanvasPhoto(photos, photoRefs, stageConfig);

// Composable de animaciones: para disparar tweens
const { animatePhotoGroup, animatePhotoGroupExplosion } = usePhotoAnimations();

// Función para añadir fotos a partir de una foto y disparar animaciones
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
    similarityType.value,
    resultLength.value,
    basePosition,
    opposite.value,
    inverted.value
  );

  if (spreadAligned.value) {
    animatePhotoGroup(
      photoRefs,
      photos,
      basePosition,
      position,
      offsetX,
      offsetY
    );
  } else {
    animatePhotoGroupExplosion(photoRefs, photos, basePosition, position);
  }
};

const fitStageToPhotos = () => {
  if (!photos.value.length) return;

  const stage = stageRef.value.getStage();
  const containerWidth = stage.width();
  const containerHeight = stage.height();
  const margin = 40;
  const extraPaddingRatio = 0.15; // 10% de padding

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
    margin * targetZoom;
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
      zoom.value = targetZoom;
      updateStageOffset();
    },
  }).play();
};

const handleDeletePhotos = (event) => {
  event.cancelBubble = true;
  canvasStore.deletePhotos();
};

onMounted(() => {
  stageConfig.width = containerRef.value.clientWidth;
  stageConfig.height = containerRef.value.clientHeight;
  const stage = stageRef.value.getStage();
  stage.on("dragmove", updateStageOffset);
  orderPhotos();
  updateStageOffset();
});

watch(zoom, (newZoom) => {
  const stage = stageRef.value.getStage();
  const center = { x: stage.width() / 2, y: stage.height() / 2 };
  const oldScale = stage.scaleX();
  const centerPoint = {
    x: (center.x - stage.x()) / oldScale,
    y: (center.y - stage.y()) / oldScale,
  };
  stage.scale({ x: newZoom, y: newZoom });
  const newPos = {
    x: center.x - centerPoint.x * newZoom,
    y: center.y - centerPoint.y * newZoom,
  };
  stage.position(newPos);
  stage.batchDraw();
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
  display: block;
  outline: none;
  border: none !important;
}
.toolbar {
  position: absolute;
  right: 8px;
  z-index: 100;
}
.tags-container {
  position: absolute;
  top: -40px;
  left: 0;
  display: flex;
  flex-wrap: wrap;
}
</style>
