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

    const hoveringTrash = photo.selected
      ? photos.value.some((p) => p.selected && isInTrashZone(p))
      : isInTrashZone(photo);

    isHoveringTrash.value = hoveringTrash;
  };

  function isInTrashZone(photo) {
    const trashEl = document.querySelector(".trash-zone");
    if (!trashEl) return false;

    const trashRect = trashEl.getBoundingClientRect();

    const stage = stageRef.value.getStage();
    const { x, y, width, height } = photo.config;
    const centerKonva = { x: x + width / 2, y: y + height / 2 };
    const centerScreen = stage.getAbsoluteTransform().point(centerKonva);

    const containerRect = stage.container().getBoundingClientRect();
    const screenX = containerRect.left + centerScreen.x;
    const screenY = containerRect.top + centerScreen.y;

    return (
      screenX >= trashRect.left &&
      screenX <= trashRect.right &&
      screenY >= trashRect.top &&
      screenY <= trashRect.bottom
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
    if (photos.value.length === 0) return;
    const photoWidth = photos.value[0].config.width;
    const photoHeight = photos.value[0].config.height;
    const columns =
      Math.floor((stageConfig.width - TOOLBAR_WIDTH) / (photoWidth + margin)) ||
      1;
    const rows = Math.ceil(photos.value.length / columns);
    const gridPositions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (gridPositions.length < photos.value.length) {
          gridPositions.push({
            x: margin + col * (photoWidth + margin) + TOOLBAR_WIDTH,
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
    isHoveringTrash,
  };
}
