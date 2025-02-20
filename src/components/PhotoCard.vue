<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-card
        v-bind="props"
        :class="['photo-card', fadeClass]"
        :style="cardStyle"
      >
        <v-img
          :src="photoSrc"
          @error="fallbackImage"
          class="photo-image"
        ></v-img>

        <!-- Slot para overlay, se espera que el componente padre lo provea -->
        <slot name="overlay" :isHovering="isHovering" :photo="photo"></slot>

        <!-- Iconos informativos seleccion/deselección -->
        <div class="photo-icons">
          <v-icon v-if="photo.isIncludedByUser === true" color="secondary">
            mdi-account-check
          </v-icon>
          <v-icon
            v-else-if="photo.isIncludedByUser === false"
            color="secondary"
          >
            mdi-delete
          </v-icon>
          <div v-show="showMatchPercent" :class="[matchPercentClass]">
            <template v-if="numericalMatch">
              <span>{{ photo.matchPercent.toFixed(0) }}%</span>
            </template>
            <template v-else>
              <v-icon
                style="font-size: 15px"
                color="secondary"
                v-for="n in starCount"
                :key="n"
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

const props = defineProps({
  photo: Object,
  withInsights: Boolean,
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
});

const emit = defineEmits(["view-info", "switch-selected"]);

const photoSrc = computed(
  () => `${import.meta.env.VITE_PHOTOS_BASE_URL}/${props.photo.name}`
);

const cardStyle = computed(() => ({
  animationDelay: `${props.fadeDelay}ms`,
}));

const fadeClass = computed(() =>
  props.withInsights ? "fade-in-selected" : "fade-in-unselected"
);

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
  if (percent >= 85) return 3;
  if (percent >= 55) return 2;
  if (percent >= 10) return 1;
  else return 0;
});
</script>

<style scoped>
.photo-image {
  height: 150px;
  width: 100%;
  object-fit: cover;
}

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
  animation: fadeInSelectedAnimation 0.7s ease-in-out forwards;
}

.fade-in-unselected {
  opacity: 0;
  transform: translateY(50px);
  animation: fadeInUnselectedAnimation 0.3s ease-in-out forwards;
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
  color: rgb(var(--v-theme-secondary));
}
.medium-match {
  color: white;
}
.low-match {
  color: darkgray;
}
</style>
