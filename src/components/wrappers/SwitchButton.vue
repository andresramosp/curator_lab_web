<template>
  <v-btn
    @click="toggle"
    class="mx-2 toolbar-control switch"
    variant="outlined"
    :class="{ on: value, off: !value }"
  >
    <v-icon v-if="icon" left class="mr-1">{{ icon }}</v-icon>
    <slot>Button</slot>
  </v-btn>
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
