<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from "vue";
import { usePhotosStore } from "./stores/photos";
const photosStore = usePhotosStore();

onMounted(() => {
  photosStore.getOrFetch();
});
</script>
