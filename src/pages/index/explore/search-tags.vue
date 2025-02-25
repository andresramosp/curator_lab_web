<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar">
      <!-- CAJA INCLUDE -->
      <v-combobox
        v-model="includedTags"
        v-model:search="searchInputIncluded"
        :items="includedTagSuggestions"
        label="Included Tags"
        style="width: 17%"
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
        label="Excluded Tags"
        multiple
        chips
        style="width: 17%"
        clearable
        open-on-focus
        @update:search="onSearchInputExcluded"
        class="mx-2"
      />

      <v-spacer></v-spacer>

      <SwitchButton
        icon="mdi-magnify-scan"
        v-model="deepSearch"
        tooltip="Performs a deeper search, while consuming more time."
        >Deep Search</SwitchButton
      >

      <v-btn
        @click="handleSearch"
        :loading="loading && !loadingIteration"
        :disabled="!excludedTags.length && !includedTags.length"
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
      :withInsights="false"
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

const iteration = ref(1);
const deepSearch = ref(false);
const currentMatchPercent = ref(0);
const maxPageAttempts = ref(false);
const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);

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

// watch(
//   includedTags,
//   (newVal, oldVal) => {
//     if (
//       photos.value.length &&
//       newVal.length > 0 &&
//       newVal.length < oldVal.length
//     ) {
//       handleSearch();
//     }
//   },
//   { deep: true }
// );

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

function getPageSize() {
  let rowCount = 4;
  let unselectedPhotos = photos.value.filter(
    (photo) => !photo.isIncluded
  ).length;
  let module = unselectedPhotos % rowCount;
  let extraPhotos = module == 0 ? 0 : rowCount - module;
  return iteration.value == 1 ? 8 : 4 + extraPhotos;
}

async function searchPhotos() {
  loading.value = true;
  maxPageAttempts.value = false;
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/searchByTags`, {
      included: includedTags.value,
      excluded: excludedTags.value,
      deepSearch: deepSearch.value,
      iteration: iteration.value,
      pageSize: getPageSize(),
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
