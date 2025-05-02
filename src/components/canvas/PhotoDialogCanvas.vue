<template>
  <v-dialog v-model="dialog" max-width="900" height="600">
    <template #activator="{ on, attrs }">
      <!-- Opcional: activador si lo necesitas internamente -->
    </template>

    <v-card style="display: flex; flex-direction: column; height: 600px">
      <v-card-text style="overflow-y: auto; flex: 1">
        <v-container fluid>
          <v-row>
            <v-col
              v-for="photo in photos"
              :key="photo.id"
              cols="2"
              class="d-flex justify-center"
            >
              <v-card v-bind="props">
                <v-img
                  :src="photo.thumbnailUrl"
                  :class="{ 'selected-photo': selectedIds.includes(photo.id) }"
                  width="100"
                  @click="toggleSelection(photo.id)"
                  cover
                />
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="mt-auto mr-13">
        <v-btn size="small" class="outline" text @click="close">Close</v-btn>
        <v-btn size="small" color="primary" @click="confirmSelection">{{
          isTrash ? "Restore" : "Add to Canvas"
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { usePhotosStore } from "@/stores/photos";
import { useCanvasStore } from "@/stores/canvas";

const props = defineProps({
  modelValue: Boolean,
  isTrash: Boolean,
});

const emit = defineEmits(["update:modelValue", "add-photos"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const photosStore = usePhotosStore();
const canvasStore = useCanvasStore();
const selectedIds = ref([]);
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const photos = computed(() => {
  if (props.isTrash) {
    return canvasStore.discardedPhotos.map((dp) =>
      photosStore.photos.find((p) => p.id == dp.id)
    );
  } else {
    return photosStore.photos.filter(
      (p) =>
        !canvasStore.photos.find((photo) => photo.id == p.id) &&
        !canvasStore.discardedPhotos.find((photo) => photo.id == p.id)
    );
  }
});

function toggleSelection(photoId) {
  if (selectedIds.value.includes(photoId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== photoId);
  } else {
    selectedIds.value.push(photoId);
  }
}

function confirmSelection() {
  if (props.isTrash) {
    canvasStore.discardedPhotos = canvasStore.discardedPhotos.filter(
      (dp) => !selectedIds.value.includes(dp.id)
    );
  }
  emit("add-photos", selectedIds.value);
  close();
}

function close() {
  selectedIds.value = [];
  emit("update:modelValue", false);
}

onMounted(() => {
  photosStore.getOrFetch();
});
</script>

<style scoped>
.selected-photo {
  border: 3px solid rgb(var(--v-theme-secondary));
  border-radius: 4px;
}
</style>
