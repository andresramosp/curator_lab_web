<template>
  <div class="main-container">
    <v-toolbar color="surface" :elevation="8" class="sticky-toolbar d-flex">
      <!-- Área de input (flex proporcional con box-sizing) -->
      <div style="flex: 0 0 48%; box-sizing: border-box; padding-top: 5px">
        <template v-if="searchType == 'semantic'">
          <v-text-field
            v-model="description"
            :disabled="!warmedUp"
            :label="'Type your query in natural language'"
            autofocus
            outlined
            persistent-placeholder
          ></v-text-field>
        </template>
        <template v-else-if="searchType == 'tags'">
          <div class="d-flex" style="width: 100%; gap: 8px">
            <v-combobox
              :disabled="!warmedUp"
              autofocus
              v-model="includedTags"
              v-model:search="searchInputIncluded"
              :items="includedTagSuggestions"
              label="Included Tags"
              multiple
              chips
              clearable
              open-on-focus
              @update:search="onSearchInputIncluded"
            />
            <v-combobox
              v-model="excludedTags"
              :disabled="!warmedUp"
              v-model:search="searchInputExcluded"
              :items="excludedTagSuggestions"
              label="Penalized Tags"
              multiple
              chips
              clearable
              open-on-focus
              @update:search="onSearchInputExcluded"
            />
          </div>
        </template>
        <template v-else>
          <div class="d-flex" style="gap: 8px">
            <v-text-field
              :disabled="!warmedUp"
              autofocus
              v-model="topologicalAreas.left"
              label="Left half"
              placeholder="A red dragon"
              outlined
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
              :disabled="!warmedUp"
              v-model="topologicalAreas.middle"
              label="Middle area"
              placeholder="Something funny"
              outlined
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
              </template>
            </v-text-field>
            <v-text-field
              :disabled="!warmedUp"
              v-model="topologicalAreas.right"
              label="Right half"
              placeholder="A little mouse"
              outlined
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
              </template>
            </v-text-field>
          </div>
        </template>
      </div>

      <!-- Área de botones (flex con menú alineado a la derecha) -->
      <div
        style="
          flex: 0 0 52%;
          box-sizing: border-box;
          padding-bottom: 5px;
          display: flex;
          align-items: center;
        "
      >
        <!-- Agrupación principal de controles -->
        <div style="display: flex; gap: 10px; align-items: center">
          <ToggleButtons v-model="searchType">
            <ToggleOption
              value="semantic"
              tooltip="Enter the query in natural language"
            >
              <v-icon left class="mr-1">mdi-brain</v-icon>
              Text
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

          <ToggleButtons v-model="searchMode">
            <ToggleOption
              value="logical"
              tooltip="Perform a heavy search with logical criteria and conceptual precision."
            >
              <v-icon left class="mr-1">mdi-magnify-scan</v-icon>
              Strict
            </ToggleOption>
            <ToggleOption
              value="flexible"
              tooltip="Allow the engine to include indirect and figurative associations."
            >
              <v-icon left class="mr-1">mdi-brain</v-icon>
              Flexible
            </ToggleOption>

            <ToggleOption
              :disabled="searchType != 'semantic'"
              value="curation"
              tooltip="Create a top selection of images for your conceptual project with intelligence assistance."
            >
              <img
                style="width: 16px; margin-right: 3.5px"
                :src="
                  searchMode == 'curation' || searchType != 'semantic'
                    ? logoGray
                    : logoGreen
                "
                alt="CuratorLab Logo"
              />

              Curation
            </ToggleOption>
          </ToggleButtons>

          <v-btn
            @click="handleClear"
            :disabled="loading || !warmedUp"
            class="toolbar-control outline"
          >
            Clear
          </v-btn>
          <v-btn
            @click="handleSearch"
            :loading="loading && !loadingIteration && !loadingInsights"
            :disabled="searchDisabled || !warmedUp"
            class="toolbar-control"
          >
            Search
          </v-btn>
        </div>
        <!-- Menú desplazado al extremo derecho -->
        <div style="margin-left: auto; margin-right: 12px">
          <v-menu v-model="menu" offset-y>
            <template #activator="{ props }">
              <v-btn
                :disabled="!photosStore.selectedPhotoIds.length"
                size="small"
                v-bind="props"
                icon
              >
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="moveToCanvas()">
                <v-list-item-title>Move to Canvas</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-toolbar>

    <component
      :is="currentGrid"
      v-if="loading || loadingIteration || (photos && photos.length)"
      ref="photosGridRef"
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :loadingIteration="loadingIteration"
      :loading="loading"
      :loadingInsights="loadingInsights"
      :maxPageAttempts="maxPageAttempts"
      :minMatchScore="minMatchScore"
      @update:minMatchScore="minMatchScore = $event"
    />
    <div
      v-else
      class="d-flex flex-column align-center justify-center"
      style="height: 100%; opacity: 0.5; text-align: center; margin-top: -50px"
    >
      <img
        src="@/assets/CuratorLogoGray.png"
        alt="Curator Lab Logo"
        :class="{ 'soft-pulse': !warmedUp }"
        style="width: 250px; height: auto; opacity: 0.15"
      />

      <div v-if="warmedUp"></div>
      <div style="margin-top: 0px; font-size: 1.2rem">
        <span v-if="!warmedUp">Warming up...</span>
        <span v-else>{{ queryDescription.prefix }}</span>
      </div>

      <transition
        v-if="!warmedUp || queryDescription.example"
        name="slide-fade"
        mode="out-in"
      >
        <div
          :key="warmedUp ? queryDescription.example : warmingMessage"
          style="
            margin-top: 4px;
            font-size: 1rem;
            font-style: italic;
            cursor: pointer;
          "
          @click="warmedUp ? (description = queryDescription.example) : null"
        >
          {{ warmedUp ? `"${queryDescription.example}"` : warmingMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "SearchPage" });
import { ref, computed, onMounted, onUnmounted, reactive, watch } from "vue";
import axios from "axios";
import { io } from "socket.io-client";
import ToggleButtons from "@/components/wrappers/ToggleButtons.vue";
import ToggleOption from "@/components/wrappers/ToggleOption.vue";
import PhotosSearchGrid from "@/components/PhotosSearchGrid.vue";
import PhotosCurationGrid from "@/components/PhotosCurationGrid.vue";
import { useSearchTags } from "@/composables/useSearchTags";
import { usePhotosStore } from "@/stores/photos";
import { useCanvasStore } from "@/stores/canvas";
import { useRouter } from "vue-router";
import queryExamples from "@/assets/query_examples.json";
import logoGray from "@/assets/CuratorLogoGray.png";
import logoGreen from "@/assets/CuratorLogo.png";

const socket = io(import.meta.env.VITE_API_WS_URL);

const warmedUp = ref(false);

const warmingMessages = [
  "Warming up the engines...",
  "Preparing the stage...",
  "Just a few seconds more...",
  "Aligning the neurons...",
  "Summoning the muses...",
];
const warmingMessage = ref(warmingMessages[0]);
let warmingInterval = null;

const photosStore = usePhotosStore();
const canvasStore = useCanvasStore();
const router = useRouter();

const searchType = ref("semantic");
const searchMode = ref("logical");
const iteration = ref(1);
const iterationsRecord = ref({});
const loading = ref(false);
const loadingIteration = ref(false);
const loadingInsights = ref(false);
const hasMoreIterations = ref(false);
const maxPageAttempts = ref(false);
const minMatchScore = ref(2);
const clearQuery = ref(null);
const currentMatchPercent = ref(0);

const menu = ref(false);

const photosGridRef = ref(null);

const currentGrid = computed(() =>
  searchMode.value == "curation" ? PhotosCurationGrid : PhotosSearchGrid
);

// Semantic
const description = ref("");

// Topological
const topologicalAreas = reactive({
  left: "",
  right: "",
  middle: "",
});

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
  const mode = searchMode.value;
  const type = searchType.value;

  if (type === "semantic") {
    const examples = queryExamples[mode];
    const randomExample = `${
      examples[Math.floor(Math.random() * examples.length)]
    }`;

    if (mode === "flexible") {
      return {
        example: randomExample,
        prefix: "Try something like...",
      };
    } else if (mode === "logical") {
      return {
        example: randomExample,
        prefix: "Try something like...",
      };
    } else if (mode === "curation") {
      return {
        example: randomExample,
        prefix: "Try something like...",
      };
    }
  } else if (type === "tags") {
    return {
      prefix: "Search by including or penalizing specific tags you define",
      example: null,
    };
  } else if (type === "topological") {
    return {
      prefix: "Search based on where elements appear in the image",
      example: null,
    };
  }
});

const photos = computed(() => {
  const getActualPhotos = () => {
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

    return result;
  };

  if (loading.value || loadingIteration.value || loadingInsights.value) {
    const actual = getActualPhotos();
    const skeletons = Array.from({ length: getPageSize() }, (_, i) => ({
      id: `skeleton-${i}`,
      isSkeleton: true,
      src: null,
    }));
    return iteration.value == 1 ? [...skeletons] : [...actual];
  } else {
    return getActualPhotos();
  }
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
  return searchMode.value == "curation" ? 6 : 12;
}

async function searchPhotos() {
  loading.value = true;
  maxPageAttempts.value = false;
  try {
    let payload;
    let options = {
      searchMode: searchMode.value,
      iteration: iteration.value,
      pageSize: getPageSize(),
      minMatchScore: minMatchScore.value,
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

watch(searchMode, () => {
  handleClear();
});

watch(searchType, () => {
  if (searchType.value != "semantic" && searchMode.value == "curation") {
    searchMode.value = "logical";
  }
});

function handleClear() {
  // description.value = "";
  // includedTags.value = [];
  // excludedTags.value = [];
  // topologicalAreas.left = "";
  // topologicalAreas.middle = "";
  // topologicalAreas.right = "";

  iteration.value = 1;
  iterationsRecord.value = {};
  hasMoreIterations.value = false;
  currentMatchPercent.value = 0;
  clearQuery.value = null;

  photosStore.selectedPhotosRecord = {};
}

function handleSearch() {
  photosStore.selectedPhotosRecord = {};
  iteration.value = 1;
  hasMoreIterations.value = false;
  iterationsRecord.value = {};
  searchPhotos();
}

async function nextIteration() {
  loadingIteration.value = true;
  await searchPhotos();
}

async function moveToCanvas() {
  await photosStore.getOrFetch();
  const photosToAdd = photosStore.selectedPhotoIds
    .map((id) => photosStore.photos.find((p) => p.id == id))
    .filter(Boolean); // por si acaso
  canvasStore.addPhotos(photosToAdd);
  router.push("/canvas");
}

async function ensureWarmUp() {
  let i = 0;
  warmingInterval = setInterval(() => {
    i = (i + 1) % warmingMessages.length;
    warmingMessage.value = warmingMessages[i];
  }, 5000);

  const { data } = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL}/api/search/warmUp`
  );
  warmedUp.value = data.result;

  if (data.result && warmingInterval) {
    clearInterval(warmingInterval);
    warmingInterval = null;
  }
}

// WebSocket handlers
onMounted(() => {
  ensureWarmUp();
  socket.on("matches", (data) => {
    Object.entries(data.results).forEach(([iter, richPhotos]) => {
      iterationsRecord.value[iter] = {
        photos: richPhotos.map((item) => ({
          ...item.photo,
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

    setTimeout(() => {
      photosGridRef.value?.scrollToLast();
    }, 100);

    loadingIteration.value = false;
    loadingInsights.value = searchMode.value == "curation";
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
              matchScore: updated.matchScore,
              reasoning: updated.reasoning,
            }
          : existing;
      });
    });
    hasMoreIterations.value = data.hasMore;
    iteration.value = data.iteration + 1;
    clearQuery.value = data.structuredResult.original;
    loadingInsights.value = false;

    setTimeout(() => {
      photosGridRef.value?.scrollToLast();
    }, 100);

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
  if (warmingInterval) clearInterval(warmingInterval);
});
</script>

<style scoped>
.sticky-toolbar {
  position: sticky;
  top: 10px;
  z-index: 10;
  width: 100%;
  padding-top: 10px;
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

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.warming-up-animated {
  animation: soft-pulse 2.5s ease-in-out infinite;
  display: inline-block;
}

@keyframes soft-pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
.soft-pulse {
  animation: soft-pulse 2.5s ease-in-out infinite;
}

@keyframes soft-pulse {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
