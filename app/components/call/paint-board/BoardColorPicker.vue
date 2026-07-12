<template>
  <div
    class="absolute top-0 left-0 z-20 h-full w-full"
    :class="[isOpen ? 'pointer-events-auto' : 'pointer-events-none']"
    @click.self.stop="close"
  >
    <div
      ref="colorPickerWrapper"
      class="absolute bottom-0 left-0 z-30 h-auto w-full origin-bottom rounded-t-2xl py-3 transition-all duration-200 ease-in-out"
      :class="[
        isOpen
          ? 'pointer-events-auto bg-surface shadow-medium'
          : 'pointer-events-none bg-surface/0 shadow-none',
      ]"
    >
      <div
        class="w-full whitespace-nowrap px-3 transition-all duration-200 overflow-hidden"
        :class="[
          isOpen ? 'h-auto opacity-100' : 'h-0 opacity-0 pointer-events-none',
        ]"
      >
        <div class="mb-4 flex w-full items-center gap-x-1">
          <div
            v-for="(color, index) in colors"
            :key="index"
            class="aspect-square cursor-pointer rounded-lg border-2 transition-all duration-200 ease-in-out"
            :class="[
              index === selectedColor ? 'border-primary' : 'border-primary/0',
            ]"
            :style="{
              backgroundColor: color,
              width: `${100 / colors.length}%`,
            }"
            @click="changeSelection(index)"
          />
        </div>
        <BButton
          :disabled="!canSelect"
          class="min-w-full"
          color="primary"
          :text="t('chat.board.confirm')"
          @click="submitSelection"
        />
      </div>
    </div>
  </div>
</template>

<!-- Normal script block used to export the interface for parent components -->
<script lang="ts">
export interface BoardColorPickerExposed {
  open: () => void;
  close: () => void;
}
</script>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    colors: string[];
  }>(),
  {
    modelValue: "#000000",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n();

const colorPickerWrapper = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const selectedColor = ref(0);
const previousSelectedColor = ref(0);
const isTransitioning = ref(true);

const colors = computed(() => props.colors);

const canSelect = computed(
  () => selectedColor.value !== previousSelectedColor.value,
);

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
  }
};

const open = () => {
  const index = colors.value.indexOf(props.modelValue);
  previousSelectedColor.value = index !== -1 ? index : 0;
  selectedColor.value = previousSelectedColor.value;

  setTimeout(() => {
    isTransitioning.value = false;
  }, 300);

  nextTick(() => {
    isOpen.value = true;
  });
};

const close = () => {
  if (isOpen.value && !isTransitioning.value) {
    isTransitioning.value = true;
    isOpen.value = false;
    // Revert to previous color when closing without submitting
    emit("update:modelValue", colors.value[previousSelectedColor.value]);
  }
};

const changeSelection = (index: number) => {
  selectedColor.value = index;
  emit("update:modelValue", colors.value[index]);
};

const submitSelection = () => {
  previousSelectedColor.value = selectedColor.value;
  isOpen.value = false;
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeyDown);
});

defineExpose<BoardColorPickerExposed>({
  open,
  close,
});
</script>
