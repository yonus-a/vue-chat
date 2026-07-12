<template>
    <BPopup ref="popup" no-padding>
        <div class="w-dvw max-w-120">
            <div class="flex w-full items-center gap-x-2 border-b border-b-outline-variant p-5">
                <BIcon :icon="popupIcon.icon" weight="fill" :class="[popupIcon.color]" class="h-7 w-7" />
                <div class="select-none text-label-lg text-on-surface">{{ popupContent.title }}</div>
            </div>
            <div class="w-full select-none border-b border-b-outline-variant p-5 text-wrap">
                <p class="text-body-md text-on-surface/50">{{ popupContent.description }}</p>
            </div>
            <div class="flex w-full items-center gap-x-3 p-5">
                <BButton :text="actionButtonText" :loading="isLoading" @click="handleAction" />
                <BButton color="secondary" type="outline" :text="t('chat.permissions.notNow')" @click="closePopup" />
            </div>
        </div>
    </BPopup>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue';
import type { Popup } from '~/types/components/popup';
import { useAppPermissions, type PopupState } from '~/composables/useAppPermissions';
import { useEventBus } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{
    action: [];
    cancel: [];
}>();

const { t } = useI18n();
const { requestMediaAccess, getNativeScreenShare } = useAppPermissions();
const callStore = useCallStore();

const popup = ref<Popup | null>(null);
const popupMode = ref<PopupState>('mic-permission');
const isLoading = ref(false);
const currentResolver = ref<((v: boolean) => void) | null>(null);

// --- Event Bus ---
const bus = useEventBus<{ resolve: (v: boolean) => void; state: PopupState }>('global-permission-popup');

// FIX: The original code did not clean up the event listener, causing memory leaks
// and duplicate triggers if the component was unmounted and remounted.
const { off: offBus } = bus.on((payload) => {
    currentResolver.value = payload.resolve;
    switchMode(payload.state);
});

onUnmounted(() => {
    offBus();
});

// --- Computed ---
const popupIcon = computed(() => ({
    icon: popupMode.value.endsWith('permission') ? 'PhWarningCircle' : 'PhWarningOctagon',
    color: popupMode.value.endsWith('permission') ? 'fill-primary' : 'fill-error',
}));

const actionButtonText = computed(() =>
    popupMode.value.endsWith('permission') ? t('chat.permissions.allow') : t('chat.permissions.retry')
);

const popupContent = computed(() => {
    switch (popupMode.value) {
        case 'permission':
            return { title: t('chat.permissions.permissionTitle'), description: t('chat.permissions.description') };
        case 'cam-error':
            return { title: t('chat.permissions.camError.title'), description: t('chat.permissions.camError.description') };
        case 'mic-error':
            return { title: t('chat.permissions.micError.title'), description: t('chat.permissions.micError.description') };
        case 'cam-permission':
            return { title: t('chat.permissions.cam.title'), description: t('chat.permissions.cam.description') };
        case 'mic-permission':
            return { title: t('chat.permissions.mic.title'), description: t('chat.permissions.mic.description') };
        case 'screen-share-error':
            return { title: t('chat.permissions.screenError.title'), description: t('chat.permissions.screenError.description') };
        case 'screen-share-permission':
            return { title: t('chat.permissions.screen.title'), description: t('chat.permissions.screen.description') };
    }
});

// --- Methods ---
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
        } catch (err: unknown) {
            console.error("Screen Share Error:", (err as Error).name);
            success = false;
        }

        isLoading.value = false;
        if (success) {
            popup.value?.close();
            currentResolver.value?.(true);
        } else {
            // macOS often throws NotAllowedError if System Settings are off
            await switchMode('screen-share-error');
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
        await switchMode(errorMode);
    }
};

defineExpose<{
    open: (state: PopupState) => void;
    close: () => void;
    setLoading: (state: boolean) => void;
}>({
    open: (state: PopupState) => {
        popupMode.value = state;
        isLoading.value = false;
        nextTick(() => popup.value?.open());
    },
    close: closePopup,
    setLoading: (state: boolean) => {
        isLoading.value = state;
    },
});
</script>