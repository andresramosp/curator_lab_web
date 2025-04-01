// src/composables/useCanvasPhoto.js
import { reactive } from "vue";
import Konva from "konva";
import { hungarian } from "@/utils/utils";

export function useCanvasPhoto(photos, photoRefs, stageConfig) {
  const dragGroupStart = reactive({});

  const handleSelectPhoto = (photo, event) => {
    if (!selectionRectVisible()) {
      photo.selected = !photo.selected;
    }
    const groupNode = photoRefs.value[photo.id]?.getNode();
    if (groupNode) {
      groupNode.moveToTop();
      groupNode.getLayer().batchDraw();
    }
  };

  // Función auxiliar (si fuese necesario comprobar si el rectángulo de selección está visible)
  const selectionRectVisible = () => {
    // Aquí se podría recibir el estado desde el composable del stage
    return false;
  };

  const handleDragStart = (photo, e) => {
    e.cancelBubble = true;
    // Reiniciamos el objeto de inicio del drag
    Object.keys(dragGroupStart).forEach((key) => delete dragGroupStart[key]);
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

  const handleDragEnd = (photo, e) => {
    // Si se requiere lógica adicional al terminar el drag, se implementa aquí.
  };

  const handleMouseOver = (photo) => {
    photo.hovered = true;
  };

  const handleMouseOut = (photo) => {
    photo.hovered = false;
  };

  const orderPhotos = () => {
    const margin = 35;
    if (photos.value.length === 0) return;
    const photoWidth = photos.value[0].config.width;
    const photoHeight = photos.value[0].config.height;
    const columns = Math.floor(stageConfig.width / (photoWidth + margin)) || 1;
    const rows = Math.ceil(photos.value.length / columns);
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
    const costMatrix = photos.value.map((photo) =>
      gridPositions.map((pos) => {
        const dx = photo.config.x - pos.x;
        const dy = photo.config.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy);
      })
    );
    const assignments = hungarian(costMatrix);
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

  return {
    handleSelectPhoto,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleMouseOver,
    handleMouseOut,
    orderPhotos,
  };
}
