<template>
  <div ref="menuWrapper" class="relative">
    <div
      class="relative cursor-pointer"
      :class="[overlay ? 'z-10100' : '']"
      @click.stop="toggleMenu"
    >
      <slot name="trigger" :isOpen="isOpen" />
    </div>

    <div
      v-if="overlay"
      class="fixed top-0 left-0 h-dvh w-dvw z-10060 transition-all duration-300 ease-in-out"
      :class="[
        isOpen
          ? 'pointer-events-auto bg-on-background/20 backdrop-blur-sm'
          : 'pointer-events-none bg-on-background/0 backdrop-blur-none',
      ]"
      @click="closeMenu"
    />

    <div
      ref="panelRef"
      class="absolute z-10110 rounded-xl border border-outline-variant bg-surface transition-all duration-200 ease-in-out"
      :class="[
        isOpen ? 'shadow-[0px_8px_24px_rgba(149,157,165,0.2)]' : 'shadow-none',
        !hasCustomContent && options.length > 0 ? 'w-50' : '',
      ]"
      :style="panelPositionStyles"
      @click="handleContentClick"
    >
      <div v-if="hasCustomContent" key="menu-custom">
        <slot :isOpen="isOpen" :close="closeMenu" />
      </div>

      <div
        v-else-if="options.length > 0"
        key="menu-list"
        class="flex max-h-75 flex-col gap-y-1 overflow-y-auto p-3"
      >
        <template v-for="(opt, idx) in options" :key="opt.key">
          <div class="pointer-events-auto">
            <div
              class="flex h-11 w-full cursor-pointer items-center gap-x-2 rounded-lg bg-transparent px-2 transition-all duration-200 ease-in-out hover:bg-surface-variant-2"
              @click="handleSelect(opt.key)"
            >
              <BIcon
                v-if="opt.icon"
                :icon="opt.icon"
                class="h-5 w-5"
                :class="[
                  opt.color ? `fill-${opt.color}` : 'fill-on-surface/50',
                ]"
              />
              <div
                class="select-none text-label-sm"
                :class="[
                  opt.color ? `text-${opt.color}` : 'text-on-surface/50',
                ]"
              >
                {{ opt.label }}
              </div>
            </div>
          </div>
          <div v-if="idx < options.length - 1" class="px-2">
            <div class="h-px w-full bg-outline-container" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<!-- Normal script block used to export the interface for other components to import -->
<script lang="ts">
export interface Option {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}
</script>

<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  watch,
  useId,
  useSlots,
  type CSSProperties,
} from "vue";
import { useClickOutside } from "~/composables/useClickOutside";

// Shared state across all BMenu instances to handle global auto-closing
const globalActiveMenuId = ref<string | null>(null);

const props = withDefaults(
  defineProps<{
    options?: Option[];
    overlay?: boolean;
    autoClose?: boolean;
    align?: "top" | null;
    ignoreGlobal?: boolean;
  }>(),
  {
    options: () => [],
    overlay: false,
    autoClose: true,
    align: null,
    ignoreGlobal: false,
  },
);

const emit = defineEmits<{
  select: [key: string];
  open: [];
  close: [];
}>();

const slots = useSlots();
const instanceId = useId();

const isOpen = ref(false);
const menuWrapper = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const verticalAlign = ref<"bottom" | "top">("bottom");
const horizontalAlign = ref<"left" | "right">("left");

const hasCustomContent = computed(
  () => !props.options || props.options.length === 0,
);

const calculateAlignment = async () => {
  await nextTick();
  if (!menuWrapper.value || !panelRef.value) return;

  const triggerRect = menuWrapper.value.getBoundingClientRect();
  const panelWidth = panelRef.value.offsetWidth;
  const panelHeight = panelRef.value.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 1. VERTICAL CHECK: If opening below hits bottom, and there's room above, go TOP.
  if (
    triggerRect.bottom + panelHeight > viewportHeight &&
    triggerRect.top > panelHeight
  ) {
    verticalAlign.value = "top";
  } else {
    verticalAlign.value = "bottom";
  }

  // 2. HORIZONTAL CHECK: If opening to the right hits edge, align to the right edge.
  if (triggerRect.left + panelWidth > viewportWidth) {
    horizontalAlign.value = "right";
  } else {
    horizontalAlign.value = "left";
  }
};

const toggleMenu = () => {
  if (!isOpen.value) {
    globalActiveMenuId.value = instanceId;
    emit("open");
    isOpen.value = true;
    calculateAlignment();
  } else {
    closeMenu();
  }
};

const closeMenu = () => {
  isOpen.value = false;
  emit("close");
  if (globalActiveMenuId.value === instanceId) {
    globalActiveMenuId.value = null;
  }
};

const panelPositionStyles = computed<CSSProperties>(() => {
  const isVisible = isOpen.value;
  const v = props.align === "top" ? "top" : verticalAlign.value;
  const h = horizontalAlign.value;

  const styles: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? "auto" : "none",
    visibility: isVisible ? "visible" : "hidden",
    whiteSpace: "nowrap",
    position: "absolute",
  };

  // Vertical Positioning
  if (v === "bottom") {
    styles.top = "100%";
    styles.bottom = "auto";
    styles.transform = isVisible ? "translateY(12px)" : "translateY(0px)";
  } else {
    styles.bottom = "100%";
    styles.top = "auto";
    styles.transform = isVisible ? "translateY(-12px)" : "translateY(0px)";
  }

  // Horizontal Positioning
  if (h === "left") {
    styles.left = "0";
    styles.right = "auto";
  } else {
    styles.right = "0";
    styles.left = "auto";
  }

  return styles;
});

watch(globalActiveMenuId, (newId) => {
  if (props.ignoreGlobal) return;
  if (newId !== instanceId && isOpen.value) {
    closeMenu();
  }
});

useClickOutside(menuWrapper, () => {
  if (!isOpen.value) return;
  if (props.autoClose) {
    closeMenu();
  }
});

const handleSelect = (key: string) => {
  emit("select", key);
  closeMenu();
};

// Prevents the panel from closing when interacting with custom slot content
const handleContentClick = () => {
  if (hasCustomContent.value) return;
};

defineExpose({
  open: () => {
    globalActiveMenuId.value = instanceId;
    isOpen.value = true;
    calculateAlignment();
  },
  close: closeMenu,
});
</script>
