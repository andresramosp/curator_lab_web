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
        <v-btn icon @click="handleDeletePhotos" size="small" class="mx-auto">
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
        <v-btn
          @click="mouseMode = mouseMode === 'move' ? 'select' : 'move'"
          icon
          size="small"
          class="mx-auto"
        >
          <v-icon v-if="mouseMode === 'move'" size="30">mdi-dots-square</v-icon>
          <v-icon v-else size="30">mdi-pan</v-icon>
        </v-btn>
        <v-btn icon @click="orderPhotos" size="small" class="mx-auto">
          <v-icon size="30">mdi-grid</v-icon>
        </v-btn>
        <v-btn icon @click="fitStageToPhotos" size="small" class="mx-auto">
          <v-icon size="30">mdi-crop-free</v-icon>
        </v-btn>
      </div>
      <v-slider
        v-model="slider"
        hide-details
        density="compact"
        class="mt-1"
        style="height: 24px"
      />
    </div>

    <!-- Configuración -->
    <div class="section">
      <div class="text-caption font-weight-medium text-grey-lighten-1 mb-1">
        Configuración
      </div>
      <v-select
        label="Tipo de expansión"
        :items="['General', 'Context']"
        v-model="config.type"
        density="compact"
        hide-details
        class="mt-1"
        style="height: 36px; font-size: 12px"
      />
      <v-row dense class="mt-1">
        <v-col>
          <v-switch
            label="Inverted"
            v-model="config.inverted"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col>
          <v-switch
            label="Opposite"
            v-model="config.opposite"
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
            v-model.number="photoOptions.count"
            density="compact"
            hide-details
            style="height: 36px; font-size: 12px"
          />
        </v-col>
        <v-col>
          <v-switch
            label="Aligned"
            v-model="photoOptions.aligned"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-space-between mt-2">
        <v-btn
          icon
          size="small"
          :color="photoOptions.layout === 'vertical' ? 'primary' : ''"
          @click="photoOptions.layout = 'vertical'"
        >
          <v-icon size="18">mdi-view-sequential</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          :color="photoOptions.layout === 'horizontal' ? 'primary' : ''"
          @click="photoOptions.layout = 'horizontal'"
        >
          <v-icon size="18">mdi-view-parallel</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          :color="photoOptions.layout === 'circular' ? 'primary' : ''"
          @click="photoOptions.layout = 'circular'"
        >
          <v-icon size="18">mdi-circle-slice-3</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref } from "vue";

const slider = ref(0);

const config = ref({
  type: "General",
  inverted: false,
  opposite: false,
});

const photoOptions = ref({
  count: 1,
  aligned: true,
  layout: "vertical",
});
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
