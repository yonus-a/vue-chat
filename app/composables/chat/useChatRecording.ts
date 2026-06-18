// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
// composables/useChatRecording.ts
import { ref, computed, type Ref } from "vue";

export function useChatRecording(
  inputWidth: Ref<number | undefined>,
  callbacks: {
    onStart: () => void;
    onCancel: () => void;
    onSend?: (mediaUrl: string) => void;
    requestPermission: () => Promise<boolean>;
  },
) {
  const isRecording = ref(false);
  const isLocked = ref(false);
  const isPaused = ref(false);
  const recordingTime = ref(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const mediaStream = ref<MediaStream | null>(null);
  const currentFacingMode = ref<"user" | "environment">("user");

  const toggleCamera = async () => {
    if (!mediaStream.value || !isRecording.value) return;
    currentFacingMode.value =
      currentFacingMode.value === "user" ? "environment" : "user";

    const oldTrack = mediaStream.value.getVideoTracks()[0];
    if (oldTrack) oldTrack.stop();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode.value },
      });
      if (mediaStream.value && newStream.getVideoTracks()[0]) {
        mediaStream.value.removeTrack(oldTrack);
        mediaStream.value.addTrack(newStream.getVideoTracks()[0]);
      }
    } catch (err) {
      console.error("Failed to flip camera:", err);
    }
  };

  // Drag State
  const isDragging = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const dragOffset = ref({ x: 0, y: 0 });
  const dragAxis = ref<"x" | "y" | null>(null);

  const pressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
  const isPointerDown = ref(false);
  const isLongPress = ref(false);

  const formattedTime = computed(() => {
    const m = Math.floor(recordingTime.value / 60)
      .toString()
      .padStart(2, "0");
    const s = (recordingTime.value % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  });

  const lockOpacity = computed(() => (dragAxis.value === "x" ? 0 : 1));
  const cancelOpacity = computed(() =>
    dragAxis.value === "y"
      ? 1
      : 1 - Math.min(Math.abs(dragOffset.value.x) / 80, 1),
  );

  const resetDrag = () => {
    isDragging.value = false;
    dragOffset.value = { x: 0, y: 0 };
    dragAxis.value = null;
  };

  const togglePause = () => {
    isPaused.value = !isPaused.value;
    if (!isPaused.value) {
      timerInterval = setInterval(() => recordingTime.value++, 1000);
    } else if (timerInterval) {
      clearInterval(timerInterval);
    }
  };

  const stopRecording = (triggerSend = false) => {
    if (timerInterval) clearInterval(timerInterval);

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((t) => t.stop());
      mediaStream.value = null;
    }
    isRecording.value = false;
    isLocked.value = false;
    isPaused.value = false;
    recordingTime.value = 0;
    resetDrag();

    if (triggerSend) callbacks.onSend();
    else callbacks.onCancel();
  };

  const onPointerDown = (event: PointerEvent) => {
    isPointerDown.value = true;
    isLongPress.value = false;
    startX.value = event.clientX;
    startY.value = event.clientY;
    resetDrag();

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    if (pressTimer.value) clearTimeout(pressTimer.value);

    pressTimer.value = setTimeout(async () => {
      isLongPress.value = true;
      // Await the permission UI
      const hasPermission = await callbacks.requestPermission();

      if (hasPermission && isPointerDown.value) {
        isDragging.value = true;
        isRecording.value = true;
        isPaused.value = false;
        recordingTime.value = 0;
        callbacks.onStart();
        timerInterval = setInterval(() => recordingTime.value++, 1000);

        try {
          mediaStream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode.value },
            audio: true,
          });
        } catch (err) {
          console.error("Stream failed", err);
        }
      }
    }, 400);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!isRecording.value || isLocked.value || !isDragging.value) return;

    const deltaX = event.clientX - startX.value;
    const deltaY = event.clientY - startY.value;

    if (!dragAxis.value) {
      if (deltaY < -10) dragAxis.value = "y";
      else if (deltaX < -10) dragAxis.value = "x";
    }

    if (dragAxis.value === "y") {
      dragOffset.value.y = Math.max(-100, Math.min(0, deltaY));
      if (dragOffset.value.y <= -60) {
        isLocked.value = true;
        resetDrag();
      }
    } else if (dragAxis.value === "x") {
      const cancelThreshold = inputWidth.value ? inputWidth.value / 3 : 150;
      dragOffset.value.x = Math.max(-cancelThreshold, Math.min(0, deltaX));
      if (deltaX <= -cancelThreshold) stopRecording(false);
    }
  };

  const onPointerUp = () => {
    isPointerDown.value = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    if (pressTimer.value) {
      clearTimeout(pressTimer.value);
      pressTimer.value = null;
    }

    if (isRecording.value && !isLocked.value) {
      if (dragAxis.value === "x") stopRecording(false);
      else stopRecording(true);
    }
    resetDrag();
  };

  return {
    isRecording,
    isLocked,
    isPaused,
    formattedTime,
    dragOffset,
    isDragging,
    lockOpacity,
    cancelOpacity,
    isLongPress,
    onPointerDown,
    mediaStream,
    toggleCamera,
    togglePause,
    stopRecording,
  };
}
