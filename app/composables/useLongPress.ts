import { ref, onBeforeUnmount } from "vue";

export function useLongPress(callback: (event: PointerEvent) => void) {
  const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = ref({ x: 0, y: 0 });

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    touchStartPos.value = { x: event.clientX, y: event.clientY };
    longPressTimer.value = setTimeout(() => {
      if ("vibrate" in navigator) navigator.vibrate(50);
      callback(event);
      longPressTimer.value = null;
    }, 1000);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!longPressTimer.value) return;
    const deltaX = Math.abs(event.clientX - touchStartPos.value.x);
    const deltaY = Math.abs(event.clientY - touchStartPos.value.y);
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
  };

  const onPointerUp = () => {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
  };

  onBeforeUnmount(() => {
    if (longPressTimer.value) clearTimeout(longPressTimer.value);
  });

  return { onPointerDown, onPointerMove, onPointerUp };
}
