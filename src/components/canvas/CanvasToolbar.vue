<template>
  <v-card class="d-flex flex-column canvas-toolbar" elevation="2">
    <ul class="section-list">
      <!-- Photos Section -->
      <li class="section">
        <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
          Photos
        </div>
        <div class="d-flex justify-space-between">
          <v-tooltip text="Import from catalog" location="bottom">
            <template #activator="{ props }">
              <v-btn
                icon
                @click="emitOpenDialog"
                size="small"
                class="mx-auto"
                v-bind="props"
              >
                <v-icon size="20">mdi-folder</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Import from local files" location="bottom">
            <template #activator="{ props }">
              <v-btn
                icon
                @click="emitImportLocal"
                size="small"
                class="mx-auto"
                v-bind="props"
              >
                <v-icon size="22">mdi-folder-download</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Clear canvas" location="bottom">
            <template #activator="{ props }">
              <v-btn
                icon
                @click="emitClearCanvas"
                size="small"
                class="mx-auto"
                v-bind="props"
              >
                <v-icon size="22">mdi-delete-sweep</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </li>

      <!-- Settings -->
      <li class="section">
        <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
          Settings
        </div>
        <v-select
          label="Expansion type"
          :items="expansionTypes"
          item-title="label"
          item-value="data"
          v-model="toolbarState.expansion.type"
          density="compact"
          hide-details
          class="select-compact mt-1"
        />
        <v-row dense align="center" justify="space-around" class="mt-2">
          <v-switch
            label="Inverted"
            color="secondary"
            class="switch-compact"
            v-model="toolbarState.expansion.inverted"
            density="compact"
            hide-details
          />
          <v-switch
            label="Opposite"
            color="secondary"
            class="switch-compact"
            v-model="toolbarState.expansion.opposite"
            density="compact"
            hide-details
          />
        </v-row>
      </li>

      <!-- Photo Expansion -->
      <li class="section">
        <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
          Photo Expansion
        </div>
        <v-row dense>
          <v-col>
            <v-select
              label="Number"
              :items="[1, 2, 3, 4, 5]"
              v-model.number="toolbarState.photoOptions.count"
              density="compact"
              hide-details
              class="select-compact mt-1"
              style="width: 120px"
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-space-around mt-2">
          <ToggleButtons v-model="toolbarState.photoOptions.spreadMode">
            <ToggleOption
              size="small"
              value="linear"
              tooltip="Expand in horizontal line"
            >
              <v-icon left class="mr-1">mdi-pan-horizontal</v-icon>
            </ToggleOption>
            <ToggleOption
              size="small"
              value="perpendicular"
              tooltip="Expand in vertical column"
            >
              <v-icon left class="mr-1">mdi-pan-vertical</v-icon>
            </ToggleOption>
            <ToggleOption
              size="small"
              value="circular"
              tooltip="Expand in circular layout"
            >
              <v-icon left class="mr-1">mdi-orbit-variant</v-icon>
            </ToggleOption>
          </ToggleButtons>
        </div>
      </li>
    </ul>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import ToggleButtons from "../wrappers/ToggleButtons.vue";
import ToggleOption from "../wrappers/ToggleOption.vue";

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits([
  "update:modelValue",
  "openDialog",
  "importLocal",
  "clearCanvas",
]);

const toolbarState = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const expansionTypes = [
  { label: "General", data: { criteria: "embedding" } },
  { label: "Context", data: { criteria: "semantic", fields: ["context"] } },
  { label: "Story", data: { criteria: "semantic", fields: ["story"] } },
  { label: "Tags", data: { criteria: "tags" } },
  { label: "Composition", data: { criteria: "composition" } },
];

const emitOpenDialog = () => emit("openDialog");
const emitImportLocal = () => emit("importLocal");
const emitClearCanvas = () => emit("clearCanvas");
</script>

<style scoped lang="scss">
.canvas-toolbar {
  height: 100%;
  padding-top: 5px;
}

section-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.section {
  padding: 0 17px 15px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  .text-caption {
    opacity: 0.8;
  }
}

.section:last-child {
  border-bottom: none;
}

.section-transparent {
  background-color: rgba(255, 255, 255, 0.05);
  opacity: 0.7;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
