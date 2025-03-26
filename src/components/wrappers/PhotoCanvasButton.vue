<template>
  <v-group
    :config="{ x: computedX, y: computedY }"
    @click="handleClick"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <v-rect
      :config="{
        width: buttonWidth,
        height: buttonHeight,
        fill: fill,
        cornerRadius: 0,
      }"
    />
    <v-text
      :config="{
        x: 0,
        y: (buttonHeight - fontSize) / 2,
        width: buttonWidth,
        height: buttonHeight,
        text: icon,
        fontSize: fontSize,
        align: 'center',
        verticalAlign: 'middle',
        fill: textColor,
      }"
    />
  </v-group>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  photo: Object,
  type: { type: String, required: true }, // "delete" o "add"
  fill: { type: String, required: true },
  icon: { type: String, required: true },
  fontSize: { type: Number, default: 16 },
  textColor: { type: String, default: "white" },
  onClick: { type: Function, required: true },
});

const buttonWidth = 20;
const buttonHeight = 20;
const margin = 5;

const computedX = computed(() => {
  const photoWidth = props.photo.config.width;
  if (props.type === "delete") {
    // Centro en la mitad izquierda
    return (photoWidth / 2 - buttonWidth) / 2;
  } else if (props.type === "add") {
    // Centro en la mitad derecha
    return photoWidth / 2 + (photoWidth / 2 - buttonWidth) / 2;
  }
  return 0;
});

const computedY = computed(
  () => props.photo.config.height - buttonHeight - margin
);

const handleClick = (e) => {
  e.cancelBubble = true;
  props.onClick(props.photo, e);
};

const handleMouseOver = (e) => {
  const stage = e.target.getStage();
  stage.container().style.cursor = "pointer";
};

const handleMouseOut = (e) => {
  const stage = e.target.getStage();
  stage.container().style.cursor = "default";
};
</script>
