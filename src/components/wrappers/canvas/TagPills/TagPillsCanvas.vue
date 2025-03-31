<template>
  <v-group :config="{ x: 0, y: 0 }" @wheel="onWheel" :clipFunc="clipFunc">
    <template v-for="(tagPhoto, index) in filteredTags" :key="tagPhoto.tag.id">
      <TagPill
        :tag="tagPhoto.tag"
        :photo="photo"
        :offsetY="getOffsetY(index)"
        v-model="tagPhoto.tag.selected"
      />
    </template>
  </v-group>
</template>

<script setup>
import { ref, computed } from "vue";
import TagPill from "./TagPill.vue";

const props = defineProps({
  photo: { type: Object, required: true },
  tags: { type: Array, required: true },
});

const allowedGroups = ["person", "animals", "objects", "environment", "misc"];
const filteredTags = computed(() => {
  return props.tags.filter((tagPhoto) =>
    allowedGroups.includes(tagPhoto.tag.group)
  );
});

const scrollOffset = ref(0);
const itemHeight = 20;
const initialOffset = 10;

const totalContentHeight = computed(() => {
  return initialOffset + filteredTags.value.length * itemHeight;
});
const clipHeight = computed(() => props.photo.config.height);

const clampScroll = (offset) => {
  const minOffset = clipHeight.value - totalContentHeight.value;
  if (offset < minOffset) return minOffset;
  if (offset > 0) return 0;
  return offset;
};

const onWheel = (e) => {
  e.cancelBubble = true; // Cancela la propagación en Konva
  e.evt.preventDefault();
  e.evt.stopPropagation();
  const delta = e.evt.deltaY > 0 ? -10 : 10;
  scrollOffset.value = clampScroll(scrollOffset.value + delta);
};

const getOffsetY = (index) => {
  return scrollOffset.value + initialOffset + index * itemHeight;
};

const clipFunc = (ctx) => {
  ctx.beginPath();
  ctx.rect(0, 10, props.photo.config.width, clipHeight.value - 15);
  ctx.closePath();
  ctx.clip();
};
</script>

<style scoped>
/* Puedes agregar estilos adicionales si lo requieres */
</style>
