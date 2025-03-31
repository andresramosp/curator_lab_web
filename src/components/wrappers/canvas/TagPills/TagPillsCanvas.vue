<template>
  <v-group>
    <!-- Hit area ampliado para capturar el scroll -->
    <v-rect
      :config="{
        x: 0,
        y: 0,
        width: hitAreaWidth,
        height: hitAreaHeight,
        opacity: 0,
        listening: true,
      }"
      @wheel="onWheel"
    />
    <!-- Grupo de tags con clipping -->
    <v-group :config="{ x: 0, y: 0 }" :clipFunc="clipFunc">
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
});

const allowedGroups = ["person", "animals", "objects", "environment", "misc"];
const filteredTags = computed(() =>
  props.tags
    .filter((tagPhoto) => allowedGroups.includes(tagPhoto.tag.group))
    .sort(
      (t1, t2) =>
        shortenTag(t2.tag.name).length - shortenTag(t1.tag.name).length
    )
);

const scrollOffset = ref(0);
const itemHeight = 20;
const initialOffset = 5;

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
  const delta = e.evt.deltaY > 0 ? -7 : 7;
  scrollOffset.value = clampScroll(scrollOffset.value + delta);
};

const getOffsetY = (index) => {
  return scrollOffset.value + initialOffset + index * itemHeight;
};

const clipFunc = (ctx) => {
  ctx.beginPath();
  ctx.rect(0, 5, props.photo.config.width, clipHeight.value - 10);
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
