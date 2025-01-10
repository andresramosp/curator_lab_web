<template>
  <v-card class="pa-4">
    <v-card-title>{{ title }}</v-card-title>
    <v-autocomplete
      v-model="newTag"
      v-model:search="searchValue"
      :items="availableTags"
      label="Search and add tags"
      outlined
      hide-no-data
      :loading="loading"
      @update:model-value="handleSelect"
    />
    <v-list>
      <v-list-item v-for="(tag, index) in tags" :key="index">
        <v-list-item-title>{{ tag }}</v-list-item-title>
        <v-list-item-action>
          <v-btn icon @click="removeTag(index)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";
import debounce from "lodash/debounce";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  tags: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update-tags"]);

const newTag = ref("");
const searchValue = ref("");
const availableTags = ref([]);
const loading = ref(false);

const fetchAvailableTags = debounce(async () => {
  if (!searchValue.value) {
    availableTags.value = [];
    return;
  }
  loading.value = true;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/tags/search`,
      {
        params: { term: searchValue.value },
      }
    );
    availableTags.value = response.data.result.map((tag) => tag.name);
  } catch (error) {
    console.error("Error fetching tags:", error);
  } finally {
    loading.value = false;
  }
}, 300);

function addTag() {
  if (newTag.value && !props.tags.includes(newTag.value)) {
    const updatedTags = [...props.tags, newTag.value];
    emit("update-tags", updatedTags);
  }
  newTag.value = "";
}

function handleSelect(value) {
  if (value && availableTags.value.includes(value)) {
    addTag();
  }
}

function removeTag(index) {
  const updatedTags = props.tags.filter((_, i) => i !== index);
  emit("update-tags", updatedTags);
}

/**
 * Escucha cambios en el valor de búsqueda y ejecuta la función con debounce.
 */
watch(searchValue, () => {
  fetchAvailableTags();
});
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}
</style>
