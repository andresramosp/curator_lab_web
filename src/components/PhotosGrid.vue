<template>
  <div>
    <div v-if="photos && photos.length" class="photos-list">
      <v-hover v-for="photo in photos" :key="photo.id">
        <template #default="{ isHovering, props }">
          <v-card v-bind="props" class="photo-card-selected">
            <v-img
              :src="`${photosBaseURL}/${photo.name}`"
              class="photo-image"
              :class="{ 'blurred-photo': photo.analyzing }"
              @error="fallbackImage(photo)"
            ></v-img>
            <!-- Botonera flotante -->
            <div v-show="isHovering && !photo.analyzing" class="action-buttons">
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
    <div v-else class="photos-list">
      <v-card
        v-for="n in uploadingPhotos"
        v-bind="props"
        class="photo-card-selected"
      >
        <v-skeleton-loader :key="n" type="image" class="photo-skeleton"
      /></v-card>
    </div>

    <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { usePhotosStore } from "@/stores/photos";
import PhotoDialog from "./PhotoDialog.vue";

const props = defineProps({
  photos: Array,
  uploadingPhotos: Number,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
});

const photosBaseURL = import.meta.env.VITE_PHOTOS_BASE_URL;
const photosStore = usePhotosStore();

const showDialog = ref(false);
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
    ...photo,
    description: photo.description || "No description available",
    tags: photo.tags, //.map((t) => t.name),
  };
  showDialog.value = true;
}

function fallbackImage(photo) {
  if (photo.url) {
    photo.url = null;
  }
}
</script>

<style scoped>
.photos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  align-items: flex-start;
  overflow-y: scroll;
  height: 90vh;
}

.photo-image {
  height: 150px;
  object-fit: cover;
  width: 100%;
}

.photo-skeleton {
  height: 150px;
  width: 100%;
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
