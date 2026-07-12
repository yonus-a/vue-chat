export type CallKind = "voice-call" | "video-call";

export type CallSignalEvent =
  | { type: "offer"; callId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; callId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; callId: string; candidate: RTCIceCandidateInit }
  | { type: "end"; callId: string }
  | { type: "join"; callId: string; memberId: string }
  | { type: "leave"; callId: string; memberId: string };

export interface CallHandlers {
  initiate(conversationId: string, kind: CallKind): Promise<{ callId: string }>;
  sendOffer(callId: string, sdp: RTCSessionDescriptionInit): Promise<void>;
  sendAnswer(callId: string, sdp: RTCSessionDescriptionInit): Promise<void>;
  sendIce(callId: string, candidate: RTCIceCandidateInit): Promise<void>;
  end(callId: string): Promise<void>;
  onSignal(handler: (e: CallSignalEvent) => void): () => void;
}

let handlers: CallHandlers | null = null;

export function createCall(config: { handlers: CallHandlers }) {
  handlers = config.handlers;
}

export function getCallHandlers(): CallHandlers {
  if (!handlers) {
    throw new Error(
      "Call is not initialized. Call createCall() before using call features.",
    );
  }

  return handlers;
}