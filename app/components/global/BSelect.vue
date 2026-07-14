<template>
  <div
    :class="[disabled ? 'cursor-not-allowed opacity-50' : 'opacity-100']"
    class="flex w-full max-w-90 flex-col outline-none"
    :tabindex="tabindex"
    @keyup.tab="openOnTab"
    @keydown.down.prevent="highlightNext"
    @keydown.up.prevent="highlightPrev"
    @keydown.enter.prevent="selectHighlighted"
    @keydown.esc.prevent="closeDropdown"
  >
    <span
      v-if="title"
      class="pointer-events-none mb-1.5 select-none text-label-md text-chat-on-background"
    >
      {{ title }}
    </span>

    <div ref="dropdownRef" class="relative w-full">
      <div @click="toggleDropdown" :class="containerClasses">
        <div
          class="flex h-full flex-1 items-center gap-x-2 overflow-x-auto overflow-y-hidden hide-scrollbar"
        >
          <BImage
            v-if="selectedItem?.image"
            :src="selectedItem.image"
            class="h-6 w-6 min-h-6 min-w-6 max-h-6 max-w-6 overflow-hidden rounded-full"
          />
          <div
            v-else-if="selectedItem?.color"
            class="aspect-square h-6 w-6 shrink-0 rounded-full"
            :style="{ background: selectedItem.color }"
          />

          <span
            v-if="selectedItem && (!searchable || !isOpen)"
            class="truncate select-none text-sm font-medium text-chat-on-background opacity-100 shrink-0"
          >
            {{ selectedItem.label }}
          </span>

          <span
            v-if="showPlaceholder"
            class="truncate select-none text-sm font-medium text-chat-on-background opacity-50 shrink-0"
          >
            {{ placeholder }}
          </span>

          <input
            v-if="searchable && isOpen"
            ref="searchInput"
            v-model="searchQuery"
            @click.stop
            @keydown.down.prevent="highlightNext"
            @keydown.up.prevent="highlightPrev"
            @keydown.enter.prevent="selectHighlighted"
            class="h-full min-w-15 max-w-full flex-1 bg-transparent text-sm font-medium text-chat-on-background outline-none placeholder:text-chat-on-background/50"
            :placeholder="placeholder"
          />
        </div>

        <BIcon
          icon="PhCaretDown"
          class="h-5 w-5 shrink-0 fill-chat-on-background/50 transition-transform duration-300"
          :class="[isOpen ? 'rotate-180' : '', disabled ? 'opacity-40' : '']"
        />
      </div>

      <transition name="dropdown-fade">
        <div
          v-if="isOpen"
          :class="[
            'absolute left-0 right-0 z-50 flex flex-col overflow-hidden rounded-xl border border-chat-outline bg-chat-background shadow-[0_12px_16px_-4px_rgba(13,13,18,0.08)] dark:shadow-[0_12px_16px_-4px_rgba(0,0,0,0.4)]',
            openDirection === 'up'
              ? 'bottom-[calc(100%+6px)] origin-bottom'
              : 'top-[calc(100%+6px)] origin-top',
          ]"
        >
          <div
            v-if="isLoading"
            class="flex h-18.75 w-full items-center justify-center"
          >
            <BIcon
              icon="PhCircleNotch"
              class="h-7 w-7 animate-spin fill-chat-outline"
            />
          </div>

          <template v-else>
            <div
              v-if="filteredOptions.length === 0"
              class="flex items-center justify-center gap-x-2 py-6 text-chat-on-background/50"
            >
              <span class="select-none text-sm font-medium">
                {{
                  t("noResultFound", {
                    search: searchQuery,
                    item: noResultText || t("result"),
                  })
                }}
              </span>
            </div>

            <div
              v-if="filteredOptions.length > 0"
              ref="optionsListRef"
              class="max-h-50 overflow-y-auto"
            >
              <div
                :style="{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: 'relative',
                  width: '100%',
                }"
              >
                <div
                  v-for="virtualRow in virtualizer.getVirtualItems()"
                  :key="virtualRow.index"
                  :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size - 2}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }"
                  :class="[
                    'flex cursor-pointer items-center gap-x-2 px-2 transition-colors duration-200 ease-in-out',
                    isSelected(filteredOptions[virtualRow.index]) ||
                    highlightedIndex === virtualRow.index
                      ? 'bg-chat-surface-2'
                      : 'bg-transparent',
                  ]"
                  @click.stop="toggleOption(filteredOptions[virtualRow.index])"
                >
                  <BImage
                    v-if="filteredOptions[virtualRow.index].image"
                    :src="filteredOptions[virtualRow.index].image"
                    class="h-6 w-6 min-h-6 min-w-6 max-h-6 max-w-6 shrink-0 object-cover rounded-sm"
                  />
                  <div
                    v-else-if="filteredOptions[virtualRow.index]?.color"
                    class="aspect-square h-6 w-6 shrink-0 overflow-hidden rounded-full"
                    :style="{
                      background: filteredOptions[virtualRow.index]?.color,
                    }"
                  />
                  <BIcon
                    v-else-if="filteredOptions[virtualRow.index].icon"
                    :icon="filteredOptions[virtualRow.index].icon"
                    class="h-6 w-6 shrink-0"
                    :class="
                      isSelected(filteredOptions[virtualRow.index])
                        ? 'fill-chat-primary'
                        : 'fill-chat-on-background'
                    "
                  />

                  <span
                    class="flex-1 truncate overflow-hidden text-ellipsis text-sm font-medium"
                    :class="
                      isSelected(filteredOptions[virtualRow.index])
                        ? 'text-chat-primary'
                        : 'text-chat-on-background'
                    "
                  >
                    {{ filteredOptions[virtualRow.index].label }}
                  </span>

                  <BIcon
                    v-if="isSelected(filteredOptions[virtualRow.index])"
                    icon="PhCheck"
                    class="ms-auto h-5 w-5 shrink-0 fill-chat-primary"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>
      </transition>
    </div>

    <div
      class="h-5 w-full overflow-hidden transition-all duration-300 ease-in-out"
      :class="[message ? 'mt-1.5 opacity-100' : 'mt-0 opacity-0']"
    >
      <div class="flex items-center gap-x-1.5">
        <BIcon
          v-if="message"
          :icon="messageIcon"
          class="h-4 w-4 shrink-0"
          :class="messageColorClass"
        />
        <span class="select-none text-xs" :class="messageColorClass">{{
          message
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import type { DropdownOption } from "~/types/components/select";
import useLocalI18n from "~/composables/useLocalI18n";
import { componentsGeneral } from "@i18n/locales";
const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    options?: DropdownOption[];
    tabindex?: number;
    title?: string;
    placeholder?: string;
    message?: string;
    disabled?: boolean;
    searchable?: boolean;
    hasError?: boolean;
    color?: "primary" | "error" | "warning" | "success" | "secondary" | string;
    loading?: boolean;
    remoteSearch?: boolean;
    noResultText?: string;
  }>(),
  {
    modelValue: "",
    options: () => [],
    tabindex: 0,
    title: "",
    placeholder: "Select...",
    message: "",
    disabled: false,
    searchable: false,
    hasError: false,
    color: "primary",
    loading: false,
    remoteSearch: false,
    noResultText: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  search: [query: string];
}>();

const { t } = useLocalI18n(componentsGeneral);
const isOpen = ref(false);
const searchQuery = ref("");
const dropdownRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const optionsListRef = ref<HTMLElement | null>(null);
const highlightedIndex = ref(-1);
const openDirection = ref<"down" | "up">("down");
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const isLoading = computed(() => props.loading);

const calculatePosition = () => {
  if (!dropdownRef.value) return;
  const rect = dropdownRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const requiredSpace = 260;

  openDirection.value =
    spaceBelow < requiredSpace && rect.top > requiredSpace ? "up" : "down";
};

const messageColorClass = computed(() => {
  if (props.hasError || props.color === "error") return "fill-chat-error text-chat-error";
  if (props.color === "success") return "fill-chat-secondary text-chat-secondary";
  if (props.color === "warning") return "fill-chat-warning text-chat-warning";
  return "fill-chat-on-background/50 text-chat-on-background/50";
});

const messageIcon = computed(() => {
  if (props.hasError || props.color === "error") return "PhWarningCircle";
  if (props.color === "success") return "PhCheckCircle";
  if (props.color === "warning") return "PhWarning";
  return "PhInfo";
});

watch(searchQuery, (newVal) => {
  highlightedIndex.value = -1;
  if (props.remoteSearch && props.searchable) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => emit("search", newVal), 300);
  }
});

const filteredOptions = computed(() => {
  if (!props.searchable || props.remoteSearch || !searchQuery.value)
    return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((opt) => opt.label.toLowerCase().includes(query));
});

const virtualizerOptions = computed(() => ({
  count: filteredOptions.value.length,
  getScrollElement: () => optionsListRef.value as HTMLElement | null,
  estimateSize: () => 42,
  overscan: 5,
}));

const virtualizer = useVirtualizer(virtualizerOptions);

const scrollToHighlighted = () => {
  nextTick(() => {
    if (highlightedIndex.value >= 0) {
      virtualizer.value.scrollToIndex(highlightedIndex.value, {
        align: "auto",
      });
    }
  });
};

const highlightNext = () => {
  if (!isOpen.value) return toggleDropdown();
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++;
    scrollToHighlighted();
  }
};

const highlightPrev = () => {
  if (!isOpen.value) return;
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
    scrollToHighlighted();
  }
};

const selectHighlighted = () => {
  if (!isOpen.value) return;
  if (
    highlightedIndex.value >= 0 &&
    filteredOptions.value[highlightedIndex.value]
  ) {
    toggleOption(filteredOptions.value[highlightedIndex.value]);
  }
};

const isSelected = (option: DropdownOption) =>
  props.modelValue === option.value;

const selectedItem = computed(
  () => props.options.find((opt) => opt.value === props.modelValue) || null,
);

const showPlaceholder = computed(() => {
  if (props.searchable && isOpen.value) return false;
  return !selectedItem.value;
});

const toggleDropdown = () => {
  if (props.disabled) return;

  if (!isOpen.value) {
    calculatePosition();
    isOpen.value = true;

    if (selectedItem.value) {
      const idx = filteredOptions.value.findIndex(
        (opt) => opt.value === selectedItem.value!.value,
      );
      highlightedIndex.value = idx >= 0 ? idx : 0;
    } else {
      highlightedIndex.value = 0;
    }

    if (props.searchable) {
      setTimeout(() => searchInput.value?.focus(), 50);
      if (props.remoteSearch && !searchQuery.value) emit("search", "");
    }

    nextTick(scrollToHighlighted);
  } else {
    closeDropdown();
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  searchQuery.value = "";
  highlightedIndex.value = -1;
};

const toggleOption = (option: DropdownOption) => {
  emit("update:modelValue", option.value);
  closeDropdown();
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    isOpen.value &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    closeDropdown();
  }
};

const openOnTab = () => {
  if (!isOpen.value) toggleDropdown();
};

const containerClasses = computed(() => {
  const c = props.color;
  const isError = props.hasError || c === "error";

  const bg = isOpen.value
    ? "bg-chat-background"
    : isError
      ? "bg-chat-error/10"
      : c === "warning"
        ? "bg-chat-warning/10"
        : c === "success" || c === "secondary"
          ? "bg-chat-secondary/10"
          : "bg-surface-rest";

  const border = isError
    ? "border-chat-error"
    : c === "warning"
      ? "border-chat-warning"
      : c === "success" || c === "secondary"
        ? "border-chat-secondary"
        : isOpen.value
          ? "border-chat-primary"
          : "border-chat-outline";

  const shadow = isOpen.value
    ? "shadow-[0_8px_10px_-3px_rgba(13,13,18,0.05)] dark:shadow-[0_8px_10px_-3px_rgba(0,0,0,0.26)]"
    : "shadow-none";

  return [
    "flex h-12 w-full cursor-pointer items-center gap-x-1.5 rounded-[10px] border px-3 py-2.5 transition-all duration-300",
    bg,
    border,
    shadow,
    props.disabled && "pointer-events-none opacity-50",
  ];
});

onMounted(() => document.addEventListener("mousedown", handleClickOutside));

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease-in-out;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
