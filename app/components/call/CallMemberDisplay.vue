<template>
  <div
    class="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 bg-black-600 p-2 transition-all duration-200 ease-in-out"
    :class="[
      contact.isSpeaking ? 'border-chat-primary' : 'border-chat-primary/0',
    ]"
  >
    <!-- Video Background Feature -->
    <video
      v-show="hasActiveStream"
      ref="videoRef"
      autoplay
      playsinline
      :muted="isMine"
      class="absolute inset-0 z-0 h-full w-full object-cover"
    />

    <!-- Controls Overlay -->
    <div
      class="absolute left-0 top-0 z-10 flex h-full w-full flex-col justify-between p-2"
    >
      <div class="flex w-full items-center justify-end">
        <div
          :class="[contact.isSpeaking ? 'opacity-100' : 'opacity-0']"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black-500 transition-all duration-200 ease-in-out"
        >
          <BIcon icon="PhWaveform" class="h-4 w-4 fill-white" />
        </div>
      </div>
      <div class="flex w-full items-center">
        <div
          @click="toggleFullScreen"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black-500"
        >
          <BIcon
            :icon="!isFullScreen ? 'PhFrameCorners' : 'PhCornersIn'"
            class="h-4 w-4 fill-white"
          />
        </div>
      </div>
    </div>

    <!-- Avatar Fallback Logic -->
    <div v-if="!hasActiveStream" class="h-18 w-18">
      <ContactAvatar :contact="contact" :show-online="false" />
    </div>

    <!-- Name Label (Z-index ensures visibility over video) -->
    <div
      :class="{ 'absolute bottom-4 left-4 z-20': hasActiveStream }"
      class="select-none text-white text-label-md sm:text-title-lg"
    >
      {{ contact.name }} {{ contact.lastName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import ContactAvatar from "../chat/contact/ContactAvatar.vue";
import { computed, ref, watch, onMounted } from "vue";
import { useChatStore } from "~/stores/chatStore.js";
import type { CallMember } from "~/types";

const props = withDefaults(
  defineProps<{
    contact: CallMember;
    isFullScreen?: boolean;
  }>(),
  {
    isFullScreen: false,
  },
);

const emit = defineEmits<{
  "toggle-fullscreen": [];
}>();

const chatStore = useChatStore();
const videoRef = ref<HTMLVideoElement | null>(null);

const isMine = computed(() => chatStore.currentUserId === props.contact.id);

// Detect if camera is on or screen is being shared
const hasActiveStream = computed(() => {
  return (
    props.contact.stream !== null &&
    (props.contact.isCameraOn || props.contact.isScreenSharing)
  );
});

const toggleFullScreen = () => {
  emit("toggle-fullscreen");
};

// Manual binding for the MediaStream object
const updateStream = () => {
  if (videoRef.value) {
    videoRef.value.srcObject = props.contact.stream;
  }
};

// Handle stream changes (e.g., swapping camera to screen share)
watch(() => props.contact.stream, updateStream);
onMounted(updateStream);
</script>
