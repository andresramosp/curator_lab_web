<template>
  <v-card class="photos-container selected-photos">
    <v-card-title class="section-title">{{
      withInsights ? "Top Selection" : "User Selection"
    }}</v-card-title>
    <v-card-text>
      <div class="photos-list">
        <PhotoCard
          v-for="(photo, index) in selectedPhotos"
          :key="photo.id"
          :photo="photo"
          :with-insights="withInsights"
          :fade-delay="photoFadeInDelays[index] || 0"
          @view-info="handleViewInfo"
          @switch-selected="handleSwitchSelected"
          :show-match-percent="false"
        >
          <template #overlay="{ isHovering, photo }">
            <div v-if="isHovering" class="reasoning-overlay">
              <span
                v-if="withInsights && photo.reasoning"
                class="reasoning-text"
              >
                {{ photo.reasoning }}
              </span>
              <div class="photo-buttons">
                <v-btn size="small" icon @click="handleViewInfo(photo)">
                  <v-icon>mdi-information</v-icon>
                </v-btn>
                <v-btn size="small" icon @click="handleSwitchSelected(photo)">
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </PhotoCard>

        <!-- Botón para aumentar iteración -->
        <v-card
          v-show="withInsights"
          :disabled="!hasMoreIterations || !selectedPhotos.length"
          :loading="loadingIteration"
          class="photo-card add-card"
          elevation="16"
          hover
          :style="{
            animationDelay: `${
              photoFadeInDelays[selectedPhotos.length - 1] || 0
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
</template>

<script setup>
import { computed, ref, watch, shallowRef } from "vue";
import PhotoCard from "./PhotoCard.vue";

const props = defineProps({
  photos: Array,
  withInsights: Boolean,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
});

const emit = defineEmits(["view-info", "switch-selected", "next-iteration"]);

const selectedPhotos = computed(() =>
  props.photos.filter((photo) => photo.isIncluded)
);

const photoFadeInDelays = ref([]);
const previousPhotosLength = shallowRef(props.photos.length);

watch(
  () => props.photos.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      photoFadeInDelays.value = props.photos.map(
        (_, index) => index * 100 // Delay mayor para Insights
      );
      previousPhotosLength.value = newLength;
    } else {
      photoFadeInDelays.value = [];
    }
  },
  { immediate: true }
);

function handleViewInfo(photo) {
  emit("view-info", photo);
}

function handleSwitchSelected(photo) {
  emit("switch-selected", photo);
}
</script>

<style scoped>
.photos-container {
  padding: 4px;
  border: 1px solid var(--v-theme-on-surface);
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.photos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

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

.centered-btn {
  margin: auto;
  display: block;
}

/* Se mantienen estilos específicos para el overlay de Insights */
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

.photo-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.reasoning-text {
  font-size: 11px;
}
</style>
