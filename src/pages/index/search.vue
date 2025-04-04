<template>
  <div class="main-container">
    <v-toolbar :elevation="8" class="sticky-toolbar d-flex">
      <!-- Área de input (condicional) -->
      <div style="width: 55%">
        <template v-if="searchType == 'semantic'">
          <v-text-field
            v-model="description"
            :label="queryDescription.text"
            :placeholder="queryDescription.example"
            outlined
            persistent-placeholder
            class="mx-3"
          ></v-text-field>
        </template>
        <template v-else-if="searchType == 'tags'">
          <div class="d-flex" style="width: 100%">
            <v-combobox
              v-model="includedTags"
              v-model:search="searchInputIncluded"
              :items="includedTagSuggestions"
              label="Included Tags"
              multiple
              chips
              clearable
              open-on-focus
              @update:search="onSearchInputIncluded"
              class="mx-2"
            />
            <v-combobox
              v-model="excludedTags"
              v-model:search="searchInputExcluded"
              :items="excludedTagSuggestions"
              label="Penalized Tags"
              multiple
              chips
              clearable
              open-on-focus
              @update:search="onSearchInputExcluded"
              class="mx-2"
            />
          </div>
        </template>
        <template v-else>
          <div class="d-flex">
            <v-text-field
              v-model="topologicalAreas.left"
              :label="'Left half'"
              :placeholder="'A red dragon'"
              outlined
              class="mx-1"
              persistent-placeholder
            >
              <template #append-inner v-if="topologicalAreas.left">
                <v-icon
                  size="18"
                  @click="topologicalAreas.left = ''"
                  style="cursor: pointer"
                >
                  mdi-close
                </v-icon>
              </template>
            </v-text-field>
            <v-text-field
              v-model="topologicalAreas.middle"
              :label="'Middle area'"
              :placeholder="'Something funny'"
              outlined
              class="mx-1"
              persistent-placeholder
            >
              <template #append-inner v-if="topologicalAreas.middle">
                <v-icon
                  size="18"
                  @click="topologicalAreas.middle = ''"
                  style="cursor: pointer"
                >
                  mdi-close
                </v-icon>
              </template></v-text-field
            >
            <v-text-field
              v-model="topologicalAreas.right"
              :label="'Right half'"
              :placeholder="'A little mouse'"
              outlined
              class="mx-1"
              persistent-placeholder
            >
              <template #append-inner v-if="topologicalAreas.right">
                <v-icon
                  size="18"
                  @click="topologicalAreas.right = ''"
                  style="cursor: pointer"
                >
                  mdi-close
                </v-icon>
              </template></v-text-field
            >
          </div>
        </template>
      </div>

      <ToggleButtons v-model="searchType" style="width: 17%">
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

      <ToggleButtons v-model="searchMode" style="width: 11%">
        <ToggleOption
          value="logical"
          tooltip="Performs a search with logical criteria and conceptual precision"
        >
          <v-icon left class="mr-1">mdi-magnify-scan</v-icon>
          Strict
        </ToggleOption>
        <ToggleOption
          value="creative"
          tooltip="Allows the engine to find indirect and figurative associations"
        >
          <v-icon left class="mr-1">mdi-brain</v-icon>
          Flexible
        </ToggleOption>
      </ToggleButtons>

      <SwitchButton
        :isDisabled="searchMode != 'creative' || searchType != 'semantic'"
        icon="mdi-eye-outline"
        v-model="withInsights"
        tooltip="Get insights on high potential photos"
      >
        Insights
      </SwitchButton>

      <v-btn
        @click="handleSearch"
        :loading="loading && !loadingIteration"
        :disabled="searchDisabled"
        class="mx-3 toolbar-control"
      >
        Search
      </v-btn>
    </v-toolbar>

    <!-- <div class="alert-message">
      <v-alert
        v-if="maxPageAttempts"
        class="bottom-0 mb-5"
        position="fixed"
        color="secondary"
        closable
        :text="`It seems unlikely that we will find more pictures related to ${clearQuery}. We suggest you adjust the search or try a different mode.`"
        theme="dark"
      ></v-alert>
    </div> -->
    <div
      v-if="photos.length"
      class="toolbar-control photos-options d-flex align-center"
    >
      <div v-if="withInsights" class="d-flex align-center">
        <span class="me-2">Insights</span>
        <v-switch
          v-model="onlyInsights"
          color="secondary"
          hide-details
        ></v-switch>
      </div>
    </div>
    <PhotosSearchGrid
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :withInsights="searchType !== 'tags' ? withInsights : false"
      :loadingIteration="loadingIteration"
      :loadingInsights="loadingInsights"
      :maxPageAttempts="maxPageAttempts"
    />
    <div class="grid-floating-buttons">
      <v-btn
        v-if="photosStore.selectedPhotoIds.length"
        class="sync-button"
        @click="moveToCanvas()"
      >
        Move to Canvas
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from "vue";
import axios from "axios";
import { io } from "socket.io-client";
import ToggleButtons from "@/components/wrappers/ToggleButtons.vue";
import ToggleOption from "@/components/wrappers/ToggleOption.vue";
import SwitchButton from "@/components/wrappers/SwitchButton.vue";
import PhotosSearchGrid from "@/components/PhotosSearchGrid.vue";
import { useSearchTags } from "@/composables/useSearchTags";
import { usePhotosStore } from "@/stores/photos";
import { useCanvasStore } from "@/stores/canvas";
import { useRouter } from "vue-router";

const socket = io(import.meta.env.VITE_API_WS_URL);

const photosStore = usePhotosStore();
const canvasStore = useCanvasStore();
const router = useRouter();

const searchType = ref("semantic");
const searchMode = ref("logical");
const withInsights = ref(false);
const iteration = ref(1);
const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const loadingInsights = ref(false);
const hasMoreIterations = ref(false);
const maxPageAttempts = ref(false);
const clearQuery = ref(null);
const currentMatchPercent = ref(0);

// Semantic
const description = ref("");

// Topological
const topologicalAreas = reactive({
  left: "",
  right: "",
  middle: "",
});

const onlyInsights = ref(false);

// Lógica específica para tags (composable)
const {
  includedTags,
  excludedTags,
  includedTagSuggestions,
  excludedTagSuggestions,
  searchInputIncluded,
  searchInputExcluded,
  onSearchInputIncluded,
  onSearchInputExcluded,
} = useSearchTags();

const queryDescription = computed(() => {
  return searchMode.value === "creative"
    ? {
        text: "Explore your catalogue in a more flexible and figurative way",
        example: "Images that resonate with StarWars universe",
      }
    : {
        text: "Search the catalogue with natural language and logic precision",
        example: "People eating on a boat, during a sunny day",
      };
});

const photos = computed(() => {
  const keys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);
  let result = [];
  for (let i = 0; i < iteration.value; i++) {
    const key = keys[i];
    if (key !== undefined && iterationsRecord.value[key]?.photos) {
      result.push(...iterationsRecord.value[key].photos);
    }
  }
  return result.filter(
    (photo) => loadingIteration.value || !onlyInsights.value || photo.isInsight
  );
});

const searchDisabled = computed(() => {
  if (searchType.value == "tags") {
    return !includedTags.value.length && !excludedTags.value.length;
  }
  if (searchType.value == "semantic") {
    return !description.value.length;
  }
  if (searchType.value == "topological") {
    return (
      !topologicalAreas.left.length &&
      !topologicalAreas.right.length &&
      !topologicalAreas.middle.length
    );
  }
});

function getPageSize() {
  return 12;
}

async function searchPhotos() {
  loading.value = true;
  loadingInsights.value = withInsights.value;
  maxPageAttempts.value = false;
  try {
    let payload;
    let options = {
      withInsights: withInsights.value,
      searchMode: searchMode.value,
      iteration: iteration.value,
      pageSize: getPageSize(),
    };
    if (searchType.value === "tags") {
      payload = {
        included: includedTags.value,
        excluded: excludedTags.value,
        options,
      };
    } else if (searchType.value == "topological") {
      payload = {
        ...topologicalAreas,
        options,
      };
    } else {
      payload = {
        description: description.value,
        options,
      };
    }
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/search/${searchType.value}`,
      payload
    );
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  photosStore.selectedPhotosRecord = {};
  onlyInsights.value = false;
  iteration.value = 1;
  hasMoreIterations.value = false;
  iterationsRecord.value = {};
  searchPhotos();
}

async function nextIteration() {
  loadingIteration.value = true;
  loadingInsights.value = withInsights.value;
  await searchPhotos();
  loadingIteration.value = false;
}

async function moveToCanvas() {
  await canvasStore.addPhotos(photosStore.selectedPhotoIds);
  router.push("/canvas");
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
    if (searchType.value === "tags" && data.structuredResult) {
      clearQuery.value = data.structuredResult.original;
    }
    console.log(data);
  });

  socket.on("insights", (data) => {
    Object.entries(data.results).forEach(([iter, richPhotos]) => {
      if (!iterationsRecord.value[iter]) return;
      iterationsRecord.value[iter].photos = iterationsRecord.value[
        iter
      ].photos.map((existing) => {
        const updated = richPhotos.find(
          (item) => item.photo.id === existing.id
        );
        return updated
          ? {
              ...existing,
              isInsight: updated.isInsight,
              reasoning: updated.reasoning,
            }
          : existing;
      });
    });
    hasMoreIterations.value = data.hasMore;
    iteration.value = data.iteration + 1;
    clearQuery.value = data.structuredResult.original;
    loadingInsights.value = false;

    console.log(data);
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

.photos-options {
  top: -4px;
  right: 5px;
  margin-top: 3px;
  height: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
