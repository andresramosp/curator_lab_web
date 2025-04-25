// src/composables/useCanvasStage.js
import { reactive, watch, watchPostEffect } from "vue";
import Konva from "konva";

const TOOLBAR_WIDTH = 260;

export { TOOLBAR_WIDTH };

export function useCanvasStage(stageRef, photos, toolbarState) {
  const stageConfig = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: { x: 1, y: 1 },
    draggable: false,
  });

  const stageOffset = reactive({ x: 0, y: 0 });
  const selectionRect = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  let selectionStart = null;

  watch(
    () => toolbarState.value.mouseMode,
    (newVal) => {
      stageConfig.draggable = newVal === "move";
    },
    { immediate: true }
  );

  const updateStageOffset = () => {
    const stage = stageRef.value?.getStage();
    if (stage) {
      toolbarState.value.zoomLevel = stage.scaleX(); // sincroniza zoom en ambos sentidos
      stageOffset.x = stage.x();
      stageOffset.y = stage.y();
    }
  };

  const handleWheel = (e) => {
    const stage = stageRef.value.getStage();
    const pointer = stage.getPointerPosition();

    const { criteria } = toolbarState.value.expansion.type;
    if (criteria === "tags" && isHoverPhoto()) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return;
    }

    e.evt.preventDefault();

    const oldScale = stage.scaleX();
    const scaleBy = 1.11;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    applyZoom(stage, newScale, updateStageOffset, pointer);
  };

  const handleMouseDown = (e) => {
    if (toolbarState.value.mouseMode !== "select" && !isHoverPhoto()) {
      photos.value.forEach((photo) => {
        photo.selected = false;
      });
      return;
    }

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
    if (toolbarState.value.mouseMode !== "select" || !selectionRect.visible)
      return;

    const stage = stageRef.value.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(pointer);

    selectionRect.width = pos.x - selectionStart.x;
    selectionRect.height = pos.y - selectionStart.y;
  };

  const handleMouseUp = () => {
    if (toolbarState.value.mouseMode !== "select" || !selectionRect.visible)
      return;

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
    stageConfig.draggable = toolbarState.value.mouseMode === "move";
  };

  const isHoverPhoto = () => {
    const stage = stageRef.value.getStage();
    const pointer = stage.getPointerPosition();
    let shape = stage.getIntersection(pointer);
    let isOverPhoto = false;

    while (shape && shape !== stage) {
      if (shape.getAttr("_isPhoto")) {
        isOverPhoto = true;
        break;
      }
      shape = shape.getParent();
    }

    return isOverPhoto;
  };

  let spinnerAnim = null;

  watchPostEffect(() => {
    const stage = stageRef.value?.getStage?.();
    if (!stage) return;

    const layer = stage.getLayers()[0];
    const isAnyLoading = photos.value.some((p) => p.loading);

    if (isAnyLoading && !spinnerAnim) {
      spinnerAnim = new Konva.Animation(() => {
        photos.value.forEach((photo) => {
          if (photo.loading) {
            photo.spinnerRotation = (photo.spinnerRotation || 0) + 6;
          }
        });
      }, layer);
      spinnerAnim.start();
    } else if (!isAnyLoading && spinnerAnim) {
      spinnerAnim.stop();
      spinnerAnim = null;
    }
  });

  return {
    stageConfig,
    stageOffset,
    selectionRect,
    updateStageOffset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    applyZoom,
  };
}

export const applyZoom = (
  stage,
  newScale,
  updateOffsetFn,
  centerPoint = null
) => {
  const oldScale = stage.scaleX();

  const pointer = centerPoint || {
    x: stage.width() / 2,
    y: stage.height() / 2,
  };

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  stage.scale({ x: newScale, y: newScale });

  stage.position({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  });

  stage.batchDraw();
  updateOffsetFn?.();
};
