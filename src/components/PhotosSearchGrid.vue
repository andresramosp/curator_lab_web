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
          <div v-show="isHovering" class="matching-tags">
            <span v-if="photo.reasoning">{{ photo.reasoning }}</span>
            <span v-else v-for="tag in photo.matchingTags">{{ tag }}</span>
          </div>
        </v-card>
      </template>
    </v-hover>

    <!-- Additional card for next iteration -->
    <v-card :disabled="!hasMoreIterations" class="photo-card add-card">
      <v-card-text class="text-center">
        <v-btn
          icon
          :loading="loadingIteration"
          @click="$emit('next-iteration')"
        >
          <v-icon size="36">mdi-plus</v-icon>
        </v-btn>
      </v-card-text>
    </v-card>
  </div>

  <div v-else-if="hasMoreIterations">
    <v-card
      :disabled="!hasMoreIterations"
      class="photo-card add-card"
      @click="$emit('next-iteration')"
    >
      <v-card-text class="text-center">
        <v-btn icon :loading="loadingIteration">
          <v-icon size="36">mdi-plus</v-icon>
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
  <div v-else class="catalog-message">
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
  align-items: flex-start;
}

.photo-card {
  width: 220px; /* Tamaño consistente */
  min-height: 150px;
  position: relative;
  overflow: hidden; /* Garantiza que elementos no se salgan del card */
}

.photo-image {
  height: 150px;
  object-fit: cover; /* Ajusta imagenes al contenedor */
  width: 100%;
}

.matching-tags {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%; /* Asegura que ocupe todo el ancho del card */
  display: flex;
  flex-wrap: wrap; /* Permite que los tags salten de línea */
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px;
  border-radius: 0 0 8px 8px; /* Bordes solo en la parte inferior */
  text-align: center;
}

.matching-tags span {
  color: #fff; /* Color del texto para contraste */
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2); /* Fondo semitransparente */
  border-radius: 4px;
  white-space: break-spaces; /* Permite que las palabras largas salten de línea */
  word-break: break-word; /* Asegura que las palabras demasiado largas se ajusten al contenedor */
}

.catalog-message {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 18px;
}

.blurred-photo {
  filter: blur(3px);
}

.add-card {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* .add-card:hover {
  background-color: #e0e0e0;
} */
</style>
