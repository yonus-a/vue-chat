import { inject, provide, type InjectionKey } from "vue";
import type { CallHandlers } from "../types";

const CALL_HANDLERS: InjectionKey<CallHandlers | null> =
  Symbol("call_handlers");

export function provideCallHandlers(handlers: CallHandlers) {
  provide(CALL_HANDLERS, handlers);
}

export function useCallHandlers() {
  const helpers = inject(CALL_HANDLERS);

  if (!helpers) {
    throw new Error(
      "useCallHandlers() called without provideCallHandlers() in an ancestor",
    );
  }

  return helpers;
}
