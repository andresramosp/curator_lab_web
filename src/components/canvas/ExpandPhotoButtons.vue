<template>
  <PhotoCanvasButton
    v-if="enableDiagonal"
    :photo="photo"
    position="bottom-right"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />
  <PhotoCanvasButton
    v-if="enableDiagonal"
    :photo="photo"
    position="bottom-left"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />
  <PhotoCanvasButton
    v-if="enableDiagonal"
    :photo="photo"
    position="upper-right"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />
  <PhotoCanvasButton
    v-if="enableDiagonal"
    :photo="photo"
    position="upper-left"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />

  <PhotoCanvasButton
    :photo="photo"
    position="left"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />

  <PhotoCanvasButton
    :photo="photo"
    position="right"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />

  <PhotoCanvasButton
    :photo="photo"
    position="upper"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />

  <PhotoCanvasButton
    :photo="photo"
    position="bottom"
    :fill="secondaryColor"
    icon="+"
    @click="handleClick"
  />
</template>

<script setup>
import { useTheme } from "vuetify";
import PhotoCanvasButton from "./PhotoCanvasButton.vue";

const theme = useTheme();
const secondaryColor = theme.current.value.colors.secondary;
const props = defineProps({
  photo: Object,
  enableDiagonal: Boolean,
});
const emit = defineEmits(["click"]);

const handleClick = (position) => {
  emit("click", { photo: props.photo, position });
};
</script>
