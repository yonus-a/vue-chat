<script setup lang="ts">
import { computed, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
    disabled?: boolean;
  }>(),
  {
    label: "",
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const slots = useSlots();

const hasContent = computed(() => !!props.label || !!slots.default);

const toggleCheck = () => {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
};
</script>
<template>
  <div
    class="group inline-flex items-center transition-all duration-200"
    :class="[
      hasContent && 'gap-x-3',
      !disabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
    ]"
    @click="toggleCheck"
  >
    <div class="flex shrink-0 items-center justify-center">
      <div
        class="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md bg-outline p-0.5 transition-all duration-200"
      >
        <div
          class="absolute inset-0 bg-diamond-primary-secondary transition-opacity duration-200 ease-in-out"
          :class="modelValue ? 'opacity-100' : 'opacity-0'"
        />
        <div
          class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[3px] bg-surface"
        >
          <div
            class="absolute inset-0 flex items-center justify-center bg-diamond-primary-secondary transition-all duration-200 ease-in-out"
            :class="modelValue ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
          >
            <BIcon
              class="h-3.5 w-3.5 fill-white"
              weight="bold"
              icon="PhCheck"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasContent" class="select-none flex-1">
      <slot>
        <span class="text-body-md text-on-surface">{{ label }}</span>
      </slot>
    </div>
  </div>
</template>
