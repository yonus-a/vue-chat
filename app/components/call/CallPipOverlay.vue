<template>
    <div v-if="callStore.isActive && callStore.isPiP" ref="pipContainer" :style="clampedStyle"
        class="fixed  w-70 h-40 bg-black-600 rounded-2xl shadow-floating z-9999 overflow-hidden border border-white/10 flex flex-col items-center justify-center cursor-move touch-none"
        :class="[!isDragging ? 'transition-all duration-300 ease-out' : '']">

        <!-- Video Background Layer -->
        <video v-show="showVideo" ref="pipVideo" autoplay playsinline muted
            class="absolute inset-0 w-full h-full object-cover z-0"
            :class="{ 'scale-x-[-1]': !callStore.isSharingScreen && targetMember.id === chatStore.currentUserId }"></video>

        <!-- UI Content Layer -->
        <div v-if="!showVideo" class="relative pointer-events-none select-none z-10 w-full h-full flex flex-col items-center justify-center gap-y-4 bg-black/20">
            <!-- Avatar Fallback (Hidden if video is playing) -->
            <div  class="w-18 h-18">
                <ContactAvatar :showOnline="false" :contact="targetMember" />
            </div>

            <!-- Name Label (Always visible, styled for overlay) -->
            <div  class="text-center text-white select-none text-label-md drop-shadow-md">
                {{ targetMember?.name }} {{ targetMember?.lastName }}
            </div>
        </div>

        <!-- Action Layer -->
        <div class="p-2 w-full absolute h-full z-[10000] flex items-end pointer-events-none">
            <div @click="maximizeCall"
                class="bg-black/50 backdrop-blur-md rounded-full flex cursor-pointer items-center justify-center w-10 aspect-square pointer-events-auto hover:bg-black/80 transition-colors">
                <BIcon icon="PhResize" class="w-4 h-4 fill-white" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useDraggable, useWindowSize } from '@vueuse/core';
import ContactAvatar from '../chat/contact/ContactAvatar.vue';
import { useCallStore, useChatStore } from '~/nuxt-shims.js';

const chatStore = useChatStore();
const callStore = useCallStore();

const pipContainer = ref<HTMLElement | null>(null);
const pipVideo = ref<HTMLVideoElement | null>(null);
const supportsNativePiP = ref(false);

const { width: windowWidth, height: windowHeight } = useWindowSize();

// --- DRAG LOGIC WITH BOUNDARIES & CORNER SNAPPING ---
// Using the larger dimensions (sm breakpoints) to ensure it never clips off-screen
const PIP_WIDTH = 280;
const PIP_HEIGHT = 160;
const PADDING = 16;

// 1. Initialize Draggable
const { x, y, isDragging } = useDraggable(pipContainer, {
    initialValue: {
        x: typeof window !== 'undefined' ? window.innerWidth - PIP_WIDTH - PADDING : 0,
        y: typeof window !== 'undefined' ? window.innerHeight - PIP_HEIGHT - PADDING : 0
    },
});

// 2. Snap to Closest Corner on Release
watch(isDragging, (dragging) => {
    if (!dragging) {
        const maxX = windowWidth.value - PIP_WIDTH - PADDING;
        const maxY = windowHeight.value - PIP_HEIGHT - PADDING;

        // Find midpoints to determine which corner is closest
        const targetX = x.value < (windowWidth.value / 2) ? PADDING : maxX;
        const targetY = y.value < (windowHeight.value / 2) ? PADDING : maxY;

        x.value = targetX;
        y.value = targetY;
    }
});

// 3. Clamp coordinates during drag so it can't leave the viewport
const clampedStyle = computed(() => {
    const maxX = windowWidth.value - PIP_WIDTH - PADDING;
    const maxY = windowHeight.value - PIP_HEIGHT - PADDING;

    const safeX = Math.max(PADDING, Math.min(x.value, maxX));
    const safeY = Math.max(PADDING, Math.min(y.value, maxY));

    return {
        left: `${safeX}px`,
        top: `${safeY}px`
    };
});


// --- ACTIONS ---
const maximizeCall = async () => {
    // Close native PiP if it's active before maximizing
    if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
    }
    callStore.maximize();
};

// --- NATIVE OS PIP FALLBACK ---
const toggleNativePiP = async () => {
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (pipVideo.value) {
            await pipVideo.value.requestPictureInPicture();
        }
    } catch (error) {
        console.error("Native PiP failed:", error);
    }
};

onMounted(() => {
    supportsNativePiP.value = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document;
});

const targetMember = computed(() => {
    const others = callStore.callMembers.filter(m => m.id !== chatStore.currentUserId);
    return others.length > 0 ? others[0] : callStore.callMembers[0];
});
/**
 * Stream Priority Logic:
 * 1. Other end's video/screen stream
 * 2. My Screen Sharing stream
 * 3. My Local Camera stream (if enabled)
 */
const activeStream = computed(() => {
    const others = callStore.callMembers.filter(m => m.id !== chatStore.currentUserId);
    const otherStream = others.find(m => m.stream)?.stream;

    if (otherStream) return otherStream;
    return callStore.isSharingScreen ? callStore.screenStream : callStore.localStream;
});

const showVideo = computed(() => {
    // Show if others have a stream OR if I am sharing/streaming cam
    const otherStreaming = callStore.callMembers.some(m => m.id !== chatStore.currentUserId && m.stream);
    if (otherStreaming) return true;

    return callStore.isSharingScreen || !callStore.isCamDisabled;
});

// Update the updateStream function to use activeStream
const updateStream = () => {
    if (pipVideo.value && activeStream.value) {
        pipVideo.value.srcObject = activeStream.value;
    }
};

// Ensure the watch tracks the new computed activeStream
watch(() => [callStore.isPiP, activeStream.value, showVideo.value], () => {
    if (callStore.isPiP) {
        nextTick(() => updateStream());
    }
}, { immediate: true });

watch(() => [callStore.isPiP, callStore.localStream, callStore.isSharingScreen], () => {
    if (callStore.isPiP) {
        nextTick(() => updateStream());
    }
}, { immediate: true });
</script>
