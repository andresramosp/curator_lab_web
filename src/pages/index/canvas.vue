<template>
  <div class="canvas-container">
    <v-stage
      :config="stageConfig"
      ref="stageRef"
      @wheel="handleWheel"
      style="border: 1px solid #ccc"
    >
      <v-layer>
        <v-image
          v-for="photo in photos"
          :key="photo.id"
          :config="{
            ...photo.config,
            image: photo.image,
            draggable: true,
          }"
          @click="handlePhotoClick(photo)"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd(photo, $event)"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useImage } from "vue-konva";

const stageRef = ref(null);
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
  },
  {
    id: 2,
    src: `${
      import.meta.env.VITE_API_BASE_URL
    }/uploads/photos/1742647923492-1740648472828-DSC07285.jpg`,
    config: { x: 250, y: 100, width: 150, height: 100 },
    image: null,
  },
]);

const imageNames = [
  "1742648875207-DSC02238.jpg",
  "1742648875384-DSC02277.jpg",
  "1742648877582-DSC08287-2.jpg",
  "1742648879121-DSC09856.jpg",
];

const handlePhotoClick = (photo) => {
  const offsetX = 75;
  const offsetY = 50;

  const randomName = imageNames[Math.floor(Math.random() * imageNames.length)];
  const src = `${
    import.meta.env.VITE_API_BASE_URL
  }/uploads/photos/${randomName}`;

  const newPhoto = reactive({
    id: Date.now(),
    src,
    config: {
      x: photo.config.x + offsetX,
      y: photo.config.y + offsetY,
      width: 150,
      height: 100,
    },
    image: null,
  });

  const [image] = useImage(newPhoto.src);
  newPhoto.image = image;

  photos.value.push(newPhoto);
};

onMounted(() => {
  photos.value.forEach((photo) => {
    const [image] = useImage(photo.src);
    photo.image = image;
  });
});

const handleDragStart = (e) => {
  e.cancelBubble = true;
};

const handleDragEnd = (photo, e) => {
  photo.config.x = e.target.x();
  photo.config.y = e.target.y();
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
</style>
