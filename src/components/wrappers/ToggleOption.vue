<template>
  <v-tooltip location="bottom">
    <template #activator="{ props }">
      <v-btn v-bind="props" class="toolbar-control switch" :value="value">
        <slot />
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: "ToggleOption",
  props: {
    value: {
      type: String,
      default: "",
    },
    tooltip: {
      type: String,
      default: "",
    },
  },
};
</script>
