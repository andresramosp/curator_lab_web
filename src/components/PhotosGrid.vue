<template>
  <div>
    <div v-if="photos && photos.length" class="photos-list">
      <v-hover v-for="photo in photos" :key="photo.id">
        <template #default="{ isHovering, props }">
          <v-card v-bind="props" class="photo-card-upload">
            <v-img
              :src="`${photosBaseURL}/${photo.thumbnailName}`"
              class="photo-image"
              :class="{ 'blurred-photo': needProcess(photo) }"
              @error="fallbackImage(photo)"
            ></v-img>
            <!-- Botonera flotante -->
            <div
              v-show="isHovering && !needProcess(photo).isAnalyzing"
              class="action-buttons"
            >
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
        class="photo-card-upload"
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

function needProcess(photo) {
  return (
    !photo.analyzerProcess || photo.analyzerProcess.currentStage !== "finished"
  );
}

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
