<template>
  <v-container class="main-container">
    <!-- Toolbar for search form -->
    <v-toolbar flat>
      <v-text-field
        v-model="form.description"
        label="Description"
        outlined
        @input="handleInputChange"
      ></v-text-field>

      <v-btn
        @click="searchPhotosByTags"
        :loading="loading"
        :disabled="disableSearchButton"
      >
        Search
      </v-btn>
    </v-toolbar>

    <!-- Tag Selectors -->
    <v-row>
      <v-col cols="4">
        <TagSelector
          title="Tags Mandatory"
          :tags="form.mandatoryTags"
          @update-tags="(tags) => (form.mandatoryTags = tags)"
        />
      </v-col>
      <v-col cols="4">
        <TagSelector
          title="Tags Optional"
          :tags="form.optionalTags"
          @update-tags="(tags) => (form.optionalTags = tags)"
        />
      </v-col>
      <v-col cols="4">
        <TagSelector
          title="Tags Excluded"
          :tags="form.excludedTags"
          @update-tags="(tags) => (form.excludedTags = tags)"
        />
      </v-col>
    </v-row>

    <!-- Photos Grid -->
    <PhotosGrid
      :photos="photos"
      :forCuration="false"
      :hasMoreIterations="hasMoreIterations || tryDescIfEmpty"
      @next-iteration="nextIteration"
      :loadingIteration="loadingIteration"
    />
  </v-container>
</template>

<script setup>
import { ref, watch } from "vue";
import PhotosGrid from "@/components/photosGrid.vue";
import axios from "axios";
import TagSelector from "@/components/TagSelector.vue";

const form = ref({
  tags: [],
  description: "",
  filename: "",
  accuracy: 0,
  iteration: 1,
  mandatoryTags: [],
  optionalTags: [],
  excludedTags: [],
});

const searchByTags = ref(true);
const photos = ref(null);
const currentQueryLogicResult = ref(null);
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(true);
const lastQuery = ref("");
const disableSearchButton = ref(true);
const tryDescIfEmpty = ref(false);

const availableTags = ["nature", "portrait", "urban", "macro"];

function handleInputChange() {
  disableSearchButton.value = form.value.description === lastQuery.value;
}

async function searchPhotosByTags() {
  form.value.iteration = 1;
  loading.value = true;
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_tags`,
      form.value
    );
    photos.value = response.data.results;
    const { queryLogicResult } = response.data;
    currentQueryLogicResult.value = queryLogicResult;
    hasMoreIterations.value = response.data.hasMore;
    lastQuery.value = form.value.description;
    searchByTags.value = response.data.searchType == "TAGS";
    disableSearchButton.value = true;
    tryDescIfEmpty.value = !photos.value.length && !hasMoreIterations.value;
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

async function nextIteration() {
  form.value.iteration++;
  loadingIteration.value = true;
  try {
    const response = await axios.post(
      searchByTags.value && !tryDescIfEmpty.value
        ? `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_tags`
        : `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_tags`,
      {
        ...form.value,
        iteration: tryDescIfEmpty.value
          ? form.value.iteration - 1
          : form.value.iteration,
        currentPhotos: photos.value.map((photo) => photo.id),
        currentQueryLogicResult: currentQueryLogicResult.value,
      }
    );
    photos.value = [...photos.value, ...response.data.results];
    hasMoreIterations.value = response.data.hasMore;
    console.log(hasMoreIterations);
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loadingIteration.value = false;
  }
}
</script>

<style scoped>
.main-container {
  padding: 16px;
  row-gap: 15px;
}
</style>
