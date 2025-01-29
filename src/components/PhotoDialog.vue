<template>
  <v-dialog
    :model-value="dialog"
    @update:model-value="$emit('update:dialog', $event)"
    max-width="750"
  >
    <v-card>
      <!-- <v-card-title>Photo Information</v-card-title> -->
      <v-card-text>
        <v-container>
          <v-row no-gutters>
            <v-col cols="12">
              <strong>Id:</strong> {{ selectedPhoto.id }}
            </v-col>
            <v-col cols="12">
              <strong>Name:</strong> {{ selectedPhoto.name }}
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
                      {{
                        selectedPhoto.description || "No description available"
                      }}
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
import { defineProps } from "vue";
const props = defineProps({
  selectedPhoto: Object,
  dialog: Boolean,
});
defineEmits(["update:dialog"]);
</script>
