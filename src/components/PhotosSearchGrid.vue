<template>
  <div class="photos-grid">
    <div class="photos-container">
      <v-card
        ref="scrollContainer"
        :style="{
          width: '100%',
          position: 'relative',
          overflowY: 'scroll',
          height: '83vh',
        }"
      >
        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in photos"
              :key="photo.id"
              :photo="photo"
              :isLoading="loading || loadingIteration"
              :is-thinking="isThinking(photo)"
              :fade-delay="photoFadeInDelays[index] || 0"
              @view-info="viewPhotoInfo"
              :numerical-match="false"
              :size="'16%'"
            >
              <template #overlay="{ isHovering, photo }">
                <div
                  v-show="isHovering && !loadingIteration && !loading"
                  class="action-buttons"
                >
                  <v-btn size="small" icon @click.stop="viewPhotoInfo(photo)">
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
                  <v-btn size="small" icon @click="deletePhoto(photo.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
        <div class="search-fixed-button">
          <div class="search-button-wrapper">
            <v-btn
              :loading="loadingIteration"
              @click="$emit('next-iteration')"
              class="outline"
              style="width: 99%"
              :disabled="
                !hasMoreIterations || loadingIteration || loadingInsights
              "
            >
              <v-icon size="23">mdi-autorenew</v-icon> Load More
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
    <!-- <v-btn
      style="padding: 0px; width: 99%; margin-top: 5px"
      :loading="loadingIteration"
      @click="$emit('next-iteration')"
      class="centered-btn outline"
      :disabled="!hasMoreIterations || loadingIteration || loadingInsights"
    >
      <v-icon size="23">mdi-autorenew</v-icon> Load More
    </v-btn> -->
  </div>

  <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
</template>

<script setup>
import { ref, nextTick } from "vue";
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

const photoFadeInDelays = ref([]);

const scrollContainer = ref(null);

defineExpose({
  scrollToLast: () => {
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.$el.scrollTo({
          top: scrollContainer.value.$el.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  },
});

const isThinking = (photo) => {
  return props.loadingInsights && photo.matchScore === undefined;
};

function deletePhoto(id) {
  // Placeholder: implement delete logic here
  console.log("Delete photo", id);
}
</script>

<style scoped>
.section-title {
  font-size: 16px;
  color: var(--v-theme-primary);
}

.photos-container {
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
