<template>
  <v-container class="main-container">
    <!-- Toolbar for search form -->
    <v-toolbar flat>
      <v-select
        v-model="form.tags"
        :items="availableTags"
        label="Tags"
        multiple
      ></v-select>

      <v-text-field
        v-model="form.description"
        label="Description"
        outlined
      ></v-text-field>

      <v-select
        v-model="form.accuracy"
        :items="[0, 1, 2]"
        label="accuracy"
      ></v-select>

      <v-text-field
        v-model="form.filename"
        label="Filename"
        outlined
      ></v-text-field>

      <v-btn @click="searchPhotos">Search</v-btn>
    </v-toolbar>

    <!-- Photos Grid -->
    <PhotosGrid :photos="photos" :forCuration="true" />
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
});

const photos = ref([]);
const availableTags = ["nature", "portrait", "urban", "macro"];

async function searchPhotos() {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/search`,
      form.value
    );
    photos.value = response.data.results;
  } catch (error) {
    console.error("Failed to fetch photos", error);
  }
}
</script>

<style scoped>
.main-container {
  padding: 16px;
}
</style>
