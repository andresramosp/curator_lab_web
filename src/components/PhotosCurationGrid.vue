<template>
  <div class="photos-grid">
    <div class="photos-container">
      <v-card
        ref="scrollContainer"
        :style="{
          width: '50%',
          position: 'relative',
          overflowY: 'scroll',
          height: '83vh',
        }"
      >
        <img
          src="@/assets/CandidatePhotosGray.png"
          alt="Curator Lab Logo"
          style="
            width: 450px;
            height: auto;
            opacity: 0.06;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          "
        />

        <v-card-title class="curation-card-title">
          <span style="font-size: 1.1rem; opacity: 0.7">Curation Area</span>
          <div style="display: flex; align-items: center; gap: 4px">
            <span style="font-size: 11px; font-weight: 300">Rating Filter</span>
            <v-rating
              hover
              color="primary"
              :length="3"
              :model-value="minMatchScore"
              @update:model-value="$emit('update:minMatchScore', $event)"
              dense
            >
              <template v-slot:item="props">
                <v-tooltip
                  location="top"
                  :text="
                    ['Partial Match', 'Good Match', 'Full Match'][props.index]
                  "
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      :color="props.isFilled ? 'secondary' : 'primary'"
                      size="17px"
                    >
                      mdi-star
                    </v-icon>
                  </template>
                </v-tooltip>
              </template>
            </v-rating>
          </div>
        </v-card-title>

        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in filteredUnselectedPhotos"
              :key="photo.id"
              :photo="photo"
              :isLoading="loading || loadingIteration"
              :is-thinking="isThinking(photo)"
              :do-fade="false"
              @view-info="viewPhotoInfo"
              :showMatchPercent="true"
              :size="'32%'"
            >
              <template #overlay="{ isHovering, photo }">
                <div
                  v-if="
                    isHovering &&
                    !loading &&
                    !loadingInsights &&
                    !loadingIteration
                  "
                  class="reasoning-overlay"
                >
                  <span v-if="photo.reasoning" class="reasoning-text">{{
                    photo.reasoning
                  }}</span>
                </div>
                <div
                  v-if="isThinking(photo) && !maxPageAttempts"
                  class="thinking-overlay"
                >
                  <span
                    v-for="(letter, index) in 'Reviewing'.split('')"
                    :key="index"
                    class="thinking-letter"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    {{ letter }}
                  </span>
                </div>
                <div
                  v-show="isHovering && !loadingIteration && !loading"
                  class="action-buttons"
                >
                  <v-btn size="small" icon @click.stop="viewPhotoInfo(photo)">
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
                  <v-btn size="small" icon @click.stop="toggleSelection(photo)">
                    <v-icon>mdi-arrow-right-bold</v-icon>
                  </v-btn>
                </div>
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
        <div class="search-fixed-button">
          <div class="search-button-wrapper">
            <v-btn
              :loading="loadingIteration || loadingInsights"
              @click="$emit('next-iteration')"
              class="outline"
              block
            >
              <v-icon size="23">mdi-autorenew</v-icon> Load More
            </v-btn>
          </div>
        </div>
      </v-card>

      <v-card
        :style="{ width: '50%', position: 'relative' }"
        style="overflow-y: scroll; height: 83vh"
      >
        <img
          src="@/assets/CuratedPhotosGray.png"
          alt="Curator Lab Logo"
          style="
            width: 450px;
            height: auto;
            opacity: 0.06;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          "
        />
        <v-card-title class="curation-card-title">
          <span style="font-size: 1.1rem; opacity: 0.7">Selection Area</span>
          <div style="display: flex; align-items: center"></div>
        </v-card-title>
        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in selectedPhotos"
              :key="photo.id"
              :photo="photo"
              :isLoading="loading || loadingIteration"
              :is-thinking="isThinking(photo)"
              :do-fade="true"
              :fade-delay="0"
              @view-info="viewPhotoInfo"
              :showMatchPercent="false"
              :size="'32%'"
            >
              <template #overlay="{ isHovering, photo }">
                <div v-if="isHovering" class="reasoning-overlay">
                  <span v-if="photo.reasoning" class="reasoning-text">{{
                    photo.reasoning
                  }}</span>
                  <span v-else-if="photo.selected" class="reasoning-text">{{
                    "User Selection"
                  }}</span>
                </div>
                <div
                  v-if="isThinking(photo) && !maxPageAttempts"
                  class="thinking-overlay"
                >
                  <span
                    v-for="(letter, index) in 'Reviewing'.split('')"
                    :key="index"
                    class="thinking-letter"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    {{ letter }}
                  </span>
                </div>
                <div
                  v-show="isHovering && !loadingIteration && !loading"
                  class="action-buttons"
                >
                  <v-btn size="small" icon @click.stop="toggleSelection(photo)">
                    <v-icon>mdi-arrow-left-bold</v-icon>
                  </v-btn>
                  <v-btn size="small" icon @click.stop="viewPhotoInfo(photo)">
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
                </div>
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
        <div class="search-fixed-button">
          <div class="search-button-wrapper">
            <v-btn
              :disabled="!selectedPhotos.length"
              @click="$emit('next-iteration')"
              class="outline"
              block
            >
              <v-icon size="23">mdi-image</v-icon> Create Series
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
  </div>
  <div v-if="maxPageAttempts" class="alert-message">
    <v-alert dense class="alert-progress">
      It seems unlikely we'll find more photos with the selected score. Please
      reduce the score filter.
    </v-alert>
  </div>
  <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
</template>

<script setup>
import { ref, nextTick, watch, computed } from "vue";
import PhotoCard from "./PhotoCard.vue";
import PhotoDialog from "./PhotoDialog.vue";
import { usePhotosStore } from "@/stores/photos";

const props = defineProps({
  photos: Array,
  loadingIteration: Boolean,
  loading: Boolean,
  hasMoreIterations: Boolean,
  loadingInsights: Boolean,
  maxPageAttempts: Boolean,
  minMatchScore: Number,
});

const emit = defineEmits(["next-iteration", "update:minMatchScore"]);

const photosStore = usePhotosStore();

const showDialog = ref(false);
const selectedPhoto = ref({ id: null, description: "", matchingChunks: [] });

const unselectedPhotos = ref([]);
const selectedPhotos = ref([]);

const minRating = ref(1);

const filteredUnselectedPhotos = computed(() =>
  unselectedPhotos.value.filter(
    (photo) =>
      photo.matchScore == undefined ||
      (photo.matchScore || 0) >= props.minMatchScore
  )
);

watch(
  () => props.photos,
  (newPhotos) => {
    const newSelected = newPhotos.filter((p) => p.selected);
    const newUnselected = newPhotos.filter((p) => !p.selected || p.isSkeleton);

    // Actualiza selected solo añadiendo los nuevos, sin reordenar los ya locales
    const currentSelectedIds = selectedPhotos.value.map((p) => p.id);
    newSelected.forEach((p) => {
      if (!currentSelectedIds.includes(p.id)) {
        selectedPhotos.value.push(p);
      }
    });
    // Elimina los que ya no están seleccionados
    selectedPhotos.value = selectedPhotos.value.filter((p) =>
      newSelected.some((np) => np.id === p.id)
    );

    // Para unselected puedes reemplazar completa, porque no tienes orden manual
    unselectedPhotos.value = newUnselected.reverse();
  },
  { immediate: true }
);

function viewPhotoInfo(photo) {
  selectedPhoto.value = {
    ...photo,
    description: photo.description || "No description available",
    tags: photo.tags,
    matchingTags: photo.matchingTags,
    matchingChunks: photo.matchingChunks,
  };
  showDialog.value = true;
}

const scrollContainer = ref(null);

defineExpose({
  scrollToLast: () => {
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.$el.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    });
  },
});

const isThinking = (photo) => {
  return props.loadingInsights && photo.matchScore === undefined;
};

function toggleSelection(photo) {
  if (photo.selected) {
    photo.selected = undefined;
    selectedPhotos.value = selectedPhotos.value.filter(
      (p) => p.id !== photo.id
    );
    unselectedPhotos.value.unshift(photo);
    photosStore.togglePhotoSelection(photo.id);
  } else {
    photo.selected = true;
    unselectedPhotos.value = unselectedPhotos.value.filter(
      (p) => p.id !== photo.id
    );
    selectedPhotos.value.unshift(photo);
    photosStore.togglePhotoSelection(photo.id);
  }
}
</script>

<style scoped lang="scss">
.section-title {
  font-size: 16px;
  color: var(--v-theme-primary);
}

.photos-container {
  display: flex;
  padding: 4px;
  border: 1px solid var(--v-theme-on-surface);
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.photos-grid {
  display: flex;
  flex-direction: column;
  /* gap: 16px; */
  width: 100%;
}

.catalog-message {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 18px;
}

.thinking-overlay {
  position: absolute;
  bottom: 5px;
  left: 0;
  width: 100%;
  height: 100%;
  color: white;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.thinking-letter {
  display: inline-block;
  opacity: 0.4;
  animation: typingEffect 1s infinite ease-in-out;
}

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

.top-score-photo {
  border: 3px solid rgb(var(--v-theme-secondary));
}

.reasoning-overlay {
  background: rgba(0, 0, 0, 0.6);
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.reasoning-text {
  font-size: 12px;
}

.search-grid-toolbar {
  display: flex;
  height: 20px;
  background-color: red;
}

.v-card {
  display: flex;
  flex-direction: column;
  // .v-card-text {
  //   padding-top: 10px;
  // }
}

.curation-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 20px;
  position: sticky;
  top: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 2;
  min-height: 40px;
}
</style>
