<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar">
      <v-row align="center" justify="space-between">
        <v-col cols="7">
          <v-text-field
            v-model="form.description"
            :label="queryDescription.text"
            :placeholder="queryDescription.example"
            outlined
          ></v-text-field>
        </v-col>
        <v-col cols="4" class="d-flex pr-8">
          <v-slider
            :disabled="form.useEmbeddings"
            :max="2"
            color="secondary"
            v-model="searchType"
            :ticks="searchTypes"
            show-ticks="always"
            step="1"
            tick-size="4"
          ></v-slider>

          <v-switch
            color="secondary"
            v-model="form.useEmbeddings"
            label="Quick search"
            class="ml-4"
            inset
          ></v-switch>
        </v-col>

        <v-col cols="1" class="d-flex justify-end pr-8">
          <v-btn
            @click="handleSearch"
            :loading="loading && !loadingIteration"
            :disabled="disableSearchButton"
          >
            Search
          </v-btn>
        </v-col>
      </v-row>
    </v-toolbar>

    <PhotosSearchGrid
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :isQuickSearch="form.useEmbeddings"
      :loadingIteration="loadingIteration"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";

const form = ref({
  description: "",
  filename: "",
  iteration: 1,
  useEmbeddings: false,
});

const searchType = ref(1);

const searchTypes = {
  0: "Logical",
  1: "Semantic",
  2: "Creative",
};

const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);
const onlySelected = ref(false);

const queryDescription = computed(() => {
  if (searchType.value == 0) {
    return {
      text: "Search with a logical, more strict syntax",
      example: "Photos with dogs and umbrellas, but not people",
    };
  } else if (searchType.value == 1) {
    return {
      text: "Search the catalog with natural language",
      example: "Images of people eating in a board",
    };
  } else {
    return {
      text: "Explore your catalogue in a more creative way",
      example: "Images which atmosphere resonates with StarWars movies",
    };
  }
});

const photos = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);

  const currentIteration = form.value.iteration;
  const accumulatedPhotos = [];

  for (let i = 0; i < currentIteration; i++) {
    const key = iterationKeys[i];
    if (key !== undefined && iterationsRecord.value[key].photos) {
      accumulatedPhotos.unshift(...iterationsRecord.value[key].photos);
    }
  }

  return accumulatedPhotos.filter(
    (ph) =>
      !ph.hasOwnProperty("isIncluded") ||
      (onlySelected.value && ph.isIncluded) ||
      !onlySelected.value
  );
});

async function searchPhotos() {
  // form.value.iteration = 1
  loading.value = true;
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search`,
      {
        ...form.value,
        searchType: searchTypes[searchType.value].toLowerCase(),
        iteration: form.value.iteration,
        currentPhotos: photos.value
          ? photos.value.map((photo) => photo.id)
          : null,
      }
    );
    processResult(response);
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

function processResult(response) {
  iterationsRecord.value = {
    ...iterationsRecord.value,
    ...response.data.results,
  };
  hasMoreIterations.value = response.data.hasMore;
  form.value.iteration = response.data.iteration;
}

function handleSearch() {
  form.value.iteration = 1;
  iterationsRecord.value = {};
  searchPhotos();
}

async function nextIteration() {
  loadingIteration.value = true;
  await searchPhotos();
  loadingIteration.value = false;
}
</script>

<style scoped>
.main-container {
  padding: 16px;
  row-gap: 15px;
}

.sticky-toolbar {
  position: sticky;
  top: 10px;
  z-index: 10;
}

.tag-breadcrumb {
  border-radius: 5px;
  width: 100%;
  position: sticky;
  /* top: 80px; 
  z-index: 9; */
}

.tag-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 8px;
  column-gap: 5px;
  padding: 5px;
  flex-direction: row;
  align-content: stretch;
  justify-content: flex-start;
}

.tag-section {
  margin-bottom: 10px;
}
.tag-line:last-child {
  margin-bottom: 0;
}
</style>
