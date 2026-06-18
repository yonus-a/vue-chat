import type { DefineComponent } from "vue";

/**
 * Pre-declared public type for the ChatPage SFC. Avoids vue-tsc emitting a
 * declaration that transitively references private types from the bundled
 * child components.
 */
declare const ChatPage: DefineComponent<{}, {}, any>;
export default ChatPage;
