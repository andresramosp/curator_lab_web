<template>
  <div class="main-container" ref="containerRef">
    <!-- Toolbar vertical a la derecha -->
    <div right permanent width="80" class="toolbar">
      <v-select
        v-model="similarityType"
        :items="[
          {
            label: 'General',
            data: { criteria: 'embedding' },
          },
          {
            label: 'Context',
            data: { criteria: 'semantic', fields: ['context'] },
          },
          {
            label: 'Story',
            data: { criteria: 'semantic', fields: ['story'] },
          },
          {
            label: 'Tags',
            data: { criteria: 'tags' },
          },
        ]"
        item-title="label"
        item-value="data"
      ></v-select>
      <v-select v-model="resultLength" :items="[1, 2, 3]"></v-select>
      <v-list dense>
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
            _isPhoto: true, // Propiedad personalizada para identificar la foto
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
              stroke: photo.selected ? secondaryColor : primaryColor,
              strokeWidth: photo.selected ? 4 : 2,
            }"
          />

          <template v-if="photo.showButton">
            <TagPillsCanvas
              v-if="similarityType.criteria === 'tags'"
              :photo="photo"
              :tags="photo.tags"
            />
            <ExpandPhotoButtons
              :photo="photo"
              @click="handleAddPhotoFromPhoto"
            ></ExpandPhotoButtons>
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
import { storeToRefs } from "pinia";
import { useCanvasStore } from "@/stores/canvas";
import { hungarian } from "@/utils/utils";
import TagPillsCanvas from "@/components/canvas/TagPills/TagPillsCanvas.vue";
import ExpandPhotoButtons from "@/components/canvas/ExpandPhotoButtons.vue";

const canvasStore = useCanvasStore();
const { photos } = storeToRefs(canvasStore);

const stageRef = ref(null);
const containerRef = ref(null);
const stageConfig = reactive({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: { x: 1, y: 1 },
  draggable: false,
});
const similarityType = ref({ criteria: "embedding" });
const resultLength = ref(1);

onMounted(() => {
  stageConfig.width = containerRef.value.clientWidth;
  stageConfig.height = containerRef.value.clientHeight;
  orderPhotos();
});

watch(
  () => photos.value.map((p) => p.src),
  (newSources, oldSources) => {
    photos.value.forEach((photo) => {
      if (!photo.image) {
        const [image] = useImage(photo.src);
        photo.image = image;
      }
    });
  },
  { immediate: true }
);

const photoRefs = ref({});
const setPhotoRef = (id) => (el) => {
  if (el) photoRefs.value[id] = el;
};

const theme = useTheme();
const secondaryColor = theme.current.value.colors.secondary;
const primaryColor = theme.current.value.colors.primary;

const mode = ref("select");
watch(mode, (newVal) => {
  stageConfig.draggable = newVal === "move";
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

const handleAddPhotoFromPhoto = async (event) => {
  const { photo, position } = event;
  photo.baseAngleInc = photo.baseAngleInc || 0;
  event.cancelBubble = true;
  const basePosition = { x: photo.config.x, y: photo.config.y };

  // Extraemos el margen y dimensiones de la foto para el offset
  const margin = 35;
  const photoWidth =
    photos.value.length > 0 ? photos.value[0].config.width : 200;
  const photoHeight =
    photos.value.length > 0 ? photos.value[0].config.height : 200;
  const offsetX = photoWidth + margin;
  const offsetY = photoHeight + margin;

  await canvasStore.addPhotosFromPhoto(
    [photo.id],
    similarityType.value,
    resultLength.value,
    basePosition
  );

  nextTick(() => {
    const newPhotos = photos.value.filter((p) => p.config.opacity === 0);
    const count = newPhotos.length;

    newPhotos.forEach((newPhoto, index) => {
      const groupNode = photoRefs.value[newPhoto.id]?.getNode();
      if (!groupNode) return;
      let targetX = basePosition.x;
      let targetY = basePosition.y;

      if (["left", "right", "upper", "bottom"].includes(position)) {
        // Disparo en única dirección (fila india)
        if (position === "left") {
          targetX = basePosition.x - offsetX * (index + 1);
        } else if (position === "right") {
          targetX = basePosition.x + offsetX * (index + 1);
        } else if (position === "upper") {
          targetY = basePosition.y - offsetY * (index + 1);
        } else if (position === "bottom") {
          targetY = basePosition.y + offsetY * (index + 1);
        }
      } else if (
        ["upper-left", "upper-right", "bottom-right", "bottom-left"].includes(
          position
        )
      ) {
        // Disparo diagonal, con casos especiales para 1, 2 y 3 fotos
        if (count === 1) {
          if (position === "upper-left") {
            targetX = basePosition.x - offsetX;
            targetY = basePosition.y - offsetY;
          } else if (position === "upper-right") {
            targetX = basePosition.x + offsetX;
            targetY = basePosition.y - offsetY;
          } else if (position === "bottom-right") {
            targetX = basePosition.x + offsetX;
            targetY = basePosition.y + offsetY;
          } else if (position === "bottom-left") {
            targetX = basePosition.x - offsetX;
            targetY = basePosition.y + offsetY;
          }
        } else if (count === 2) {
          // Primera foto en horizontal, segunda en vertical
          if (index === 0) {
            targetX =
              position === "upper-left" || position === "bottom-left"
                ? basePosition.x - offsetX
                : basePosition.x + offsetX;
            targetY = basePosition.y;
          } else {
            targetX = basePosition.x;
            targetY =
              position === "upper-left" || position === "upper-right"
                ? basePosition.y - offsetY
                : basePosition.y + offsetY;
          }
        } else if (count === 3) {
          // Una diagonal, una horizontal y una vertical
          if (index === 0) {
            if (position === "upper-left") {
              targetX = basePosition.x - offsetX;
              targetY = basePosition.y - offsetY;
            } else if (position === "upper-right") {
              targetX = basePosition.x + offsetX;
              targetY = basePosition.y - offsetY;
            } else if (position === "bottom-right") {
              targetX = basePosition.x + offsetX;
              targetY = basePosition.y + offsetY;
            } else if (position === "bottom-left") {
              targetX = basePosition.x - offsetX;
              targetY = basePosition.y + offsetY;
            }
          } else if (index === 1) {
            targetX =
              position === "upper-left" || position === "bottom-left"
                ? basePosition.x - offsetX
                : basePosition.x + offsetX;
            targetY = basePosition.y;
          } else if (index === 2) {
            targetX = basePosition.x;
            targetY =
              position === "upper-left" || position === "upper-right"
                ? basePosition.y - offsetY
                : basePosition.y + offsetY;
          }
        } else {
          // Para más de 3 fotos, se organiza en un grid
          const cols = Math.ceil(Math.sqrt(count));
          const row = Math.floor(index / cols);
          const col = index % cols;
          if (position === "upper-left") {
            targetX = basePosition.x - offsetX - col * offsetX;
            targetY = basePosition.y - offsetY - row * offsetY;
          } else if (position === "upper-right") {
            targetX = basePosition.x + offsetX + col * offsetX;
            targetY = basePosition.y - offsetY - row * offsetY;
          } else if (position === "bottom-right") {
            targetX = basePosition.x + offsetX + col * offsetX;
            targetY = basePosition.y + offsetY + row * offsetY;
          } else if (position === "bottom-left") {
            targetX = basePosition.x - offsetX - col * offsetX;
            targetY = basePosition.y + offsetY + row * offsetY;
          }
        }
      }

      new Konva.Tween({
        node: groupNode,
        duration: 0.7,
        x: targetX,
        y: targetY,
        opacity: 1,
        easing: Konva.Easings.StrongEaseInOut,
      }).play();

      setTimeout(() => {
        newPhoto.config.x = targetX;
        newPhoto.config.y = targetY;
        newPhoto.config.opacity = 1;
      }, 700);
    });
    photo.baseAngleInc += 30;
  });
};

const handleDeletePhotos = (event) => {
  event.cancelBubble = true;
  canvasStore.deletePhotos();
};

let dragGroupStart = {};
const handleDragStart = (photo, e) => {
  e.cancelBubble = true;
  dragGroupStart = {};
  if (photo.selected) {
    photos.value.forEach((p) => {
      if (p.selected) {
        dragGroupStart[p.id] = { x: p.config.x, y: p.config.y };
      }
    });
  } else {
    dragGroupStart[photo.id] = { x: photo.config.x, y: photo.config.y };
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
  const stage = stageRef.value.getStage();
  const pointer = stage.getPointerPosition();

  // Si el criterio es "tags", verificamos si el puntero está sobre una foto
  if (similarityType.value.criteria === "tags") {
    let shape = stage.getIntersection(pointer);
    let isOverPhoto = false;
    while (shape && shape !== stage) {
      if (shape.getAttr("_isPhoto")) {
        isOverPhoto = true;
        break;
      }
      shape = shape.getParent();
    }
    if (isOverPhoto) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return;
    }
  }

  // Lógica de zoom normal
  const oldScale = stage.scaleX();
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

const orderPhotos = () => {
  const margin = 35;
  if (photos.value.length === 0) return;
  const photoWidth = photos.value[0].config.width;
  const photoHeight = photos.value[0].config.height;
  const columns = Math.floor(stageConfig.width / (photoWidth + margin)) || 1;
  const rows = Math.ceil(photos.value.length / columns);

  // Generamos la lista de posiciones del grid
  const gridPositions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (gridPositions.length < photos.value.length) {
        gridPositions.push({
          x: margin + col * (photoWidth + margin),
          y: margin + row * (photoHeight + margin),
        });
      }
    }
  }

  // Creamos la matriz de costos (distancias)
  const costMatrix = photos.value.map((photo) => {
    return gridPositions.map((pos) => {
      const dx = photo.config.x - pos.x;
      const dy = photo.config.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy);
    });
  });

  // Se obtiene la asignación óptima con el algoritmo húngaro
  const assignments = hungarian(costMatrix);

  // Animamos cada foto a su posición asignada
  assignments.forEach((gridIndex, photoIndex) => {
    const targetPos = gridPositions[gridIndex];
    const photo = photos.value[photoIndex];
    const dx = photo.config.x - targetPos.x;
    const dy = photo.config.y - targetPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5 && photoRefs.value[photo.id]) {
      const groupNode = photoRefs.value[photo.id].getNode();
      new Konva.Tween({
        node: groupNode,
        duration: 0.7,
        x: targetPos.x,
        y: targetPos.y,
        easing: Konva.Easings.StrongEaseInOut,
      }).play();
    }
    photo.config.x = targetPos.x;
    photo.config.y = targetPos.y;
  });
};

// Implementación del algoritmo húngaro para matrices (se rellena con ceros para cuadrar si es necesario)
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
