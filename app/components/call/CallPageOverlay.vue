<template>
    <div v-show="isReady" class=" flex flex-col w-full h-full bg-diamond-black ">
        <div class=" h-16 sm:h-20 flex items-center justify-between px-4">
            <div class="md:block hidden text-white select-none text-label-lg">{{ t('chat.call.title') }}</div>
            <div class=" bg-black-500 md:hidden rounded-full flex items-center gap-x-4 h-10 px-3">
                <!--<BIcon icon="PhLightning" @click="handleOptions('toggle-flash')"
                    class=" cursor-pointer fill-white w-6 h-6" />
                <BIcon icon="PhArrowsClockwise" @click="handleOptions('flip-camera')"
                    class=" cursor-pointer fill-white w-6 h-6" />-->
                <div v-for="option in mobileOptions" :key="option.key">
                    <BIcon :icon="option.icon" @click="handleOptions(option.key)" class=" fill-white w-6 h-6"
                        :class="[option.disabled === true ? ' cursor-not-allowed opacity-50' : ' opacity-100 cursor-pointer']" />
                </div>
            </div>
            <div class=" flex items-center gap-x-4.5">
                <div
                    class=" h-6 flex items-center justify-center bg-diamond-error rounded-full px-2 text-white select-none">
                    <div class=" text-body-sm">{{ callTimeDisplay }}</div>
                </div>
                <BIcon icon="PhArrowLeft" @click="goBack" class=" w-5 h-5 fill-white cursor-pointer" />
            </div>
        </div>
        <div class=" w-full p-3 sm:p-6 flex-1">
            <div class="w-full h-full min-h-0 relative">
                <TransitionGroup name="layout" tag="div" :class="wrapperClasses">
                    <CallMemberDisplay v-for="(member, index) in callMembers.slice(0, 6)" :key="member.id"
                        :contact="member" :is-full-screen="fullScreenId === member.id"
                        @toggle-fullscreen="toggleFullScreen(member.id)" :class="getMemberClass(member, index)" />
                </TransitionGroup>
            </div>
        </div>
        <div
            class=" w-full h-21 bg-black-600 flex justify-center gap-x-1.5 sm:gap-x-3 items-center  border-t border-t-[#2C2C2E]">

            <CallBoard>
                <template #trigger="{ isOpen }">
                    <div class="w-9 sm:w-12 transition-all duration-200 aspect-square rounded-full flex items-center justify-center"
                        :class="[isOpen ? 'bg-white' : 'bg-black-500']">
                        <BIcon :icon="isOpen ? 'PhX' : 'PhPalette'" class="sm:w-6 sm:h-6 w-4 h-4"
                            :class="[isOpen ? 'fill-black-500' : 'fill-white']" />
                    </div>
                </template>
            </CallBoard>
            <MedicSelector mode="medic">
                <template #trigger="{ isOpen }">
                    <div class="w-9 sm:w-12 transition-all duration-200 aspect-square rounded-full flex items-center justify-center"
                        :class="[isOpen ? 'bg-white' : 'bg-black-500']">
                        <BIcon :icon="isOpen ? 'PhX' : 'PhUserPlus'" class="sm:w-6 sm:h-6 w-4 h-4"
                            :class="[isOpen ? 'fill-black-500' : 'fill-white']" />
                    </div>
                </template>
            </MedicSelector>
            <div class="  w-9 sm:w-12  transition-all duration-200 ease-in-out aspect-square rounded-full flex items-center justify-center"
                :class="[option.isActive ? ' bg-white cursor-pointer' : (option.hasErrors ? 'bg-error-900 cursor-not-allowed' : 'cursor-pointer bg-black-500')]"
                @click="handleOptions(option.key)" v-for="option in optionButtons" :key="option.key">
                <BIcon :icon="option.icon" class=" sm:w-6 sm:h-6 w-4 h-4 "
                    :class="[option.isActive ? ' fill-black-500' : (option.hasErrors ? ' fill-error-200' : ' fill-white')]" />
            </div>
            <div @click="handleOptions('leave-call')"
                class=" rounded-full w-12 sm:w-15 aspect-square bg-diamond-error cursor-pointer flex items-center justify-center">
                <BIcon icon="PhPhoneX" class=" w-5 h-5 sm:w-7 sm:h-7 fill-white" />
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { type PropType, defineComponent, onBeforeMount, onMounted, computed } from 'vue';
import type { Contact } from '~/types/chat';
import { useI18n, useCallStore, useAppToast, useWindowSize, useAppPermissions, useDevice } from '~/nuxt-shims';
import CallMemberDisplay from './CallMemberDisplay.vue';
import { formatDuration } from '~/utils/format'
import CallBoard from './CallBoard.vue';
import MedicSelector from '../chat/medic-features/MedicSelector.vue';
export default defineComponent({
    name: 'CallPageOverlay',
    props: {
        contacts: {
            type: Object as PropType<Contact[]>,
            required: true,
            default: () => []
        }
    },
    components: {
        CallMemberDisplay,
        CallBoard,
        MedicSelector,
    },
    setup(props) {
        const { t } = useI18n()
        const isReady = ref(false)
        const { openToast } = useAppToast()
        const callStore = useCallStore()
        const { width } = useWindowSize()
        const { requestWithPopup, checkMediaStatus } = useAppPermissions()
        const { hardware } = useDevice();
        const isFlashOn = ref(false);
        const isBoardOpen = ref(false)
        const hasMultipleCameras = ref(false);
        const supportsTorch = ref(false);

        const flashIcon = computed(() => isFlashOn.value ? 'PhLightningSlash' : 'PhLightning')
        const boardIcon = computed(() => isBoardOpen.value ? 'PhX' : 'PhPencilCircle')

        const chatContact = computed(() => {
            return callStore.chatContact
        })

        const callTimeDisplay = computed(() => formatDuration(callStore.elapsedTime))


        const isMobile = computed(() => width.value < 768);

        const fullScreenId = ref<number | null>(null);

        const toggleFullScreen = (id: number) => {
            fullScreenId.value = fullScreenId.value === id ? null : id;
        };

        const mobileOptions = computed(() => [
            {
                icon: 'PhArrowsClockwise',
                key: 'flip-camera',
                disabled: !hasMultipleCameras.value,
            },
            {
                icon: flashIcon.value,
                key: 'toggle-flash',
                disabled: !supportsTorch.value,
            }
        ]);

        const getNativeDeviceRequirements = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                hasMultipleCameras.value = videoInputs.length > 1;

            } catch (err) {
                console.error("Failed to enumerate devices for camera count", err);
            } finally {
            }
        }


        // Replace gridLayoutClasses with wrapperClasses
        const wrapperClasses = computed(() => {
            if (!fullScreenId.value) {
                // Grid Layout Mode
                const count = callMembers.value.length;
                const gap = isMobile.value ? 'gap-3' : 'gap-4';
                let gridLayout = 'grid-cols-2';

                if (count === 1) gridLayout = 'grid-cols-1 grid-rows-1';
                else if (count === 2) gridLayout = 'grid-cols-1 grid-rows-2';
                else if (count === 3) gridLayout = 'grid-cols-1 grid-rows-3';
                else if (count === 4) gridLayout = 'grid-cols-2 grid-rows-2';
                else if (count === 6) gridLayout = 'grid-cols-2 grid-rows-3';

                return `grid ${gridLayout} ${gap} w-full h-full p-4 relative`;
            }

            // Full Screen Mode Wrapper
            // 'block' is used instead of grid to prevent CSS grid from interfering with absolute positioning
            return isMobile.value
                ? `block relative w-full h-full`
                : `flex flex-row flex-wrap content-start w-full h-full p-4 gap-4 relative overflow-hidden`;
        });

        const getMemberClass = (member: Contact, index: number) => {
            const base = 'transition-all duration-300 ease-in-out origin-center';

            if (!fullScreenId.value) {
                if (callMembers.value.length === 5 && index === 0) return `${base} col-span-2`;
                return base;
            }

            if (isMobile.value) {
                if (member.id === fullScreenId.value) {
                    // 1. Target Full Screen
                    // !absolute overrides the child's 'relative' class.
                    // top/left/right/bottom-4 gives it a perfect 16px margin around the whole screen.
                    return `${base} !absolute top-0 left-0 right-0 bottom-0 z-0`;
                }
                if (index === 0) {
                    // 2. Local User PIP (You)
                    // Placed at the bottom-right cleanly. !w and !h override the child's w-full/h-full.
                    return `${base} !absolute bottom-8 right-6 z-20 !w-[110px] !h-[150px] shadow-2xl rounded-2xl`;
                }
                // 3. Hidden Members
                // They shrink into the center and fade out so the transition looks smooth
                return `${base} !absolute top-1/2 left-1/2 opacity-0 scale-0 pointer-events-none z-[-1]`;
            } else {
                // Desktop Layout
                if (member.id === fullScreenId.value) {
                    return `${base} !w-full !h-[calc(100%-11rem)] order-1`;
                }
                return `${base} flex-1 min-w-[140px] max-w-[200px] !h-36 order-2`;
            }
        };

        const callMembers = computed(() => callStore.callMembers)

        const optionButtons = computed(() => [
            //   {
            //       icon: 'PhX',
            //       key: 'minimize-call'
            //   },
            {
                icon: 'PhMonitorArrowUp',
                key: 'share-screen',
                isActive: callStore.isSharingScreen
            },
            //  {
            //      icon: 'PhUserPlus',
            //      key: 'add-user'
            //  },
            {
                icon: callStore.isSoundMuted ? 'PhSpeakerSlash' : 'PhSpeakerHigh',
                key: 'toggle-sound'
            },
            {
                icon: callStore.isMicMuted ? 'PhMicrophoneSlash' : 'PhMicrophone',
                key: 'toggle-mic',
                hasErrors: !hardware.hasMicrophone
            },
            {
                icon: !callStore.isCamDisabled ? 'PhVideoCameraSlash' : 'PhVideoCamera',
                key: 'toggle-video',
                hasErrors: !hardware.hasCamera,
            },
        ]);
        const goBack = () => {
            callStore.minimize()
        }

        watch(() => chatContact.value, () => {
            if (chatContact.value) {
                initPermissions()
            }
        })

        watch(callMembers, (newMembers, oldMembers) => {
            const justStartedStreaming = newMembers.find((member, index) => {
                const wasStreaming = oldMembers?.[index]
                    ? (oldMembers[index].isCameraOn || oldMembers[index].isScreenSharing)
                    : false;
                const isStreaming = member.isCameraOn || member.isScreenSharing;

                return isStreaming && !wasStreaming;
            });

            if (justStartedStreaming) {
                fullScreenId.value = justStartedStreaming.id;
                return;
            }

            if (fullScreenId.value) {
                const currentFullScreenMember = newMembers.find(m => m.id === fullScreenId.value);
                const isStillStreaming = currentFullScreenMember
                    ? (currentFullScreenMember.isCameraOn || currentFullScreenMember.isScreenSharing)
                    : false;

                if (!isStillStreaming) {
                    fullScreenId.value = null;
                }
            }
        }, { deep: true });


        onBeforeMount(() => {
            callStore.maximize();
            isReady.value = callStore.isActive;
        })

        onMounted(async () => {
            getNativeDeviceRequirements()
            if (chatContact.value) {
                await initPermissions();
            }
        });

        // --- REPLACEMENT FOR initPermissions ---
        const initPermissions = async () => {
            if (!callStore.chatContact) return;
            const service = callStore.chatContact.serviceType;
            const isVideo = service === 'video-call';

            await callStore.syncMediaSettings(service);

            // Query browser natively without triggering prompts
            const status = await checkMediaStatus();

            const needsMic = status.mic !== 'granted';
            const needsCam = isVideo && status.cam !== 'granted';

            // If we are missing permissions, trigger the CUSTOM popup
            if (needsMic || needsCam) {
                const state = isVideo ? 'permission' : 'mic-permission';

                // WAIT for the user to interact with PermissionPopup.vue
                const granted = await requestWithPopup(state);

                // If user clicks "Not Now" or denies it, kick them back safely
                if (!granted) {
                    callStore.isActive = false;
                    return; // Stop execution
                }
            }

            // CRITICAL FIX: The popup has been cleared. WE NOW safely start the hardware.
            await callStore.initCall(isVideo);
        };

        const handleOptions = async (key: string) => {

            const option = mobileOptions.value.find(o => o.key === key);
            if (option?.disabled) {
                openToast(t('chat.call.deviceDoesntSupport'), 'error')
                return
            };

            const button = optionButtons.value.find(btn => btn.key === key);
            if (button?.hasErrors) return;
            switch (key) {
                case 'minimize-call':
                    callStore.minimize();
                    break;
                case 'share-screen':
                    if (callStore.isSharingScreen) {
                        callStore.stopScreenShare();
                        return;
                    }
                    if (isMobile.value) {
                        await requestWithPopup('screen-share-error');
                        return;
                    }
                    await requestWithPopup('screen-share-permission');
                    break;
                case 'add-user':

                    break;
                case 'toggle-sound':
                    callStore.toggleSound();
                    break;
                case 'toggle-mic':
                    callStore.toggleMic();
                    break;
                case 'toggle-video':
                    await callStore.toggleCam();
                    break;
                case 'leave-call':
                    callStore.stopCall();
                    break;
                case 'flip-camera':
                    if (isMobile.value) {
                        await callStore.toggleCamera();
                    }
                    break;

                case 'toggle-flash':
                    if (isMobile.value && callStore.currentFacingMode === 'environment') {
                        await callStore.toggleFlash();
                    }
                    break;
            }
        }

        return {
            t,
            wrapperClasses,
            optionButtons,
            callMembers,
            goBack,
            handleOptions,
            getMemberClass,
            isMobile,
            fullScreenId,
            callTimeDisplay,
            toggleFullScreen,
            isBoardOpen,
            boardIcon,
            mobileOptions,
            isReady,
        }
    }
})
</script>