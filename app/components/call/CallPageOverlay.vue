<template>
  <div v-show="isReady" class="flex h-full w-full flex-col bg-diamond-black">
    <!-- Header -->
    <div class="flex h-16 items-center justify-between px-4 sm:h-20">
      <div class="hidden text-label-lg text-white select-none md:block">
        {{ t("chat.call.title") }}
      </div>

      <div
        class="flex h-10 items-center gap-x-4 rounded-full bg-black-500 px-3 md:hidden"
      >
        <div v-for="option in mobileOptions" :key="option.key">
          <BIcon
            :icon="option.icon"
            class="h-6 w-6 fill-white"
            :class="[
              option.disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer opacity-100',
            ]"
            @click="handleOptions(option.key)"
          />
        </div>
      </div>

      <div class="flex items-center gap-x-4.5">
        <div
          class="flex h-6 items-center justify-center rounded-full bg-diamond-error px-2 text-white select-none"
        >
          <div class="text-body-sm">{{ callTimeDisplay }}</div>
        </div>
        <BIcon
          icon="PhArrowLeft"
          class="h-5 w-5 cursor-pointer fill-white"
          @click="goBack"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="w-full flex-1 p-3 sm:p-6">
      <div class="relative h-full w-full min-h-0">
        <TransitionGroup name="layout" tag="div" :class="wrapperClasses">
          <CallMemberDisplay
            v-for="(member, index) in callMembers.slice(0, 6)"
            :key="member.id"
            :contact="member"
            :is-full-screen="fullScreenId === member.id"
            :class="getMemberClass(member, index)"
            @toggle-fullscreen="toggleFullScreen(member.id)"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- Footer Controls -->
    <div
      class="flex h-21 w-full items-center justify-center gap-x-1.5 border-t border-t-[#2C2C2E] bg-black-600 sm:gap-x-3"
    >
      <CallBoard>
        <template #trigger="{ isOpen }">
          <div
            class="flex aspect-square w-9 items-center justify-center rounded-full transition-all duration-200 sm:w-12"
            :class="[isOpen ? 'bg-white' : 'bg-black-500']"
          >
            <BIcon
              :icon="isOpen ? 'PhX' : 'PhPalette'"
              class="h-4 w-4 sm:h-6 sm:w-6"
              :class="[isOpen ? 'fill-black-500' : 'fill-white']"
            />
          </div>
        </template>
      </CallBoard>

      <MedicSelector mode="medic">
        <template #trigger="{ isOpen }">
          <div
            class="flex aspect-square w-9 items-center justify-center rounded-full transition-all duration-200 sm:w-12"
            :class="[isOpen ? 'bg-white' : 'bg-black-500']"
          >
            <BIcon
              :icon="isOpen ? 'PhX' : 'PhUserPlus'"
              class="h-4 w-4 sm:h-6 sm:w-6"
              :class="[isOpen ? 'fill-black-500' : 'fill-white']"
            />
          </div>
        </template>
      </MedicSelector>

      <div
        v-for="option in optionButtons"
        :key="option.key"
        class="flex aspect-square w-9 items-center justify-center rounded-full transition-all duration-200 ease-in-out sm:w-12"
        :class="[
          option.isActive
            ? 'cursor-pointer bg-white'
            : option.hasErrors
              ? 'cursor-not-allowed bg-error-900'
              : 'cursor-pointer bg-black-500',
        ]"
        @click="handleOptions(option.key)"
      >
        <BIcon
          :icon="option.icon"
          class="h-4 w-4 sm:h-6 sm:w-6"
          :class="[
            option.isActive
              ? 'fill-black-500'
              : option.hasErrors
                ? 'fill-error-200'
                : 'fill-white',
          ]"
        />
      </div>

      <div
        class="flex aspect-square w-12 cursor-pointer items-center justify-center rounded-full bg-diamond-error sm:w-15"
        @click="handleOptions('leave-call')"
      >
        <BIcon icon="PhPhoneX" class="h-5 w-5 fill-white sm:h-7 sm:w-7" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeMount, onMounted } from "vue";
import type { Contact } from "~/types/chat";
import { formatDuration } from "~/utils/format";
import CallMemberDisplay from "./CallMemberDisplay.vue";
import CallBoard from "./CallBoard.vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "~/composables/useAppToast.js";
import { useCallStore } from "~/stores/callStore.js";
import { useAppPermissions } from "~/composables/useAppPermissions.js";
import { useDevice } from "~/composables/useDevice.js";

defineOptions({
  name: "CallPageOverlay",
});

interface CallOption {
  icon: string;
  key: string;
  isActive?: boolean;
  hasErrors?: boolean;
  disabled?: boolean;
}

// Note: `contacts` prop is retained to prevent breaking parent component APIs,
// though the component actually pulls state directly from `useCallStore()`.
defineProps<{
  contacts?: Contact[];
}>();

const { t } = useI18n();
const { openToast } = useAppToast();
const callStore = useCallStore();
const { width } = useWindowSize();
const { requestWithPopup, checkMediaStatus } = useAppPermissions();
const { hardware } = useDevice();

const isReady = ref(false);
const isFlashOn = ref(false);
const hasMultipleCameras = ref(false);
const supportsTorch = ref(false);
const fullScreenId = ref<string | null>(null);

const isMobile = computed(() => width.value < 768);
const callTimeDisplay = computed(() => formatDuration(callStore.elapsedTime));
const callMembers = computed(() => callStore.callMembers);
const flashIcon = computed(() =>
  isFlashOn.value ? "PhLightningSlash" : "PhLightning",
);

const mobileOptions = computed<CallOption[]>(() => [
  {
    icon: "PhArrowsClockwise",
    key: "flip-camera",
    disabled: !hasMultipleCameras.value,
  },
  {
    icon: flashIcon.value,
    key: "toggle-flash",
    disabled: !supportsTorch.value,
  },
]);

const optionButtons = computed<CallOption[]>(() => [
  {
    icon: "PhMonitorArrowUp",
    key: "share-screen",
    isActive: callStore.isSharingScreen,
  },
  {
    icon: callStore.isSoundMuted ? "PhSpeakerSlash" : "PhSpeakerHigh",
    key: "toggle-sound",
  },
  {
    icon: callStore.isMicMuted ? "PhMicrophoneSlash" : "PhMicrophone",
    key: "toggle-mic",
    hasErrors: !hardware.hasMicrophone,
  },
  {
    icon: !callStore.isCamDisabled ? "PhVideoCameraSlash" : "PhVideoCamera",
    key: "toggle-video",
    hasErrors: !hardware.hasCamera,
  },
]);

const wrapperClasses = computed(() => {
  if (!fullScreenId.value) {
    const count = callMembers.value.length;
    const gap = isMobile.value ? "gap-3" : "gap-4";
    let gridLayout = "grid-cols-2";

    if (count === 1) gridLayout = "grid-cols-1 grid-rows-1";
    else if (count === 2) gridLayout = "grid-cols-1 grid-rows-2";
    else if (count === 3) gridLayout = "grid-cols-1 grid-rows-3";
    else if (count === 4) gridLayout = "grid-cols-2 grid-rows-2";
    else if (count === 6) gridLayout = "grid-cols-2 grid-rows-3";

    return `relative grid h-full w-full p-4 ${gridLayout} ${gap}`;
  }

  // 'block' is used instead of grid to prevent CSS grid from interfering with absolute positioning
  return isMobile.value
    ? "relative block h-full w-full"
    : "relative flex h-full w-full flex-row flex-wrap content-start overflow-hidden gap-4 p-4";
});

const getMemberClass = (member: Contact, index: number) => {
  const base = "origin-center transition-all duration-300 ease-in-out";

  if (!fullScreenId.value) {
    if (callMembers.value.length === 5 && index === 0)
      return `${base} col-span-2`;
    return base;
  }

  if (isMobile.value) {
    if (member.id === fullScreenId.value) {
      return `${base} !absolute bottom-0 left-0 right-0 top-0 z-0`;
    }
    if (index === 0) {
      return `${base} !absolute bottom-8 right-6 z-20 !h-[150px] !w-[110px] rounded-2xl shadow-2xl`;
    }
    return `${base} !absolute left-1/2 top-1/2 z-[-1] scale-0 opacity-0 pointer-events-none`;
  } else {
    if (member.id === fullScreenId.value) {
      return `${base} order-1 !h-[calc(100%-11rem)] !w-full`;
    }
    return `${base} order-2 !h-36 min-w-[140px] max-w-[200px] flex-1`;
  }
};

const toggleFullScreen = (id: string) => {
  fullScreenId.value = fullScreenId.value === id ? null : id;
};

const goBack = () => {
  callStore.minimize();
};

const getNativeDeviceRequirements = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    hasMultipleCameras.value = videoInputs.length > 1;
  } catch (err) {
    console.error("Failed to enumerate devices for camera count", err);
  }
};

const initPermissions = async () => {
  if (!callStore.chatContact) return;
  const service = callStore.chatContact.serviceType;
  const isVideo = service === "video-call";

  await callStore.syncMediaSettings(service);

  const status = await checkMediaStatus();
  const needsMic = status.mic !== "granted";
  const needsCam = isVideo && status.cam !== "granted";

  if (needsMic || needsCam) {
    const state = isVideo ? "permission" : "mic-permission";
    const granted = await requestWithPopup(state);

    if (!granted) {
      callStore.isActive = false;
      return;
    }
  }

  await callStore.initCall(isVideo);
};

const handleOptions = async (key: string) => {
  const option = mobileOptions.value.find((o) => o.key === key);
  if (option?.disabled) {
    openToast(t("chat.call.deviceDoesntSupport"), "error");
    return;
  }

  const button = optionButtons.value.find((btn) => btn.key === key);
  if (button?.hasErrors) return;

  switch (key) {
    case "minimize-call":
      callStore.minimize();
      break;
    case "share-screen":
      if (callStore.isSharingScreen) {
        callStore.stopScreenShare();
        return;
      }
      if (isMobile.value) {
        await requestWithPopup("screen-share-error");
        return;
      }
      await requestWithPopup("screen-share-permission");
      break;
    case "toggle-sound":
      callStore.toggleSound();
      break;
    case "toggle-mic":
      callStore.toggleMic();
      break;
    case "toggle-video":
      await callStore.toggleCam();
      break;
    case "leave-call":
      callStore.stopCall();
      break;
    case "flip-camera":
      if (isMobile.value) {
        await callStore.toggleCamera();
      }
      break;
    case "toggle-flash":
      if (isMobile.value && callStore.currentFacingMode === "environment") {
        await callStore.toggleFlash();
      }
      break;
  }
};

// --- Watchers ---
watch(
  () => callStore.chatContact,
  (newContact) => {
    if (newContact) {
      initPermissions();
    }
  },
);

watch(
  callMembers,
  (newMembers, oldMembers) => {
    const justStartedStreaming = newMembers.find((member, index) => {
      const wasStreaming = oldMembers?.[index]
        ? oldMembers[index].isCameraOn || oldMembers[index].isScreenSharing
        : false;
      const isStreaming = member.isCameraOn || member.isScreenSharing;
      return isStreaming && !wasStreaming;
    });

    if (justStartedStreaming) {
      fullScreenId.value = justStartedStreaming.id;
      return;
    }

    if (fullScreenId.value) {
      const currentFullScreenMember = newMembers.find(
        (m) => m.id === fullScreenId.value,
      );
      const isStillStreaming = currentFullScreenMember
        ? currentFullScreenMember.isCameraOn ||
          currentFullScreenMember.isScreenSharing
        : false;

      if (!isStillStreaming) {
        fullScreenId.value = null;
      }
    }
  },
  { deep: true },
);

// --- Lifecycle ---
onBeforeMount(() => {
  callStore.maximize();
  isReady.value = callStore.isActive;
});

onMounted(async () => {
  getNativeDeviceRequirements();
  if (callStore.chatContact) {
    await initPermissions();
  }
});
</script>
