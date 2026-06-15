<template>
    <div class=" w-full h-full relative rounded-2xl p-2 flex flex-col bg-black-600 gap-y-2 items-center border-2 overflow-hidden justify-center transition-all duration-200 ease-in-out"
        :class="[contact.isSpeaking ? ' border-primary' : ' border-primary/0']">

        <!-- Video Background Feature -->
        <video v-show="hasActiveStream" ref="videoRef" autoplay playsinline :muted="isMine"
            class="absolute inset-0 w-full h-full object-cover "></video>

        <div class=" absolute p-2 w-full h-full z-0 top-0 left-0  flex flex-col justify-between" >
            <div class=" w-full flex justify-end items-center">
                <div :class="[contact.isSpeaking ? 'opacity-100' : 'opacity-0']"
                    class="cursor-pointer rounded-full bg-black-500 transition-all duration-200 ease-in-out w-10 h-10 flex items-center justify-center">
                    <BIcon icon="PhWaveform" class=" w-4 h-4 fill-white" />
                </div>
            </div>
            <div class=" w-full flex items-center">
                <div @click="toggleFullScreen"
                    class=" rounded-full w-10 h-10 cursor-pointer flex items-center justify-center bg-black-500">
                    <BIcon :icon="!isFullScreen ? 'PhFrameCorners' : 'PhCornersIn'" class="  w-4 h-4 fill-white" />
                </div>
            </div>
        </div>

        <!-- Avatar Fallback Logic -->
        <div v-if="!hasActiveStream" class=" w-18 h-18">
            <ContactAvatar :showOnline="false" :contact="contact" />
        </div>

        <!-- Name Label (Z-index ensures visibility over video) -->
        <div :class="{ 'absolute bottom-4 left-4 z-20': hasActiveStream }"
            class=" text-white text-label-md sm:text-title-lg select-none">
            {{ contact.name }} {{ contact.lastName }}
        </div>
    </div>
</template>

<script lang="ts">
import { type PropType, defineComponent, computed, ref, watch, onMounted } from 'vue';
import type { CallMember } from '~/types/call';
import ContactAvatar from '../chat/contact/ContactAvatar.vue';
import { useChatStore } from '#imports';

export default defineComponent({
    name: 'CallMemberDisplay',
    props: {
        contact: {
            type: Object as PropType<CallMember>,
            required: true,
        },
        isFullScreen: {
            type: Boolean,
            default: false
        }
    },
    components: {
        ContactAvatar,
    },
    emits: ['toggle-fullscreen'],
    setup(props, { emit }) {
        const chatStore = useChatStore();
        const videoRef = ref<HTMLVideoElement | null>(null);
        const isMine = computed(() => chatStore.currentUserId === props.contact.id);

        // Detect if camera is on or screen is being shared
        const hasActiveStream = computed(() => {
            return props.contact.stream !== null && (props.contact.isCameraOn || props.contact.isScreenSharing);
        });

        const toggleFullScreen = () => {
            emit('toggle-fullscreen');
        };

        //  watch(() => hasActiveStream.value, () => {
        //      if (hasActiveStream.value) {
        //          toggleFullScreen()
        //      } else {
        //          if (!isMine.value && props.isFullScreen) {
        //              toggleFullScreen()
        //          }
        //      }
        //  })

        // Manual binding for the MediaStream object
        const updateStream = () => {
            if (videoRef.value) {
                videoRef.value.srcObject = props.contact.stream;
            }
        };

        // Handle stream changes (e.g., swapping camera to screen share)
        watch(() => props.contact.stream, updateStream);
        onMounted(updateStream);

        return {
            isMine,
            videoRef,
            hasActiveStream,
            toggleFullScreen,
        };
    }
})
</script>
