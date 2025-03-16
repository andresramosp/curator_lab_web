<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar d-flex">
      <v-text-field
        v-model="description"
        :label="queryDescription.text"
        :placeholder="queryDescription.example"
        outlined
        persistent-placeholder
        style="width: 20%"
        class="mx-3"
      ></v-text-field>

      <ToggleButtons v-model="searchType" style="width: 16%">
        <ToggleOption
          value="semantic"
          tooltip="Enter the query in natural language"
        >
          <v-icon left class="mr-1">mdi-brain</v-icon>
          Semantic
        </ToggleOption>

        <ToggleOption value="tags" tooltip="Enter the query by tags">
          <v-icon left class="mr-1">mdi-brain</v-icon>
          Tags
        </ToggleOption>
        <ToggleOption
          value="topological"
          tooltip="Search for specific elements by spatial distribution"
        >
          <v-icon left class="mr-1">mdi-magnify-scan</v-icon>
          Spatial
        </ToggleOption>
      </ToggleButtons>

      <ToggleButtons v-model="searchMode" style="width: 12%">
        <ToggleOption
          value="logical"
          tooltip="Performs a search with logical criteria and conceptual precision"
        >
          <v-icon left class="mr-1">mdi-magnify-scan</v-icon>
          Logical
        </ToggleOption>

        <ToggleOption
          value="creative"
          tooltip="Allows the engine to find indirect and figurative associations"
        >
          <v-icon left class="mr-1">mdi-brain</v-icon>
          Creative
        </ToggleOption>
      </ToggleButtons>

      <div style="width: 15%">
        <SwitchButton
          icon="mdi-eye-outline"
          v-model="withInsights"
          tooltip="Get insights on high potential photos"
        >
          Insights
        </SwitchButton>

        <v-btn
          @click="handleSearch"
          :loading="loading && !loadingIteration"
          :disabled="!description.length"
          class="mx-3 toolbar-control"
        >
          Search
        </v-btn>
      </div>
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
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import axios from "axios";
import { io } from "socket.io-client";
import ToggleButtons from "@/components/wrappers/ToggleButtons.vue";
import ToggleOption from "@/components/wrappers/ToggleOption.vue";

const socket = io(import.meta.env.VITE_API_WS_URL);
const description = ref("");
const iteration = ref(1);
const searchType = ref("semantic");
const searchMode = ref("logical");
const withInsights = ref(false);
const currentMatchPercent = ref(0);

const maxPageAttempts = ref(false);
const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const hasMoreIterations = ref(false);
const clearQuery = ref(null);

const queryDescription = computed(() => {
  if (searchMode.value === "creative") {
    return {
      text: "Explore your catalogue in a more flexible and figurative way",
      example: "Images that resonate with StarWars universe",
    };
  } else if (searchMode.value === "logical") {
    return {
      text: "Search the catalogue with natural language and logic precision",
      example: "People eating on a boat, during a sunny day",
    };
  }
});

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

function getPageSize() {
  if (!withInsights.value) return 8;
  const rowCount = 4;
  const unselectedPhotos = photos.value.filter(
    (photo) => !photo.isIncluded
  ).length;
  const module = unselectedPhotos % rowCount;
  const extraPhotos = module === 0 ? 0 : rowCount - module;
  return iteration.value === 1 ? 8 : 4 + extraPhotos;
}

async function searchPhotos() {
  loading.value = true;
  maxPageAttempts.value = false;
  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/search/${searchType.value}`,
      {
        description: description.value,
        options: {
          withInsights: withInsights.value,
          searchMode: searchMode.value,
          iteration: iteration.value,
          pageSize: getPageSize(),
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  iteration.value = 1;
  hasMoreIterations.value = false;
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

// WebSocket handlers...
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
    if (!withInsights.value) {
      hasMoreIterations.value = data.hasMore;
      iteration.value = data.iteration + 1;
    }
    console.log(data);
  });
  socket.on("insights", (data) => {
    Object.entries(data.results).forEach(([iter, richPhotos]) => {
      if (!iterationsRecord.value[iter]) return;
      iterationsRecord.value[iter].photos = iterationsRecord.value[
        iter
      ].photos.map((existingPhoto) => {
        const updatedPhoto = richPhotos.find(
          (item) => item.photo.id === existingPhoto.id
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
    hasMoreIterations.value = data.hasMore;
    iteration.value = data.iteration + 1;
    clearQuery.value = data.structuredResult.original;
  });
  socket.on("maxPageAttempts", () => {
    maxPageAttempts.value = true;
  });
});

onUnmounted(() => {
  socket.off("matches");
  socket.off("insights");
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
