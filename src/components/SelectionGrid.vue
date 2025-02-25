<template>
  <div>
    <div
      ref="scrollContainer"
      class="photos-container"
      style="overflow-y: auto; height: 74vh"
    >
      <v-card style="min-height: 620px">
        <v-card-title class="section-title">{{
          withInsights ? "Top Selection" : "User Selection"
        }}</v-card-title>
        <v-card-text>
          <div class="photos-list" style="gap: 10px">
            <PhotoCard
              v-for="(photo, index) in selectedPhotos"
              :key="photo.id"
              :photo="photo"
              :with-insights="withInsights"
              :fade-delay="photoFadeInDelays[index] || 0"
              @view-info="handleViewInfo"
              @switch-selected="handleSwitchSelected"
              :numerical-match="false"
              :show-match-percent="!withInsights"
              :type="withInsights ? 'insight' : 'selected'"
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
                    <v-btn
                      size="small"
                      icon
                      @click="handleSwitchSelected(photo)"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                  </div>
                </div>
              </template>
            </PhotoCard>
          </div>
        </v-card-text>
      </v-card>
    </div>
    <v-card style="padding: 10px">
      <v-btn
        @click="() => {}"
        variant="outlined"
        class="switch centered-btn"
        :disabled="!selectedPhotos.length"
      >
        <v-icon size="23">mdi-palette</v-icon> Move to Canvas
      </v-btn>
    </v-card>
  </div>
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

const selectedPhotos = computed(() => {
  if (props.withInsights) {
    return props.photos.filter((photo) => photo.isIncluded).reverse();
  } else {
    return props.photos.filter((photo) => photo.isIncluded);
  }
});

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

.reasoning-text {
  font-size: 11px;
}
</style>
