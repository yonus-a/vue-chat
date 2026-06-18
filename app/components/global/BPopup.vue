<template>
    <ClientOnly>
        <Teleport to="body">
            <div id="popup-el" @mousedown.self="onBackdropMouseDown" @mouseup="onBackdropMouseUp"
                @touchstart.self="onBackdropTouchDown" @touchend="onBackdropTouchUp" :class="['fixed flex w-dvw h-dvh z-9999 transition-all duration-300 ease-in-out',
                    isMobile ? 'items-end' : 'items-center justify-center',
                    isOpen
                        ? 'backdrop-blur-sm bg-[#0A0A0A]/20 dark:bg-white/20 pointer-events-auto visible'
                        : 'pointer-events-none bg-[#0A0A0A]/0 dark:bg-white/0 backdrop-blur-none invisible']">

                <div ref="tabContent" :style="isMobile ? { transform: `translateY(${translateY}px)` } : {}" :class="[
                    'relative bg-surface  rounded-t-xl md:rounded-xl',
                    isMobile ? 'w-full' : 'max-w-[90vw] lg:max-w-max',
                    isDragging ? 'transition-none' : 'transition-all duration-300 ease-in-out',

                    // FIX 2: Grouped visibility and opacity logic
                    isOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none',

                    // FIX 3: Removed p-0 toggle to prevent layout jumping during close animation
                    !noPadding ? 'p-3' : 'p-0',

                    // Desktop Animation
                    !isMobile && isOpen ? 'scale-100' : (!isMobile ? 'scale-95' : ''),
                    // Mobile Animation
                    isMobile && isOpen ? 'translate-y-0' : (isMobile ? 'translate-y-full' : '')
                ]">
                    <div v-if="isMobile" @mousedown="startDrag" @touchstart="startDrag"
                        class="w-full flex justify-center pb-4 pt-2 cursor-grab active:cursor-grabbing">
                        <div class="h-1.5 w-12 bg-outline rounded-full"></div>
                    </div>
                    <div v-if="hasClose || title.trim().length > 0"
                        class="w-full pb-3 flex justify-start gap-x-3 items-center ">
                        <div v-if="hasClose" @click="close"
                            class="w-7 h-7 flex items-center justify-center cursor-pointer transition-colors">
                            <BIcon icon="PhX" class="w-4 h-4 fill-on-surface" />
                        </div>
                        <div v-if="title.trim().length > 0" class=" text-label-sm text-on-surface select-none">
                            {{ title }}
                        </div>
                    </div>

                    <div class="whitespace-nowrap text-wrap">
                        <slot></slot>
                    </div>
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script lang="ts">
import { ref, defineComponent, watch, computed, onUnmounted } from 'vue';
import type { Popup } from '~/types/components/popup';
import { useWindowSize } from '~/composables/useWindowSize'
export default defineComponent({
    name: 'ThePopup',
    emits: ['closed', 'close'],
    props: {
        noPadding: {
            type: Boolean,
            default: false,
        },
        hasClose: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: ''
        },
        autoClose: {
            type: Boolean,
            default: true,
        }
    },
    setup(props, { emit, expose }) {
        const isOpen = ref(false);
        const { width } = useWindowSize();
        const isMobile = computed(() => width.value < 768);

        const isDragging = ref(false);
        const startY = ref(0);
        const translateY = ref(0);
        const tabContent = ref<HTMLElement | null>(null);


        const open = () => {
            translateY.value = 0;
            isOpen.value = true;
        }

        const close = () => {
            if (!props.autoClose) return
            isOpen.value = false
            backdropDown.value = false
            emit('close')
            setTimeout(() => {
                if (!isOpen.value) {
                    emit('closed')
                    translateY.value = 0
                }
            }, 300)
        }

        const startDrag = (event: MouseEvent | TouchEvent) => {
            if (!isMobile.value) return;
            isDragging.value = true;
            startY.value = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchmove', onDrag);
            window.addEventListener('touchend', endDrag);
        };

        const onDrag = (event: MouseEvent | TouchEvent) => {
            if (!isDragging.value) return;
            const currentY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
            const deltaY = currentY - startY.value;
            // Only allow dragging down
            translateY.value = deltaY > 0 ? deltaY : 0;
        };

        const endDrag = () => {
            if (!isDragging.value) return;
            isDragging.value = false;

            // If dragged down enough, close it
            if (translateY.value > 100) {
                if (props.autoClose) {
                    close();
                }
            } else {
                translateY.value = 0;
            }

            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('touchmove', onDrag);
            window.removeEventListener('touchend', endDrag);
        };

        watch(isOpen, (val) => {
            if (typeof window === "undefined") return;
            const html = document.documentElement;
            if (val) {
                setTimeout(() => {
                    html.style.overflow = 'visible';
                }, 300)
            } else {
                html.style.overflow = 'hidden';
            }
        });

        // Cleanup global listeners if component is destroyed while dragging
        onUnmounted(() => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('touchmove', onDrag);
            window.removeEventListener('touchend', endDrag);
        });

        const backdropDown = ref(false)

        const onBackdropMouseDown = (event: MouseEvent) => {
            // Mark that the initial press was on the backdrop
            backdropDown.value = true
        }

        const onBackdropMouseUp = (event: MouseEvent) => {
            // Only close if both the press and the release were on the backdrop
            if (backdropDown.value && event.target === event.currentTarget) {
                close()
            }
            backdropDown.value = false
        }

        // Same for touch events
        const onBackdropTouchDown = (event: TouchEvent) => {
            backdropDown.value = true
        }

        const onBackdropTouchUp = (event: TouchEvent) => {
            if (backdropDown.value && event.target === event.currentTarget) {
                close()
            }
            backdropDown.value = false
        }

        expose({ open, close } as Popup);

        return {
            isOpen, isMobile, isDragging, translateY, tabContent,
            open, close, startDrag, onBackdropTouchUp, onBackdropTouchDown,
            onBackdropMouseUp, onBackdropMouseDown,
        }
    }
})
</script>

<style scoped>
#popup-el {
    position: fixed !important;
    top: 0px !important;
    left: 0px !important;
}

/* Visibility is the key. 
   Transitions work on visibility: it stays 'visible' until the timer hits 0.
*/
.visible {
    visibility: visible !important;
}

.invisible {
    visibility: hidden !important;
}
</style>