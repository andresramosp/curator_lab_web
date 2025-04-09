<template>
  <v-btn-toggle
    v-model="value"
    color="secondary"
    mandatory
    class="mx-3"
    style="height: auto !important; justify-content: center"
  >
    <slot />
  </v-btn-toggle>
</template>

<script>
export default {
  name: "ToggleButtons",
  props: {
    modelValue: {
      type: String,
      default: "",
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
};
</script>
<style>
.v-btn-group {
  border-radius: 15px;
}
</style>
