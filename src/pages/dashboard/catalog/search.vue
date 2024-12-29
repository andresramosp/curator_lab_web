<template>
  <v-container class="main-container">
    <!-- Toolbar for search form -->
    <v-toolbar flat>
      <v-text-field
        v-model="form.description"
        label="Description"
        outlined
      ></v-text-field>

      <v-btn @click="searchPhotos" :loading="loading"> Search </v-btn>
    </v-toolbar>

    <!-- Photos Grid -->
    <PhotosGrid
      :photos="photos"
      :forCuration="false"
      @next-iteration="nextIteration"
      :loadingIteration="loadingIteration"
    />
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import PhotosGrid from "@/components/photosGrid.vue";
import axios from "axios";

const form = ref({
  tags: [],
  description: "",
  filename: "",
  accuracy: 0,
  iteration: 1,
});

const photos = ref(null);
const loading = ref(false);
const loadingIteration = ref(false);

const availableTags = ["nature", "portrait", "urban", "macro"];

async function searchPhotos() {
  form.value.iteration = 1;
  loading.value = true;
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search`,
      form.value
    );
    photos.value = response.data.results;
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loading.value = false;
  }
}

async function nextIteration() {
  form.value.iteration++;
  loadingIteration.value = true;
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search`,
      { ...form.value, currentPhotos: photos.value.map((photo) => photo.id) }
    );
    photos.value = [...photos.value, ...response.data.results];
  } catch (error) {
    console.error("Failed to fetch photos", error);
  } finally {
    loadingIteration.value = false;
  }
}
</script>

<style scoped>
.main-container {
  padding: 16px;
  row-gap: 15px;
}
</style>
