// composables/useAppPermissions.ts
import { ref } from "vue";
import { useEventBus } from "@vueuse/core";
export type PopupState =
  | "permission"
  | "mic-error"
  | "cam-error"
  | "mic-permission"
  | "cam-permission"
  | "screen-share-error"
  | "screen-share-permission";

interface PermissionRequest {
  state: PopupState;
  resolve: (value: boolean) => void;
}

const permissionBus = useEventBus<PermissionRequest>("global-permission-popup");
export function useAppPermissions() {
  const checkMediaStatus = async () => {
    try {
      const mic = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      const cam = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      return { mic: mic.state, cam: cam.state };
    } catch (err) {
      return { mic: "unknown", cam: "unknown" };
    }
  };

  // Requests BOTH at once as requested, with a fallback if hardware is missing
  const requestMediaAccess = async (need: "audio" | "video" | "both") => {
    try {
      // 1. Try the primary request
      const constraints: MediaStreamConstraints = {
        audio: need === "audio" || need === "both",
        video: need === "video" || need === "both",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return { success: true };
    } catch (error: any) {
      // 2. DETECT MISSING HARDWARE (Mac Mini case)
      if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        console.warn("Hardware not found. Checking for partial success...");

        // If they needed 'both' but only have one (or none), try a partial fallback
        if (need === "both") {
          try {
            // Try ONLY video if audio failed
            const vStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            vStream.getTracks().forEach((t) => t.stop());
            return { success: true, hardwareWarning: "no-mic" };
          } catch {
            return { success: false, error: "no-hardware" };
          }
        }
        return { success: false, error: "no-hardware" };
      }

      // 3. Handle explicit denials (NotAllowedError)
      return { success: false, error: error.name };
    }
  };

  const requestLocation = async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("Unsupported");
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const requestScreenShare = async (): Promise<boolean> => {
    return await requestWithPopup("screen-share-permission");
  };

  const requestWithPopup = (state: PopupState) => {
    return new Promise<boolean>((resolve) => {
      permissionBus.emit({ state, resolve });
    });
  };

  const getNativeScreenShare = async (): Promise<MediaStream> => {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
  };

  return {
    checkMediaStatus,
    requestMediaAccess,
    requestLocation,
    requestScreenShare,
    requestWithPopup,
    getNativeScreenShare,
  };
}
