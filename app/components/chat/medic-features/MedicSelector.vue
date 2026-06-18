<template>
    <!-- MOBILE FLOW -->
    <div v-if="isMobile && options.length === 0" class="contents" @click="handleMobileClick">
        <!-- Change to named slot -->
        <slot name="trigger" />
    </div>
    <!-- DESKTOP FLOW -->
    <BMenu @open="handleMenuState(true)" v-else ref="menuRef" :auto-close :options="displayOptions"
        @select="handleSelect" @close="resetMenuMode">
        <template #trigger>
            <!-- Change to named slot -->
            <slot name="trigger" />
        </template>

        <!-- Only render custom content if in medic mode -->
        <div class="p-1" v-if="internalMenuMode === 'medic'">
            <MedicSelectorContent @close="closeAll" />
        </div>
    </BMenu>
    <BPopup ref="popupRef">
        <MedicSelectorContent @close="closeAll" />
    </BPopup>
</template>

<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, computed, ref, type PropType } from 'vue';
import { useWindowSize, useI18n } from '~/nuxt-shims';
import type { Popup } from '~/types/components/popup';
import type { Menu } from '~/types/components/menu';
import type { MenuOption } from '~/types/components/menu-options';
import MedicSelectorContent from './MedicSelectorContent.vue';

export default defineComponent({
    name: 'MedicSelector',
    props: {
        mode: {
            type: String as PropType<'medic' | 'options'>,
            default: 'options' // Default to options to allow for transition
        },
        options: { type: Array as PropType<MenuOption[]>, default: () => [] }
    },
    components: { MedicSelectorContent },
    emits: ['select'],
    setup(props, { emit }) {
        const { t } = useI18n();
        const popupRef = ref<Popup | null>(null);
        const menuRef = ref<Menu | null>(null);
        const isMenuOpenned = ref(false)
        const { width } = useWindowSize();
        const isTransitioning = ref(false);

        // FIX: Initialize based on props/options as you requested
        const internalMenuMode = ref<'options' | 'medic'>(
            (props.mode === 'medic' || props.options.length === 0) ? 'medic' : 'options'
        );

        const isMobile = computed(() => width.value < 768);

        const handleMenuState = (isOpen: boolean) => {
            isMenuOpenned.value = isOpen;
        }

        const handleSelect = (key: string) => {
            if (key === 'add-user') {
                if (!isMobile.value) {
                    isTransitioning.value = true;
                    menuRef.value?.close();
                    setTimeout(() => {
                        internalMenuMode.value = 'medic';
                        setTimeout(() => {
                            menuRef.value?.open();
                            isTransitioning.value = false;
                        }, 200);
                    }, 200);
                } else {
                    handleMobileClick()
                }
            } else {
                emit('select', key);
                closeAll();
            }
        };

        const resetMenuMode = () => {
            if (isTransitioning.value) return;
            setTimeout(() => {
                // Reset to initial mode
                handleMenuState(false)
                internalMenuMode.value = (props.mode === 'medic' || props.options.length === 0) ? 'medic' : 'options';
            }, 300);
        };

        const closeAll = () => {
            popupRef.value?.close();
            menuRef.value?.close();
        };

        const displayOptions = computed(() => {
            return internalMenuMode.value === 'medic' ? [] : props.options;
        });

        const handleMobileClick = () => {
            popupRef.value?.open();
        };

        return {
            isMobile, handleMobileClick, displayOptions, popupRef, menuRef,
            closeAll, t, internalMenuMode, handleSelect, resetMenuMode,
            handleMenuState,
            isMenuOpenned,
        };
    }
});
</script>