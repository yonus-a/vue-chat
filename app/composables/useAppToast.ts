// app/composables/useToast.ts
import { useState } from "~/nuxt-shims";
import type { Toast } from "~/types/components/toast";

export const useAppToast = () => {
  // A reference to the toast component instance
  const toastRef = useState<Toast | null>("global-toast-ref", () => null);

  /**
   * @param message The text to display
   * @param type 'success' | 'error' | 'warning' | 'info' (matching your DToast props)
   */
  const openToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = "success",
  ) => {
    if (toastRef.value) {
      toastRef.value.openToast(message, type);
    } else {
      console.warn("DToast component is not yet initialized in app.vue");
    }
  };

  return {
    toastRef,
    openToast,
  };
};
