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

    <div
      v-if="searchType == 'tags' && Object.keys(iterationsRecord).length"
      class="tag-breadcrumb"
    >
      <div
        v-for="(expansor, tagIndex) in allExpansors"
        :key="tagIndex"
        class="tag-line"
      >
        <v-sheet class="m-2">
          <span v-for="(exp, expIndex) in expansor" :key="exp.tag">
            <v-chip
              :title="exp.proximity"
              :color="isTagIncluded(exp.tag) ? 'secondary' : ''"
              :variant="expIndex !== 0 ? 'tonal' : 'elevated'"
              :style="{
                fontWeight: expIndex !== 0 ? '400' : 'bold',
              }"
              size="small"
            >
              {{ exp.tag }}
            </v-chip>
            <span v-if="expIndex < expansor.length - 1"> &rarr; </span>
          </span>
        </v-sheet>
      </div>
    </div>
    <PhotosSearchGrid
      :photos="photos"
      :hasMoreIterations="hasMoreIterations"
      @next-iteration="nextIteration"
      :loadingIteration="loadingIteration"
    />
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";

const form = ref({
  tags: [],
  description: "",
  filename: "",
  iteration: 1,
});

const iterationsRecord = ref({});
const searchType = ref("tags");
const currentQueryLogicResult = ref(null);
const loading = ref(false);
const loadingIteration = ref(false);
const lastQuery = ref("");
const disableSearchButton = ref(false);

const photos = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);

  const currentIteration = form.value.iteration;
  const accumulatedPhotos = [];

  for (let i = 0; i < currentIteration; i++) {
    const key = iterationKeys[i];
    if (key !== undefined && iterationsRecord.value[key].photos) {
      accumulatedPhotos.push(...iterationsRecord.value[key].photos);
    }
  }

  return accumulatedPhotos;
});

const allExpansors = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);

  const lastKey = iterationKeys[iterationKeys.length - 1];
  return iterationsRecord.value[lastKey]?.tagsAnd || [];
});

const tagsExpansors = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value)
    .map(Number)
    .sort((a, b) => a - b);

  const currentIteration = form.value.iteration;
  let tagsAnd = [];
  let tagsOr = [];
  let tagsNot = [];

  const key = iterationKeys[currentIteration - 1];
  tagsAnd = iterationsRecord.value[key]?.tagsAnd.map((ex) =>
    ex.map((ex) => ex.tag)
  );

  tagsOr = iterationsRecord.value[key]?.tagsOr.map((ex) => ex.tag);

  tagsNot = iterationsRecord.value[key]?.tagsNot.map((ex) => ex.tag);

  return { tagsAnd, tagsOr, tagsNot };
});

const hasMoreIterations = computed(() => {
  const iterationKeys = Object.keys(iterationsRecord.value).map(Number);
  return form.value.iteration < iterationKeys.length;
});

function isTagIncluded(tag) {
  return tagsExpansors.value.tagsAnd.some((group) => group.includes(tag));
}

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
    iterationsRecord.value = response.data.results;

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
  iterationsRecord.value = {};
  currentQueryLogicResult.value = null;
  searchPhotos();
}

async function nextIteration() {
  form.value.iteration++;
  if (searchType.value !== "tags") searchPhotos();
}
</script>

<style scoped>
.main-container {
  padding: 16px;
  row-gap: 15px;
}

.tag-breadcrumb {
  border-radius: 5px;
  width: 100%;
}

.tag-line {
  display: flex;
  margin-bottom: 10px;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 8px;
  column-gap: 5px;
  flex-direction: row;
  align-content: stretch;
  justify-content: flex-start;
}
.tag-line:last-child {
  margin-bottom: 0;
}
</style>
