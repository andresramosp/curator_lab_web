<template>
  <v-container class="main-container">
    <div v-if="photosStore.photos.length" class="photos-list">
      <v-hover v-for="photo in photosStore.photos" :key="photo.id">
        <template #default="{ isHovering, props }">
          <v-card
            v-bind="props"
            class="photo-card"
            :color="isHovering ? 'undefined' : 'undefined'"
          >
            <v-img
              :src="photosBaseURL + photo.path"
              class="photo-image"
            ></v-img>
            <!-- Botonera flotante -->
            <div v-if="isHovering" class="action-buttons">
              <v-btn size="small" icon @click="deletePhoto(photo.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-btn size="small" icon @click="editPhoto(photo.id)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn size="small" icon @click="analyzePhoto(photo.id)">
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
              <v-btn size="small" icon @click="viewPhotoInfo(photo.id)">
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </div>
          </v-card>
        </template>
      </v-hover>
    </div>
    <div v-else class="catalog-message">
      <p class="text-h5 text-center">No photos yet</p>
    </div>
    <v-btn class="catalog-button" fab @click="openFileDialog">Add Photos</v-btn>
    <input type="file" ref="fileInput" multiple hidden @change="uploadFiles" />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePhotosStore } from "@/stores/photos";

const photosBaseURL = import.meta.env.VITE_API_BASE_URL;
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

async function deletePhoto(photoId) {
  await photosStore.deletePhoto(photoId);
  console.log("Delete photo", photoId);
}

function editPhoto(photoId) {
  console.log("Edit photo", photoId);
}

function analyzePhoto(photoId) {
  console.log("Analyze photo", photoId);
}

function viewPhotoInfo(photoId) {
  console.log("View photo info", photoId);
}

// Fetch inicial al montar el componente
onMounted(() => {
  photosStore.fetchPhotos();
});
</script>

<style scoped>
.photos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.photo-card {
  width: 200px;
  position: relative;
}

.photo-image {
  height: 150px;
}

.action-buttons {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px;
  border-radius: 8px;
  transition: opacity 0.3s;
}

.catalog-message {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.catalog-button {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
