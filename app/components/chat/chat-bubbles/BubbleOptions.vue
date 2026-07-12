<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useMessagesStore } from "~/stores/messageStores";
import type { Menu } from "~/types/components/menu";
import type { ExtendedMessage } from "~/types/chat";
import BMenu from "~/components/global/BMenu.vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  message: ExtendedMessage;
}>();

const { t } = useI18n();
const messagesStore = useMessagesStore();
const isOpen = ref(false);

const menuRef = ref<Menu | null>(null);
const position = ref({ x: 0, y: 0 });

const openMenu = (x: number, y: number) => {
  const adjustedX = Math.min(x, window.innerWidth - 250);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  position.value = { x: adjustedX, y: adjustedY };
  isOpen.value = true;
  messagesStore.isOptionMenuOpen = true;

  nextTick(() => {
    menuRef.value?.open();
  });
};

const closeMenu = () => {
  menuRef.value?.close();
  messagesStore.isOptionMenuOpen = false;
};

const onMenuClosed = () => {
  isOpen.value = false;
  messagesStore.isOptionMenuOpen = false;
};

defineExpose({ openMenu, closeMenu });

const showAsDeselect = computed(() => {
  return (
    messagesStore.isSelectMode &&
    messagesStore.selectedMessages.has(props.message.id)
  );
});
const options = computed(() => {
  const allOptions = [
    {
      icon: "PhArrowBendUpLeft",
      key: "reply",
      label: t("chat.messageOptions.reply"),
      canShow: props.message.isSent,
    },
    {
      icon: "PhPencilSimpleLine",
      key: "edit",
      label: t("chat.messageOptions.edit"),
      canShow: messagesStore.canEdit,
    },
    {
      icon: "PhCopy",
      key: "copy",
      label: t("chat.messageOptions.copy"),
      canShow: true,
    },
    {
      icon: showAsDeselect.value ? "PhXCircle" : "PhCheckCircle",
      key: "select_toggle",
      label: showAsDeselect.value
        ? t("chat.messageOptions.deselect")
        : t("chat.messageOptions.select"),
      canShow: true,
    },
    {
      icon: "PhTrash",
      key: "delete",
      label: t("chat.messageOptions.delete"),
      canShow: messagesStore.canDelete,
      color: "error",
    },
  ];
  return allOptions.filter((option) => option.canShow);
});

const handleOption = (key: string) => {
  const targetIds =
    messagesStore.isSelectMode &&
    messagesStore.selectedMessages.has(props.message.id)
      ? messagesStore.selectedArray.map((m) => m.id)
      : [props.message.id];

  closeMenu();

  setTimeout(() => {
    switch (key) {
      case "delete":
        messagesStore.triggerDelete(targetIds);
        break;
      case "select_toggle":
        if (!messagesStore.isSelectMode) {
          messagesStore.startSelectMode(props.message);
        } else {
          messagesStore.toggleSelection(props.message);
        }
        break;
      case "edit":
        messagesStore.triggerEdit(props.message);
        break;
      case "reply":
        if (!props.message.isSent) return;
        messagesStore.replyingTo = props.message;
        break;
      case "copy":
        messagesStore.copyMessageText();
        break;
    }
  }, 300);
};
</script>
<template>
  <Teleport to="body">
    <div
      :style="{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 99999,
        pointerEvents: 'none',
      }"
      dir="rtl"
    >
      <BMenu
        @select="handleOption"
        :options="options"
        ref="menuRef"
        @close="onMenuClosed"
      >
        <template #trigger>
          <div style="width: 1px; height: 1px"></div>
        </template>
      </BMenu>
    </div>
  </Teleport>
</template>
