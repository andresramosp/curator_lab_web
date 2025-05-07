<template>
  <v-tooltip location="bottom">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :disabled="disabled"
        class="toolbar-control switch outline"
        :class="[`toggle-option-${size}`]"
        :value="value"
      >
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
    size: {
      type: String,
      default: "large",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
<style>
.toggle-option-large {
  height: 48px !important;
}
.toggle-option-small {
  height: 35px !important;
}
</style>
