<script setup lang="ts">
import { computed, useAttrs, type Component } from "vue";
import * as PhosphorIcons from "@phosphor-icons/vue";

const props = withDefaults(
  defineProps<{
    icon: string;
    weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
    size?: string | number;
  }>(),
  {
    weight: "regular",
    size: "1em",
  },
);

const attrs = useAttrs();

// Filter out 'class' to handle it separately and avoid duplication
const filteredAttrs = computed(() => {
  const { class: _, ...rest } = attrs;
  return rest;
});

type PhosphorComponent = Component & { name?: string };

const iconComponent = computed<PhosphorComponent | string>(() => {
  if (!props.icon) return "span";

  const name = normalizeIconName(props.icon);
  return (PhosphorIcons as Record<string, PhosphorComponent>)[name] ?? "span";
});

function normalizeIconName(icon: string): string {
  // Strip a "Ph"/"ph" prefix (case-insensitive), then re-add a normalized "Ph".
  const withoutPrefix = /^ph/i.test(icon) ? icon.slice(2) : icon;
  return "Ph" + withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
}
</script>
<template>
  <component
    :is="iconComponent"
    :weight="weight"
    :size="size"
    v-bind="filteredAttrs"
    :class="['inline-block fill-current transition-all duration-200']"
  />
</template>
