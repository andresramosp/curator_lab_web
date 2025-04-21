<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-card
        v-bind="props"
        :class="[`photo-card-${type}`]"
        :style="cardStyle"
        @click="photosStore.togglePhotoSelection(photo.id)"
      >
        <div class="image-container">
          <v-img
            :src="photoSrc"
            @error="fallbackImage"
            :class="[`photo-image-${type}`]"
          ></v-img>
        </div>

        <!-- Slot para overlay, se espera que el componente padre lo provea -->
        <slot name="overlay" :isHovering="isHovering" :photo="photo"></slot>

        <!-- Iconos informativos seleccion/deselección -->
        <div v-if="!isThinking" class="photo-icons">
          <div v-if="photo.isInsight" class="high-match">
            <v-icon color="secondary">mdi-crown</v-icon>
          </div>
          <div v-else :class="[matchPercentClass]">
            <template v-if="numericalMatch">
              <span>{{ photo.matchPercent.toFixed(0) }}%</span>
            </template>
            <template v-else>
              <v-icon style="font-size: 15px" v-for="n in starCount" :key="n"
                >mdi-star</v-icon
              >
            </template>
          </div>
        </div>
      </v-card>
    </template>
  </v-hover>
</template>

<script setup>
import { computed } from "vue";
import { usePhotosStore } from "@/stores/photos";

const props = defineProps({
  photo: Object,
  withInsights: Boolean,
  isThinking: Boolean,
  fadeDelay: {
    type: Number,
    default: 0,
  },
  numericalMatch: {
    type: Boolean,
    default: true,
  },
  showMatchPercent: { type: Boolean, default: true },
  maxPageAttempts: Boolean,
  type: "match" | "selected" | "insight",
});

const emit = defineEmits(["view-info"]);

const photosStore = usePhotosStore();

const photoSrc = computed(
  () => `${import.meta.env.VITE_PHOTOS_BASE_URL}/${props.photo.thumbnailName}`
);

const cardStyle = computed(() => ({
  animationDelay: `${props.fadeDelay}ms`,
  border: photosStore.selectedPhotoIds.includes(props.photo.id.toString())
    ? "1px solid rgb(var(--v-theme-secondary)) !important"
    : "none",
}));

function fallbackImage() {
  if (props.photo.url) {
    props.photo.url = null;
  }
}

const matchPercentClass = computed(() => {
  const percent = props.photo.matchPercent;
  if (percent >= 80) return "high-match";
  else if (percent >= 40) return "medium-match";
  else return "low-match";
});

const starCount = computed(() => {
  const percent = props.photo.matchPercent;
  if (percent >= 95) return 5;
  if (percent >= 85) return 4;
  if (percent >= 75) return 3;
  if (percent >= 55) return 2;
  if (percent >= 25) return 1;
  else return 0;
});
</script>

<style scoped>
.photo-icons {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 13px;
}

/* Animaciones de fade-in para Insights y Matches */
.fade-in-selected {
  opacity: 0;
  transform: translateY(50px);
  filter: grayscale(100%) blur(3px);
  animation: fadeInSelectedAnimation 0.5s ease-in-out forwards;
}

.fade-in-unselected {
  opacity: 0;
  transform: translateY(50px);
  animation: fadeInUnselectedAnimation 0.5s ease-in-out forwards;
}

@keyframes fadeInSelectedAnimation {
  from {
    opacity: 0;
    filter: grayscale(100%) blur(3px);
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    filter: grayscale(0%) blur(0px);
    transform: translateY(0);
  }
}

@keyframes fadeInUnselectedAnimation {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.high-match {
  /* color: rgb(var(--v-theme-secondary)); */
  color: white;
}
.medium-match {
  color: white;
}
.low-match {
  color: darkgray;
}

.image-container {
  display: flex;
  align-items: center; /* Centrado vertical */
  justify-content: center; /* Opcional, para centrar horizontalmente */
  height: 100%;
  padding: 5px;
}
</style>
