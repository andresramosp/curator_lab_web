<template>
  <v-container class="main-container">
    <PhotosGrid :photos="photosStore.photos" :forCuration="false" />
    <v-btn class="catalog-button" fab @click="openFileDialog">Add Photos</v-btn>
    <input type="file" ref="fileInput" multiple hidden @change="uploadFiles" />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePhotosStore } from "@/stores/photos";
import PhotosGrid from "@/components/photosGrid.vue";

const photosStore = usePhotosStore();
const fileInput = ref(null);

function openFileDialog() {
  fileInput.value.click();
}

async function uploadFiles(event) {
  const selectedFiles = Array.from(event.target.files);
  if (selectedFiles.length === 0) return;

  await photosStore.uploadPhotos(selectedFiles);
  event.target.value = ""; // Reset file input
}

// Fetch inicial al montar el componente
onMounted(() => {
  photosStore.fetchPhotos();
});
</script>

<style scoped>
.catalog-button {
  position: sticky;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
