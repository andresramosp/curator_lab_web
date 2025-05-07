<template>
  <div class="photos-grid">
    <div class="photos-container">
      <!-- GRID PRINCIPAL (NO SELECCIONADAS O DESCARTADAS) -->
      <v-card
        ref="scrollOneContainer"
        :style="{ width: '50%' }"
        style="overflow-y: scroll; height: 77vh"
      >
        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in unselectedPhotos"
              :key="photo.id"
              :photo="photo"
              :isLoading="loading || loadingIteration"
              :is-thinking="isThinking(photo)"
              :fade-delay="unselectedPhotoFadeInDelays[index] || 0"
              @view-info="viewPhotoInfo"
              :showMatchPercent="false"
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
                    >{{ letter }}</span
                  >
                </div>
                <div
                  v-show="isHovering && !loadingIteration && !loading"
                  class="action-buttons"
                >
                  <v-btn size="small" icon @click.stop="viewPhotoInfo(photo)"
                    ><v-icon>mdi-information</v-icon></v-btn
                  >
                  <v-btn size="small" icon @click.stop="toggleSelection(photo)"
                    ><v-icon>mdi-arrow-right-bold</v-icon></v-btn
                  >
                </div>
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
      </v-card>

      <!-- GRID SELECCIÓN (SELECCIONADAS) -->
      <v-card
        ref="scrollTwoContainer"
        :style="{ width: '50%' }"
        style="overflow-y: scroll; height: 77vh"
      >
        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in selectedPhotos"
              :key="photo.id"
              :photo="photo"
              :isLoading="loading || loadingIteration"
              :is-thinking="isThinking(photo)"
              :fade-delay="selectedPhotoFadeInDelays[index] || 0"
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
                    >{{ letter }}</span
                  >
                </div>
                <div
                  v-show="isHovering && !loadingIteration && !loading"
                  class="action-buttons"
                >
                  <v-btn size="small" icon @click.stop="toggleSelection(photo)"
                    ><v-icon>mdi-arrow-left-bold</v-icon></v-btn
                  >
                  <v-btn size="small" icon @click.stop="viewPhotoInfo(photo)"
                    ><v-icon>mdi-information</v-icon></v-btn
                  >
                </div>
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
      </v-card>
    </div>
    <v-btn
      style="padding: 0px; width: 99%; margin-top: 5px"
      :loading="loadingIteration || loadingInsights"
      @click="$emit('next-iteration')"
      class="centered-btn outline"
      :disabled="!hasMoreIterations || loadingIteration || loadingInsights"
    >
      <v-icon size="23">mdi-autorenew</v-icon> Load More
    </v-btn>
  </div>

  <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";
import PhotoCard from "./PhotoCard.vue";
import PhotoDialog from "./PhotoDialog.vue";

const props = defineProps({
  photos: Array,
  loadingIteration: Boolean,
  loading: Boolean,
  hasMoreIterations: Boolean,
  loadingInsights: Boolean,
  maxPageAttempts: Boolean,
});

const emit = defineEmits(["next-iteration"]);

const showDialog = ref(false);
const selectedPhoto = ref({ id: null, description: "", matchingChunks: [] });

const unselectedPhotos = computed(() =>
  props.photos
    .filter(
      (p) => (p.selected === false) | (p.selected === undefined) || p.isSkeleton
    )
    .reverse()
);
const selectedPhotos = computed(() =>
  props.photos.filter((p) => p.selected === true).reverse()
);

const unselectedPhotoFadeInDelays = computed(() => {
  return unselectedPhotos.value.reverse().map((photo) => {
    const globalIndex = props.photos.findIndex((p) => p.id === photo.id);
    return globalIndex * 150;
  });
});

const selectedPhotoFadeInDelays = computed(() => {
  return selectedPhotos.value.reverse().map((photo) => {
    const globalIndex = props.photos.findIndex((p) => p.id === photo.id);
    return globalIndex * 150;
  });
});

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

const scrollOneContainer = ref(null);
const scrollTwoContainer = ref(null);

defineExpose({
  scrollToLast: () => {
    nextTick(() => {
      if (scrollOneContainer.value && scrollTwoContainer.value) {
        scrollOneContainer.value.scrollTo({
          bottom: scrollOneContainer.value.scrollHeight,
          behavior: "smooth",
        });
        scrollTwoContainer.value.scrollTo({
          bottom: scrollTwoContainer.value.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  },
});

const isThinking = (photo) => {
  return props.loadingInsights && photo.isInsight === undefined;
};

function toggleSelection(photo) {
  photo.selected = photo.selected ? undefined : true;
}
</script>

<style scoped>
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
</style>
