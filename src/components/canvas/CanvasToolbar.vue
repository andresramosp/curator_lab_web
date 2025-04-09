<template>
  <v-card
    class="pa-2 d-flex flex-column"
    style="height: 100%; max-width: 260px"
    elevation="2"
  >
    <!-- Importación -->
    <div class="section">
      <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
        Importación
      </div>
      <div class="d-flex justify-space-between mt-2">
        <v-btn icon variant="outlined" size="small" class="mx-auto">
          <v-icon size="20">mdi-folder</v-icon>
        </v-btn>
        <v-btn icon @click="emitDelete" size="small" class="mx-auto">
          <v-icon size="30">mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Navegación -->
    <div class="section">
      <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
        Navegación
      </div>
      <div class="d-flex justify-space-between mt-2">
        <v-btn @click="toggleMouseMode" icon size="small" class="mx-auto">
          <v-icon v-if="toolbarState.mouseMode === 'move'" size="30"
            >mdi-dots-square</v-icon
          >
          <v-icon v-else size="30">mdi-pan</v-icon>
        </v-btn>
        <v-btn icon @click="emitOrderPhotos" size="small" class="mx-auto">
          <v-icon size="30">mdi-grid</v-icon>
        </v-btn>
        <v-btn icon @click="emitFitStage" size="small" class="mx-auto">
          <v-icon size="30">mdi-crop-free</v-icon>
        </v-btn>
      </div>
      <v-slider
        v-model="toolbarState.zoomLevel"
        hide-details
        density="compact"
        class="mt-1"
        style="height: 24px"
        min="0"
        max="100"
      />
    </div>

    <!-- Configuración -->
    <div class="section">
      <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
        Configuración
      </div>
      <v-select
        label="Tipo de expansión"
        :items="expansionTypes"
        item-title="label"
        item-value="data"
        v-model="toolbarState.expansion.type"
        density="compact"
        hide-details
        class="mt-1"
        style="height: 36px; font-size: 12px"
      />
      <v-row dense class="mt-1">
        <v-col>
          <v-switch
            label="Invertido"
            v-model="toolbarState.expansion.inverted"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col>
          <v-switch
            label="Opuesto"
            v-model="toolbarState.expansion.opposite"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>
    </div>

    <!-- Expansión de fotos -->
    <div class="section">
      <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
        Expansión de fotos
      </div>
      <v-row dense class="mt-1">
        <v-col>
          <v-text-field
            type="number"
            label="Número de fotos"
            v-model.number="toolbarState.photoOptions.count"
            density="compact"
            hide-details
            style="height: 36px; font-size: 12px"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-space-between mt-2">
        <ToggleButtons v-model="toolbarState.photoOptions.spreadMode">
          <ToggleOption
            value="horizontal"
            tooltip="Expandir en línea horizontal"
          >
            <v-icon left class="mr-1">mdi-pan-horizontal</v-icon>
          </ToggleOption>

          <ToggleOption value="vertical" tooltip="Expandir en columna vertical">
            <v-icon left class="mr-1">mdi-pan-vertical</v-icon>
          </ToggleOption>

          <ToggleOption
            value="circular"
            tooltip="Expandir en círculo alrededor"
          >
            <v-icon left class="mr-1">mdi-orbit-variant</v-icon>
          </ToggleOption>
        </ToggleButtons>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import ToggleButtons from "../wrappers/ToggleButtons.vue";
import ToggleOption from "../wrappers/ToggleOption.vue";

// Props y emit para v-model personalizado
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits([
  "update:modelValue",
  "deletePhotos",
  "orderPhotos",
  "fitStage",
]);

const expansionTypes = [
  { label: "General", data: { criteria: "embedding" } },
  { label: "Context", data: { criteria: "semantic", fields: ["context"] } },
  { label: "Story", data: { criteria: "semantic", fields: ["story"] } },
  { label: "Tags", data: { criteria: "tags" } },
  { label: "Composition", data: { criteria: "composition" } },
  { label: "Geometrical", data: { criteria: "geometrical" } },
  { label: "Chromatic", data: { criteria: "chromatic" } },
];

// Acceso reactivo al modelo externo
const toolbarState = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Métodos internos
function toggleMouseMode() {
  const newMode = toolbarState.value.mouseMode === "move" ? "select" : "move";
  emit("update:modelValue", {
    ...toolbarState.value,
    mouseMode: newMode,
  });
}

function emitDelete() {
  emit("deletePhotos");
}

function emitOrderPhotos() {
  emit("orderPhotos");
}

function emitFitStage() {
  emit("fitStage");
}
</script>

<style scoped>
.section {
  padding-left: 8px;
  padding-right: 8px;
  margin-bottom: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
