<template>
    <div dir="rtl" class=" w-full relative">
        <VideoRecordDisplay ref="videoDisplayRef" :stream="mediaStream" :is-paused="isPaused"
            :recording-time="currentRecordingSeconds" @flip-camera="handleFlipCamera" />
        <div>
            <div :class="[textMode !== 'normal' ? ' h-10' : 'h-0']"
                class=" gap-x-3 px-3 w-full whitespace-nowrap overflow-hidden border-t select-none text-body-sm border-t-outline-variant flex relative z-30 justify-between items-center transition-all duration-200 ease-in-out bg-surface">
                <BIcon :icon="textMode === 'edit' ? 'PhPencilSimpleLine' : 'PhArrowBendUpLeft'"
                    class=" w-5 h-5 fill-on-surface shrink-0" />
                <div class=" flex-1 flex items-center gap-x-2">
                    <div v-if="textMode === 'reply'" class=" shrink-0 text-on-surface/50 ">{{
                        displayActionName }} :</div>
                    <div class=" flex-1">
                        <div class=" text-on-surface w-full overflow-hidden text-ellipsis line-clamp-1">
                            <SafeEmojiText :text="displayedActionText" />
                        </div>
                    </div>
                </div>
                <BIcon icon="PhX" class=" cursor-pointer w-5 shrink-0 h-5 fill-on-surface/50" @click="cancelAction" />
            </div>
        </div>
        <div @contextmenu.prevent ref="rootElements"
            :class="[(isRecording && !isLocked) || messageText.trim().length > 0 ? 'px-4' : 'px-4']"
            class=" transition-all duration-200 ease-in-out min-h-19 py-4 w-full bg-surface flex items-end border-t border-t-outline-variant gap-x-5 relative z-40 overflow-visible select-none ">

            <div class="relative flex items-center justify-center shrink-0 z-30 mb-0.5" :style="{
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }">
                <div v-if="isRecording"
                    class="absolute -top-20 flex flex-col items-center justify-center bg-surface shadow-floating rounded-full w-9 transition-opacity"
                    :class="[isLocked ? 'pointer-events-auto py-1.5' : 'pointer-events-none py-3 gap-y-3']"
                    :style="{ opacity: lockOpacity }">

                    <template v-if="!isLocked">
                        <BIcon icon="PhLockKey" class="w-5 h-5 fill-on-surface" />
                    </template>

                    <template v-else>
                        <div class="w-full h-9 flex items-center justify-center cursor-pointer" @click="togglePause">
                            <BIcon :icon="isPaused ? 'PhPlayCircle' : 'PhPauseCircle'"
                                class="w-6 h-6 fill-on-surface" />
                        </div>
                    </template>
                    <BIcon icon="PhCaretUp" class="w-4 h-4 fill-on-surface/60 animate-bounce" />
                </div>

                <div class="flex items-center w-11 touch-none h-11 justify-center transition-all duration-200"
                    :class="[(isRecording && !isLocked) || messageText.trim().length > 0 ? ' rounded-full bg-primary/10' : 'w-6 h-6 bg-primary/0']"
                    @pointerdown="!isLocked ? handlePointerDown($event) : null"
                    @click="!isLocked ? toggleSecondaryMessageType() : null">
                    <BIcon v-if="!isLocked && messageText.trim().length == 0" :icon="secondaryMessageIcon"
                        :weight="isRecording ? 'fill' : 'regular'"
                        class="cursor-pointer w-6 h-6 shrink-0 transition-colors"
                        :class="[isRecording ? ' fill-primary' : iconClass]" />
                    <div v-else
                        class=" min-w-11 min-h-11 aspect-square rounded-full bg-gradient-primary-secondary flex items-center justify-center cursor-pointer">
                        <BIcon icon="PhPaperPlaneTilt" class=" w-6 h-6 fill-white shrink-0  " @click="sendRecording" />
                    </div>
                </div>
            </div>

            <div v-show="!isRecording" class="flex-1 flex items-end gap-x-5">
                <div class=" min-h-11 flex items-center w-full">
                    <div ref="inputRef" contenteditable="true" @keydown.enter.exact.prevent="handleEnterKey"
                        @input="handleContentInput" @focus="onInputFocus" @blur="saveCursorPosition"
                        @keyup="saveCursorPosition" @mouseup="saveCursorPosition" :data-placeholder="inputPlaceholder"
                        class="text-body-md text-on-surface outline-none flex-1 bg-transparent z-10 max-h-[144px] overflow-y-auto hide-scrollbar leading-6 py-1 cursor-text whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface/50 pointer-events-auto">
                    </div>
                </div>
                <div class="shrink-0 flex items-center gap-x-8 z-10  h-11" :class="[iconClass]">
                    <div class="hidden md:block">
                        <BMenu ref="menuRef">
                            <template #trigger>
                                <BIcon icon="PhSmiley" class="cursor-pointer w-6 h-6 fill-on-surface"
                                    @mousedown.prevent />
                            </template>
                            <div class="">
                                <BEmojiPicker @select="handleEmojiSelect" />
                            </div>
                        </BMenu>
                    </div>

                    <!-- MOBILE: Toggle Button -->
                    <BIcon icon="PhSmiley" class="md:hidden cursor-pointer w-6 h-6 fill-on-surface" @mousedown.prevent
                        @click="toggleMobileEmoji" />
                    <InputAttachement :initial-caption="messageText" @send-attachments="handleAttachments" />
                </div>
            </div>

            <div v-show="isRecording" class="flex-1 justify-between -translate-y-2 flex items-center ">
                <div></div>
                <div class=" flex justify-center items-center text-body-md text-on-surface/70 transition-opacity"
                    :style="{ opacity: cancelOpacity }">
                    <span v-if="!isLocked">{{ t('chat.swipeToCancel') }}</span>
                    <span v-else class="text-primary  cursor-pointer px-4  z-20" @click="cancelRecording">{{
                        t('chat.cancel')
                        }}</span>
                </div>

                <div class=" left-6 flex items-center  gap-x-2 shrink-0 z-10">
                    <div class="w-2.5 h-2.5 relative">
                        <div class="w-2.5 h-2.5 rounded-full bg-error"></div>
                        <div class="w-2.5 h-2.5 rounded-full bg-error animate-ping absolute top-0 left-0 inset-0"></div>
                    </div>
                    <span class="text-body-md min-w-12 text-center text-on-surface tabular-nums mt-0.5" dir="ltr">{{
                        formattedTime
                    }}</span>
                </div>
            </div>
        </div>
        <div class="md:hidden w-full transition-all relative z-30 duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] overflow-hidden"
            :class="showMobileEmojiPicker ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'">
            <BEmojiPicker @select="handleEmojiSelect" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useI18n, useChatActionStore, useMessagesStore, useChatStore } from '~/nuxt-shims';
import { type Menu } from '~/types/components/menu';
import InputAttachement from './chat-input/InputAttachement.vue';
import { PopupState, useAppPermissions } from '~/composables/useAppPermissions';
import { useChatRecording } from '~/composables/chat/useChatRecording';
import { useCallStore } from '~/nuxt-shims';
import type { ExtendedMessage, Message } from '~/types/chat';
import SafeEmojiText from '../general/SafeEmojiText.vue';
import { parseEmojiArray } from '~/utils/emojiParser';
import VideoRecordDisplay from './chat-input/VideoRecordDisplay.vue';
export default defineComponent({
    name: 'ChatInput',
    components: { InputAttachement, SafeEmojiText, VideoRecordDisplay },
    props: { isActive: { type: Boolean, default: false } },
    emits: ['send', 'edit'],
    setup(props, { expose, emit }) {
        const { t } = useI18n();
        const { requestWithPopup, checkMediaStatus } = useAppPermissions();
        const chatActionStore = useChatActionStore();
        const messagesStore = useMessagesStore();
        const chatStore = useChatStore()
        const callStore = useCallStore()
        const savedRange = ref<Range | null>(null);
        const isSelectingEmoji = ref(false);

        const textMode = ref<'normal' | 'edit' | 'reply'>('normal');
        const inputWidth = computed(() => rootElements.value?.clientWidth);
        const editingMessageData = ref<ExtendedMessage | null>(null); // Replace 'any' with ExtendedMessage if imported
        const replyingToMessageData = ref<ExtendedMessage | null>(null);

        chatActionStore.editBus.on((payload) => handleEditMessage(payload))
        // const saveEdit = chatActionStore.saveEdit;


        const videoDisplayRef = ref<any>(null);

        const recording = useChatRecording(inputWidth, {
            onStart: () => {
                if (secondaryMessageType.value === 'video') videoDisplayRef.value?.open();
            },
            onCancel: () => {
                if (secondaryMessageType.value === 'video') videoDisplayRef.value?.close();
            },
            onSend: ((mediaUrl?: string) => {
                const finalUrl = mediaUrl || 'placeholder';
                const msg = createBaseMessage();
                msg.type = secondaryMessageType.value as any;
                if (msg.type === 'voice') msg.voiceUrl = finalUrl;
                if (msg.type === 'video' as any) msg.videoUrl = finalUrl;

                chatActionStore.sendMessage([msg]);
                chatActionStore.clearActions();

                // Auto-close on send
                if (secondaryMessageType.value === 'video') videoDisplayRef.value?.close();
            }) as () => void,
            requestPermission: async () => await ensurePermissions()
        });

        // Parse formattedTime ("00:15") into exact seconds
        const currentRecordingSeconds = computed(() => {
            if (!recording.formattedTime.value) return 0;
            const [minutes, seconds] = recording.formattedTime.value.split(':').map(Number);
            return (minutes * 60) + (seconds || 0);
        });

        // Force-send at 60 seconds
        watch(currentRecordingSeconds, (sec) => {
            if (sec >= 60 && recording.isRecording.value) {
                recording.stopRecording(true); // true = send
            }
        });


        const handleEditMessage = (msg: ExtendedMessage) => {
            textMode.value = 'edit';
            editingMessageData.value = msg;
            messageText.value = msg.text || '';
            nextTick(() => {
                inputRef.value?.focus();
                adjustHeight();
            });
        }

        watch(() => messagesStore.replyingTo, (msg) => {
            if (msg) {
                textMode.value = 'reply';
                replyingToMessageData.value = msg;

                nextTick(() => {
                    inputRef.value?.focus();
                });
            } else if (textMode.value === 'reply') {
                // Only reset if we were actually in reply mode
                textMode.value = 'normal';
                replyingToMessageData.value = null;
            }
        });

        // 3. ADD THE CANCEL FUNCTION
        const cancelAction = () => {
            chatActionStore.clearActions();
        };

        watch(() => textMode.value, () => {
        })

        // Refs
        const rootElements = ref<HTMLElement | null>(null);
        const inputRef = ref<HTMLElement | null>(null);
        const menuRef = ref<Menu | null>(null);

        // State
        const messageText = ref('');
        const secondaryMessageType = ref<'video' | 'voice'>('voice');

        //const { requestMediaAccess, checkMediaStatus } = useAppPermissions();




        // --- Permission Flow ---
        let permissionResolver: ((value: boolean) => void) | null = null;

        const ensurePermissions = async () => {
            const isVideo = secondaryMessageType.value === 'video';
            const currentStatus = await checkMediaStatus();

            const status = isVideo ? currentStatus.cam : currentStatus.mic;

            // 1. If already granted, proceed immediately
            if (status === 'granted') return true;

            // 2. If denied or unknown, trigger the modular popup via the bus
            const state: PopupState = isVideo
                ? (status === 'denied' ? 'cam-error' : 'cam-permission')
                : (status === 'denied' ? 'mic-error' : 'mic-permission');

            // This waits for the popup to resolve (user clicks allow + browser prompt success)
            return await requestWithPopup(state);
        };

        const handlePopupCancel = () => {
            if (permissionResolver) permissionResolver(false);
            permissionResolver = null;
        };

        // --- Input Logistics ---
        const adjustHeight = () => {
            if (!inputRef.value) return;
            inputRef.value.style.height = 'auto';
            inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
        };

        const createBaseMessage = (): Message => {
            return {
                id: String(Date.now() + Math.floor(Math.random() * 1000)), // Temporary fake ID
                conversationId: chatStore.activeConversationId ?? "",
                date: new Date(),
                type: 'text', // default
                isEdited: false,
                senderId: chatStore.currentUserId,
                isSent: false,
                isRead: false, // Mine are always read
                repliedTo: messagesStore.replyingTo || undefined // Inject reply data if active
            } as Message;
        };

        // 4. Update handleAttachments to map payloads
        const handleAttachments = (payloads: any[]) => {
            const newMessages: Message[] = payloads.map(payload => {
                const msg = createBaseMessage();
                msg.type = payload.type;
                if (payload.type === 'text') msg.text = payload.text;
                if (payload.type === 'image') msg.imageUrl = payload.imageUrl;
                if (payload.type === 'file') msg.fileUrl = payload.fileUrl;
                if (payload.type === 'voice') msg.voiceUrl = payload.voiceUrl;
                if (payload.type === 'video') msg.videoUrl = payload.videoUrl;
                return msg;
            });

            // Call Store directly!
            chatActionStore.sendMessage(newMessages);

            messageText.value = '';
            chatActionStore.clearActions();
        };

        // 5. Update sendMessage to use the same logic
        const sendMessage = () => {
            if (messageText.value.trim().length === 0) return;

            if (textMode.value === 'edit' && editingMessageData.value) {
                chatActionStore.saveEditMessage(editingMessageData.value.id, messageText.value);
            } else {
                const msg = createBaseMessage();
                msg.type = 'text';
                msg.text = messageText.value;
                chatActionStore.sendMessage([msg]);
            }

            messageText.value = '';
            if (inputRef.value) inputRef.value.innerHTML = ''; // MUST CLEAR DIV HTML
            textMode.value = 'normal'
            chatActionStore.clearActions();
            nextTick(() => adjustHeight());
        };


        const handlePointerDown = (event: PointerEvent) => {
            if (messageText.value.trim().length > 0) {
                sendMessage();
                return;
            }
            menuRef.value?.close();
            recording.onPointerDown(event);

            // NOTE: The 300ms setTimeout has been completely removed from here. 
            // The @click event now handles the toggle safely!
        };

        const toggleSecondaryMessageType = () => {
            // Only toggle if we are NOT holding it down and NOT already recording
            if (!recording.isLongPress.value && !recording.isRecording.value) {
                secondaryMessageType.value = secondaryMessageType.value === 'voice' ? 'video' : 'voice';
            }
        };

        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (textMode.value !== 'normal') {
                    cancelAction();
                } else if (messagesStore.selectedArray.length > 0) {
                    cancelAction()
                }
                else {
                    handleEscapeNavigation()
                }
            }
        };

        const handleEscapeNavigation = () => {
            const isCallMode = callStore.isActive && !callStore.isPiP;
            const isProfileView = chatStore.profileViewOpen;

            if (isCallMode) {
                callStore.minimize();
            } else if (isProfileView) {
                chatStore.closeProfile();
            } else {
                chatStore.setSelectedChat(null);
            }
        };

        onMounted(() => {
            window.addEventListener('keydown', handleGlobalKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        });

        expose({ focus: () => inputRef.value?.focus() });

        const displayedActionText = computed(() => {
            let message = textMode.value === 'edit' ? editingMessageData.value : replyingToMessageData.value
            if (message?.voiceUrl && message.voiceUrl.trim().length > 0) return t('chat.attachementTypes.voice')
            if (message?.videoUrl && message.videoUrl.trim().length > 0) return t('chat.attachementTypes.video')
            if (message?.imageUrl && message.imageUrl.length > 0) return t('chat.attachementTypes.image')
            if (message?.fileUrl && message.fileUrl.trim().length > 0) return t('chat.attachementTypes.file')
            return message?.text
        })

        const displayActionName = computed(() => {
            let message = replyingToMessageData.value?.senderId
            if (textMode.value === 'edit') return t('chat.you')
            if (chatStore.currentUserId === message) return t('chat.you')
            return `${replyingToMessageData.value?.contact?.name}`
        })

        // --- Add these new refs ---
        const showMobileEmojiPicker = ref(false);
        const lastCursorPos = ref({ start: 0, end: 0 });

        // --- Add these new methods ---
        const saveCursorPosition = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && inputRef.value) {
                // Ensure we are only saving the cursor if it's currently inside our input div
                if (inputRef.value.contains(selection.anchorNode)) {
                    savedRange.value = selection.getRangeAt(0).cloneRange();
                }
            }
        };

        const onInputFocus = () => {
            if (isSelectingEmoji.value) return;
            showMobileEmojiPicker.value = false;
        };

        const toggleMobileEmoji = () => {
            showMobileEmojiPicker.value = !showMobileEmojiPicker.value;
            if (showMobileEmojiPicker.value) {
                saveCursorPosition(); // Save where we were typing
                inputRef.value?.blur(); // Telegram UX: Blur input to hide the mobile keyboard
            }
        };

        const handleEmojiSelect = (emoji: string) => {
            isSelectingEmoji.value = true;
            if (!inputRef.value) return;

            // Force focus on the div
            inputRef.value.focus();

            const selection = window.getSelection();
            let range;

            // Restore the exact cursor position
            if (savedRange.value) {
                range = savedRange.value;
                selection?.removeAllRanges();
                selection?.addRange(range);
            } else {
                // Fallback: If no cursor is saved, put the cursor at the very end
                range = document.createRange();
                range.selectNodeContents(inputRef.value);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }

            // Delete any text the user currently has highlighted
            range.deleteContents();

            // Parse the incoming emoji to get the Hex code
            const parsed = parseEmojiArray(emoji);
            if (parsed.length > 0 && parsed[0].type === 'emoji') {
                const chunk = parsed[0];

                // Create the physical image element
                const img = document.createElement('img');
                img.src = `/emojis/apple/webp/${chunk.hex}.webp`;
                img.alt = chunk.content;
                img.className = "inline-block w-5 h-5 mx-0.5 align-middle select-text pointer-events-none";

                // Drop it at the cursor
                range.insertNode(img);

                // Move the blinking cursor to the right side of the newly inserted image
                range.setStartAfter(img);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);

                // Save this new position so the next emoji doesn't reset
                savedRange.value = range.cloneRange();
            }

            // Immediately trigger your existing text extractor so messageText state updates
            handleContentInput();

            nextTick(() => {
                // Only keep focus if we aren't using the mobile pop-up picker
                if (showMobileEmojiPicker.value) {
                    inputRef.value?.blur();
                }
                adjustHeight();
            });
            isSelectingEmoji.value = false;
        };

        const handleEnterKey = (e: KeyboardEvent) => {
            if (e.shiftKey) return; // Allow Shift+Enter for new lines
            e.preventDefault();
            sendMessage();
        };

        const handleContentInput = () => {
            if (!inputRef.value) return;
            let rawText = '';

            // Loop through DOM nodes to grab text and emoji alt tags
            inputRef.value.childNodes.forEach((node: any) => {
                if (node.nodeType === 3) {
                    rawText += node.textContent; // Standard text
                } else if (node.nodeName === 'IMG') {
                    rawText += node.alt; // Native emoji from the image alt tag
                } else if (node.nodeName === 'DIV' || node.nodeName === 'BR') {
                    rawText += '\n'; // Handle line breaks
                }
            });
            messageText.value = rawText;
            adjustHeight();
        };

        const placeCaretAtEnd = (el: HTMLElement) => {
            el.focus();
            if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        };

        const handleFlipCamera = () => {
            if (typeof (recording as any).toggleCamera === 'function') {
                (recording as any).toggleCamera();
            } else {
                console.warn("Camera flip requested, but toggleCamera method is missing in useChatRecording");
            }
        };


        return {
            t, rootElements, inputRef, menuRef, messageText, handlePopupCancel,
            secondaryMessageIcon: computed(() => secondaryMessageType.value === 'voice' ? 'PhMicrophone' : 'PhCamera'),
            inputDisabled: computed(() => !props.isActive),
            inputPlaceholder: computed(() => props.isActive ? t('chat.placeholder') : t('chat.chatLocked')),
            iconClass: computed(() => !props.isActive ? 'opacity-50 fill-on-surface pointer-events-none' : 'fill-on-surface opacity-100 pointer-events-auto'),

            adjustHeight, handleEmojiSelect, handlePointerDown, sendMessage,
            sendRecording: () => recording.stopRecording(true),
            cancelRecording: () => recording.stopRecording(false),
            toggleSecondaryMessageType,
            handleEnterKey,
            cancelAction,
            textMode,
            editingMessageData,
            replyingToMessageData,
            displayedActionText,
            displayActionName,
            handleAttachments,
            showMobileEmojiPicker,
            onInputFocus,
            handleContentInput,
            handleFlipCamera,
            videoDisplayRef,
            currentRecordingSeconds,
            saveCursorPosition,
            toggleMobileEmoji,
            ...recording // Spreads all the recording refs (isRecording, dragOffset, formattedTime, etc.) to the template
        };
    }
});
</script>
