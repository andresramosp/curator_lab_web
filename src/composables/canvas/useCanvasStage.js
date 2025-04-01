// src/composables/useCanvasStage.js
import { reactive, watch } from "vue";
import Konva from "konva";

export function useCanvasStage(stageRef, photos, mode, zoom, similarityType) {
  const stageConfig = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: { x: 1, y: 1 },
    draggable: false,
  });

  watch(
    mode,
    (newVal) => {
      stageConfig.draggable = newVal === "move";
    },
    { immediate: true }
  );

  const stageOffset = reactive({ x: 0, y: 0 });
  const selectionRect = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  let selectionStart = null;

  const updateStageOffset = () => {
    const stage = stageRef.value?.getStage();
    if (stage) {
      zoom.value = stage.scaleX();
      stageOffset.x = stage.x();
      stageOffset.y = stage.y();
    }
  };

  const handleWheel = (e) => {
    const stage = stageRef.value.getStage();
    const pointer = stage.getPointerPosition();
    // Si el criterio es "tags", evitamos el zoom si el puntero está sobre una foto
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
    const oldScale = stage.scaleX();
    const scaleBy = 1.11;
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
    updateStageOffset();
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

  return {
    stageConfig,
    stageOffset,
    selectionRect,
    updateStageOffset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
