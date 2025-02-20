<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar">
      <!-- CAJA INCLUDE -->
      <v-combobox
        v-model="includedTags"
        v-model:search="searchInputIncluded"
        :items="includedTagSuggestions"
        label="Tags incluidos"
        multiple
        chips
        clearable
        open-on-focus
        @update:search="onSearchInputIncluded"
        class="mx-2"
      />

      <!-- CAJA EXCLUDE -->
      <v-combobox
        v-model="excludedTags"
        v-model:search="searchInputExcluded"
        :items="excludedTagSuggestions"
        label="Tags excluidos"
        multiple
        chips
        clearable
        open-on-focus
        @update:search="onSearchInputExcluded"
        class="mx-2"
      />

      <v-spacer></v-spacer>

      <SwitchButton
        icon="mdi-magnify-scan"
        v-model="isQuickSearch"
        tooltip="Performs a quick surface search. Ideal for searching for dogs and cats."
        >Quick Search</SwitchButton
      >

      <v-btn
        @click="handleSearch"
        :loading="loading && !loadingIteration"
        :disabled="false"
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

    <div class="photo-grid-container">
      <PhotosSearchGrid
        :photos="photos"
        :hasMoreIterations="hasMoreIterations"
        @next-iteration="nextIteration"
        :withInsights="false"
        :loadingIteration="loadingIteration"
        :maxPageAttempts="maxPageAttempts"
        :isCreative="isCreative"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_WS_URL);

const iteration = ref(1);
const isQuickSearch = ref(false);
const currentMatchPercent = ref(0);
const maxPageAttempts = ref(false);
const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);

const photos = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);
  const accumulatedPhotos = [];
  for (let i = 0; i < iteration.value; i++) {
    const key = iterationKeys[i];
    if (key !== undefined && iterationsRecord.value[key]?.photos) {
      accumulatedPhotos.push(...iterationsRecord.value[key].photos);
    }
  }
  return accumulatedPhotos;
});

// Variables para tags incluidos y excluidos
const includedTags = ref([]);
const excludedTags = ref([]);
const includedTagSuggestions = ref([]);
const excludedTagSuggestions = ref([]);
const searchInputIncluded = ref("");
const searchInputExcluded = ref("");

// Debounce timers
let debounceTimeoutIncluded = null;
let debounceTimeoutExcluded = null;

// Función que llama al endpoint real /api/tags/search
async function fetchTagSuggestions(query) {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/tags/search`,
      {
        params: { term: query },
      }
    );
    // Se asume que cada tag tiene una propiedad 'name'
    return response.data.result.map((tag) => tag.name);
  } catch (error) {
    console.error("Error fetching tag suggestions", error);
    return [];
  }
}

async function onSearchInputIncluded(val) {
  searchInputIncluded.value = val;
  if (debounceTimeoutIncluded) clearTimeout(debounceTimeoutIncluded);
  if (val.trim().length < 2) {
    includedTagSuggestions.value = [];
    return;
  }
  debounceTimeoutIncluded = setTimeout(async () => {
    try {
      const suggestions = await fetchTagSuggestions(val);
      includedTagSuggestions.value = suggestions;
    } catch (error) {
      console.error("Error fetching included tag suggestions", error);
    }
  }, 500);
}

async function onSearchInputExcluded(val) {
  searchInputExcluded.value = val;
  if (debounceTimeoutExcluded) clearTimeout(debounceTimeoutExcluded);
  if (val.trim().length < 2) {
    excludedTagSuggestions.value = [];
    return;
  }
  debounceTimeoutExcluded = setTimeout(async () => {
    try {
      const suggestions = await fetchTagSuggestions(val);
      excludedTagSuggestions.value = suggestions;
    } catch (error) {
      console.error("Error fetching excluded tag suggestions", error);
    }
  }, 300);
}

async function searchPhotos() {
  loading.value = true;
  maxPageAttempts.value = false;
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/searchByTags`, {
      included: includedTags.value,
      excluded: excludedTags.value,
      isQuickSearch: isQuickSearch.value,
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

// WebSocket handlers
onMounted(() => {
  socket.on("matches", (data) => {
    Object.entries(data.results).forEach(([iter, richPhotos]) => {
      iterationsRecord.value[iter] = {
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
    hasMoreIterations.value = data.hasMore;
    iteration.value = data.iteration + 1;
    console.log(data);
  });

  socket.on("maxPageAttempts", () => {
    maxPageAttempts.value = true;
  });
});

onUnmounted(() => {
  socket.off("matches");
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
