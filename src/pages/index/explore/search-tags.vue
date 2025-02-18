<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar">
      <v-row align="center" justify="space-between">
        <v-col cols="6">
          <v-text-field
            v-model="form.description"
            :label="queryDescription.text"
            :placeholder="queryDescription.example"
            outlined
          ></v-text-field>
        </v-col>
        <v-col cols="4" class="d-flex pr-8" style="column-gap: 20px">
          <v-slider
            :max="2"
            :disabled="form.isQuickSearch"
            color="secondary"
            v-model="searchType"
            :ticks="searchTypes"
            show-ticks="always"
            step="1"
            tick-size="0"
          ></v-slider>

          <v-switch
            color="secondary"
            v-model="form.isQuickSearch"
            label="Quick search"
            class="ml-4"
            inset
          ></v-switch>
        </v-col>

        <v-col cols="1" class="d-flex justify-end pr-8">
          <v-btn
            @click="handleSearch"
            :loading="loading && !loadingIteration"
            :disabled="!form.description.length"
          >
            Search
          </v-btn>
        </v-col>
      </v-row>
    </v-toolbar>

    <div class="alert-message">
      <v-alert
        v-if="maxPageAttempts"
        class="bottom-0 mb-5"
        position="fixed"
        color="secondary"
        closable
        :text="`It seems unlikely that we will find more pictures related to ${clearQuery}. We suggest you adjust the search or try a different mode.`"
        theme="dark"
      >
      </v-alert>
    </div>

    <PhotosSearchGrid
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :withInsights="withInsights"
      :loadingIteration="loadingIteration"
      :maxPageAttempts="maxPageAttempts"
      :searchType="searchType"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import axios from "axios";
import { io } from "socket.io-client";
import { de } from "vuetify/locale";

const socket = io(import.meta.env.VITE_API_WS_URL);

const form = ref({
  description: "",
  filename: "",
  iteration: 1,
  isQuickSearch: false,
  // withInsights: false,
});

const maxPageAttempts = ref(false);
const searchType = ref(1);
const searchTypes = {
  0: "Logical",
  1: "Semantic",
  2: "Creative",
};

// Provisional hasta que se decida si "creative" estará disponible sin insights, y cómo sería el botón de "get insights"
const withInsights = computed(() => {
  return searchType.value == 2 && !form.value.isQuickSearch;
});

const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);
const onlySelected = ref(false);
const clearQuery = ref(null);

const queryDescription = computed(() => {
  if (searchType.value == 0) {
    return {
      text: "Search with a logical, more strict syntax",
      example: "Photos with dogs and umbrellas, but not people",
    };
  } else if (searchType.value == 1) {
    return {
      text: "Search the catalog with natural language",
      example: "Images of people eating on a boat",
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
    if (key !== undefined && iterationsRecord.value[key]?.photos) {
      if (!withInsights.value) {
        accumulatedPhotos.push(...iterationsRecord.value[key].photos);
      } else {
        accumulatedPhotos.unshift(...iterationsRecord.value[key].photos);
      }
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
  loading.value = true;
  maxPageAttempts.value = false;
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/search`, {
      ...form.value,
      withInsights: withInsights.value,
      searchType: searchTypes[searchType.value].toLowerCase(),
      iteration: form.value.iteration,
      currentPhotos: photos.value
        ? photos.value.map((photo) => photo.id)
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
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

watch(
  () => withInsights.value,
  () => {
    iterationsRecord.value = {};
  }
);

// WebSocket handlers
onMounted(() => {
  socket.on("embeddings", (data) => {
    Object.entries(data.results).forEach(([iteration, result]) => {
      iterationsRecord.value[iteration] = {
        photos: result.photos.map((photo) => ({
          ...photo,
          score: data.scores.find((score) => score.photo.id == photo.id)
            .totalScore,
          queryMatched: data.scores.find((score) => score.photo.id == photo.id)
            .queryMatched,
        })),
      };
    });
    if (!withInsights.value) {
      hasMoreIterations.value = data.hasMore;
      form.value.iteration = data.iteration + 1;
    }

    console.log(data);
  });

  socket.on("result", (data) => {
    Object.entries(data.results).forEach(([iteration, result]) => {
      if (!iterationsRecord.value[iteration]) return;

      iterationsRecord.value[iteration].photos = iterationsRecord.value[
        iteration
      ].photos.map((existingPhoto) => {
        const updatedPhoto = result.photos.find(
          (p) => p.id === existingPhoto.id
        );
        return updatedPhoto
          ? {
              ...existingPhoto,
              isIncluded: updatedPhoto.isIncluded,
              reasoning: updatedPhoto.reasoning,
            }
          : existingPhoto;
      });
    });

    console.log(data);

    hasMoreIterations.value = data.hasMore;
    form.value.iteration = data.iteration + 1;
    clearQuery.value = data.structuredResult.original;
  });

  socket.on("maxPageAttempts", (data) => {
    maxPageAttempts.value = true;
  });
});

onUnmounted(() => {
  socket.off("embeddings");
  socket.off("result");
  socket.off("maxPageAttempts");
});
</script>

<style scoped>
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

.alert-message {
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
