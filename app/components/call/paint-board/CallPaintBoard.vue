<template>
  <div
    class="relative w-dvw overflow-hidden whitespace-nowrap text-wrap select-none md:max-w-135"
  >
    <div class="flex h-full w-full flex-col p-4">
      <div class="flex shrink-0 items-center gap-x-3">
        <BIcon
          icon="PhX"
          class="h-5 w-5 cursor-pointer fill-chat-on-background/50"
          @click="$emit('close')"
        />
        <div class="text-label-sm text-chat-on-background">
          {{ t("board.title") }}
        </div>
      </div>

      <!-- CANVAS WRAPPER -->
      <div
        class="relative mt-4 min-h-117 w-full shrink-0 overflow-hidden rounded-2xl border-2 border-chat-primary bg-white"
      >
        <canvas
          ref="canvasRef"
          class="absolute top-0 left-0 h-full w-full touch-none"
        />
      </div>

      <div class="mt-2 flex shrink-0 items-center justify-between">
        <BButton
          icon="PhTrayArrowDown"
          color="primary"
          type="fill"
          @click="saveToFiles"
        />

        <div dir="rtl" class="flex items-center gap-x-2">
          <div
            v-if="pages.length === 1"
            class="flex h-11 w-11 aspect-square cursor-pointer items-center justify-center rounded-full bg-chat-surface"
            @click.stop="handleAction('add-page')"
          >
            <BIcon icon="PhPlus" class="h-6 w-6 fill-chat-on-background" />
          </div>

          <BMenu v-else :options="pageOptions" @select="handlePageSelect">
            <template #trigger>
              <div
                class="relative flex h-11 items-center justify-center gap-x-2.5 rounded-full bg-chat-surface p-2.5"
              >
                <div class="select-none text-label-sm text-chat-on-background">
                  +{{ pages.length - 1 }}
                </div>
                <BIcon icon="PhFiles" class="h-6 w-6 fill-chat-on-background" />
              </div>
            </template>
          </BMenu>

          <BMenu ref="colorPickerMenu" align="top">
            <template #trigger>
              <div
                class="relative flex h-11 w-11 aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-full bg-chat-surface"
                @click.stop="handleAction('color')"
              >
                <div
                  class="pointer-events-none aspect-square h-6 w-6 rounded-full"
                  :style="{ backgroundColor: selectedColor }"
                />
              </div>
            </template>
            <div class="flex flex-col gap-y-4 p-3">
              <div class="select-none text-label-md text-chat-on-background">
                {{ t("board.selectColor") }}
              </div>
              <div class="hidden w-50 grid-cols-5 gap-1 md:grid">
                <div
                  v-for="color in colors"
                  :key="color"
                  class="aspect-square w-8 cursor-pointer rounded-lg border transition-all duration-200 ease-in-out"
                  :class="[
                    selectedColor === color
                      ? 'border-chat-primary'
                      : 'border-chat-primary/0',
                  ]"
                  :style="{ backgroundColor: color }"
                  @click="setColor(color)"
                />
              </div>
            </div>
          </BMenu>

          <div
            class="flex h-11 w-11 aspect-square cursor-pointer items-center justify-center rounded-full bg-chat-surface"
            @click="handleAction('erase')"
          >
            <BIcon icon="PhEraser" class="h-6 w-6 fill-chat-on-background" />
          </div>

          <BMenu align="top">
            <template #trigger="{ isOpen }">
              <div
                class="flex h-11 w-11 aspect-square cursor-pointer items-center justify-center rounded-full bg-chat-surface"
              >
                <BIcon icon="PhPencilLine" class="h-6 w-6 fill-chat-on-background" />
              </div>
            </template>
            <!-- @click.stop prevents the BPopup from closing when you click the menu -->
            <div class="py-2" @click.stop @pointerdown.stop>
              <BrushSizeSlider v-model="brushSize" :color="selectedColor" />
            </div>
          </BMenu>

          <div
            class="flex h-11 w-11 aspect-square cursor-pointer items-center justify-center rounded-full bg-chat-surface"
            @click="handleAction('redo')"
          >
            <BIcon icon="PhArrowUUpRight" class="h-6 w-6 fill-chat-on-background" />
          </div>

          <div
            class="flex h-11 w-11 aspect-square cursor-pointer items-center justify-center rounded-full bg-chat-surface"
            @click="handleAction('undo')"
          >
            <BIcon icon="PhArrowUUpLeft" class="h-6 w-6 fill-chat-on-background" />
          </div>
        </div>
      </div>
    </div>

    <BoardColorPicker
      ref="boardColorPicker"
      v-show="isMobile"
      v-model="selectedColor"
      :colors="colors"
      class="md:hidden"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
} from "vue";

import BrushSizeSlider from "./BrushSizeSlider.vue";
import BoardColorPicker from "./BoardColorPicker.vue";
import type { BoardColorPickerExposed } from "./BoardColorPicker.vue";
import { useAppToast } from "~/composables/useAppToast.js";
import { useCallStore } from "~/stores/callStore.js";
import type { Menu } from "~/types/components/menu";
import useLocalI18n from "~/composables/useLocalI18n";
import { callPaintBoard } from "@i18n/locales";
import { storeToRefs } from "pinia";

// Isolate the untyped signature_pad instance to avoid polluting the rest of the file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignaturePadInstance = any;


const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const { t } = useLocalI18n(callPaintBoard);
const callStore = useCallStore();
const { openToast } = useAppToast();
const { width } = useWindowSize();

const isMobile = computed(() => width.value < 768);
const boardColorPicker =
  useTemplateRef<BoardColorPickerExposed>("boardColorPicker");
const colorPickerMenu = useTemplateRef<Menu>("colorPickerMenu");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

const colors = ref([
  "#2C2727",
  "#F49AA6",
  "#F897F6",
  "#CF40F3",
  "#555CEE",
  "#40F3E4",
  "#8CE25E",
  "#E9EF37",
  "#F37040",
  "#F34040",
]);

const setColor = (color: string) => {
  selectedColor.value = color;
  colorPickerMenu.value?.close();
};

const {
  boardPages: pages,
  boardSelectedPage: selectedPage,
  boardSelectedColor: selectedColor,
  boardBrushSize: brushSize,
  boardHistory: history,
  boardRedoHistory: redoHistory,
} = storeToRefs(callStore);

let signaturePadInstance: SignaturePadInstance = null;
let openStreamTimer: ReturnType<typeof setTimeout> | null = null;
let addPageTimer: ReturnType<typeof setTimeout> | null = null;

// Handle Canvas Resizing correctly to prevent stretching
const resizeCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  // Prevent resizing to 0x0 if the menu is closed/hidden
  if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return;

  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d")?.scale(ratio, ratio);

  if (signaturePadInstance) {
    if (history.value.length > 0) {
      signaturePadInstance.fromData(history.value);
    } else {
      // Crucial: Re-apply the white background color after resizing
      signaturePadInstance.clear();
    }
  }
};

onMounted(async () => {
  const SignaturePadModule = await import("signature_pad");
  const SignaturePad = SignaturePadModule.default;

  if (canvasRef.value) {
    signaturePadInstance = new SignaturePad(canvasRef.value, {
      minWidth: brushSize.value,
      maxWidth: brushSize.value + 2,
      penColor: selectedColor.value,
      backgroundColor: "rgb(255, 255, 255)",
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    signaturePadInstance.addEventListener("endStroke", () => {
      history.value = signaturePadInstance.toData();
      redoHistory.value = [];
    });
  }
});

onBeforeUnmount(() => {
  stopStreaming();
  window.removeEventListener("resize", resizeCanvas);
  if (openStreamTimer) clearTimeout(openStreamTimer);
  if (addPageTimer) clearTimeout(addPageTimer);
  if (signaturePadInstance) {
    signaturePadInstance.off();
  }
});

watch(brushSize, (newSize) => {
  if (signaturePadInstance) {
    signaturePadInstance.minWidth = newSize;
    signaturePadInstance.maxWidth = newSize + 2;
  }
});

watch(selectedColor, (newColor) => {
  if (signaturePadInstance) {
    signaturePadInstance.penColor = newColor;
  }
});

const saveToFiles = () => {
  if (!signaturePadInstance || signaturePadInstance.isEmpty()) return;

  // Save as JPEG (which relies on the backgroundColor we set to white)
  const dataUrl = signaturePadInstance.toDataURL("image/jpeg");

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `drawing-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  openToast(t("board.savedSuccessfully"), "success");
};

const handleAction = (action: string) => {
  if (!signaturePadInstance) return;

  switch (action) {
    case "erase": {
      if (signaturePadInstance.isEmpty()) return;
      const snapshot = signaturePadInstance.toData();
      history.value.push({ isClearAction: true, snapshot });
      signaturePadInstance.clear();
      redoHistory.value = [];
      break;
    }
    case "color":
      if (isMobile.value) {
        boardColorPicker.value?.open();
      } else {
        colorPickerMenu.value?.open();
      }
      break;
    case "add-page":
      pages.value[selectedPage.value] = {
        data: signaturePadInstance.toData(),
        history: [...history.value],
        redo: [...redoHistory.value],
      };
      pages.value.push({ data: [], history: [], redo: [] });
      selectedPage.value = pages.value.length - 1;

      signaturePadInstance.clear();

      history.value = [];
      redoHistory.value = [];
      break;
    case "undo":
      if (history.value.length > 0) {
        const lastAction = history.value.pop();
        redoHistory.value.push(lastAction);
        signaturePadInstance.fromData(history.value);
      }
      break;
    case "redo":
      if (redoHistory.value.length > 0) {
        const nextAction = redoHistory.value.pop();
        history.value.push(nextAction);
        signaturePadInstance.fromData(history.value);
      }
      break;
  }
};

const pageOptions = computed(() => {
  const options = pages.value.map((_, index) => ({
    key: (index + 1).toString(),
    label: t("board.page", { page: index + 1 }),
    icon: "PhFiles",
    color: "primary",
  }));

  options.push({
    key: "add-new-page",
    label: t("board.addPage"),
    icon: "PhPlus",
    color: "primary",
  });

  return options;
});

const switchPage = (index: number) => {
  if (!signaturePadInstance || index === selectedPage.value) return;

  // Save current page state before leaving
  pages.value[selectedPage.value] = {
    data: signaturePadInstance.toData(),
    history: [...history.value],
    redo: [...redoHistory.value],
  };

  // Load target page state
  selectedPage.value = index;
  const target = pages.value[index];

  signaturePadInstance.fromData(target.data || []);
  history.value = [...(target.history || [])];
  redoHistory.value = [...(target.redo || [])];
};

const handlePageSelect = (key: string) => {
  if (key === "add-new-page") {
    if (addPageTimer) clearTimeout(addPageTimer);
    addPageTimer = setTimeout(() => {
      addPageTimer = null;
      handleAction("add-page");
    }, 300);
  } else {
    const targetIndex = Number(key) - 1;
    switchPage(targetIndex);
  }
};

const startStreaming = () => {
  if (!canvasRef.value || !signaturePadInstance) return;

  // Type assertion because captureStream is not in standard TS DOM lib types
  const stream = (
    canvasRef.value as unknown as { captureStream(fps: number): MediaStream }
  ).captureStream(30);
  callStore.setScreenStream(stream);

  if (history.value && history.value.length > 0) {
    signaturePadInstance.fromData(history.value);
  } else {
    signaturePadInstance.clear();
  }
};

const stopStreaming = () => {
  callStore.stopScreenShare();
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      if (openStreamTimer) clearTimeout(openStreamTimer);
      openStreamTimer = setTimeout(() => {
        openStreamTimer = null;
        resizeCanvas();
        startStreaming();
      }, 50);
    } else {
      callStore.stopScreenShare();
    }
  },
  { immediate: true },
);
</script>
