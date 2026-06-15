<template>
    <div ref="menuWrapper" id="menu" class="relative">
        <div @click.stop="toggleMenu" class="cursor-pointer relative" :class="[overlay ? 'z-10100' : '']">
            <slot name="trigger" :isOpen="isOpen" />
        </div>

        <div v-if="overlay" @click="closeMenu"
            class="w-dvw h-dvh fixed top-0 left-0 transition-all duration-300 ease-in-out z-10060"
            :class="[isOpen ? 'bg-on-background/20 backdrop-blur-sm pointer-events-auto' : 'backdrop-blur-none bg-on-background/0 pointer-events-none']">
        </div>

        <div ref="panelRef" @click="handleContentClick"
            class="absolute z-10110  bg-surface shadow-floating rounded-xl border border-outline-variant transition-all duration-200 ease-in-out"
            :style="panelPositionStyles"
            :class="[isOpen ? 'shadow-[0px_8px_24px_rgba(149,157,165,0.2)]' : 'shadow-none', !hasCustomContent && options && options.length > 0 ? 'w-50' : '']">

            <div v-if="hasCustomContent" key="menu-custom">
                <slot :isOpen="isOpen" :close="closeMenu" />
            </div>

            <div v-else-if="options && options.length > 0" key="menu-list"
                class="flex p-3 max-h-75 overflow-y-auto flex-col gap-y-1">
                <template v-for="(opt, idx) in options" :key="opt.key">
                    <div class="pointer-events-auto">
                        <div @click="handleSelect(opt.key)"
                            class="bg-surface-variant-2/0 hover:bg-surface-variant-2 transition-all duration-200 ease-in-out h-11 flex items-center cursor-pointer rounded-lg px-2 gap-x-2 w-full">
                            <BIcon v-if="opt.icon" :icon="opt.icon" class="w-5 h-5"
                                :class="[opt.color ? `fill-${opt.color}` : 'fill-on-surface/50']" />
                            <div class="select-none text-label-sm"
                                :class="[opt.color ? `text-${opt.color}` : 'text-on-surface/50']">
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

<script lang="ts">
import { defineComponent, ref, computed, nextTick, watch, type PropType, useSlots, Comment, Fragment, Text } from 'vue';
import { useClickOutside } from '#imports';

const globalActiveMenuId = ref<string | null>(null);
export interface Option {
    key: string;
    label: string;
    icon?: string;
    color?: string;
}

export default defineComponent({
    name: 'BMenu',
    props: {
        options: { type: Array as PropType<Option[]>, default: () => [] },
        overlay: { type: Boolean, default: false },
        autoClose: {
            type: Boolean, default: true,
        },
        align: {
            type: String as PropType<'top' | null>,
            default: null
        },
        ignoreGlobal: { type: Boolean, default: false },
    },
    emits: ['select', 'open', 'close'],
    setup(props, { emit, expose }) {
        const isOpen = ref(false);
        const menuWrapper = ref<HTMLElement | null>(null);
        const panelRef = ref<HTMLElement | null>(null);

        const slots = useSlots(); // Add this

        const hasCustomContent = computed(() => {
            return !props.options || props.options.length === 0;
        });



        // New reactive alignment states
        const verticalAlign = ref<'bottom' | 'top'>('bottom');
        const horizontalAlign = ref<'left' | 'right'>('left');

        const instanceId = useId();

        const calculateAlignment = async () => {
            await nextTick();
            if (!menuWrapper.value || !panelRef.value) return;

            const triggerRect = menuWrapper.value.getBoundingClientRect();
            const panelWidth = panelRef.value.offsetWidth;
            const panelHeight = panelRef.value.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 1. VERTICAL CHECK: If opening below hits bottom, and there's room above, go TOP.
            if (triggerRect.bottom + panelHeight > viewportHeight && triggerRect.top > panelHeight) {
                verticalAlign.value = 'top';
            } else {
                verticalAlign.value = 'bottom';
            }

            // 2. HORIZONTAL CHECK: If opening to the right hits edge, go RIGHT (meaning align right edges).
            if (triggerRect.left + panelWidth > viewportWidth) {
                horizontalAlign.value = 'right';
            } else {
                horizontalAlign.value = 'left';
            }
        };

        const toggleMenu = () => {
            if (!isOpen.value) {
                globalActiveMenuId.value = instanceId;
                emit('open')
                isOpen.value = true;
                calculateAlignment();
            } else {
                closeMenu();
            }
        };

        const panelPositionStyles = computed(() => {
            const isVisible = isOpen.value;

            const v = props.align === 'top' ? 'top' : verticalAlign.value;
            const h = horizontalAlign.value;

            const styles: any = {
                opacity: isVisible ? '1' : '0',
                pointerEvents: isVisible ? 'auto' : 'none',
                visibility: isVisible ? 'visible' : 'hidden',
                whiteSpace: 'nowrap',
                position: 'absolute'
            };

            // Vertical Positioning
            if (v === 'bottom') {
                styles.top = '100%';
                styles.bottom = 'auto';
                styles.transform = isVisible ? 'translateY(12px)' : 'translateY(0px)';
            } else {
                styles.bottom = '100%';
                styles.top = 'auto';
                styles.transform = isVisible ? 'translateY(-12px)' : 'translateY(0px)';
            }

            if (h === 'left') {
                styles.left = '0';
                styles.right = 'auto';
            } else {
                styles.right = '0';
                styles.left = 'auto';
            }

            return styles;
        });

        // Rest of your logic...
        const closeMenu = () => {
            isOpen.value = false;
            emit('close');
            if (globalActiveMenuId.value === instanceId) globalActiveMenuId.value = null;
        };
        watch(globalActiveMenuId, (newId) => {
            if (props.ignoreGlobal) return;

            if (newId !== instanceId && isOpen.value) {
                closeMenu();
            }
        });

        useClickOutside(menuWrapper, () => {
            if (props.autoClose) {
                closeMenu()
            }
        });
        const handleSelect = (key: string) => { emit('select', key); closeMenu(); };

        const handleContentClick = () => {
            if (hasCustomContent.value) return
        }

        expose({ open: () => { globalActiveMenuId.value = instanceId; isOpen.value = true; calculateAlignment(); }, close: closeMenu });

        return { isOpen, handleContentClick, menuWrapper, panelRef, toggleMenu, closeMenu, handleSelect, panelPositionStyles, hasCustomContent };
    }
});
</script>