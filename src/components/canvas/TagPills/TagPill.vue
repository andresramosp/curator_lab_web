<template>
  <v-group
    :config="{ x: computedX, y: computedY }"
    @click="handleClick"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <v-rect
      :config="{
        width: pillWidth,
        height: pillHeight,
        fill: isSelected
          ? selectedColor
          : isHovered
          ? 'lightgray'
          : defaultColor,
        opacity: 0.7,
        cornerRadius: pillHeight / 2,
      }"
    />
    <v-text
      :config="{
        x: 0,
        y: (pillHeight - fontSize) / 2,
        width: pillWidth,
        text: shortenTag(tag.name),
        fontSize: fontSize,
        align: 'center',
        fill: textColor,
      }"
    />
  </v-group>
</template>

<script setup>
import { shortenTag } from "@/utils/utils";
import { computed, ref } from "vue";
import { useTheme } from "vuetify";

const props = defineProps({
  tag: { type: Object, required: true },
  photo: { type: Object, required: true },
  offsetX: { type: Number, default: null },
  offsetY: { type: Number, default: null },
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const isSelected = computed({
  get() {
    return props.modelValue;
  },
  set(newVal) {
    emit("update:modelValue", newVal);
  },
});

const isHovered = ref(false);

const fontSize = 11;
const textPadding = 2;
const defaultColor = "gray";

const theme = useTheme();
const selectedColor = theme.current.value.colors.secondary;
const textColor = theme.current.value.colors.primary;

const pillWidth = computed(() => {
  const approxWidth = shortenTag(props.tag.name).length * (fontSize * 0.5);
  return approxWidth + textPadding + 7;
});
const pillHeight = 18;

const computedX = computed(() =>
  props.offsetX !== null
    ? props.offsetX
    : (props.photo.config.width - pillWidth.value) / 2
);
const computedY = computed(() => (props.offsetY !== null ? props.offsetY : 10));

const handleClick = (e) => {
  e.cancelBubble = true;
  isSelected.value = !isSelected.value;
};

const handleMouseOver = (e) => {
  isHovered.value = true;
  const stage = e.target.getStage();
  stage.container().style.cursor = "pointer";
};

const handleMouseOut = (e) => {
  isHovered.value = false;
  const stage = e.target.getStage();
  stage.container().style.cursor = "default";
};
</script>
