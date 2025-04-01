<template>
  <v-group :config="{ opacity: visible ? 1 : 0 }">
    <!-- Hit area inferior (ampliado) -->
    <v-rect
      :config="{
        x: -25,
        y: -25,
        width: hitAreaWidth,
        height: hitAreaHeight,
        opacity: 0,
        listening: true,
      }"
      @wheel="onWheel"
    />

    <!-- Grupo visible de tags, que también capta el wheel -->
    <v-group :config="{ x: 0, y: 0 }" :clipFunc="clipFunc" @wheel="onWheel">
      <template
        v-for="(tagPhoto, index) in filteredTags"
        :key="tagPhoto.tag.id"
      >
        <TagPill
          :tag="tagPhoto.tag"
          :photo="photo"
          :offsetY="getOffsetY(index)"
          v-model="tagPhoto.tag.selected"
        />
      </template>
    </v-group>
  </v-group>
</template>

<script setup>
import { ref, computed } from "vue";
import TagPill from "./TagPill.vue";
import { shortenTag } from "@/utils/utils";

const props = defineProps({
  photo: { type: Object, required: true },
  tags: { type: Array, required: true },
  visible: { type: Boolean, required: true },
});

const allowedGroups = [
  "person",
  "animals",
  "objects",
  "environment",
  "misc",
  "toponym",
  "mood",
  "weather",
  "symbols",
];
const filteredTags = computed(() => {
  const seen = new Map();
  for (const tagPhoto of props.tags) {
    const id = tagPhoto.tag.id;
    if (allowedGroups.includes(tagPhoto.tag.group) && !seen.has(id)) {
      seen.set(id, tagPhoto);
    }
  }
  return Array.from(seen.values()).sort(
    (t1, t2) => shortenTag(t2.tag.name).length - shortenTag(t1.tag.name).length
  );
});

const scrollOffset = ref(0);
const itemHeight = 23;
const initialOffset = 10;

const totalContentHeight = computed(
  () => initialOffset + filteredTags.value.length * itemHeight
);
const clipHeight = computed(() => props.photo.config.height);

const clampScroll = (offset) => {
  const minOffset = clipHeight.value - totalContentHeight.value;
  if (offset < minOffset) return minOffset;
  if (offset > 0) return 0;
  return offset;
};

const onWheel = (e) => {
  e.evt.preventDefault();
  e.evt.stopPropagation();
  const delta = e.evt.deltaY > 0 ? -itemHeight * 0.5 : itemHeight * 0.5;
  scrollOffset.value = clampScroll(scrollOffset.value + delta);
};

const getOffsetY = (index) => {
  return scrollOffset.value + initialOffset + index * itemHeight;
};

const clipFunc = (ctx) => {
  ctx.beginPath();
  ctx.rect(0, initialOffset, props.photo.config.width, clipHeight.value - 15);
  ctx.closePath();
  ctx.clip();
};

// Área de captura extendida: por ejemplo, 50px extra de ancho y alto.
const hitAreaWidth = computed(() => props.photo.config.width + 50);
const hitAreaHeight = computed(() => props.photo.config.height + 50);
</script>

<style scoped>
/* Ajusta estilos si es necesario */
</style>
