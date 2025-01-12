<template>
  <v-container class="main-container">
    <v-toolbar :elevation="8">
      <v-row align="center" justify="space-between">
        <v-col cols="6">
          <v-text-field
            v-model="form.description"
            label="Description"
            outlined
            @input="handleInputChange"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-radio-group v-model="searchType" inline>
            <v-radio label="Tags" value="tags"></v-radio>
            <v-radio label="Semantic" value="semantic"></v-radio>
            <v-radio label="Creative" value="creative"></v-radio>
          </v-radio-group>
        </v-col>
        <v-col cols="2" class="d-flex justify-end pr-8">
          <v-btn
            @click="handleSearch"
            :loading="loading"
            :disabled="disableSearchButton"
          >
            Search
          </v-btn>
        </v-col>
      </v-row>
    </v-toolbar>

    <!-- Photos Grid -->
    <PhotosSearchGrid
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :loadingIteration="loadingIteration"
    />
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const form = ref({
  tags: [],
  description: "",
  filename: "",
  iteration: 1,
});

const photos = ref([]);
const iterationsRecord = ref({});
const searchType = ref("tags");
const currentQueryLogicResult = ref(null);
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);
const lastQuery = ref("");
const disableSearchButton = ref(false);

function handleInputChange() {
  // disableSearchButton.value = form.value.description === lastQuery.value;
}

async function searchPhotos() {
  loading.value = true;
  try {
    const response = await axios.post(
      searchType.value == "tags"
        ? `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_tags`
        : searchType.value == "semantic"
        ? `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_desc`
        : `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search_creative`,
      {
        ...form.value,
        iteration: form.value.iteration,
        currentPhotos: photos.value
          ? photos.value.map((photo) => photo.id)
          : null,
        currentQueryLogicResult: currentQueryLogicResult.value,
      }
    );
    // photos.value = [...photos.value, ...processResult(response.data.results)];
    iterationsRecord.value = response.data.results;
    hasMoreIterations.value = response.data.hasMore;

    if (form.value.iteration == 1) {
      const { queryLogicResult } = response.data;
      currentQueryLogicResult.value = queryLogicResult;
      lastQuery.value = form.value.description;
      // disableSearchButton.value = true;
    }
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  form.value.iteration = 1;
  photos.value = [];
  currentQueryLogicResult.value = null;
  searchPhotos();
}

async function nextIteration() {
  form.value.iteration++;
  if (searchType !== "tags") searchPhotos();
}
</script>

<style scoped>
.main-container {
  padding: 16px;
  row-gap: 15px;
}
</style>
