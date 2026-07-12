<template>
  <div
    :dir="dir"
    @click="emit('click')"
    :class="[
      'relative inline-flex items-center justify-center select-none rounded-full transition-all duration-200 ease-in-out text-primary bg-primary/10 border-gradient-active',
      sizeClasses,
      paddingClasses,
      icon.trim() ? 'gap-x-3' : '',
    ]"
  >
    <Transition name="icon-expand">
      <div
        v-if="icon"
        :class="[
          'shrink-0 z-10 flex items-center justify-center overflow-hidden',
          iconSizeClass,
        ]"
      >
        <BIcon
          @click.stop="emit('action')"
          :icon="icon"
          class="w-full h-full"
        />
      </div>
    </Transition>

    <span
      v-if="text"
      :class="[
        'z-10 truncate transition-all duration-200 ease-in-out',
        textSizeClass,
      ]"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useLocale } from "~/composables/useLocale";

const props = withDefaults(
  defineProps<{
    size?: "md" | "lg";
    icon?: string;
    text?: string;
  }>(),
  {
    size: "md",
    icon: "",
    text: "",
  },
);

const { dir } = useLocale();

const emit = defineEmits<{
  click: [];
  action: [];
}>();

const sizeClasses = computed(() =>
  props.size === "lg" ? "h-[32px]" : "h-[28px]",
);
const iconSizeClass = computed(() =>
  props.size === "lg" ? "w-4.5 h-4.5" : "w-4 h-4",
);
const textSizeClass = computed(() =>
  props.size === "lg" ? "text-label-md" : "text-label-sm",
);

const paddingClasses = computed(() => {
  if (props.icon && props.text) return "ps-2 pe-3";
  if (props.icon) return "px-1.5";
  return "px-3";
});
</script>

<style scoped>
.border-gradient-active {
  position: relative;
  border: none !important;
}

.border-gradient-active::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  padding: 1px;
  background: var(--background-image-diamond-primary-secondary);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.icon-expand-enter-active,
.icon-expand-leave-active {
  transition:
    width 200ms ease-in-out,
    opacity 200ms ease-in-out,
    transform 200ms ease-in-out;
}

.icon-expand-enter-from,
.icon-expand-leave-to {
  width: 0 !important;
  opacity: 0;
  transform: scale(0.5);
}
</style>
