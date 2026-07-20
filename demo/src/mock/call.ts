import type { CallHandlers, TurnConfig } from "@yonus_amire01/chat";

export function createMockCallHandlers(): CallHandlers {
  return {
    async publish() {},
    onMessage() {
      return () => {};
    },
    async getTurnConfig(): Promise<TurnConfig> {
      return {
        urls: ["stun:stun.l.google.com:19302"],
        iceTransportPolicy: "all",
      };
    },
  };
}