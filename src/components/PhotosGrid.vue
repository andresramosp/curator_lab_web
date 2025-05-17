<template>
  <div>
    <div v-if="photos && photos.length" class="photos-list">
      <v-hover v-for="photo in photos" :key="photo.id">
        <template #default="{ isHovering, props }">
          <v-card v-bind="props" class="photo-card-upload">
            <v-img
              :src="photo.thumbnailUrl"
              class="photo-image"
              @error="fallbackImage(photo)"
            ></v-img>

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
              <v-btn size="small" icon @click="viewPhotoInfo(photo.id)">
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </div>
          </v-card>
        </template>
      </v-hover>
    </div>
    <!-- <div v-else class="photos-list">
      <v-card
        v-for="n in uploadingPhotos"
        v-bind="props"
        class="photo-card-upload"
      >
        <v-skeleton-loader :key="n" type="image" class="photo-skeleton"
      /></v-card>
    </div> -->
    <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePhotosStore } from "@/stores/photos";
import PhotoDialog from "./PhotoDialog.vue";

const props = defineProps({
  photos: Array,
  uploadingPhotos: Number,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
});

const photosStore = usePhotosStore();

const showDialog = ref(false);
const selectedPhotoId = ref(null);

// Accede al store para obtener la foto completa
const selectedPhoto = computed(() =>
  photosStore.photos.find((p) => p.id === selectedPhotoId.value)
);

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

async function viewPhotoInfo(photoId) {
  await photosStore.fetchPhoto(photoId);
  selectedPhotoId.value = photoId;
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
