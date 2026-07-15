<template>
  <div
    v-if="callStore.isActive && callStore.isPiP"
    ref="pipContainer"
    :style="clampedStyle"
    class="fixed z-9999 flex h-40 w-70 cursor-move flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black-600 shadow-floating touch-none"
    :class="[!isDragging ? 'transition-all duration-300 ease-out' : '']"
  >
    <!-- Video Background Layer -->
    <video
      v-show="showVideo"
      ref="pipVideo"
      autoplay
      playsinline
      muted
      class="absolute inset-0 z-0 h-full w-full object-cover"
      :class="{
        'scale-x-[-1]':
          !callStore.isSharingScreen &&
          targetMember.id === chatStore.currentUserId,
      }"
    />

    <!-- UI Content Layer -->
    <div
      v-if="!showVideo"
      class="relative z-10 flex h-full w-full flex-col items-center justify-center gap-y-4 bg-black/20 select-none pointer-events-none"
    >
      <!-- Avatar Fallback -->
      <div class="h-18 w-18">
        <ContactAvatar :contact="targetMember" :show-online="false" />
      </div>

      <!-- Name Label -->
      <div
        class="select-none text-center text-label-md text-white drop-shadow-md"
      >
        {{ targetMember?.name }} {{ targetMember?.lastName }}
      </div>
    </div>

    <!-- Action Layer -->
    <div
      class="pointer-events-none absolute z-10000 flex h-full w-full items-end p-2"
    >
      <div
        class="pointer-events-auto flex aspect-square w-10 cursor-pointer items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-black/80"
        @click="maximizeCall"
      >
        <BIcon icon="PhResize" class="h-4 w-4 fill-white" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import ContactAvatar from "../chat/contact/ContactAvatar.vue";
import { useChatStore } from "~/stores/chatStore.js";
import { useCallStore } from "~/stores/callStore.js";

const chatStore = useChatStore();
const callStore = useCallStore();

const pipContainer = ref<HTMLElement | null>(null);
const pipVideo = ref<HTMLVideoElement | null>(null);

const { width: windowWidth, height: windowHeight } = useWindowSize();

// --- DRAG LOGIC WITH BOUNDARIES & CORNER SNAPPING ---
const PIP_WIDTH = 280;
const PIP_HEIGHT = 160;
const PADDING = 16;

// 1. Initialize Draggable
const { x, y, isDragging } = useDraggable(pipContainer, {
  initialValue: {
    x:
      typeof window !== "undefined"
        ? window.innerWidth - PIP_WIDTH - PADDING
        : 0,
    y:
      typeof window !== "undefined"
        ? window.innerHeight - PIP_HEIGHT - PADDING
        : 0,
  },
});

// 2. Snap to Closest Corner on Release
watch(isDragging, (dragging) => {
  if (!dragging) {
    const maxX = windowWidth.value - PIP_WIDTH - PADDING;
    const maxY = windowHeight.value - PIP_HEIGHT - PADDING;

    const targetX = x.value < windowWidth.value / 2 ? PADDING : maxX;
    const targetY = y.value < windowHeight.value / 2 ? PADDING : maxY;

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
    top: `${safeY}px`,
  };
});

// --- TARGET MEMBER & STREAM LOGIC ---
const targetMember = computed(() => {
  const others = callStore.callMembers.filter(
    (m) => m.id !== chatStore.currentUserId,
  );
  return others.length > 0 ? others[0] : callStore.callMembers[0];
});

/**
 * Stream Priority Logic:
 * 1. Other end's video/screen stream
 * 2. My Screen Sharing stream
 * 3. My Local Camera stream (if enabled)
 */
const activeStream = computed(() => {
  const others = callStore.callMembers.filter(
    (m) => m.id !== chatStore.currentUserId,
  );
  const otherStream = others.find((m) => m.stream)?.stream;

  if (otherStream) return otherStream;
  return callStore.isSharingScreen
    ? callStore.screenStream
    : callStore.localStream;
});

const showVideo = computed(() => {
  const otherStreaming = callStore.callMembers.some(
    (m) => m.id !== chatStore.currentUserId && m.stream,
  );
  if (otherStreaming) return true;

  return callStore.isSharingScreen || !callStore.isCamDisabled;
});

// --- ACTIONS ---
const maximizeCall = async () => {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  }
  callStore.maximize();
};

const updateStream = () => {
  if (pipVideo.value && activeStream.value) {
    pipVideo.value.srcObject = activeStream.value;
  }
};

// Consolidated watcher for stream updates
watch(
  () => [callStore.isPiP, activeStream.value, showVideo.value],
  () => {
    if (callStore.isPiP) {
      nextTick(updateStream);
    }
  },
  { immediate: true },
);
</script>
