import type {
  CallHandlers,
  CallKind,
  CallSignalEvent,
} from "@yonus_amire01/chat";

export function createMockCallHandlers(): CallHandlers {
  return {
    async initiate(conversationId: string, kind: CallKind) {
      await new Promise((r) => setTimeout(r, 150));
      return { callId: `call-${conversationId}-${Date.now()}-${kind}` };
    },
    async sendOffer() {},
    async sendAnswer() {},
    async sendIce() {},
    async end() {},
    onSignal(_handler: (e: CallSignalEvent) => void) {
      return () => {};
    },
  };
}