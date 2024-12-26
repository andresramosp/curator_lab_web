<template>
  <div v-if="photos.length" class="photos-list">
    <v-hover v-for="photo in photos" :key="photo.id">
      <template #default="{ isHovering, props }">
        <v-card
          v-bind="props"
          class="photo-card"
          :color="isHovering ? 'undefined' : 'undefined'"
          :class="{
            'blurred-photo': forCuration && !photo.metadata,
          }"
        >
          <v-img
            :src="photosBaseURL + '/' + photo.name"
            class="photo-image"
          ></v-img>
          <!-- Botonera flotante -->
          <div v-if="!forCuration" v-show="isHovering" class="action-buttons">
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
</template>

<script setup>
import { usePhotosStore } from "@/stores/photos";

const props = defineProps({
  photos: Array,
  forCuration: Boolean,
});

const photosBaseURL = import.meta.env.VITE_PHOTOS_BASE_URL;
const photosStore = usePhotosStore();

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

.blurred-photo {
  filter: blur(3px);
}
</style>
