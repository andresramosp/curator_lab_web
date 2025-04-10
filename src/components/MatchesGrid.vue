<template>
  <div>
    <div
      ref="scrollContainer"
      class="photos-container"
      style="overflow-y: auto; height: 74vh"
    >
      <v-card style="min-height: 620px">
        <v-card-text>
          <div class="photos-list">
            <PhotoCard
              v-for="(photo, index) in photos"
              :key="photo.id"
              :photo="photo"
              :with-insights="withInsights"
              :is-thinking="isThinking(photo)"
              :fade-delay="photoFadeInDelays[index] || 0"
              @view-info="handleViewInfo"
              :numerical-match="false"
              :type="photo.isInsight ? 'insight' : 'match'"
            >
              <template #overlay="{ isHovering, photo }">
                <div
                  v-if="isHovering && photo.isInsight"
                  class="reasoning-overlay"
                >
                  <span
                    v-if="photo.isInsight && photo.reasoning"
                    class="reasoning-text"
                  >
                    {{ photo.reasoning }}
                  </span>
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
                <div v-show="isHovering" class="action-buttons">
                  <v-btn size="small" icon @click="deletePhoto(photo.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-btn size="small" icon @click="editPhoto(photo.id)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn size="small" icon @click="analyzePhoto(photo.id)">
                    <v-icon>mdi-magnify</v-icon>
                  </v-btn>
                  <v-btn
                    size="small"
                    icon
                    @click.stop="$emit('view-info', photo)"
                  >
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
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
        class="centered-btn outline"
        :disabled="!hasMoreIterations || loadingIteration || loadingInsights"
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
  loadingInsights: Boolean,
  hasMoreIterations: Boolean,
  maxPageAttempts: Boolean,
});

const emit = defineEmits(["view-info", "next-iteration"]);

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
  return (
    props.loadingInsights && props.withInsights && photo.isInsight === undefined
  );
};
function handleViewInfo(photo) {
  emit("view-info", photo);
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
  /* position: absolute;
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
  justify-content: center; */

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

/* Opcional: estilo para foto de top score */
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
</style>
