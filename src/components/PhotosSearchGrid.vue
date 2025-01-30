<template>
  <div v-if="photos && photos.length" class="photos-grid">
    <v-card v-show="!isQuickSearch" class="photos-container selected-photos">
      <v-card-text>
        <div class="photos-list">
          <v-hover v-for="(photo, index) in selectedPhotos" :key="photo.id">
            <template #default="{ isHovering, props }">
              <v-card
                v-bind="props"
                class="photo-card fade-in"
                :style="{
                  animationDelay: `${
                    photoFadeInDelays.length ? photoFadeInDelays[index] : 0
                  }ms`,
                }"
                :color="isHovering ? 'undefined' : 'undefined'"
              >
                <v-img
                  :src="photosBaseURL + '/' + photo.name"
                  class="photo-image photo-included"
                ></v-img>
                <!-- Botonera flotante -->
                <div v-show="isHovering" class="photo-buttons">
                  <!-- <span v-if="photo.reasoning">{{ photo.reasoning }}</span> -->
                  <span v-for="tag in photo.matchingTags">{{ tag }}</span>
                  <v-btn size="small" icon @click="viewPhotoInfo(photo)">
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
                  <!-- <v-btn size="small" icon @click="analyzePhoto(photo.id)">
                    <v-icon>mdi-magnify</v-icon>
                  </v-btn> -->
                  <v-btn size="small" icon @click="switchSelected(photo)">
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                </div>
              </v-card>
            </template>
          </v-hover>

          <!-- Botón para aumentar iteración -->
          <v-card
            :disabled="!hasMoreIterations"
            :loading="loadingIteration"
            class="photo-card add-card fade-in"
            elevation="16"
            hover
            :style="{
              animationDelay: `${
                photoFadeInDelays.length
                  ? photoFadeInDelays[photoFadeInDelays.length - 1]
                  : 0
              }ms`,
            }"
          >
            <v-card-text class="text-center">
              <v-btn
                icon
                :loading="loadingIteration"
                @click="$emit('next-iteration')"
                class="centered-btn"
              >
                <v-icon size="36">mdi-autorenew</v-icon>
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>

    <!-- Fotos no seleccionadas -->
    <v-card
      class="photos-container"
      :class="{
        'unselected-photos': !isQuickSearch,
      }"
    >
      <!-- <v-card-title class="section-title">Processed</v-card-title> -->
      <v-card-text>
        <div class="photos-list">
          <v-hover v-for="(photo, index) in unselectedPhotos" :key="photo.id">
            <template #default="{ isHovering, props }">
              <v-card
                v-bind="props"
                class="photo-card fade-in"
                :style="{
                  animationDelay: `${
                    photoFadeInDelays.length ? photoFadeInDelays[index] : 0
                  }ms`,
                }"
                :color="isHovering ? 'undefined' : 'undefined'"
              >
                <v-img
                  :src="photosBaseURL + '/' + photo.name"
                  class="photo-image"
                ></v-img>
                <div class="photo-overlay" v-show="isThinking(photo)">
                  <span
                    v-show="isThinking(photo)"
                    v-for="(letter, index) in 'Reviewing'.split('')"
                    :key="index"
                    class="thinking-letter"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    {{ letter }}
                  </span>
                </div>
                <div
                  class="photo-overlay"
                  v-show="isHovering && !isThinking(photo) && !isQuickSearch"
                >
                  <v-btn icon @click="switchSelected(photo)">
                    <v-icon size="36">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </v-card>
            </template>
          </v-hover>

          <v-card
            v-show="isQuickSearch"
            :disabled="!hasMoreIterations"
            :loading="loadingIteration"
            class="photo-card add-card fade-in"
            elevation="16"
            hover
            :style="{
              animationDelay: `${
                photoFadeInDelays.length
                  ? photoFadeInDelays[photoFadeInDelays.length - 1]
                  : 0
              }ms`,
            }"
          >
            <v-card-text class="text-center">
              <v-btn
                icon
                :loading="loadingIteration"
                @click="$emit('next-iteration')"
                class="centered-btn"
              >
                <v-icon size="36">mdi-autorenew</v-icon>
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </div>

  <div v-else class="catalog-message">
    <p class="text-h5 text-center">No photos yet</p>
  </div>

  <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
</template>

<script setup>
import { ref, computed, watch, shallowRef } from "vue";
import { usePhotosStore } from "@/stores/photos";
import PhotoDialog from "./PhotoDialog.vue";

const props = defineProps({
  photos: Array,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
  isQuickSearch: Boolean,
});

const photosBaseURL = import.meta.env.VITE_PHOTOS_BASE_URL;
const photosStore = usePhotosStore();

const showDialog = ref(false);
const selectedPhoto = ref({ id: null, description: "" });

const selectedPhotos = computed(() =>
  props.photos.filter((photo) => photo.isIncluded)
);
const unselectedPhotos = computed(() =>
  props.photos.filter((photo) => !photo.isIncluded)
);

async function analyzePhoto(photoId) {
  photosStore.analyze([photoId]);
}

const photoFadeInDelays = ref([]);
const previousPhotosLength = shallowRef(props.photos.length);

const isThinking = (photo) => {
  return !props.isQuickSearch && photo.isIncluded == undefined;
};

watch(
  () => props.photos.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      photoFadeInDelays.value = props.photos.map(
        (_, index) => index * (props.isQuickSearch ? 10 : 150)
      );
      previousPhotosLength.value = newLength;
    } else {
      photoFadeInDelays.value = [];
    }
  },
  { immediate: true }
);

function viewPhotoInfo(photo) {
  selectedPhoto.value = {
    ...photo,
    name: photo.name.split("-")[1],
    description: photo.description || "No description available",
    tags: photo.tags.map((t) => t.name),
  };
  showDialog.value = true;
}

function switchSelected(photo) {
  photo.isIncluded = !photo.isIncluded;
  if (photo.isIncluded) {
    photo._reasoning = photo.reasoning;
    photo.reasoning = "Selected by user";
  } else {
    photo.reasoning = photo._reasoning;
  }
}
</script>

<style scoped>
.photos-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.photos-container {
  padding: 16px;
  border: 1px solid var(--v-theme-on-surface);
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.photos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  /* justify-content: center; */
  align-items: flex-start;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: var(--v-theme-primary);
}

.selected-photos .section-title {
  color: var(--v-theme-primary);
}

.unselected-photos .section-title {
  color: var(--v-theme-secondary);
}

.unselected-photos {
  filter: grayscale(100%);
}

.add-card {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  /* background-color: #f0f0f0; */
}

.photo-image {
  height: 150px;
  object-fit: cover;
  width: 100%;
}

.blurred-photo {
  filter: blur(3px);
}

.photo-buttons {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px;
  text-align: center;
  justify-content: center;
}

.matching-tags span {
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  white-space: break-spaces;
  word-break: break-word;
}

.catalog-message {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 18px;
}

.centered-btn {
  margin: auto;
  display: block;
}
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInAnimation 0.5s ease-in-out forwards;
}

@keyframes fadeInAnimation {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.thinking-letter {
  display: inline-block;
  opacity: 0.4; /* Inicialmente tenue */
  animation: typingEffect 1s infinite ease-in-out;
}

/* Animación de parpadeo secuencial */
@keyframes typingEffect {
  0% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
}
</style>
