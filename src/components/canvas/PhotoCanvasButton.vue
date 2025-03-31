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
        opacity: 0.6,
        cornerRadius: 5,
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
  position: {
    type: String,
    required: true,
    validator: (value) =>
      ["upper-left", "upper-right", "bottom-left", "bottom-right"].includes(
        value
      ),
  },

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
  switch (props.position) {
    case "upper-left":
    case "bottom-left":
      return margin;
    case "upper-right":
    case "bottom-right":
      return photoWidth - buttonWidth - margin;
    default:
      return 0;
  }
});

const computedY = computed(() => {
  const photoHeight = props.photo.config.height;
  switch (props.position) {
    case "upper-left":
    case "upper-right":
      return margin;
    case "bottom-left":
    case "bottom-right":
      return photoHeight - buttonHeight - margin;
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
  const stage = e.target.getStage();
  stage.container().style.cursor = "pointer";
};

const handleMouseOut = (e) => {
  const stage = e.target.getStage();
  stage.container().style.cursor = "default";
};
</script>
