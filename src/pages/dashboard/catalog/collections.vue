<template>
  <v-container class="main-container">
    <div class="catalog-message">
      <p class="text-h5 text-center">No collections yet</p>
    </div>
    <v-btn class="catalog-button" fab @click="addNewPhoto">
      Create Collection
    </v-btn>
  </v-container>
</template>

<script setup>
import { usePhotosStore } from "@/stores/photos";
</script>

<style scoped>
.photos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.photo-image {
  height: 150px;
}

.catalog-message {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.catalog-button {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
