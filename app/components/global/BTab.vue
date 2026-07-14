<template>
  <div ref="containerRef" class="flex flex-col gap-y-2">
    <div class="relative flex select-none items-center gap-x-5 text-label-md">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        :ref="
          (el) => {
            if (el) tabRefs[index] = el as HTMLElement;
          }
        "
        class="cursor-pointer py-1 transition-colors duration-200"
        :class="[
          modelValue === index ? 'text-chat-on-background' : 'text-chat-on-background/50',
        ]"
        @click="setTab(index)"
      >
        {{ tab }}
      </div>
    </div>

    <div class="relative h-0.5 w-full rounded-full bg-chat-outline-variant">
      <div
        class="bg-gradient-primary-secondary absolute bottom-0 h-full rounded-full transition-all duration-200 ease-in-out"
        :style="indicatorStyle"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    tabs: string[];
  }>(),
  {
    modelValue: 0,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const containerRef = ref<HTMLElement | null>(null);
const tabRefs = ref<HTMLElement[]>([]);
const indicatorStyle = ref({
  width: "0px",
  left: "0px",
});

let resizeObserver: ResizeObserver | null = null;

const updateIndicator = () => {
  const activeEl = tabRefs.value[props.modelValue];
  if (activeEl) {
    indicatorStyle.value = {
      width: `${activeEl.offsetWidth}px`,
      left: `${activeEl.offsetLeft}px`,
    };
  }
};

const setTab = (index: number) => {
  emit("update:modelValue", index);
};

watch(
  () => props.modelValue,
  () => {
    nextTick(updateIndicator);
  },
);

watch(
  () => props.tabs,
  () => {
    tabRefs.value = [];
    nextTick(updateIndicator);
  },
);

onMounted(() => {
  // Initial position calculation
  nextTick(updateIndicator);

  // Fallback for late-rendering layouts or web fonts loading
  setTimeout(updateIndicator, 100);

  // Using ResizeObserver instead of window.resize for better accuracy
  // if the container changes size independently of the viewport
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.bg-gradient-primary-secondary {
  min-height: 2px;
  z-index: 10;
}

.transition-all {
  will-change: left, width;
}
</style>
