<template>
  <v-container class="canvas-container">
    <v-btn class="catalog-button" fab @click="addNewPhoto">Add Photo</v-btn>
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
          :config="{ ...photo.config, image: photo.imageObj }"
          draggable
          @dragend="handleDragEnd(photo, $event)"
        />
      </v-layer>
    </v-stage>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

const stageRef = ref(null);
const stageConfig = reactive({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: { x: 1, y: 1 },
  draggable: true, // Habilita el desplazamiento del canvas
});

const photos = ref([
  {
    id: 1,
    src: "http://localhost:3333/uploads/photos/1742647923741-1740648473927-DSC09839.jpg",
    config: { x: 50, y: 50, width: 150, height: 150 },
  },
  {
    id: 2,
    src: "http://localhost:3333/uploads/photos/1742647923492-1740648472828-DSC07285.jpg",
    config: { x: 250, y: 100, width: 150, height: 150 },
  },
]);

const loadImage = (photo) => {
  const imageObj = new Image();
  imageObj.src = photo.src;
  imageObj.onload = () => {
    photo.imageObj = imageObj;
  };
};

onMounted(() => {
  photos.value.forEach((photo) => loadImage(photo));
});

const addNewPhoto = () => {
  const newId = photos.value.length + 1;
  const newPhoto = {
    id: newId,
    src: "https://via.placeholder.com/150/00ff00",
    config: { x: 100, y: 200, width: 150, height: 150 },
  };
  loadImage(newPhoto);
  photos.value.push(newPhoto);
};

const handleDragEnd = (photo, e) => {
  photo.config.x = e.target.x();
  photo.config.y = e.target.y();
};

const handleWheel = (e) => {
  e.evt.preventDefault();
  const stage = stageRef.value.getStage();
  const oldScale = stage.scaleX();
  const scaleBy = 1.05;
  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
  stage.scale({ x: newScale, y: newScale });
  stage.batchDraw();
};
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100vh;
}
.catalog-button {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
</style>
