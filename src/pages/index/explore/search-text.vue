<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar">
      <v-text-field
        v-model="description"
        :label="queryDescription.text"
        :placeholder="queryDescription.example"
        outlined
        persistent-placeholder
        style="width: 60%"
        class="mx-3"
      ></v-text-field>
      <v-spacer></v-spacer>

      <SwitchButton
        icon="mdi-magnify-scan"
        v-model="isQuickSearch"
        tooltip="Performs a quick surface search. Ideal for searching for dogs and cats."
        >Quick Search</SwitchButton
      >
      <SwitchButton
        icon="mdi-palette"
        v-model="isCreative"
        tooltip="Allows the engine to find indirect and figurative associations"
        >Creative</SwitchButton
      >

      <SwitchButton
        icon="mdi-eye-outline"
        v-model="withInsights"
        tooltip="Get insights on high potential photos"
        >Insights</SwitchButton
      >

      <v-btn
        @click="handleSearch"
        :loading="loading && !loadingIteration"
        :disabled="!description.length"
        class="mx-3 toolbar-control"
      >
        Search
      </v-btn>
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
      ></v-alert>
    </div>

    <PhotosSearchGrid
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :withInsights="withInsights"
      :loadingIteration="loadingIteration"
      :maxPageAttempts="maxPageAttempts"
      :isCreative="isCreative"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_WS_URL);

const description = ref("");
const iteration = ref(1);
const isQuickSearch = ref(false);
const isCreative = ref(false);
const withInsights = ref(false);
const currentMatchPercent = ref(0);

const maxPageAttempts = ref(false);

const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);
const clearQuery = ref(null);

watch(isQuickSearch, () => {
  if (isQuickSearch.value) {
    isCreative.value = false;
    withInsights.value = false;
  }
});

watch([isCreative, withInsights], ([creative, insights]) => {
  if (creative || insights) {
    isQuickSearch.value = false;
  }
});

const queryDescription = computed(() => {
  if (isQuickSearch.value) {
    return {
      text: "Find photos quickly with specific and simple words",
      example: "Black cats",
    };
  }
  if (!isCreative.value) {
    return {
      text: "Search the catalogue with natural language and logic precission",
      example: "People eating on a boat, during a sunny day",
    };
  } else {
    return {
      text: "Explore your catalogue in a more fexible and conceptual way",
      example: "Images that resonate with StarWars universe",
    };
  }
});

const photos = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);

  const currentIteration = iteration.value;
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

  return accumulatedPhotos;
});

async function searchPhotos() {
  loading.value = true;
  maxPageAttempts.value = false;
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/search`, {
      description: description.value,
      withInsights: withInsights.value,
      isQuickSearch: isQuickSearch.value,
      searchType: isCreative.value ? "creative" : "semantic",
      iteration: iteration.value,
    });
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  iteration.value = 1;
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
  socket.on("matches", (data) => {
    Object.entries(data.results).forEach(([iteration, richPhotos]) => {
      iterationsRecord.value[iteration] = {
        photos: richPhotos.map((item) => ({
          ...item.photo,
          matchPercent: item.matchPercent,
        })),
      };
      currentMatchPercent.value = Math.min(
        Math.max(...richPhotos.map((item) => item.matchPercent)),
        100
      );
    });
    if (!withInsights.value) {
      hasMoreIterations.value = data.hasMore;
      iteration.value = data.iteration + 1;
    }
    console.log(data);
  });

  socket.on("insights", (data) => {
    Object.entries(data.results).forEach(([iteration, richPhotos]) => {
      if (!iterationsRecord.value[iteration]) return;

      iterationsRecord.value[iteration].photos = iterationsRecord.value[
        iteration
      ].photos.map((existingPhoto) => {
        const updatedPhoto = richPhotos.find(
          (item) => item.photo.id === existingPhoto.id
        );
        console.log(updatedPhoto);
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
    iteration.value = data.iteration + 1;
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
  width: 100%;
}

.toolbar-control {
  font-size: 11px !important;
}

.alert-message {
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
