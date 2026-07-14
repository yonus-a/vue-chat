<template>
  <BPopup
    ref="popup"
    :auto-close="!isLoading"
    no-padding
    @closed="handleOnClosed"
  >
    <!-- Standard Modal Layout -->
    <div
      v-if="!card"
      class="flex w-dvw flex-col items-center p-6 text-wrap md:max-w-120"
    >
      <div
        class="flex h-16 w-16 items-center justify-center rounded-full"
        :class="[modalColorings?.bgColor]"
      >
        <BIcon
          :icon="modalIcon"
          weight="fill"
          class="h-8 w-8"
          :class="[modalColorings?.iconColor]"
        />
      </div>
      <div class="mt-4 flex w-full flex-col items-center gap-y-3 select-none">
        <div v-if="modalTitle.trim()" class="text-label-lg text-chat-on-background">
          {{ modalTitle }}
        </div>
        <div v-if="modalText.trim()" class="text-body-md text-chat-on-background/50">
          {{ modalText }}
        </div>
      </div>
      <div class="mt-8 flex w-full min-w-full items-center gap-x-3">
        <div :class="[hasAction ? 'basis-1/2' : 'basis-full']">
          <BButton
            class="w-full min-w-full max-w-full"
            :loading="isLoading"
            :text="actionButtonText"
            :type="primaryButtonMode.type"
            :color="primaryButtonMode.color"
            @click="handleAction"
          />
        </div>
        <div :class="[hasAction ? 'basis-1/2' : 'basis-0']">
          <BButton
            class="w-full min-w-full max-w-full"
            type="outline"
            color="primary"
            :text="t('cancel')"
            @click="closeModal"
          />
        </div>
      </div>
    </div>

    <!-- Card Modal Layout -->
    <div v-else class="w-dvw max-w-120">
      <div
        class="flex w-full items-center gap-x-2 border-b border-b-chat-outline-variant p-5"
      >
        <BIcon
          :icon="modalIcon"
          weight="fill"
          class="h-7 w-7"
          :class="[modalColorings?.iconColor]"
        />
        <div class="select-none text-label-lg text-chat-on-background">
          {{ modalTitle }}
        </div>
      </div>
      <div
        class="w-full select-none border-b border-b-chat-outline-variant p-5 text-wrap"
      >
        <p class="text-body-md text-chat-on-background/50">{{ modalText }}</p>
      </div>
      <div class="flex w-full items-center gap-x-3 p-5">
        <BButton
          :text="actionButtonText"
          :type="primaryButtonMode.type"
          :color="primaryButtonMode.color"
          :loading="isLoading"
          @click="handleAction"
        />
        <BButton
          color="secondary"
          type="outline"
          :text="t('permissions.notNow')"
          @click="closeModal"
        />
      </div>
    </div>
  </BPopup>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Popup } from "~/types/components/popup";
import type { ModalState } from "~/types/components/modal";
import useLocalI18n from "~/composables/useLocalI18n";
import { bModal } from "@i18n/locales";
const props = withDefaults(
  defineProps<{
    loading?: boolean;
    card?: boolean;
  }>(),
  {
    loading: false,
    card: false,
  },
);

const emit = defineEmits<{
  cancel: [];
  action: [];
  closed: [];
}>();

const { t } = useLocalI18n(bModal);
const popup = ref<Popup | null>(null);
const modalState = ref<ModalState>("success");
const modalText = ref("");
const modalTitle = ref("");
const hasAction = ref(false);
const actionButtonText = ref(t("confirm"));

const isLoading = computed(() => props.loading);

const modalIcon = computed(() => {
  switch (modalState.value) {
    case "error":
      return "PhWarningOctagon";
    case "warning":
      return "PhWarning";
    case "success":
      return "PhCheckCircle";
  }
});

const primaryButtonMode = computed(() => {
  if (hasAction.value && modalState.value !== "success") {
    return {
      type: "outline" as const,
      color: modalState.value,
    };
  }
  return {
    type: "fill" as const,
    color: "primary",
  };
});

// ⚠️ Pro-Tip: Dynamic Tailwind classes like `bg-${finalColor}/10` are NOT
// compiled by Tailwind's JIT engine and will fail at runtime unless those exact
// strings are explicitly safelisted in your `tailwind.config.js` file.
const modalColorings = computed(() => {
  const finalColor =
    modalState.value === "success" ? "secondary" : modalState.value;
  return {
    bgColor: `bg-${finalColor}/10`,
    iconColor: `fill-${finalColor}`,
  };
});

const closeModal = () => {
  popup.value?.close();
};

const openModal = (
  title: string,
  description: string,
  color: ModalState,
  action: boolean = false,
  actionText?: string,
) => {
  modalText.value = description;
  modalTitle.value = title;
  modalState.value = color;
  hasAction.value = action;
  actionButtonText.value = actionText || t("confirm");
  popup.value?.open();
};

const handleAction = () => {
  if (hasAction.value) {
    emit("action");
  } else {
    closeModal();
    emit("cancel");
  }
};

const handleOnClosed = () => {
  emit("closed");
};

defineExpose({
  openModal,
  closeModal,
});
</script>
