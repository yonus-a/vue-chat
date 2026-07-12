<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  useId,
  useTemplateRef,
} from "vue";
import type { MenuOption } from "~/types/components/menu-options";

// 🚀 PERFORMANCE BOOST: Moved outside of setup().
// This prevents Vue from recreating this massive object for every single <BInput> instance on the page.
const INPUT_CONFIG = {
  sizing: {
    height: "44px",
    textareaHeight: "94px",
    radius: "10px",
    borderWidth: "1px",
    paddingInternal: "12px",
    gap: "8px",
    fontSize: "var(--text-body-md)",
    fontFamily: "inherit",
    titleSize: "var(--text-label-sm)",
    captionSize: "12px",
    iconSize: "20px",
    messageIconSize: "24px",
  },
  colors: {
    bgDisabled: "var(--color-surface-variant)",
    text: "var(--color-on-surface)",
    placeholder: "var(--color-outline)",
    icon: "var(--color-on-surface)",
    title: "var(--color-on-surface)",
    caption: "var(--color-outline)",
  },
  focus: {
    borderGradient: "var(--background-image-diamond-primary-secondary)",
  },
  variants: (c: string) => {
    const map: Record<string, { bg: string; border: string; message: string }> =
      {
        error: {
          bg: "color-mix(in srgb, var(--color-error) 10%, transparent)",
          border: "var(--color-error)",
          message: "var(--color-error)",
        },
        warning: {
          bg: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
          border: "var(--color-warning)",
          message: "var(--color-warning)",
        },
        success: {
          bg: "color-mix(in srgb, var(--color-secondary) 10%, transparent)",
          border: "var(--color-secondary)",
          message: "var(--color-secondary)",
        },
        secondary: {
          bg: "color-mix(in srgb, var(--color-secondary) 10%, transparent)",
          border: "var(--color-secondary)",
          message: "var(--color-secondary)",
        },
        primary: {
          bg: "var(--color-surface)",
          border: "var(--color-outline)",
          message: "var(--color-primary)",
        },
      };
    return map[c] || map.primary;
  },
  addon: {
    bg: "transparent",
    text: "var(--color-on-surface)",
    radius: "6px",
    height: "32px",
  },
};

const uniqueId = useId();

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    type?: "text" | "number";
    title?: string;
    placeholder?: string;
    message?: string;
    color?: "error" | "warning" | "success" | "secondary" | "primary" | string;
    icon?: string;
    tabindex?: number | string;
    autocomplete?: string;
    enterkeyhint?:
      | "enter"
      | "search"
      | "done"
      | "go"
      | "next"
      | "previous"
      | "send"
      | undefined;
    maxlength?: number | string;
    required?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    textarea?: boolean;
    prefix?: string;
    caption?: string;
    selectedOptionKey?: string;
    options?: MenuOption[];
  }>(),
  {
    modelValue: "",
    type: "text",
    title: "",
    placeholder: "",
    message: "",
    color: "primary",
    icon: "",
    tabindex: 0,
    autocomplete: "on",
    enterkeyhint: "enter",
    required: false,
    readonly: false,
    disabled: false,
    textarea: false,
    prefix: "",
    caption: "",
    selectedOptionKey: "",
    options: () => [],
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  focus: [];
  blur: [];
  submit: [value: string];
  paste: [event: ClipboardEvent];
  select: [key: string];
}>();

// Refs
const inputValue = ref(props.modelValue);
const isFocus = ref(false);
const inputField = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>(
  "inputField",
);

const startSlotRef = ref<HTMLElement | null>(null);
const endSlotRef = ref<HTMLElement | null>(null);
const startSlotWidth = ref(0);
const endSlotWidth = ref(0);
const selectedOptionIndex = ref(0);

let resizeObserver: ResizeObserver | null = null;

// Computed
const selectedOption = computed(() => {
  if (props.options.length === 0) return "";
  return props.options[selectedOptionIndex.value]?.label || "";
});

const showMessage = ref(props.message.trim().length > 0);
const displayedMessage = ref(props.message);
const messageColor = computed(() => INPUT_CONFIG.variants(props.color).message);

const messageIcon = computed(() => {
  switch (props.color) {
    case "success":
      return "PhCheckCircle";
    case "error":
    case "warning":
      return "PhWarning";
    default:
      return "PhWarningCircle";
  }
});

const inputStyle = computed(() => {
  const padInt = parseInt(INPUT_CONFIG.sizing.paddingInternal, 10);
  const gap = parseInt(INPUT_CONFIG.sizing.gap, 10);

  const startPad =
    startSlotWidth.value > 0 ? startSlotWidth.value + padInt + gap : padInt;
  const endPad =
    endSlotWidth.value > 0 ? endSlotWidth.value + padInt + gap : padInt;
  const variantMap = INPUT_CONFIG.variants(props.color);

  return {
    "--i-pad-start": `${startPad}px`,
    "--i-pad-end": `${endPad}px`,
    "--i-pad-internal": INPUT_CONFIG.sizing.paddingInternal,
    "--i-height": INPUT_CONFIG.sizing.height,
    "--i-textarea-height": INPUT_CONFIG.sizing.textareaHeight,
    "--i-radius": INPUT_CONFIG.sizing.radius,
    "--i-border-width": INPUT_CONFIG.sizing.borderWidth,
    "--i-font-size": INPUT_CONFIG.sizing.fontSize,
    "--i-bg": variantMap.bg,
    "--i-bg-disabled": INPUT_CONFIG.colors.bgDisabled,
    "--i-text": INPUT_CONFIG.colors.text,
    "--i-placeholder": INPUT_CONFIG.colors.placeholder,
    "--i-border": variantMap.border,
    "--i-border-focus-gradient": INPUT_CONFIG.focus.borderGradient,
    "--i-addon-bg": INPUT_CONFIG.addon.bg,
    "--i-addon-text": INPUT_CONFIG.addon.text,
    "--i-addon-radius": INPUT_CONFIG.addon.radius,
    "--i-addon-height": INPUT_CONFIG.addon.height,
    "--i-title-color": INPUT_CONFIG.colors.title,
    "--i-title-size": INPUT_CONFIG.sizing.titleSize,
    "--i-caption-color": INPUT_CONFIG.colors.caption,
    "--i-caption-size": INPUT_CONFIG.sizing.captionSize,
    "--i-icon-color": INPUT_CONFIG.colors.icon,
    "--i-icon-size": INPUT_CONFIG.sizing.iconSize,
    "--i-msg-icon-size": INPUT_CONFIG.sizing.messageIconSize,
  };
});

// Methods
const handleOptionSelect = (key: string) => {
  selectedOptionIndex.value = props.options.findIndex(
    (option) => option.key === key,
  );
  emit("select", key);
};

const handleKeypress = (e: KeyboardEvent) => {
  if (props.type === "number" && !/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
};

const handlePaste = (e: ClipboardEvent) => {
  emit("paste", e);
  const pasteData = e.clipboardData?.getData("text") || "";
  if (props.type === "number" && !/^[0-9]+$/.test(pasteData)) {
    e.preventDefault();
  }
};

const handleFocus = () => {
  isFocus.value = true;
  emit("focus");
};
const handleBlur = () => {
  isFocus.value = false;
  emit("blur");
};
const handleSubmit = () => emit("submit", inputValue.value);

// Watchers
watch(
  () => props.selectedOptionKey,
  (newKey) => {
    if (props.options.length > 0 && newKey) {
      const idx = props.options.findIndex((opt) => opt.key === newKey);
      if (idx > -1) selectedOptionIndex.value = idx;
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (val) => {
    if (props.options.length > 0 && props.selectedOptionKey) {
      const idx = props.options.findIndex(
        (opt) => opt.key === props.selectedOptionKey,
      );
      if (idx > -1) selectedOptionIndex.value = idx;
    }
    inputValue.value = String(val ?? "");
  },
  { immediate: true },
);

watch(
  () => inputValue.value,
  (newVal) => {
    if (!newVal) return emit("update:modelValue", "");

    if (props.type === "number") {
      const filtered = newVal.replace(/[^0-9]/g, "");
      if (filtered !== newVal) {
        inputValue.value = filtered;
        return;
      }
    }
    emit("update:modelValue", inputValue.value);
  },
);

watch(
  () => props.message,
  (newMsg) => {
    if (newMsg.trim().length > 0) {
      displayedMessage.value = newMsg;
      showMessage.value = true;
    } else {
      showMessage.value = false;
    }
  },
);

// Lifecycle
onMounted(() => {
  if (typeof window !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === startSlotRef.value)
          startSlotWidth.value = entry.contentRect.width;
        if (entry.target === endSlotRef.value)
          endSlotWidth.value = entry.contentRect.width;
      }
    });
    if (startSlotRef.value) resizeObserver.observe(startSlotRef.value);
    if (endSlotRef.value) resizeObserver.observe(endSlotRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

// Expose
defineExpose({
  focus: () => inputField.value?.focus(),
  blur: () => inputField.value?.blur(),
});
</script>

<template>
  <div class="b-input-wrapper">
    <div class="mb-1.5 select-none text-label-sm text-on-surface">
      {{ title }}
    </div>

    <div :style="inputStyle" class="relative w-full">
      <!-- Options Dropdown (e.g., Country Code selectors) -->
      <div
        v-if="options.length > 0"
        class="absolute z-10 flex h-full items-center ltr:right-0 rtl:left-0 ltr:origin-right rtl:origin-left"
      >
        <BMenu :options="options" @select="handleOptionSelect">
          <template #trigger="{ isOpen }">
            <div
              class="flex cursor-pointer items-center gap-x-3 text-on-surface/50 ltr:pr-4 rtl:pl-4"
            >
              <div class="h-5 border border-outline"></div>
              <div class="select-none text-body-md">{{ selectedOption }}</div>
              <BIcon
                icon="PhCaretDown"
                class="transition-all duration-200 ease-in-out"
                :class="isOpen ? 'rotate-180' : 'rotate-0'"
              />
            </div>
          </template>
        </BMenu>
      </div>

      <!-- Input & Textarea -->
      <input
        v-if="!textarea"
        :id="`b-input-${uniqueId}`"
        ref="inputField"
        v-model="inputValue"
        :name="`field-${uniqueId}`"
        type="text"
        :readonly="readonly"
        :maxlength="maxlength"
        :tabindex="tabindex"
        :autocomplete="autocomplete"
        :enterkeyhint="enterkeyhint"
        :inputmode="type === 'number' ? 'numeric' : undefined"
        :placeholder="placeholder"
        :disabled="disabled"
        class="b-input"
        :class="{
          'is-focused': isFocus,
          'is-readonly': readonly,
          'is-disabled': disabled,
        }"
        @keypress="handleKeypress"
        @keydown.enter="handleSubmit"
        @paste="handlePaste"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <textarea
        v-else
        ref="inputField"
        v-model="inputValue"
        :readonly="readonly"
        :maxlength="maxlength"
        :tabindex="tabindex"
        :autocomplete="autocomplete"
        :enterkeyhint="enterkeyhint"
        :inputmode="type === 'number' ? 'numeric' : undefined"
        :placeholder="placeholder"
        :disabled="disabled"
        class="b-input b-input--textarea"
        :class="{
          'is-focused': isFocus,
          'is-readonly': readonly,
          'is-disabled': disabled,
        }"
        @keypress="handleKeypress"
        @keydown.enter="handleSubmit"
        @paste="handlePaste"
        @focus="handleFocus"
        @blur="handleBlur"
      ></textarea>

      <!-- Slots Wrapper (Prefix / Icon) -->
      <div
        class="b-input-slots-wrapper absolute inset-0 flex max-h-full items-center justify-between overflow-visible pointer-events-none hide-scrollbar"
        :style="{ paddingInline: inputStyle['--i-pad-internal'] }"
      >
        <div
          ref="startSlotRef"
          class="pointer-events-auto flex shrink-0 items-center"
        >
          <span v-if="prefix.trim()" class="b-input-prefix select-none">{{
            prefix
          }}</span>
          <BIcon
            v-else-if="icon.trim()"
            :icon="icon"
            class="b-input-icon shrink-0"
          />
        </div>

        <div
          ref="endSlotRef"
          class="pointer-events-auto flex shrink-0 items-center"
        >
          <BIcon
            v-if="prefix.trim() && icon.trim()"
            :icon="icon"
            class="b-input-icon shrink-0"
          />
        </div>
      </div>
    </div>

    <!-- Caption -->
    <div v-if="caption.trim()" class="b-input-caption select-none">
      {{ caption }}
    </div>

    <!-- Message (Error / Success / Warning) -->
    <div class="b-input-message-wrapper h-4 -translate-y-0 overflow-hidden">
      <div
        class="flex items-center gap-x-1.5 transition-all duration-200 ease-in-out"
        :class="[
          showMessage
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 opacity-0',
        ]"
        :style="{ color: messageColor }"
      >
        <BIcon :icon="messageIcon" class="b-input-message-icon shrink-0" />
        <span class="select-none text-xs">{{ displayedMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles remain exactly the same, just cleaned up formatting */
.b-input-wrapper {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.b-input {
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
  height: var(--i-height);
  border-radius: var(--i-radius);
  font-size: var(--i-font-size);
  font-family: var(--i-font-family);
  font-weight: 500;
  background-color: var(--i-bg);
  color: var(--i-text);
  border: var(--i-border-width) solid var(--i-border);
  padding-inline-start: var(--i-pad-start);
  padding-inline-end: var(--i-pad-end);
}

.b-input.is-focused {
  background-color: transparent;
  border-color: var(--color-primary);
}

.b-input--textarea {
  height: var(--i-textarea-height);
  resize: none;
  padding-top: var(--i-pad-internal);
}

.b-input::placeholder {
  color: var(--color-on-surface);
  opacity: 0.5;
}

.b-input.is-readonly {
  opacity: 0.7;
}

.b-input.is-disabled {
  background-color: var(--i-bg-disabled);
  border-color: var(--color-outline);
  cursor: not-allowed;
  opacity: 0.6;
}

.b-input-slots-wrapper {
  padding-inline: var(--i-pad-internal);
}

.b-input-prefix {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--i-font-size);
  font-weight: 500;
  color: var(--color-on-surface);
  opacity: 0.5;
}

.b-input-icon {
  width: var(--i-icon-size);
  height: var(--i-icon-size);
  fill: var(--color-on-surface);
  color: var(--i-icon-color);
  opacity: 0.5;
}

.b-input-message-icon {
  width: var(--i-msg-icon-size);
  height: var(--i-msg-icon-size);
  fill: currentColor;
}

.b-input-caption {
  padding-top: 6px;
  width: 100%;
  color: var(--color-on-surface);
  font-size: var(--i-caption-size);
}
</style>
