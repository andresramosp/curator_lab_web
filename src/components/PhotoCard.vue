<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-card
        v-bind="props"
        :class="[
          `photo-card`,
          !photo.isSkeleton && !isThinking && doFade ? 'photo-appear' : '',
        ]"
        :style="cardStyle"
        @click="handleClick"
      >
        <div class="image-container">
          <v-img
            :src="photo.thumbnailUrl"
            @error="fallbackImage"
            :class="[`photo-card`, isThinking ? 'blurred-photo' : '']"
            transition="fade-transition"
          >
            <template #placeholder>
              <v-skeleton-loader type="image" class="photo-skeleton" />
            </template>
          </v-img>
        </div>

        <!-- Slot para overlay, se espera que el componente padre lo provea -->
        <slot name="overlay" :isHovering="isHovering" :photo="photo"></slot>

        <!-- Iconos informativos seleccion/deselección -->
        <div v-if="!isThinking" class="photo-icons">
          <div v-if="photo.selected">
            <v-icon color="secondary">mdi-check</v-icon>
          </div>
          <!-- <div v-else-if="photo.matchScore == 3" class="high-match">
            <img style="width: 19px;" :src="logo" alt="CuratorLab Logo"></img>
          </div> -->
          <div v-else-if="showMatchPercent" :class="[matchPercentClass]">
            <v-icon
              :color="starCount >= 3 ? 'secondary' : 'gray'"
              style="font-size: 15px; opacity: 1"
              v-for="n in starCount"
              :key="n"
              >mdi-star</v-icon
            >
          </div>
        </div>
      </v-card>
    </template>
  </v-hover>
</template>

<script setup>
import { computed } from "vue";
import { usePhotosStore } from "@/stores/photos";
import logo from "@/assets/CuratorLogo.png";
import logoGray from "@/assets/CuratorLogoGray.png";

const props = defineProps({
  photo: Object,
  isThinking: Boolean,
  isLoading: Boolean,
  doFade: Boolean,
  fadeDelay: {
    type: Number,
    default: 0,
  },

  showMatchPercent: { type: Boolean, default: true },
  maxPageAttempts: Boolean,
  size: String,
});

const emit = defineEmits(["view-info"]);

const photosStore = usePhotosStore();

const cardStyle = computed(() => ({
  width: props.size,
  animationDelay: `${props.fadeDelay}ms`,
  border: photosStore.selectedPhotoIds.includes(props.photo.id.toString())
    ? "1px solid rgb(var(--v-theme-secondary)) !important"
    : "none",
}));

const handleClick = () => {
  if (props.isLoading) return;
  if (props.photo.reasoning && !props.photo.selected) return;
  photosStore.togglePhotoSelection(props.photo.id);
};

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
  if (props.photo.matchScore !== undefined) {
    return props.photo.matchScore;
  }
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
  padding: 1px;
}

.photo-skeleton {
  height: 100%;
  width: 100%;
}

@keyframes appearUp {
  from {
    opacity: 0;
    transform: translateY(70px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.photo-appear {
  opacity: 0;
  transform: translateY(70px);
  animation: appearUp 0.4s ease forwards;
}
</style>
