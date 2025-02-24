<template>
  <v-card ref="scrollContainer" class="photos-container">
    <v-card-title class="section-title">{{ "Potential Matches" }}</v-card-title>
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
        >
          <template #overlay="{ isHovering, photo }">
            <div>
              <div
                class="photo-overlay"
                v-show="isHovering && !isThinking(photo)"
              >
                <v-btn icon @click="handleSwitchSelected(photo)">
                  <v-icon size="36">mdi-plus</v-icon>
                </v-btn>
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
            </div>
          </template>
        </PhotoCard>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
  shallowRef,
  onMounted,
  onBeforeUnmount,
} from "vue";
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

watch(
  () => props.photos.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      photoFadeInDelays.value = props.photos.map(
        (_, index) => index * (!props.withInsights ? 10 : 100)
      );
      previousPhotosLength.value = newLength;
    } else {
      photoFadeInDelays.value = [];
    }
  },
  { immediate: true }
);

const isThinking = (photo) =>
  props.withInsights && photo.isIncluded === undefined;

function handleViewInfo(photo) {
  emit("view-info", photo);
}

function handleSwitchSelected(photo) {
  emit("switch-selected", photo);
}

// Infinite scrolling: usamos $el si scrollContainer es un componente Vuetify
const scrollContainer = ref(null);
function onScroll() {
  const container = scrollContainer.value?.$el || scrollContainer.value;
  if (container && !props.loadingIteration && props.hasMoreIterations) {
    const { scrollTop, clientHeight, scrollHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      emit("next-iteration");
    }
  }
}

onMounted(() => {
  const container = scrollContainer.value?.$el || scrollContainer.value;
  if (container && container.addEventListener) {
    container.addEventListener("scroll", onScroll);
  }
});

onBeforeUnmount(() => {
  const container = scrollContainer.value?.$el || scrollContainer.value;
  if (container && container.removeEventListener) {
    container.removeEventListener("scroll", onScroll);
  }
});
</script>

<style scoped>
.photos-container {
  padding: 4px;
  border: 1px solid var(--v-theme-on-surface);
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  height: 500px;
  overflow-y: auto;
}

.section-title {
  font-size: 16px;
  color: var(--v-theme-primary);
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

.top-score-photo {
  border: 3px solid rgb(var(--v-theme-secondary));
}
</style>
