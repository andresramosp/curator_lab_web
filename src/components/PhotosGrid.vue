<template>
  <div v-if="photos && photos.length" class="photos-list">
    <v-hover v-for="photo in photos" :key="photo.id">
      <template #default="{ isHovering, props }">
        <v-card
          v-bind="props"
          class="photo-card"
          :color="isHovering ? 'undefined' : 'undefined'"
          :class="{
            'blurred-photo': !photo.metadata,
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
            <v-btn size="small" icon @click="viewPhotoInfo(photo)">
              <v-icon>mdi-information</v-icon>
            </v-btn>
          </div>
        </v-card>
      </template>
    </v-hover>
  </div>
  <div v-else-if="!photos" class="catalog-message">
    <p class="text-h5 text-center">No photos yet</p>
  </div>

  <!-- Popup Dialog -->
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>Photo Information</v-card-title>
      <v-card-text>
        <p><strong>ID:</strong> {{ selectedPhoto.id }}</p>
        <p><strong>Description:</strong> {{ selectedPhoto.description }}</p>
        <p><strong>Tags:</strong> {{ selectedPhoto.tags }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";
import { usePhotosStore } from "@/stores/photos";

const props = defineProps({
  photos: Array,
  forCuration: Boolean,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
});

const photosBaseURL = import.meta.env.VITE_PHOTOS_BASE_URL;
const photosStore = usePhotosStore();

const dialog = ref(false);
const selectedPhoto = ref({ id: null, description: "" });

async function deletePhoto(photoId) {
  await photosStore.deletePhoto(photoId);
  console.log("Delete photo", photoId);
}

function editPhoto(photoId) {
  console.log("Edit photo", photoId);
}

async function analyzePhoto(photoId) {
  photosStore.analyze([photoId]);
}

function viewPhotoInfo(photo) {
  selectedPhoto.value = {
    id: photo.id,
    description: photo.description || "No description available",
    tags: photo.tags.map((t) => t.name),
  };
  dialog.value = true;
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
