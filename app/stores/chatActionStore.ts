import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useDate, useI18n, useAppToast } from "#imports";
import type { ExtendedMessage, Message } from "~/types/chat";
import { useEventBus } from "@vueuse/core";
import { useChatStore } from "~/stores/chatStore";
import type {
  RequestProvider,
  ServiceRequest,
  AccessRequest,
} from "~/types/chat";
import type { Provider } from "~/types/service";

export const useChatActionStore = defineStore("chatAction", () => {
  const { t } = useI18n();
  const { openToast } = useAppToast();
  const { formatDateShort, formatTime } = useDate();
  const chatStore = useChatStore();

  const uploadProgress = ref<
    Map<number, { progress: number; uploaded: number; total: number }>
  >(new Map());

  const processingActions = ref(new Map<number, string>());

  // --- Helper Getter ---
  const isActionBusy = (messageId: number, actionKey: string) => {
    return processingActions.value.get(messageId) === actionKey;
  };

  // --- State ---
  const isSelectMode = ref(false);
  const selectedMessages = ref<Map<number, ExtendedMessage>>(new Map());
  const isMenuOpen = ref(false);
  const replyingTo = ref<ExtendedMessage | null>(null);
  const editingMessage = ref<ExtendedMessage | null>(null);
  const editWindowHours = ref(6);

  // --- Event Buses ---
  const deleteBus = useEventBus<number[]>("chat-delete");
  const sendBus = useEventBus<Message[]>("chat-send");
  const editBus = useEventBus<ExtendedMessage>("edit-message");
  const personalInfoBus = useEventBus<number>("personal-info-request");
  const prescriptionBus = useEventBus<number>("prescription");

  // 2. Trigger Action (Emits to ChatMessages.vue to open the modal)
  const triggerPersonalInfoRequest = (conversationId: number) => {
    personalInfoBus.emit(conversationId);
  };

  const triggerPrescription = (conversationId: number) => {
    prescriptionBus.emit(conversationId);
  };
  // NEW: A unified bus to patch existing messages (handling ID swaps, isSent toggles, etc.)
  const updateBus = useEventBus<{ id: number; updates: Partial<Message> }>(
    "chat-update",
  );

  // --- Getters ---
  const selectedArray = computed(() =>
    Array.from(selectedMessages.value.values()),
  );
  const canReply = computed(() => selectedMessages.value.size <= 1);
  const canEdit = computed(() => {
    if (selectedMessages.value.size !== 1) return false;
    const msg = selectedArray.value[0];
    if (!msg) return false;
    const isMine = msg.senderId === chatStore.currentUserId;
    const hoursPassed =
      (Date.now() - new Date(msg.date).getTime()) / (1000 * 60 * 60);
    return isMine && hoursPassed < editWindowHours.value;
  });
  const canDelete = computed(() => {
    if (selectedMessages.value.size === 0) return false;
    return selectedArray.value.every((msg) => {
      const isMine = msg.senderId === chatStore.currentUserId;
      const hoursPassed =
        (Date.now() - new Date(msg.date).getTime()) / (1000 * 60 * 60);
      return isMine && hoursPassed < editWindowHours.value;
    });
  });

  // --- Actions (Optimistic UI + Mock APIs) ---

  const triggerDelete = async (specificIds?: number[]) => {
    const targets = specificIds?.length
      ? specificIds
      : selectedArray.value.map((m) => m.id);
    if (targets.length === 0) return;

    // Set processing state for each target
    targets.forEach((id) => processingActions.value.set(id, "cancel-request"));

    deleteBus.emit(targets);
    clearActions();

    // Mock API Call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Clear processing state
    targets.forEach((id) => processingActions.value.delete(id));
  };

  // Update other actions (approve, reject, pay) similarly:
  const handleRemoteAction = async (
    messageId: number,
    actionKey: string,
    apiCall: () => Promise<void>,
  ) => {
    processingActions.value.set(messageId, actionKey);
    try {
      await apiCall();
    } finally {
      processingActions.value.delete(messageId);
    }
  };

  const sendMessage = async (messages: Message[]) => {
    const tempMessages = messages.map((m) => ({
      ...m,
      id: Math.floor(Math.random() * -1000000),
      isSent: false,
    }));

    sendBus.emit(tempMessages);

    if (tempMessages.length > 0) {
      const latest = tempMessages[tempMessages.length - 1];
      chatStore.updateLastMessage(latest.conversationId, latest);
    }

    // Process mock uploads for each message
    for (const tempMsg of tempMessages) {
      // Mock File Sizes based on attachment type
      let totalSize = 1024 * 1024 * 2; // Default 2MB
      if (tempMsg.type === "video") totalSize = 1024 * 1024 * 15; // 15MB
      if (tempMsg.type === "file") totalSize = 1024 * 1024 * 5; // 5MB

      // Initialize progress
      if (tempMsg.type !== "text") {
        uploadProgress.value.set(tempMsg.id, {
          progress: 0,
          uploaded: 0,
          total: totalSize,
        });
      }

      // Mock chunked uploading taking 2.5 seconds total (250ms interval * 10)
      let currentBytes = 0;
      const interval = setInterval(async () => {
        currentBytes += totalSize / 10;

        if (currentBytes >= totalSize) {
          clearInterval(interval);
          uploadProgress.value.delete(tempMsg.id);

          const realId = Math.floor(Math.random() * 100000) + 1000;

          // Mock Caching to IDB to ensure instant availability without downloading
          try {
            const dbName = "ChatFileCache";
            const db = await new Promise<IDBDatabase>((res, rej) => {
              const req = indexedDB.open(dbName, 1);
              req.onupgradeneeded = () => req.result.createObjectStore("files");
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            });
            const tx = db.transaction("files", "readwrite");
            const mockBlob = new Blob(["mock content"], {
              type: "application/octet-stream",
            });

            // Cache against every URL found in the message
            const urlsToCache = [
              tempMsg.fileUrl,
              tempMsg.voiceUrl,
              tempMsg.videoUrl,
              ...(tempMsg.imageUrl || []),
            ].filter(Boolean) as string[];
            urlsToCache.forEach((url) =>
              tx.objectStore("files").put(mockBlob, url),
            );
          } catch (e) {
            console.warn("Failed to mock cache", e);
          }

          // Commit to UI
          updateBus.emit({
            id: tempMsg.id,
            updates: { id: realId, isSent: true },
          });
          chatStore.patchLastMessage(tempMsg.conversationId, tempMsg.id, {
            id: realId,
            isSent: true,
          });
        } else {
          uploadProgress.value.set(tempMsg.id, {
            progress: Math.round((currentBytes / totalSize) * 100),
            uploaded: currentBytes,
            total: totalSize,
          });
        }
      }, 250);
    }
  };

  const saveEditMessage = async (id: number, text: string) => {
    const conversationId = editingMessage.value?.conversationId;

    // 1. Optimistic update
    updateBus.emit({ id, updates: { text, isSent: false } });
    if (conversationId)
      chatStore.patchLastMessage(conversationId, id, { text, isSent: false });

    clearActions();

    // 2. Mock API Call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Confirm edit
    updateBus.emit({ id, updates: { isSent: true, isEdited: true } });
    if (conversationId)
      chatStore.patchLastMessage(conversationId, id, {
        isSent: true,
        isEdited: true,
      });
  };
  const triggerEdit = (message: ExtendedMessage) => {
    editingMessage.value = message;
    editBus.emit(editingMessage.value);
  };

  const toggleSelection = (message: ExtendedMessage) => {
    const newMap = new Map(selectedMessages.value);
    if (newMap.has(message.id)) {
      newMap.delete(message.id);
      if (newMap.size === 0) isSelectMode.value = false;
    } else {
      newMap.set(message.id, message);
    }
    selectedMessages.value = newMap;
  };

  const startSelectMode = (message: ExtendedMessage) => {
    isSelectMode.value = true;
    const newMap = new Map();
    newMap.set(message.id, message);
    selectedMessages.value = newMap;
  };

  const clearActions = () => {
    isSelectMode.value = false;
    selectedMessages.value.clear();
    replyingTo.value = null;
    editingMessage.value = null;
  };

  const copyMessageText = () => {
    const textToCopy = selectedArray.value
      .map((msg) => {
        const isMine = msg.senderId === chatStore.currentUserId;
        const senderName = isMine ? t("chat.you") : msg.contact?.name || "User";
        const dateTime = `${formatDateShort(msg.date)}, ${formatTime(msg.date)}`;
        const content =
          msg.text ||
          (msg.imageUrl ? "[Image]" : msg.voiceUrl ? "[Voice]" : "[File]");
        return `${senderName} [${dateTime}]:\n${content}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(textToCopy).then(() => {
      openToast(t("chat.copiedMessage"), "success");
    });
    clearActions();
  };

  const sendServiceRequest = (
    conversationId: number,
    serviceId: number,
    serviceLabel: string,
    selectedProviders: Provider[],
  ) => {
    // 1. Check if we are in "auto-select" mode (no providers selected)
    const isAutoSelect = selectedProviders.length === 0;
    const requestStatus = isAutoSelect ? "searching" : "pending";

    // 2. Map selected providers to RequestProvider type with the mandatory individual status
    const mappedProviders: RequestProvider[] = selectedProviders.map((p) => ({
      ...p,
      status: "pending",
    }));

    // 3. Find the full service object from the serviceStore to include all its data
    // (icon, fellowships, expertiseLevel, etc.)
    const serviceStore = useServiceStore();
    const fullServiceData = serviceStore.services.find(
      (s) => s.id === serviceId,
    );

    const newRequestMessage: Message = {
      id: Math.floor(Math.random() * -1000000),
      conversationId: conversationId,
      date: new Date(),
      type: "text",
      senderId: chatStore.currentUserId,
      isSent: false,
      isRead: false,
      isEdited: false,
      repliedTo: null as any,
      request: {
        id: Math.floor(Math.random() * 10000),
        type: "add-person",
        request: {
          // Spread all service data (label, fellowships, level, icon)
          ...fullServiceData,
          id: serviceId,
          label: serviceLabel,
          status: requestStatus,
          // Always include the provider array (empty if auto-select)
          provider: mappedProviders,
          // Also include the service object explicitly as per your updated interface
          service: fullServiceData,
        } as ServiceRequest,
      },
    };

    sendMessage([newRequestMessage]);
  };

  const sendPersonalInfoRequest = (conversationId: number) => {
    const newRequestMessage: Message = {
      id: Math.floor(Math.random() * -1000000),
      conversationId: conversationId,
      date: new Date(),
      type: "text",
      senderId: chatStore.currentUserId,
      isSent: false,
      isRead: false,
      isEdited: false,
      repliedTo: null as any,
      request: {
        id: Math.floor(Math.random() * 10000),
        type: "personal-info",
        request: {
          id: Math.floor(Math.random() * 10000),
          date: new Date(),
          status: "pending",
        } as AccessRequest,
      },
    };

    sendMessage([newRequestMessage]);
  };

  // Inside ChatActionStore.ts

  const handleAccessResponse = async (
    messageId: number,
    conversationId: number,
    key: "confirm-access" | "reject-access",
    currentRequest: any, // Pass the request object directly
  ) => {
    // 1. Set specific key as busy
    processingActions.value.set(messageId, key);

    try {
      // 2. Map keys to internal status
      const targetStatus = key === "confirm-access" ? "approved" : "rejected";
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Construct the updated request structure locally (Optimistic)
      const updatedRequest = {
        ...currentRequest,
        request: {
          ...currentRequest.request,
          status: targetStatus,
        },
      };

      // 4. Update the UI via Event Bus (Handled in ChatMessages.vue)
      updateBus.emit({ id: messageId, updates: { request: updatedRequest } });

      // 5. Update Sidebar Last Message

      // 6. Mock API Call

      chatStore.patchLastMessage(conversationId, messageId, {
        request: updatedRequest,
      });
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      // 7. ALWAYS clear the loading state, even if logic fails
      processingActions.value.delete(messageId);
    }
  };

  return {
    isSelectMode,
    selectedMessages,
    isMenuOpen,
    replyingTo,
    editingMessage,
    editWindowHours,
    selectedArray,
    canReply,
    canEdit,
    canDelete,
    deleteBus,
    sendBus,
    updateBus, // Exposed buses
    triggerDelete,
    sendMessage,
    saveEditMessage,
    triggerEdit, // API wrappers
    toggleSelection,
    startSelectMode,
    clearActions,
    copyMessageText,
    editBus,
    uploadProgress,
    triggerPersonalInfoRequest,
    sendServiceRequest,
    prescriptionBus,
    sendPersonalInfoRequest,
    triggerPrescription,
    personalInfoBus,
    processingActions,
    isActionBusy,
    handleRemoteAction,
    handleAccessResponse,
  };
});
