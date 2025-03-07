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

          <div style="padding: 20px">
            <v-img
              :src="photosBaseURL + '/' + selectedPhoto.name"
              class="photo-image-big"
            ></v-img>
          </div>

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
                          'highlight-tag-positive': isMatchingPositiveTag(
                            tag.name
                          ),
                          'highlight-tag-negative': isMatchingNegativeTag(
                            tag.name
                          ),
                        }"
                      >
                        {{ `${tag.name} | ${tag.group}` }}
                      </v-chip>
                    </v-sheet>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel title="Descriptions">
                  <v-expansion-panel-text>
                    <v-container fluid>
                      <v-row
                        v-for="(desc, key) in highlightedDescriptions"
                        :key="key"
                        class="mb-2"
                      >
                        <v-col cols="12">
                          <v-card outlined>
                            <v-card-title class="headline">{{
                              key.toUpperCase()
                            }}</v-card-title>
                            <v-card-text
                              style="text-align: justify"
                              v-html="desc"
                            ></v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-container>
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

const isMatchingPositiveTag = (tagName) => {
  let matchingTag = props.selectedPhoto.matchingTags?.find(
    (tag) => tag.name == tagName
  );
  return matchingTag && matchingTag.proximity > 0;
};

const isMatchingNegativeTag = (tagName) => {
  let matchingTag = props.selectedPhoto.matchingTags?.find(
    (tag) => tag.name == tagName
  );
  return matchingTag && matchingTag.proximity < 0;
};

const highlightedDescriptions = computed(() => {
  const descriptionsObj = props.selectedPhoto.descriptions || {};
  const result = {};
  Object.keys(descriptionsObj).forEach((key) => {
    let text = descriptionsObj[key];
    if (!text) {
      result[key] = "No description available";
    } else {
      props.selectedPhoto.matchingChunks?.forEach((item) => {
        const regex = new RegExp(item.chunk, "gi");
        text = text.replace(
          regex,
          item.proximity >= 0
            ? item.isFullQuery
              ? `<span class="highlight-chunk-positive-fullQuery">${item.chunk}</span>`
              : `<span class="highlight-chunk-positive">${item.chunk}</span>`
            : `<span class="highlight-chunk-negative">${item.chunk}</span>`
        );
      });
      result[key] = text;
    }
  });
  return result;
});
</script>

<style lang="css" scoped>
.photo-image {
  margin-top: 20px;
  margin-bottom: 20px;
  height: 550px;
  object-fit: cover;
  width: 100%;
}
</style>
<style>
.highlight-chunk-positive {
  background-color: rgb(var(--v-theme-secondary));
  opacity: 0.6;
  color: darkslategray;
}
.highlight-chunk-positive-fullQuery {
  background-color: blue;
  opacity: 0.6;
  color: white;
}
.highlight-chunk-negative {
  background-color: red;
  opacity: 0.6;
}
.highlight-tag-positive {
  background-color: rgb(var(--v-theme-secondary)) !important;
  color: darkslategray !important;
}
.highlight-tag-negative {
  background-color: red !important;
}
</style>
