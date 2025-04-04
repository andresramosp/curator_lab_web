<template>
  <v-group :config="{ opacity: 1 }">
    <!-- Rectángulo de debug: área de la foto -->

    <!-- Área extendida para interactividad -->
    <v-rect
      :config="{
        x: -25,
        y: -25,
        width: photo.config.width + 50,
        height: photo.config.height + 50,
        opacity: 0,
        listening: true,
      }"
      @wheel="onWheel"
    />
    <!-- Grupo con clipping para que las detecciones se dibujen solo dentro de la foto -->
    <v-group :config="{ x: 0, y: 0 }" :clipFunc="clipFunc">
      <template v-for="detection in detections" :key="detection.id">
        <v-rect :config="getRectConfig(detection)" />
      </template>
    </v-group>
  </v-group>
</template>

<script setup>
import { defineProps } from "vue";

const props = defineProps({
  photo: { type: Object, required: true },
  detections: { type: Array, required: true },
  visible: { type: Boolean, required: true },
});

// Consideramos que el ancho original de la foto es 1500 píxeles.
const originalWidth = 1500;
// Factor de escala según el ancho mostrado de la foto.
const scale = props.photo.config.width / originalWidth;

const clipFunc = (ctx) => {
  ctx.beginPath();
  ctx.rect(0, 0, props.photo.config.width, props.photo.config.height);
  ctx.closePath();
  ctx.clip();
};

const onWheel = (e) => {
  e.evt.preventDefault();
  e.evt.stopPropagation();
  // Implementa la lógica de scroll si lo necesitas.
};

const getRectConfig = (detection) => {
  // Mapea las coordenadas de la detección a la escala de la foto.
  const x = detection.x1 * scale;
  const y = detection.y1 * scale;
  const width = (detection.x2 - detection.x1) * scale;
  const height = (detection.y2 - detection.y1) * scale;
  return {
    x,
    y,
    width,
    height,
    stroke: "red",
    strokeWidth: 2,
    fill: "rgba(255, 0, 0, 0.3)", // Para visualizar el área de forma semi-transparente.
    listening: false,
  };
};
</script>

<style scoped>
/* Ajusta estilos según necesites */
</style>
