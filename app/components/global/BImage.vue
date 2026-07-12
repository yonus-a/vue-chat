<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    src?: string;
    title?: string;
    alt?: string;
    fit?: string;
    fitToContent?: boolean;
    hasFade?: boolean;
    noLoading?: boolean;
    autoSize?: boolean;
    autoAspect?: boolean;
    imageClass?: string;
  }>(),
  {
    src: "",
    title: "",
    alt: "",
    fit: "fit",
    fitToContent: false,
    hasFade: false,
    noLoading: false,
    autoSize: false,
    autoAspect: false,
    imageClass: "",
  },
);

const emit = defineEmits<{
  load: [];
}>();

const slots = useSlots();
const hasDefaultSlot = computed(() => !!slots.default);

const rootEl = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);

// Exact pixel math references
const containerWidth = ref(0);
const containerHeight = ref(0);
const imgRatio = ref<number | null>(null);

const isLoaded = ref(false);
const imageTransitionComplete = ref(true);
const elementHeight = ref(0);
const displayedImage = ref(props.src);

let resizeObserver: ResizeObserver | null = null;

const showImage = computed(
  () => isLoaded.value && props.src !== "" && imageTransitionComplete.value,
);

const rootClasses = computed(() => [
  "relative flex justify-center items-center pointer-events-none transition-all duration-500 ease-in-out",
  props.autoSize && !props.autoAspect ? "w-auto h-auto" : "w-full h-full",
]);

const wrapperClasses = computed(() => [
  "flex w-full justify-center items-center pointer-events-none transition-all duration-500 ease-in-out",
  props.autoSize && !props.autoAspect ? "relative" : "absolute inset-0 h-full",
]);

const wrapperStyles = computed(() =>
  props.fitToContent ? { height: `${elementHeight.value}px` } : {},
);

// THE FIX: Math-based boundary detection
const autoAspectStyles = computed(() => {
  if (
    !props.autoAspect ||
    !imgRatio.value ||
    !containerWidth.value ||
    !containerHeight.value
  ) {
    return { width: "100%", height: "100%", borderRadius: "inherit" };
  }

  const cRatio = containerWidth.value / containerHeight.value;

  if (imgRatio.value > cRatio) {
    return {
      width: "100%",
      height: "auto",
      aspectRatio: `${imgRatio.value}`,
      borderRadius: "inherit",
    };
  } else {
    return {
      width: "auto",
      height: "100%",
      aspectRatio: `${imgRatio.value}`,
      borderRadius: "inherit",
    };
  }
});

const autoAspectContainerClasses = computed(() => [
  "relative flex justify-center items-center overflow-hidden transition-all duration-500",
  showImage.value
    ? "bg-transparent"
    : !props.noLoading
      ? "animate-pulse bg-black/20"
      : "",
]);

const autoAspectImageClasses = computed(() => [
  "block h-full w-full select-none object-cover",
  showImage.value ? "opacity-100" : "opacity-0",
  props.noLoading
    ? "transition-none"
    : "transition-all duration-500 ease-in-out",
  props.imageClass,
]);

const standardContainerClasses = computed(() => [
  "relative h-full w-full overflow-hidden transition-all duration-500",
  showImage.value
    ? "bg-transparent"
    : !props.noLoading
      ? "animate-pulse bg-black/20"
      : "",
]);

const standardImageClasses = computed(() => [
  "block select-none transition-all duration-500 ease-in-out",
  props.autoSize ? "h-auto w-full" : "h-full w-full",
  `object-${props.fit}`,
  showImage.value ? "opacity-100" : "opacity-0",
  props.imageClass,
]);

const overlayClasses = computed(() => [
  "absolute inset-0 z-10 flex justify-center items-center pointer-events-none",
  props.autoSize || props.autoAspect ? "h-full" : "",
]);

const contentClasses = computed(() => [
  "content",
  props.fitToContent ? "" : "h-full w-full",
]);

const updateDimensions = () => {
  if (rootEl.value) {
    containerWidth.value = rootEl.value.clientWidth;
    containerHeight.value = rootEl.value.clientHeight;
  }
  if (content.value) {
    elementHeight.value = content.value.offsetHeight - 13;
  }
};

const loadImage = (e: Event) => {
  isLoaded.value = true;
  emit("load");
  const target = e.target as HTMLImageElement;
  if (target?.naturalWidth && target?.naturalHeight) {
    imgRatio.value = target.naturalWidth / target.naturalHeight;
  }
};

const swapImage = (newSrc: string) => {
  if (props.hasFade) {
    isLoaded.value = false;
    imageTransitionComplete.value = false;
    setTimeout(() => {
      imageTransitionComplete.value = true;
      displayedImage.value = newSrc;
      updateDimensions();
    }, 200);
  } else {
    isLoaded.value = false;
    displayedImage.value = newSrc;
    updateDimensions();
  }
};

// Silent pre-loader prevents layout shifts during image swaps
watch(
  () => props.src,
  (newSrc) => {
    if (!newSrc) return;

    if (props.autoAspect) {
      const img = new Image();
      img.onload = () => {
        imgRatio.value = img.naturalWidth / img.naturalHeight;
        swapImage(newSrc);
      };
      img.onerror = () => swapImage(newSrc);
      img.src = newSrc;
    } else {
      swapImage(newSrc);
    }
  },
);

onMounted(() => {
  resizeObserver = new ResizeObserver(updateDimensions);
  if (rootEl.value) resizeObserver.observe(rootEl.value);
  if (content.value) resizeObserver.observe(content.value);

  updateDimensions();

  if (props.autoAspect && props.src) {
    const img = new Image();
    img.onload = () => {
      imgRatio.value = img.naturalWidth / img.naturalHeight;
    };
    img.src = props.src;
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>
<template>
  <div ref="rootEl" :class="rootClasses">
    <div
      :style="[wrapperStyles, { borderRadius: 'inherit' }]"
      :class="wrapperClasses"
    >
      <div
        v-if="autoAspect"
        :style="autoAspectStyles"
        :class="autoAspectContainerClasses"
      >
        <img
          :key="displayedImage"
          :alt="alt"
          :src="displayedImage"
          @load="loadImage"
          :class="autoAspectImageClasses"
          style="border-radius: inherit"
        />
      </div>

      <template v-else>
        <div :class="standardContainerClasses" style="border-radius: inherit">
          <img
            :key="displayedImage"
            :alt="alt"
            :src="displayedImage"
            @load="loadImage"
            style="border-radius: inherit"
            :class="standardImageClasses"
          />
        </div>
      </template>
    </div>

    <div :title="title" :class="overlayClasses" style="border-radius: inherit">
      <div
        class="relative w-full h-full"
        :class="[
          hasDefaultSlot ? 'pointer-events-auto' : 'pointer-events-none',
        ]"
        style="border-radius: inherit"
      >
        <div
          ref="content"
          style="border-radius: inherit"
          :class="contentClasses"
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
