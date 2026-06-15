import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CallMember } from "~/types/call";
import { useChatStore, useAppPermissions } from "#imports";
import { useRouter } from "vue-router";

export const useCallStore = defineStore("call", () => {
  const chatStore = useChatStore();
  const router = useRouter();
  const { checkMediaStatus, requestWithPopup } = useAppPermissions();

  //props for the painting board
  const boardPages = ref<{ data: any[]; history: any[]; redo: any[] }[]>([
    { data: [], history: [], redo: [] },
  ]);
  const boardSelectedPage = ref(0);
  const boardSelectedColor = ref("#2C2727");
  const boardBrushSize = ref(3);
  const boardHistory = ref<any[]>([]);
  const boardRedoHistory = ref<any[]>([]);

  const isPiP = ref(false);

  const isActive = ref(false);
  const localStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null>(null);

  const currentFacingMode = ref<"user" | "environment">("user");
  const isFlashOn = ref(false);

  const isSharingScreen = ref(false);
  const screenStream = ref<MediaStream | null>(null);

  const chatContact = ref<CallMember | null>();

  // Timer State
  const startTime = ref<number | null>(null);
  const elapsedTime = ref(0);
  const timerInterval = ref<NodeJS.Timeout | null>(null);

  //settings :
  const isMicMuted = ref(false);
  const isCamDisabled = ref(false);
  const isSoundMuted = ref(false);

  const syncMediaSettings = async (serviceType: string) => {
    const status = await checkMediaStatus();

    // Set Mic: Mute if not granted
    isMicMuted.value = status.mic !== "granted";

    // Set Cam: Disable if service is voice-only OR permission not granted
    if (serviceType === "voice-call") {
      isCamDisabled.value = true;
    } else {
      isCamDisabled.value = status.cam !== "granted";
    }
  };

  const toggleMic = async () => {
    if (isMicMuted.value) {
      // 1. Check if we already have permission
      const status = await checkMediaStatus();
      if (status.mic === "granted") {
        isMicMuted.value = false;
        localStream.value?.getAudioTracks().forEach((t) => (t.enabled = true));
        return; // Skip the popup
      }

      // 2. Only show popup if not granted
      const granted = await requestWithPopup("mic-permission");
      if (granted) {
        isMicMuted.value = false;
        localStream.value?.getAudioTracks().forEach((t) => (t.enabled = true));
      }
    } else {
      isMicMuted.value = true;
      localStream.value?.getAudioTracks().forEach((t) => (t.enabled = false));
    }
  };

  const toggleCam = async () => {
    if (isCamDisabled.value) {
      // 1. Check if we already have permission
      const status = await checkMediaStatus();
      if (status.cam === "granted") {
        isCamDisabled.value = false;
        localStream.value?.getVideoTracks().forEach((t) => (t.enabled = true));
        return; // Skip the popup
      }

      // 2. Only show popup if not granted
      const granted = await requestWithPopup("cam-permission");
      if (granted) {
        isCamDisabled.value = false;
        localStream.value?.getVideoTracks().forEach((t) => (t.enabled = true));
      }
    } else {
      isCamDisabled.value = true;
      localStream.value?.getVideoTracks().forEach((t) => (t.enabled = false));
    }
  };

  /**
   * Toggles the remote audio tracks (muting the call sound for the user).
   */
  const toggleSound = () => {
    if (remoteStream.value) {
      const remoteAudio = remoteStream.value.getAudioTracks();
      isSoundMuted.value = !isSoundMuted.value;
      remoteAudio.forEach((track) => (track.enabled = !isSoundMuted.value));
    }
  };

  /**
   * Enables/Disables the local video track.
   * If enabling, it re-verifies camera permissions.
   */

  // Members Ref (the other people in the call)
  // useCallStore.ts
  const participants = ref<CallMember[]>(
    Array.from({ length: 4 }, (_, i) => ({
      id: i + 2,
      name: "امیر",
      lastName: "سعیدی",
      isOnline: true,
      lastSeen: new Date(),
      imageUrl: `https://i.pravatar.cc/150?u=${i + 2}`,
      isActive: false,
      unreadCount: 2,
      serviceType: "chat",
      birthDate: new Date(),
      // CallMember Extensions
      stream: null,
      isScreenSharing: false,
      isCameraOn: false,
      isSpeaking: false,
      isMuted: false,
    })),
  );
  const callMembers = computed<CallMember[]>(() => {
    const currentUser: CallMember = {
      id: chatStore.currentUserId,
      name: "امیر",
      lastName: "صفری",
      imageUrl: "",
      phoneNumber: "09133877121",
      nationalCode: "1234567890",
      isOnline: true,
      lastSeen: new Date(),
      isActive: false,
      unreadCount: 0,
      serviceType: "chat",
      userType: [chatStore.chosenRole],
      birthDate: chatStore.currentUserBirthDate || new Date(),

      // Reactive mapping from Store State
      stream: isSharingScreen.value ? screenStream.value : localStream.value,
      isScreenSharing: isSharingScreen.value,
      isCameraOn: !isCamDisabled.value,
      isSpeaking: !isMicMuted.value && isActive.value, // Simple mock for speaking state
      isMuted: isMicMuted.value,
    };

    return [currentUser, ...participants.value];
  });

  const initCall = async (withVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true,
      });
      localStream.value = stream;
      isActive.value = true;

      // Apply initial muted/disabled states to the tracks
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMicMuted.value));
      stream
        .getVideoTracks()
        .forEach((t) => (t.enabled = !isCamDisabled.value));

      //
    } catch (err) {
      console.error("Init call failed", err);
    }
  };

  const startTimer = () => {
    startTime.value = Date.now();
    timerInterval.value = setInterval(() => {
      elapsedTime.value = Math.floor(
        (Date.now() - (startTime.value || 0)) / 1000,
      );
    }, 1000);
  };

  const stopCall = () => {
    if (timerInterval.value) clearInterval(timerInterval.value);

    localStream.value?.getTracks().forEach((t) => t.stop());
    localStream.value = null;

    stopScreenShare();
    isPiP.value = false;
    isActive.value = false;
    elapsedTime.value = 0;

    boardPages.value = [{ data: [], history: [], redo: [] }];
    boardSelectedPage.value = 0;
    boardSelectedColor.value = "#2C2727";
    boardBrushSize.value = 3;
    boardHistory.value = [];
    boardRedoHistory.value = [];
  };

  const stopScreenShare = () => {
    if (screenStream.value) {
      screenStream.value.getTracks().forEach((track) => track.stop());
      screenStream.value = null;
    }
    isSharingScreen.value = false;
  };

  const toggleCamera = async () => {
    if (!localStream.value) return;

    // 1. Toggle the state
    currentFacingMode.value =
      currentFacingMode.value === "user" ? "environment" : "user";

    // 2. Stop the current video tracks to release the hardware
    const videoTracks = localStream.value.getVideoTracks();
    videoTracks.forEach((track) => track.stop());

    try {
      // 3. Request a new stream with the updated facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode.value },
        audio: true, // Keep audio active
      });

      // 4. Update the localStream reference (CallMemberDisplay watches this)
      localStream.value = newStream;

      // Reset flash if switching to front camera
      if (currentFacingMode.value === "user") isFlashOn.value = false;
    } catch (err) {
      console.error("Failed to flip camera:", err);
    }
  };

  /**
   * Toggles the device flashlight (Torch).
   * Only works on 'environment' (back) camera.
   */
  const toggleFlash = async () => {
    const videoTrack = localStream.value?.getVideoTracks()[0];
    if (!videoTrack || currentFacingMode.value !== "environment") return;

    try {
      const capabilities = videoTrack.getCapabilities() as any;

      // Check if the hardware actually supports torch
      if (capabilities.torch) {
        isFlashOn.value = !isFlashOn.value;
        await videoTrack.applyConstraints({
          advanced: [{ torch: isFlashOn.value }],
        } as any);
      }
    } catch (err) {
      console.error("Flash toggle failed:", err);
    }
  };

  const startCall = async (
    contact: CallMember,
    serviceType: "voice-call" | "video-call",
  ) => {
    chatContact.value = contact;
    isActive.value = true;
    startTimer();
    await syncMediaSettings(serviceType);
    await router.push(`/dashboard/chat/${contact.id}/call`);
  };

  const setScreenStream = (stream: MediaStream) => {
    screenStream.value = stream;
    isSharingScreen.value = true;
  };

  return {
    chatContact,
    isActive,
    localStream,
    startCall,
    remoteStream,
    elapsedTime,
    callMembers,
    initCall,
    stopCall,
    setScreenStream,
    syncMediaSettings,
    isMicMuted,
    isCamDisabled,
    isSoundMuted,
    isPiP,
    toggleMic,
    toggleCam,
    toggleSound,
    stopScreenShare,
    isSharingScreen,
    screenStream,
    currentFacingMode,
    isFlashOn,
    toggleCamera,
    toggleFlash,
    boardPages,
    boardSelectedPage,
    boardSelectedColor,
    boardBrushSize,
    boardHistory,
    boardRedoHistory,
  };
});
