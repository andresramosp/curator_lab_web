<template>
  <div>
    <div
      ref="scrollContainer"
      class="photos-container"
      style="overflow-y: auto; height: 74vh"
    >
      <v-card style="min-height: 620px">
        <!-- <v-card-title class="section-title">{{
          "Potential Matches"
        }}</v-card-title> -->
        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in unselectedPhotos"
              :key="photo.id"
              :photo="photo"
              :with-insights="withInsights"
              :fade-delay="photoFadeInDelays[index] || 0"
              @view-info="handleViewInfo"
              @switch-selected="handleSwitchSelected"
              :numerical-match="false"
              :show-match-percent="!withInsights"
              :type="'match'"
            >
              <template #overlay="{ isHovering, photo }">
                <div
                  class="photo-overlay"
                  v-show="isHovering && !isThinking(photo)"
                >
                  <div class="photo-buttons">
                    <v-btn icon @click="handleViewInfo(photo)">
                      <v-icon size="30">mdi-information</v-icon>
                    </v-btn>
                    <v-btn icon @click="handleSwitchSelected(photo)">
                      <v-icon size="30">mdi-plus</v-icon>
                    </v-btn>
                  </div>
                </div>

                <div
                  v-if="isThinking(photo) && !maxPageAttempts"
                  class="photo-overlay"
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
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
      </v-card>
    </div>
    <v-card style="padding: 10px">
      <v-btn
        :loading="loadingIteration"
        @click="$emit('next-iteration')"
        class="centered-btn"
        :disabled="!hasMoreIterations || loadingIteration"
      >
        <v-icon size="23">mdi-autorenew</v-icon> Load More
      </v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch, shallowRef, nextTick } from "vue";
import PhotoCard from "./PhotoCard.vue";

const props = defineProps({
  photos: Array,
  withInsights: Boolean,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
  maxPageAttempts: Boolean,
});

const emit = defineEmits(["view-info", "switch-selected", "next-iteration"]);

const unselectedPhotos = computed(() =>
  props.photos.filter((photo) => !photo.isIncluded)
);

const photoFadeInDelays = ref([]);
const previousPhotosLength = shallowRef(props.photos.length);

const scrollContainer = ref(null);

watch(
  () => props.photos.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      photoFadeInDelays.value = props.photos.map((_, index) => index * 15);
      previousPhotosLength.value = newLength;

      nextTick(() => {
        setTimeout(() => {
          if (scrollContainer.value) {
            scrollContainer.value.scrollTop =
              scrollContainer.value.scrollHeight;
          }
        }, 200);
      });
    } else {
      photoFadeInDelays.value = [];
    }
  },
  { immediate: true }
);

const isThinking = (photo) => {
  return props.withInsights && photo.isIncluded === undefined;
};
function handleViewInfo(photo) {
  emit("view-info", photo);
}

function handleSwitchSelected(photo) {
  emit("switch-selected", photo);
}
</script>

<style scoped>
.section-title {
  font-size: 16px;
  color: var(--v-theme-primary);
}

.add-card {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
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

/* Opcional: estilo para foto de top score */
.top-score-photo {
  border: 3px solid rgb(var(--v-theme-secondary));
}
</style>
