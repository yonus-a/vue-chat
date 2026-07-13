// app/composables/useToast.ts
import { ref, type Ref } from "vue";
import type { Toast } from "~/types/components/toast";

// Module-level singleton — shared across all useAppToast() callers,
// equivalent to Nuxt's useState("global-toast-ref", () => null).
const toastRef: Ref<Toast | null> = ref(null);

export const useAppToast = () => {
  /**
   * @param message The text to display
   * @param type 'success' | 'error' | 'warning' | 'info' (matching BToast props)
   */
  const openToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "success",
  ) => {
    if (toastRef.value) {
      toastRef.value.openToast(message, type);
    } else {
      console.warn("BToast component is not yet initialized in app.vue");
    }
  };

  return {
    toastRef,
    openToast,
  };
};
