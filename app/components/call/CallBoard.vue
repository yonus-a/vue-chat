<template>
    <div v-show="isMobile" class="contents" @click="handleMobileClick">
        <slot name="trigger" :isOpen="isPopupOpen" />
    </div>
    <BMenu ignore-global 
        :align="'top-right'" v-show="!isMobile" ref="menuRef">
        <template #trigger="{ isOpen }">
            <slot name="trigger" :isOpen="isOpen" />
        </template>

        <template #default="{ isOpen }">
            <div class="p-1">
                <CallPaintBoard :is-open="isOpen" @close="closeAll" />
            </div>
        </template>
    </BMenu>
    <BPopup no-padding ref="popupRef" @close="isPopupOpen = false">
        <!-- CHANGE: Render the Content component, not yourself -->
        <CallPaintBoard :is-open="isPopupOpen" @close="closeAll" />
    </BPopup>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useWindowSize } from '~/nuxt-shims';
// CHANGE: Import the Content component specifically
import type { Menu } from '~/types/components/menu';
import type { Popup } from '~/types/components/popup';
import CallPaintBoard from './paint-board/CallPaintBoard.vue';

export default defineComponent({
    name: 'CallBoard', // CHANGE: Rename to prevent recursion
    components: { CallPaintBoard }, // CHANGE: Register the Content component
    emits: ['close'], // FIX: Declare emits to resolve the Vue warning
    setup(props, { emit }) {
        const popupRef = ref<Popup | null>(null);
        const menuRef = ref<Menu | null>(null);
        const isPopupOpen = ref(false);
        const isMenuOpen = ref(false)
        const { width } = useWindowSize();
        const isMobile = computed(() => width.value < 768);

        const handleMenuState = (open: boolean) => {
            isMenuOpen.value = open;
        }

        const handleMobileClick = () => {
            isPopupOpen.value = true;
            popupRef.value?.open();
        };

        const closeAll = () => {
            isPopupOpen.value = false;
            popupRef.value?.close();
            menuRef.value?.close();
            emit('close'); // Forward the close event if needed
        };

        return { isMobile, isPopupOpen, isMenuOpen, handleMenuState, handleMobileClick, closeAll, popupRef, menuRef };
    }
});
</script>