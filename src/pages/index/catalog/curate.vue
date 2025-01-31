<template>
  <v-container class="main-container">
    <PhotosGrid :photos="photosStore.photos" :forCuration="true" />
    <v-btn
      class="analyze-button"
      fab
      :loading="photosStore.isAnalyzing"
      :disabled="photosStore.isAnalyzing || allAnalyzed"
      @click="analyze"
    >
      Curate
    </v-btn>
    <input type="file" ref="fileInput" multiple hidden @change="uploadFiles" />
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { usePhotosStore } from "@/stores/photos";
import PhotosGrid from "@/components/photosGrid.vue";

const photosStore = usePhotosStore();

async function analyze() {
  await photosStore.analyze();
}

const allAnalyzed = computed(() => {
  return !photosStore.photos.find((photo) => !photo.metadata);
});

// Fetch inicial al montar el componente
onMounted(() => {
  photosStore.fetchPhotos();
});
</script>

<style scoped>
.analyze-button {
  position: sticky;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
