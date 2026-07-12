import type { Contact } from "./chat";

export interface CallMember extends Contact {
  stream: MediaStream | null;
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}

export type CallKind = "voice-call" | "video-call";
