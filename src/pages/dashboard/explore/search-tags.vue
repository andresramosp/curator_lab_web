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

    <!-- Photos Grid -->
    <PhotosSearchGrid
      :photos="photos"
      :forCuration="false"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :loadingIteration="loadingIteration"
    />
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import PhotosGrid from "@/components/photosSearchGrid.vue";
import axios from "axios";

const form = ref({
  tags: [],
  description: "",
  filename: "",
  iteration: 1,
});

const photos = ref(null);
const currentQueryLogicResult = ref(null);
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(true);
const lastQuery = ref("");
const disableSearchButton = ref(true);

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
    disableSearchButton.value = true;
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
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_tags`,
      {
        ...form.value,
        iteration: form.value.iteration,
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
