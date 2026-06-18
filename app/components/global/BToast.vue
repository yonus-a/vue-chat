<template>
    <Teleport to="body">
        <ClientOnly>
            <div class="w-full bg-transparent pointer-events-none md:max-w-203 max-w-dvw p-5 fixed bottom-0 z-10000 ">
                <!-- 
                OUTER DIV: Preserves your exact original positioning and mount animation.
                This prevents the drag logic from breaking Tailwind's coordinate system.
            -->
                <div class="transition-all duration-300 ease-in-out pointer-events-auto"
                    :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-15 opacity-0'">
                    <!-- 
                    INNER DIV: Handles the drag transform, background color, and touch events.
                -->
                    <div class="py-3 px-4 rounded-xl flex items-center pointer-events-auto gap-x-2 touch-none select-none cursor-grab active:cursor-grabbing md:cursor-default md:active:cursor-default"
                        :class="[
                            backgroundColor,
                            isDragging ? 'transition-none' : 'transition-transform duration-300 ease-in-out'
                        ]" :style="{ transform: `translateY(${dragY}px)` }" @pointerdown="onPointerDown"
                        @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
                        <BIcon :icon="toastIcon" class="w-5 h-5 fill-white shrink-0" />
                        <div class="flex-1 select-none text-white text-label-md">{{ toastMessage }}</div>
                        <BIcon icon="PhX" @click="closeToast"
                            class="cursor-pointer w-5 h-5 fill-white shrink-0 hover:opacity-70 transition-opacity" />
                    </div>
                </div>
            </div>
        </ClientOnly>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWindowSize } from '~/nuxt-shims';
const isOpen = ref(false);
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('info');
const toastMessage = ref('');
let timer: any = null;
const currentDuration = ref(4000);
const { width } = useWindowSize()
// Drag State
const dragY = ref(0);
const isDragging = ref(false);
let startY = 0;
const threshold = 50; // Drag down 50px to close
const isMobile = computed(() => width.value < 768)
const onPointerDown = (e: PointerEvent) => {
    if (!isMobile.value) return
    isDragging.value = true;
    startY = e.clientY;

    // Pause auto-close timer while holding
    if (timer) clearTimeout(timer);

    // Capture pointer so fast swipes don't break tracking
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
};


const onPointerMove = (e: PointerEvent) => {
    if (!isMobile.value) return
    if (!isDragging.value) return;

    const deltaY = e.clientY - startY;
    // Only allow dragging downwards to dismiss
    if (deltaY > 0) {
        dragY.value = deltaY;
    }
};

const onPointerUp = () => {
    if (!isMobile.value) return
    if (!isDragging.value) return;
    isDragging.value = false;

    // Check if user dragged past the closing threshold
    if (dragY.value > threshold) {
        closeToast();
    } else {
        // Snap back to original position
        dragY.value = 0;

        // Resume the auto-close timer
        timer = setTimeout(() => {
            closeToast();
        }, currentDuration.value);
    }
};

const openToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 4000
) => {
    if (timer) clearTimeout(timer);

    currentDuration.value = duration;
    dragY.value = 0;
    isDragging.value = false;

    toastType.value = type;
    toastMessage.value = message;
    isOpen.value = true;

    timer = setTimeout(() => {
        closeToast();
    }, duration);
};

const closeToast = () => {
    isOpen.value = false;
    if (timer) clearTimeout(timer);
    setTimeout(() => {
        dragY.value = 0;
    }, 300);
};

const backgroundColor = computed(() => {
    switch (toastType.value) {
        case 'success': return 'bg-primary';
        case 'error': return 'bg-error';
        case 'warning': return 'bg-orange-500';
        case 'info': return 'bg-on-surface';
        default: return 'bg-on-surface';
    }
});

const toastIcon = computed(() => {
    switch (toastType.value) {
        case 'success': return 'PhCheckCircle';
        case 'error': return 'PhWarningOctagon';
        case 'warning': return 'PhWarning';
        case 'info': return 'PhInfo';
        default: return 'PhInfo';
    }
});

// Expose methods for the composable
defineExpose({
    openToast,
    closeToast
});
</script>