<template>
  <div v-if="photos && photos.length" class="photos-grid">
    <MatchesGrid
      :style="{ width: showSelectionPanel ? '68%' : '100%', height: '81vh' }"
      :photos="photos"
      :with-insights="withInsights"
      :loading-iteration="loadingIteration"
      :has-more-iterations="hasMoreIterations"
      :max-page-attemps="maxPageAttempts"
      @view-info="viewPhotoInfo"
      @switch-selected="switchSelected"
      @next-iteration="$emit('next-iteration')"
    />
    <!-- <SelectionGrid
      v-if="showSelectionPanel"
      style="width: 32%; height: 81vh; overflow-y: auto"
      :photos="photos"
      :with-insights="withInsights"
      :loading-iteration="loadingIteration"
      :has-more-iterations="hasMoreIterations"
      @view-info="viewPhotoInfo"
      @switch-selected="switchSelected"
      @next-iteration="$emit('next-iteration')"
    /> -->
  </div>
  <div v-else class="catalog-message">
    <p class="text-h5 text-center">No photos yet</p>
  </div>
  <PhotoDialog v-model:dialog="showDialog" :selected-photo="selectedPhoto" />
</template>

<script setup>
import { ref, watch, shallowRef, computed } from "vue";
import SelectionGrid from "./SelectionGrid.vue";
import MatchesGrid from "./MatchesGrid.vue";
import PhotoDialog from "./PhotoDialog.vue";

const props = defineProps({
  photos: Array,
  loadingIteration: Boolean,
  hasMoreIterations: Boolean,
  withInsights: Boolean,
  maxPageAttempts: Boolean,
});

const emit = defineEmits(["next-iteration"]);

const showDialog = ref(false);
const selectedPhoto = ref({ id: null, description: "", matchingChunks: [] });

const showSelectionPanel = computed(
  () => false // props.photos.filter((photo) => photo.isIncluded).length > 0
);

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

function switchSelected(photo) {
  photo.isIncluded = !photo.isIncluded;
  if (photo.isIncluded) {
    photo._reasoning = photo.reasoning;
    photo.reasoning = "Selected by user";
    photo.isIncludedByUser =
      photo.isIncludedByUser === undefined ? true : undefined;
  } else {
    photo.reasoning = photo._reasoning;
    photo.isIncludedByUser =
      photo.isIncludedByUser === undefined ? false : undefined;
  }
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
  height: 83vh;
}

.photos-grid {
  display: flex;
  flex-direction: row;
  gap: 16px;
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

.photos-container {
  padding: 4px;
  border: 1px solid var(--v-theme-on-surface);
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  /* height: 83vh;
  overflow-y: scroll; */
}
</style>
