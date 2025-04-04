<template>
  <v-group :config="{ opacity: 1 }">
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

    <v-group :config="{ x: 0, y: 0 }" :clipFunc="clipFunc">
      <template v-for="detection in detections" :key="detection.id">
        <v-rect
          :config="getRectConfig(detection)"
          @click="toggleSelected(detection)"
          @mouseenter="detection.hover = true"
          @mouseleave="detection.hover = false"
        />
      </template>
    </v-group>
  </v-group>
</template>

<script setup>
import { defineProps } from "vue";
import { useTheme } from "vuetify";

const theme = useTheme();

const props = defineProps({
  photo: { type: Object, required: true },
  detections: { type: Array, required: true },
  visible: { type: Boolean, required: true },
});

const originalWidth = 1500;
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
};

const toggleSelected = (detection) => {
  detection.selected = !detection.selected;
};

const getRectConfig = (detection) => {
  const x = detection.x1 * scale;
  const y = detection.y1 * scale;
  const width = (detection.x2 - detection.x1) * scale;
  const height = (detection.y2 - detection.y1) * scale;

  const selectedColor = theme.current.value.colors.secondary;
  const hoverColor = theme.current.value.colors.primary;

  const isSelected = detection.selected;
  const isHovered = detection.hover;

  return {
    x,
    y,
    width,
    height,
    stroke: isSelected ? selectedColor : "red",
    strokeWidth: 2,
    fill: isSelected
      ? `${selectedColor}33` // 20% opacity
      : isHovered
      ? `${hoverColor}33`
      : "transparent",
    listening: true,
  };
};
</script>
