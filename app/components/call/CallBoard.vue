<template>
  <div v-show="isMobile" class="contents" @click="handleMobileClick">
    <slot name="trigger" :isOpen="isPopupOpen" />
  </div>

  <BMenu v-show="!isMobile" ref="menuRef" ignore-global align="top-right">
    <template #trigger="{ isOpen }">
      <slot name="trigger" :isOpen="isOpen" />
    </template>

    <template #default="{ isOpen }">
      <div class="p-1">
        <CallPaintBoard :is-open="isOpen" @close="closeAll" />
      </div>
    </template>
  </BMenu>

  <BPopup ref="popupRef" no-padding @close="isPopupOpen = false">
    <CallPaintBoard :is-open="isPopupOpen" @close="closeAll" />
  </BPopup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Menu } from "~/types/components/menu";
import type { Popup } from "~/types/components/popup";
import CallPaintBoard from "./paint-board/CallPaintBoard.vue";

const emit = defineEmits<{
  close: [];
}>();

const popupRef = ref<Popup | null>(null);
const menuRef = ref<Menu | null>(null);
const isPopupOpen = ref(false);
const isMenuOpen = ref(false);

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const handleMenuState = (open: boolean) => {
  isMenuOpen.value = open;
};

const handleMobileClick = () => {
  isPopupOpen.value = true;
  popupRef.value?.open();
};

const closeAll = () => {
  isPopupOpen.value = false;
  popupRef.value?.close();
  menuRef.value?.close();
  emit("close");
};
</script>
