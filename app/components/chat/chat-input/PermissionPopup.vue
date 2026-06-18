<template>
    <BPopup no-padding ref="popup">
        <div class=" w-dvw max-w-120">
            <div class=" flex items-center p-5 gap-x-2 w-full border-b border-b-outline-variant">
                <BIcon :icon="popupIcon.icon" :class="[popupIcon.color]" class=" w-7 h-7" weight="fill" />
                <div class=" select-none  text-on-surface text-label-lg">{{ popupContent.title }}</div>
            </div>
            <div class="border-b text-wrap border-b-outline-variant w-full p-5 select-none">
                <p class=" text-body-md text-on-surface/50">{{ popupContent.description }}</p>
            </div>
            <div class=" w-full flex items-center p-5 gap-x-3">
                <BButton :text="actionButtonText" :loading="isLoading" @click="handleAction" />
                <BButton @click="closePopup" color="secondary" type="outline" :text="t('chat.permissions.notNow')" />
            </div>
        </div>
    </BPopup>
</template>
<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { useCallStore, useI18n } from '~/nuxt-shims';
import type { Popup } from '~/types/components/popup';
import { useAppPermissions, type PopupState } from '~/composables/useAppPermissions';
import { useEventBus } from '@vueuse/core';
export default defineComponent({
    name: 'PermissionPopup',
    emits: ['action', 'cancel'],
    setup(_, { expose, emit }) {
        const popup = ref<Popup | null>(null)
        const { t } = useI18n()
        const { requestMediaAccess, getNativeScreenShare } = useAppPermissions();
        const callStore = useCallStore();
        const popupMode = ref<PopupState>('mic-permission');
        const bus = useEventBus<any>('global-permission-popup');
        const isLoading = ref(false)
        const currentResolver = ref<((v: boolean) => void) | null>(null);


        bus.on((payload) => {
            currentResolver.value = payload.resolve;
            switchMode(payload.state);
        });

        const switchMode = async (newMode: PopupState) => {
            popup.value?.close();

            // 300ms delay for a clean exit animation
            await new Promise(resolve => setTimeout(resolve, 300));

            popupMode.value = newMode;
            isLoading.value = false;

            nextTick(() => {
                popup.value?.open();
            });
        };



        const popupIcon = computed(() => {
            return {
                icon: popupMode.value.endsWith('permission') ? 'PhWarningCircle' : 'PhWarningOctagon',
                color: popupMode.value.endsWith('permission') ? 'fill-primary' : 'fill-error'
            }
        })

        const actionButtonText = computed(() => popupMode.value.endsWith('permission') ? t('chat.permissions.allow') : t('chat.permissions.retry'))

        const popupContent = computed(() => {
            switch (popupMode.value) {
                case 'permission':
                    return {
                        title: t('chat.permissions.permissionTitle'),
                        description: t('chat.permissions.description')
                    }
                case 'cam-error':
                    return {
                        title: t('chat.permissions.camError.title'),
                        description: t('chat.permissions.camError.description')
                    }
                case 'mic-error':
                    return {
                        title: t('chat.permissions.micError.title'),
                        description: t('chat.permissions.micError.description')
                    }
                case 'cam-permission':
                    return {
                        title: t('chat.permissions.cam.title'),
                        description: t('chat.permissions.cam.description')
                    }
                case 'mic-permission':
                    return {
                        title: t('chat.permissions.mic.title'),
                        description: t('chat.permissions.mic.description')
                    }
                case 'screen-share-error':
                    return {
                        title: t('chat.permissions.screenError.title'),
                        description: t('chat.permissions.screenError.description')
                    }
                case 'screen-share-permission':
                    return {
                        title: t('chat.permissions.screen.title'),
                        description: t('chat.permissions.screen.description')
                    }
            }
        })

        const openPopup = (state: PopupState) => {
            popupMode.value = state;
            isLoading.value = false;
            nextTick(() => {
                popup.value?.open()
            })
        }

        expose({
            open: (state: PopupState) => { openPopup(state) },
            close: () => { closePopup() },
            setLoading: (state: boolean) => { isLoading.value = state; }
        });

        const closePopup = () => {
            popup.value?.close();
            currentResolver.value?.(false);
            currentResolver.value = null;
        };

        const handleAction = async () => {
            isLoading.value = true;
            let success = false;

            // --- 1. SCREEN SHARE FLOW (Standalone) ---
            if (popupMode.value === 'screen-share-permission') {
                try {
                    const stream = await getNativeScreenShare();
                    if (stream) {
                        callStore.screenStream = stream;
                        callStore.isSharingScreen = true;

                        // Native Browser "Stop Sharing" handler
                        stream.getVideoTracks()[0].onended = () => {
                            callStore.stopScreenShare();
                        };
                        success = true;
                    }
                } catch (err: any) {
                    console.error("Screen Share Error:", err.name);
                    success = false;
                }

                isLoading.value = false;
                if (success) {
                    popup.value?.close();
                    currentResolver.value?.(true);
                } else {
                    // macOS often throws NotAllowedError if System Settings are off
                    return await switchMode('screen-share-error');
                }
                return; // EXIT HERE so it doesn't run the Mic/Cam logic below
            }

            // --- 2. MIC / CAM FLOW ---
            let need: 'audio' | 'video' | 'both' = 'audio';
            if (popupMode.value.startsWith('cam')) need = 'video';
            if (popupMode.value === 'permission') need = 'both';

            const result = await requestMediaAccess(need);

            isLoading.value = false;
            if (result.success) {
                popup.value?.close();
                currentResolver.value?.(true);
            } else {
                // If hardware is missing (Mac Mini), show a specific error
                const errorMode = (need === 'video' || need === 'both') ? 'cam-error' : 'mic-error';
                return await switchMode(errorMode);
            }
        };

        return {
            actionButtonText,
            popup,
            closePopup,
            t,
            popupIcon,
            popupContent,
            isLoading,
            handleAction,
        }
    }
})

</script>