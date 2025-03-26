// useCanvas.js
import { ref, reactive, onMounted } from "vue";
import { useImage } from "vue-konva";
import Konva from "konva";
import { useTheme } from "vuetify";

export function useCanvas() {
  const stageRef = ref(null);
  const theme = useTheme();
  const secondaryColor = theme.current.value.colors.secondary;
  const stageConfig = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: { x: 1, y: 1 },
    draggable: true,
  });

  const photos = ref([
    {
      id: 1,
      src: `${
        import.meta.env.VITE_API_BASE_URL
      }/uploads/photos/1742647923741-1740648473927-DSC09839.jpg`,
      config: { x: 50, y: 50, width: 150, height: 100 },
      image: null,
      selected: false,
      showButton: false,
    },
    // ... otras fotos
  ]);

  const selectionRect = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  let selectionStart = null;
  let dragGroupStart = {};

  const handleMouseDown = (e) => {
    if (e.target === stageRef.value.getStage()) {
      selectionStart = stageRef.value.getStage().getPointerPosition();
      Object.assign(selectionRect, {
        x: selectionStart.x,
        y: selectionStart.y,
        width: 0,
        height: 0,
        visible: true,
      });
      stageConfig.draggable = false;
    }
  };

  const handleMouseMove = (e) => {
    if (!selectionRect.visible) return;
    const pos = stageRef.value.getStage().getPointerPosition();
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

  const handleDragStart = (photo, e) => {
    e.cancelBubble = true;
    dragGroupStart = {};
    photos.value.forEach((p) => {
      if (p.selected) {
        dragGroupStart[p.id] = { x: p.config.x, y: p.config.y };
      }
    });
  };

  const handleDragMove = (photo, e) => {
    const newX = e.target.x();
    const newY = e.target.y();
    const origin = dragGroupStart[photo.id];
    const deltaX = newX - origin.x;
    const deltaY = newY - origin.y;
    photos.value.forEach((p) => {
      if (p.selected && dragGroupStart[p.id]) {
        p.config.x = dragGroupStart[p.id].x + deltaX;
        p.config.y = dragGroupStart[p.id].y + deltaY;
      }
    });
  };

  const handleDragEnd = (photo, e) => {
    // Opcional: limpiar o actualizar estados si es necesario.
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

  onMounted(() => {
    photos.value.forEach((photo) => {
      const [image] = useImage(photo.src);
      photo.image = image;
    });
  });

  return {
    stageRef,
    stageConfig,
    photos,
    selectionRect,
    secondaryColor,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleWheel,
  };
}
