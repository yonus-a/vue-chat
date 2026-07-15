import { useAppPermissions } from "~/composables/useAppPermissions";
import type { CallHandlers, CallKind, CallMember } from "~/types";
import { useChatStore } from "./chatStore";
import type { Contact } from "~/types";
import { defineStore } from "pinia";

export const useCallStore = defineStore("call", () => {
  const chatStore = useChatStore();
  const { checkMediaStatus, requestWithPopup } = useAppPermissions();
  let handlers: CallHandlers;

  function setHandlers(val: CallHandlers) {
    handlers = val;
  }
  // Board state
  const boardPages = ref<{ data: any[]; history: any[]; redo: any[] }[]>([
    { data: [], history: [], redo: [] },
  ]);
  const boardSelectedPage = ref(0);
  const boardSelectedColor = ref("#2C2727");
  const boardBrushSize = ref(3);
  const boardHistory = ref<any[]>([]);
  const boardRedoHistory = ref<any[]>([]);

  // PiP state
  const isPiP = ref(false);

  // Call state
  const isActive = ref(false);
  const localStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null>(null);

  // Camera state
  const currentFacingMode = ref<"user" | "environment">("user");
  const isFlashOn = ref(false);

  // Screen sharing state
  const isSharingScreen = ref(false);
  const screenStream = ref<MediaStream | null>(null);

  // Contact state
  const chatContact = ref<Contact | null>();

  // Timer state
  const startTime = ref<number | null>(null);
  const elapsedTime = ref(0);
  const timerInterval = ref<NodeJS.Timeout | null>(null);

  // Media toggles
  const isMicMuted = ref(false);
  const isCamDisabled = ref(false);
  const isSoundMuted = ref(false);

  // Participants
  const participants = ref<CallMember[]>([]);

  // Internal WebRTC state (not exposed)
  let pc: RTCPeerConnection | null = null;
  let activeCallId: string | null = null;
  let unsubscribeSignals: (() => void) | null = null;

  // Computed
  const callMembers = computed<CallMember[]>(() => {
    if (!chatStore.currentUserId) return participants.value;

    const currentUser: CallMember = {
      id: chatStore.currentUserId,
      name: "",
      lastName: "",
      imageUrl: "",
      isOnline: true,
      lastSeen: new Date(),
      isActive: false,
      unreadCount: 0,
      serviceType: "chat",
      userType: [chatStore.chosenRole],
      birthDate: chatStore.currentUserBirthDate,
      stream: isSharingScreen.value ? screenStream.value : localStream.value,
      isScreenSharing: isSharingScreen.value,
      isCameraOn: !isCamDisabled.value,
      isSpeaking: !isMicMuted.value && isActive.value,
      isMuted: isMicMuted.value,
    };
    return [currentUser, ...participants.value];
  });

  // Media sync
  const syncMediaSettings = async (serviceType: string) => {
    const status = await checkMediaStatus();
    isMicMuted.value = status.mic !== "granted";
    if (serviceType === "voice-call") {
      isCamDisabled.value = true;
    } else {
      isCamDisabled.value = status.cam !== "granted";
    }
  };

  // Media toggles
  const toggleMic = async () => {
    if (isMicMuted.value) {
      const status = await checkMediaStatus();
      if (status.mic === "granted") {
        isMicMuted.value = false;
        localStream.value?.getAudioTracks().forEach((t) => (t.enabled = true));
        return;
      }
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
      const status = await checkMediaStatus();
      if (status.cam === "granted") {
        isCamDisabled.value = false;
        localStream.value?.getVideoTracks().forEach((t) => (t.enabled = true));
        return;
      }
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

  const toggleSound = () => {
    if (remoteStream.value) {
      const remoteAudio = remoteStream.value.getAudioTracks();
      isSoundMuted.value = !isSoundMuted.value;
      remoteAudio.forEach((track) => (track.enabled = !isSoundMuted.value));
    }
  };

  // Call lifecycle
  const initCall = async (withVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true,
      });
      localStream.value = stream;
      isActive.value = true;
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMicMuted.value));
      stream
        .getVideoTracks()
        .forEach((t) => (t.enabled = !isCamDisabled.value));
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

  const stopScreenShare = () => {
    if (screenStream.value) {
      screenStream.value.getTracks().forEach((track) => track.stop());
      screenStream.value = null;
    }
    isSharingScreen.value = false;
  };

  const stopCall = () => {
    if (timerInterval.value) clearInterval(timerInterval.value);

    localStream.value?.getTracks().forEach((t) => t.stop());
    localStream.value = null;

    stopScreenShare();

    if (pc) {
      pc.close();
      pc = null;
    }

    if (unsubscribeSignals) {
      unsubscribeSignals();
      unsubscribeSignals = null;
    }

    if (activeCallId) {
      void handlers.end(activeCallId);
      activeCallId = null;
    }

    isPiP.value = false;
    isActive.value = false;
    elapsedTime.value = 0;
    participants.value = [];
    chatContact.value = null;

    boardPages.value = [{ data: [], history: [], redo: [] }];
    boardSelectedPage.value = 0;
    boardSelectedColor.value = "#2C2727";
    boardBrushSize.value = 3;
    boardHistory.value = [];
    boardRedoHistory.value = [];
  };

  const startCall = async (
    contact: Contact,
    conversationId: string,
    serviceType: CallKind,
  ) => {
    chatContact.value = contact;
    chatStore.setSelectedChat(conversationId);
    await syncMediaSettings(serviceType);
    await initCall(serviceType === "video-call");

    const { callId } = await handlers.initiate(conversationId, serviceType);
    activeCallId = callId;

    pc = new RTCPeerConnection();

    for (const track of localStream.value!.getTracks()) {
      pc.addTrack(track, localStream.value!);
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void handlers.sendIce(callId, ev.candidate.toJSON());
      }
    };

    pc.ontrack = (ev) => {
      remoteStream.value = ev.streams[0] ?? null;
    };

    unsubscribeSignals = handlers.onSignal(async (e) => {
      if (!pc || e.callId !== callId) return;

      if (e.type === "offer") {
        await pc.setRemoteDescription(e.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await handlers.sendAnswer(callId, answer);
      } else if (e.type === "answer") {
        await pc.setRemoteDescription(e.sdp);
      } else if (e.type === "ice") {
        await pc.addIceCandidate(e.candidate);
      } else if (e.type === "end") {
        stopCall();
      }
    });

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: serviceType === "video-call",
    });
    await pc.setLocalDescription(offer);
    await handlers.sendOffer(callId, offer);

    isActive.value = true;
    isPiP.value = false;
    startTimer();
  };

  // Camera controls
  const toggleCamera = async () => {
    if (!localStream.value) return;

    currentFacingMode.value =
      currentFacingMode.value === "user" ? "environment" : "user";

    const videoTracks = localStream.value.getVideoTracks();
    videoTracks.forEach((track) => track.stop());

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode.value },
        audio: true,
      });
      localStream.value = newStream;
      if (currentFacingMode.value === "user") isFlashOn.value = false;
    } catch (err) {
      console.error("Failed to flip camera:", err);
    }
  };

  const toggleFlash = async () => {
    const videoTrack = localStream.value?.getVideoTracks()[0];
    if (!videoTrack || currentFacingMode.value !== "environment") return;

    try {
      const capabilities = videoTrack.getCapabilities() as any;
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

  // PiP controls
  const maximize = () => {
    isPiP.value = false;
  };

  const minimize = () => {
    isPiP.value = true;
  };

  // Screen share
  const setScreenStream = (stream: MediaStream) => {
    screenStream.value = stream;
    isSharingScreen.value = true;
  };

  return {
    // State
    chatContact,
    isActive,
    localStream,
    remoteStream,
    elapsedTime,
    callMembers,
    participants,
    isMicMuted,
    isCamDisabled,
    isSoundMuted,
    isPiP,
    isSharingScreen,
    screenStream,
    currentFacingMode,
    isFlashOn,
    boardPages,
    boardSelectedPage,
    boardSelectedColor,
    boardBrushSize,
    boardHistory,
    boardRedoHistory,

    // Actions
    setHandlers,
    startCall,
    initCall,
    stopCall,
    setScreenStream,
    syncMediaSettings,
    toggleMic,
    toggleCam,
    toggleSound,
    stopScreenShare,
    toggleCamera,
    toggleFlash,
    maximize,
    minimize,
  };
});
