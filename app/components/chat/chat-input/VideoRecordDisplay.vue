<template>
    <div class=" pointer-events-none fixed top-0 left-0 md:w-full w-dvw md:absolute h-dvh md:backdrop-blur-none  md:h-0 overflow-visible z-20"
        :class="[isOpen ? 'backdrop-blur-lg md:bg-transparent bg-on-surface/10' : ' backdrop-blur-none']">
        <div
            class=" md:-translate-y-full pointer-events-none md:pb-4 md:block flex flex-col justify-between md:py-0 py-26 items-center md:h-auto h-full md:pr-4">
            <div class=" md:hidden"></div>
            <div class=" transition-all duration-200 ease-in-out "
                :class="[isOpen ? ' opacity-100 scale-100 pointer-events-auto translate-y-0' : ' pointer-events-none scale-0 opacity-0 translate-y-1/4']">
                <BubbleVideo mode="recording" :stream="stream" :is-paused="isPaused" :recording-time="recordingTime"
                    :max-duration="60" />
            </div>
            <div class=" md:hidden px-4 py-3 flex items-center gap-x-6 rounded-full bg-surface shadow-floating origin-bottom"
                :class="[isOpen ? ' opacity-100 scale-100 pointer-events-auto translate-y-0' : ' pointer-events-none scale-0 opacity-0 translate-y-1/4']">
                <BIcon v-for="option in mobileOptions" :key="option.key" :icon="option.icon"
                    @click="handleOption(option.key)" class=" w-6 h-6 fill-on-surface"
                    :class="[option.disabled ? ' opacity-50 cursor-not-allowed' : 'cursor-pointer opacity-100']" />
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { ref, defineComponent, computed, onMounted, watch, type PropType } from 'vue';
import BubbleVideo from '../chat-bubbles/BubbleVideo.vue';
import { useDevice, useCallStore } from '~/nuxt-shims';

export interface PatientRefferalExposed {
    open: () => void;
    close: () => void;
}

export default defineComponent({
    name: 'VideoRecordDisplay',
    components: {
        BubbleVideo,
    },
    props: {
        stream: { type: Object as PropType<MediaStream | null>, default: null },
        isPaused: { type: Boolean, default: false },
        recordingTime: { type: Number, default: 0 }
    },
    emits: ['flip-camera'],
    setup(props, { expose, emit }) {
        const callStore = useCallStore()
        const currentFacingMode = ref<"user" | "environment">("user");
        const isFlashOn = ref(false);
        const { hardware } = useDevice();
        const isOpen = ref(false)
        const hasMultipleCameras = ref(false);
        const supportsTorch = ref(false);
        const flashIcon = computed(() => isFlashOn.value ? 'PhLightningSlash' : 'PhLightning')


        onMounted(async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                hasMultipleCameras.value = videoInputs.length > 1;
            } catch (err) {
                console.error("Failed to enumerate devices for camera count", err);
            }
        });

        watch(() => props.stream, (newStream) => {
            if (newStream) {
                const track = newStream.getVideoTracks()[0];
                if (track && track.getCapabilities) {
                    const caps = track.getCapabilities() as any;
                    supportsTorch.value = !!caps.torch;
                } else {
                    supportsTorch.value = false;
                }
            } else {
                supportsTorch.value = false;
                isFlashOn.value = false;
            }
        }, { immediate: true });

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

        const handleOption = async (key: string) => {
            const option = mobileOptions.value.find(o => o.key === key);
            if (option?.disabled) return;

            switch (key) {
                case 'toggle-flash':
                    const track = props.stream?.getVideoTracks()[0];
                    if (track) {
                        try {
                            isFlashOn.value = !isFlashOn.value;
                            // Apply the native torch constraint to the existing track
                            await track.applyConstraints({
                                advanced: [{ torch: isFlashOn.value }]
                            } as any);
                        } catch (err) {
                            console.error('Failed to toggle flash:', err);
                            isFlashOn.value = !isFlashOn.value; // Revert UI if hardware rejects it
                        }
                    }
                    break;
                case 'flip-camera':
                    emit('flip-camera');
                    break;
            }
        };


        const open = () => {
            isOpen.value = true;
        }

        const close = () => {
            isOpen.value = false;
        }
        expose({ close, open } as PatientRefferalExposed);


        return {
            mobileOptions,
            isOpen,
            handleOption,
        }
    }
})
</script>