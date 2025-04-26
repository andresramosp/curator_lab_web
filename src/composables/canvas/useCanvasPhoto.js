import { reactive, ref } from "vue";
import Konva from "konva";
import { hungarian } from "@/utils/utils";
import { useCanvasStore } from "@/stores/canvas";
import { TOOLBAR_WIDTH } from "./useCanvasStage";

export function useCanvasPhoto(stageRef, photos, photoRefs, stageConfig) {
  const dragGroupStart = reactive({});
  const hoverTimeouts = reactive({});
  const canvasStore = useCanvasStore();

  const isHoveringTrash = ref(false);

  const handleSelectPhoto = (photo, event) => {
    if (!selectionRectVisible()) {
      photo.selected = !photo.selected;
    }
  };

  const selectionRectVisible = () => false;

  const handleDragStart = (photo, e) => {
    e.cancelBubble = true;

    const moveGroupToTop = (p) => {
      const node = photoRefs.value[p.id]?.getNode();
      if (node) node.moveToTop();
    };

    Object.keys(dragGroupStart).forEach((key) => delete dragGroupStart[key]);

    if (photo.selected) {
      photos.value.forEach((p) => {
        if (p.selected) {
          dragGroupStart[p.id] = { x: p.config.x, y: p.config.y };
          moveGroupToTop(p);
        }
      });
    } else {
      dragGroupStart[photo.id] = { x: photo.config.x, y: photo.config.y };
      moveGroupToTop(photo);
    }

    photoRefs.value[photo.id]?.getNode()?.getLayer()?.batchDraw();
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

    const anyInTrash = photo.selected
      ? photos.value.some((p) => p.selected && isInTrashZone(p))
      : isInTrashZone(photo);

    isHoveringTrash.value = anyInTrash;

    photos.value.forEach((p) => {
      if (photo.selected) {
        p.inTrash = p.selected && anyInTrash;
      } else {
        p.inTrash = p.id === photo.id && anyInTrash;
      }
    });
  };

  function isInTrashZone(photo) {
    const trashEl = document.querySelector(".trash-zone");
    if (!trashEl) return false;

    const trashRect = trashEl.getBoundingClientRect();

    // Expandimos la zona virtual de la papelera
    const margin = 30; // píxeles extra de margen de detección

    const expandedRect = {
      left: trashRect.left - margin,
      right: trashRect.right + margin,
      top: trashRect.top - margin,
      bottom: trashRect.bottom + margin,
    };

    const stage = stageRef.value.getStage();
    const { x, y, width, height } = photo.config;
    const centerKonva = { x: x + width / 2, y: y + height / 2 };
    const centerScreen = stage.getAbsoluteTransform().point(centerKonva);

    const containerRect = stage.container().getBoundingClientRect();
    const screenX = containerRect.left + centerScreen.x;
    const screenY = containerRect.top + centerScreen.y;

    return (
      screenX >= expandedRect.left &&
      screenX <= expandedRect.right &&
      screenY >= expandedRect.top &&
      screenY <= expandedRect.bottom
    );
  }

  const handleDragEnd = (photo, evt) => {
    const node = evt.target;
    const newPos = node.position();
    photo.config.x = newPos.x;
    photo.config.y = newPos.y;

    let photosToRemove = [];

    if (photo.selected) {
      const selectedPhotos = photos.value.filter((p) => p.selected);

      // Si al menos una está dentro → se eliminan todas las seleccionadas
      const anyInTrash = selectedPhotos.some((p) => isInTrashZone(p));
      if (anyInTrash) {
        photosToRemove = selectedPhotos;
      }
    } else {
      if (isInTrashZone(photo)) {
        photosToRemove = [photo];
      }
    }

    if (photosToRemove.length) {
      canvasStore.deletePhotos(photosToRemove.map((p) => p.id));
      isHoveringTrash.value = false;
    }
  };

  const handleMouseOver = (photo) => {
    // Cancelar su propio timeout si estaba en curso
    if (hoverTimeouts[photo.id]) {
      clearTimeout(hoverTimeouts[photo.id]);
      hoverTimeouts[photo.id] = null;
    }

    // Desactivar hovered en otras fotos (y cancelar sus timeouts)
    photos.value.forEach((p) => {
      if (p.id !== photo.id) {
        if (hoverTimeouts[p.id]) {
          clearTimeout(hoverTimeouts[p.id]);
          hoverTimeouts[p.id] = null;
        }
        if (p.hovered) {
          p.hovered = false;
        }
      }
    });

    // Activar hovered en esta foto
    photo.hovered = true;
  };

  const handleMouseOut = (photo) => {
    // Si ya hay un timeout, lo cancelamos por seguridad
    if (hoverTimeouts[photo.id]) clearTimeout(hoverTimeouts[photo.id]);

    // Programamos desactivar hovered después del delay
    hoverTimeouts[photo.id] = setTimeout(() => {
      photo.hovered = false;
      hoverTimeouts[photo.id] = null;
    }, 250); // o el tiempo que quieras
  };

  const orderPhotos = () => {
    const margin = 35;
    // Seleccionar fotos
    const toOrder = photos.value.filter((p) => p.selected);
    const items = toOrder.length > 0 ? toOrder : photos.value;
    if (!items.length) return;

    // Calcular centroide
    const centroid = items.reduce(
      (acc, p) => {
        acc.x += p.config.x;
        acc.y += p.config.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    centroid.x /= items.length;
    centroid.y /= items.length;

    const w = items[0].config.width;
    const h = items[0].config.height;
    const cols = Math.max(
      1,
      Math.floor((stageConfig.width - TOOLBAR_WIDTH) / (w + margin))
    );
    const rows = Math.ceil(items.length / cols);

    // Tamaño total de la grilla
    const gridW = cols * w + (cols - 1) * margin;
    const gridH = rows * h + (rows - 1) * margin;

    // Punto de inicio (esquina superior izquierda) centrado en el centroide
    const startX = centroid.x - gridW / 2 + TOOLBAR_WIDTH;
    const startY = centroid.y - gridH / 2;

    // Generar posiciones
    const gridPositions = [];
    for (let row = 0; row < rows; row++) {
      for (
        let col = 0;
        col < cols && gridPositions.length < items.length;
        col++
      ) {
        gridPositions.push({
          x: startX + col * (w + margin),
          y: startY + row * (h + margin),
        });
      }
    }

    // Matriz de coste y asignaciones
    const cost = items.map((p) =>
      gridPositions.map((pos) => {
        const dx = p.config.x - pos.x,
          dy = p.config.y - pos.y;
        return Math.hypot(dx, dy);
      })
    );
    const assign = hungarian(cost);

    // Animar y actualizar posiciones
    assign.forEach((gi, idx) => {
      const p = items[idx],
        pos = gridPositions[gi];
      if (
        Math.hypot(p.config.x - pos.x, p.config.y - pos.y) > 5 &&
        photoRefs.value[p.id]
      ) {
        new Konva.Tween({
          node: photoRefs.value[p.id].getNode(),
          duration: 0.7,
          x: pos.x,
          y: pos.y,
          easing: Konva.Easings.StrongEaseInOut,
        }).play();
      }
      p.config.x = pos.x;
      p.config.y = pos.y;
    });
  };

  const autoAlignPhotos = () => {
    const threshold = 50; // cuánto margen permitimos para decir que están "casi alineados"
    for (let i = 0; i < photos.value.length; i++) {
      for (let j = i + 1; j < photos.value.length; j++) {
        const photoA = photos.value[i];
        const photoB = photos.value[j];

        const dx = Math.abs(photoA.config.x - photoB.config.x);
        const dy = Math.abs(photoA.config.y - photoB.config.y);

        if (dx < threshold) {
          // Alinear verticalmente
          const targetX = Math.round((photoA.config.x + photoB.config.x) / 2);
          movePhotoSmoothly(photoA, targetX, photoA.config.y);
          movePhotoSmoothly(photoB, targetX, photoB.config.y);
        }

        if (dy < threshold) {
          // Alinear horizontalmente
          const targetY = Math.round((photoA.config.y + photoB.config.y) / 2);
          movePhotoSmoothly(photoA, photoA.config.x, targetY);
          movePhotoSmoothly(photoB, photoB.config.x, targetY);
        }
      }
    }
  };

  const movePhotoSmoothly = (photo, targetX, targetY) => {
    if (!photoRefs.value[photo.id]) return;
    const node = photoRefs.value[photo.id].getNode();
    new Konva.Tween({
      node,
      duration: 0.5,
      x: targetX,
      y: targetY,
      easing: Konva.Easings.StrongEaseInOut,
    }).play();
    photo.config.x = targetX;
    photo.config.y = targetY;
  };

  const bringPhotosToFront = (photoList) => {
    photoList.forEach((photo) => {
      const node = photoRefs.value[photo.id]?.getNode();
      if (node) node.moveToTop();
    });
    const anyNode = photoRefs.value[photoList[0]?.id]?.getNode();
    if (anyNode) anyNode.getLayer().batchDraw();
  };

  return {
    handleSelectPhoto,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleMouseOver,
    handleMouseOut,
    orderPhotos,
    autoAlignPhotos,
    isHoveringTrash,
  };
}
