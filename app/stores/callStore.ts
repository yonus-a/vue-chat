import { defineStore, acceptHMRUpdate } from "pinia";

export const useCallStore = defineStore("call-modal", () => {
  const timerInterval = ref<NodeJS.Timeout | null>(null);
  const channelId = ref<string | null>(null);
  const startTime = ref<number | null>(null);
  const isMinimized = ref(false);
  const isActive = ref(false);
  const elapsedTime = ref(0);

  const startTimer = () => {
    startTime.value = Date.now();
    timerInterval.value = setInterval(() => {
      elapsedTime.value = Math.floor(
        (Date.now() - (startTime.value || 0)) / 1000,
      );
    }, 1000);
  };

  const startCall = (id: string) => {
    startTimer();
    channelId.value = id;
    isActive.value = true;
    isMinimized.value = false;
  };

  const endCall = () => {
    isActive.value = false;
    isMinimized.value = false;
    elapsedTime.value = 0;
    channelId.value = null;
  };

  const minimize = () => {
    isMinimized.value = true;
  };

  const maximize = () => {
    isMinimized.value = false;
  };

  return {
    isActive,
    isMinimized,
    elapsedTime,
    channelId,
    startCall,
    endCall,
    minimize,
    maximize,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCallStore, import.meta.hot));
}
