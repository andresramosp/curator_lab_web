<template>
  <v-dialog
    :model-value="dialog"
    @update:model-value="$emit('update:dialog', $event)"
    max-width="750"
  >
    <v-card>
      <v-card-text>
        <v-container>
          <v-row no-gutters>
            <v-col cols="12">
              <strong>Id:</strong> {{ selectedPhoto.id }}
            </v-col>
            <v-col cols="12">
              <strong>Name:</strong> {{ selectedPhoto.name.split("-")[1] }}
            </v-col>
            <v-col cols="12">
              <strong>File: </strong>
              <a
                :href="selectedPhoto.fileUrl"
                target="_blank"
                class="text-secondary text-decoration-underline"
              >
                <span>Download</span>
              </a>
            </v-col>
          </v-row>

          <v-img
            :src="photosBaseURL + '/' + selectedPhoto.name"
            class="photo-image"
          ></v-img>

          <v-row>
            <v-col cols="12">
              <v-expansion-panels>
                <v-expansion-panel expand title="Tags">
                  <v-expansion-panel-text>
                    <v-sheet class="pa-2" elevation="1">
                      <v-chip
                        v-for="tag in selectedPhoto.tags"
                        :key="tag"
                        class="ma-1"
                        :class="{
                          'highlight-tag': isMatchingTag(tag),
                        }"
                      >
                        {{ tag }}
                      </v-chip>
                    </v-sheet>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel title="Description">
                  <v-expansion-panel-text>
                    <p>
                      <strong>Description:</strong>
                      <span v-html="highlightedDescription"></span>
                    </p>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="$emit('update:dialog', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, defineProps } from "vue";

const photosBaseURL = import.meta.env.VITE_PHOTOS_BASE_URL;

const props = defineProps({
  selectedPhoto: Object,
  dialog: Boolean,
});

defineEmits(["update:dialog"]);

const isMatchingTag = (tag) => {
  return props.selectedPhoto.matchingTags?.includes(tag);
};

const highlightedDescription = computed(() => {
  if (!props.selectedPhoto.description) return "No description available";

  let description = props.selectedPhoto.description;

  props.selectedPhoto.matchingChunks?.forEach((item) => {
    const regex = new RegExp(item.chunk, "gi");
    description = description.replace(
      regex,
      item.proximity >= 0
        ? `<span class="highlight-chunk-positive">${item.chunk}</span>`
        : `<span class="highlight-chunk-negative">${item.chunk}</span>`
    );
  });

  return description;
});
</script>

<style lang="css" scoped>
.photo-image {
  margin-top: 20px;
  margin-bottom: 20px;
  height: 350px;
  object-fit: cover;
  width: 100%;
}
</style>
<style>
.highlight-chunk-positive {
  background-color: rgb(var(--v-theme-secondary));
  color: darkslategray;
}
.highlight-chunk-negative {
  background-color: red;
}
.highlight-tag {
  background-color: rgb(var(--v-theme-secondary)) !important;
  color: darkslategray !important;
}
</style>
