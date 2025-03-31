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
        opacity: 0.5,
        cornerRadius: 5,
      }"
    />
    <!-- <v-text
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
    /> -->
  </v-group>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  photo: Object,
  position: {
    type: String,
    required: true,
    validator: (value) =>
      [
        "upper-left",
        "upper-right",
        "bottom-left",
        "bottom-right",
        "right",
        "left",
        "bottom",
        "upper",
      ].includes(value),
  },
  fill: { type: String, required: true },
  icon: { type: String, required: true },
  fontSize: { type: Number, default: 8 },
  textColor: { type: String, default: "white" },
  onClick: { type: Function, required: true },
});

const buttonWidth = 16;
const buttonHeight = 16;
const margin = -8;

const computedX = computed(() => {
  const w = props.photo.config.width;
  switch (props.position) {
    case "upper-left":
      return -buttonWidth - margin;
    case "upper-right":
      return w + margin;
    case "bottom-left":
      return -buttonWidth - margin;
    case "bottom-right":
      return w + margin;

    case "left":
      return -buttonWidth - margin;
    case "right":
      return w + margin;
    case "upper":
    case "bottom":
      return (w - buttonWidth) / 2;
    default:
      return 0;
  }
});

const computedY = computed(() => {
  const h = props.photo.config.height;
  switch (props.position) {
    case "upper-left":
    case "upper-right":
      return -buttonHeight - margin;
    case "bottom-left":
    case "bottom-right":
      return h + margin;

    case "upper":
      return -buttonHeight - margin;
    case "bottom":
      return h + margin;
    case "left":
    case "right":
      return (h - buttonHeight) / 2;
    default:
      return 0;
  }
});

const emit = defineEmits(["click"]);

const handleClick = (e) => {
  e.cancelBubble = true;
  emit("click", props.position);
};

const handleMouseOver = (e) => {
  e.target.getStage().container().style.cursor = "pointer";
};

const handleMouseOut = (e) => {
  e.target.getStage().container().style.cursor = "default";
};
</script>
