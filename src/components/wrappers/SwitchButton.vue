<template>
  <v-tooltip location="bottom">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        @click="toggle"
        :disabled="isDisabled"
        class="mx-2 toolbar-control switch"
        variant="outlined"
        :class="{ on: value, off: !value }"
      >
        <v-icon v-if="icon" left class="mr-1">{{ icon }}</v-icon>
        <slot>Button</slot>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: "SwitchButton",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: "",
    },
    tooltip: {
      type: String,
      default: "asdasd",
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    value: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
  },
  methods: {
    toggle() {
      this.value = !this.value;
    },
  },
};
</script>
<style scoped>
/* .toolbar-control {
  font-size: 11px !important;
} */
</style>
