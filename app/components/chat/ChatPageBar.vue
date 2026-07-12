<template>
    <div class=" relative z-20 w-full">
        <div v-if="selectedChat"
            class=" h-16 w-full z-50 md:h-20 gap-x-4 relative bg-surface border-b border-b-outline-variant flex items-center justify-between py-4 px-5">
            <div
                class=" w-full md:flex-row flex-row-reverse relative items-center justify-end gap-x-4 md:justify-between flex">
                <div @click="openProfile" class="cursor-pointer flex items-center gap-x-3">
                    <div class="w-10 h-10 relative shrink-0">
                        <ContactAvatar v-if="contact" :contact="contact" />
                    </div>
                    <div class="select-none">
                        <div class="text-on-surface text-label-md">{{ selectedChat.name }} {{ selectedChat.lastName }}
                        </div>
                        <div class="text-on-surface/50 text-body-sm">
                            {{ t('chat.lastSeen', { time: formatRelativeDate(selectedChat.lastSeen) }) }}
                        </div>
                    </div>
                </div>

                <div class=" z-1001 relative h-6">
                    <div class="relative transition-all duration-200 ease-in-out"
                        :class="[isSelectMode ? '-translate-y-6' : 'translate-y-0']">
                        <div class="flex relative items-center gap-x-4 transition-all duration-200 ease-in-out"
                            :class="[isSelectMode ? ' pointer-events-none opacity-0' : ' opacity-100 pointer-events-auto']">
                            <div class="  hidden md:block">
                                <BIcon @click="initCall" icon="PhPhone" v-if="selectedChat.serviceType !== 'chat'"
                                    class="w-6 h-6  cursor-pointer"
                                    :class="[contact?.isActive || isInCall ? 'cursor-pointer fill-on-surface/50' : 'fill-on-surface/25 cursor-not-allowed']" />
                            </div>
                            <div class=" w-6 h-6 overflow-visible">
                                <MedicSelector @select="handleMenuAction" :options="options">
                                    <template #trigger>
                                        <BIcon icon="PhDotsThreeVertical"
                                            class="w-6 h-6 fill-on-surface/50 cursor-pointer" />
                                    </template>
                                </MedicSelector>
                            </div>
                        </div>
                        <div :class="[!isSelectMode ? ' pointer-events-none opacity-0' : ' opacity-100 pointer-events-auto']"
                            class=" hidden md:flex items-center  gap-x-4 ">
                            <BIcon @click="deleteMessages" icon="PhTrash" class=" w-6 h-6 "
                                :class="[canDelete ? 'fill-error cursor-pointer' : 'cursor-not-allowed fill-on-surface/50']" />
                            <BIcon @click="copy" icon="PhCopy" class=" w-6 h-6 cursor-pointer fill-on-surface" />
                        </div>
                    </div>
                </div>
            </div>
            <BIcon @click="goBack" icon="PhArrowLeft" class=" md:hidden fill-on-surface/50 w-6 h-6 cursor-pointer" />
        </div>
        <div class=" w-full  absolute bottom-0 z-20 h-0 overflow-visible">
            <div class=" w-full flex items-center  transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap text-wrap px-2 bg-diamond-primary-secondary"
                :class="[callData.show ? ' h-11' : 'h-0']">
                <div class=" w-full flex items-center gap-x-3 transition-all duration-200 ease-in-out"
                    :class="[callData.show ? 'opacity-100' : 'opacity-0']">
                    <BIcon class=" fill-white  w-5 shrink-0 h-5" icon="PhPhoneCall" />
                    <div class=" flex-1 text-white select-none text-label-md">{{ callData.duration }}</div>
                    <BIcon class=" fill-white cursor-pointer w-5 shrink-0 h-5" @click="backToCall"
                        icon="PhFrameCorners" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, ref, computed, type PropType, useTemplateRef } from 'vue';
import { useCallStore, useChatActionStore, useMessagesStore, useChatStore, useI18n, useDate } from '~/nuxt-shims';
import type { Menu } from '~/types/components/menu';
import type { Contact } from '~/types/chat';
import type { Popup } from '~/types/components/popup';
import ContactAvatar from './contact/ContactAvatar.vue';
import type { MenuOption } from '~/types/components/menu-options';
import MedicSelector from './medic-features/MedicSelector.vue';
import { useEventBus } from '@vueuse/core';
import { formatDuration } from '~/utils/format'
export default defineComponent({
    name: 'PageBar',
    props: {
        contact: {
            type: Object as PropType<Contact | null>,
            required: true,
        },
        options: {
            type: Array as PropType<MenuOption[]>,
            default: () => [],
            required: true,
        }
    },
    components: {
        ContactAvatar,
        MedicSelector,
    },
    emits: ['call', 'open-profile'],
    setup(props, { emit }) {
        const chatActionStore = useChatActionStore()
        const messagesStore = useMessagesStore()
        const { formatRelativeDate } = useDate();
        const { t } = useI18n();
        const callStore = useCallStore()
        const chatStore = useChatStore()

        const referBus = useEventBus('open-referral');


        const currentConversationId = computed(() => chatStore.activeConversationId)
        const menuRef = ref<Menu | null>(null)
        const selectedChat = computed(() => props.contact)
        const menuMode = ref<'medic' | 'options'>('options')

        const isSelectMode = computed(() => messagesStore.isSelectMode)
        const canDelete = computed(() => messagesStore.canDelete)
        // Template Ref for the Menu





        const actions = ref([
            { icon: 'PhPhone', key: 'call' },
            //    { icon: 'PhMagnifyingGlass', key: 'search' },
        ]);

        const handleAction = (key: 'search' | 'call') => {
            switch (key) {
                case 'call':
                    emit('call')
                    break;
                case 'search':

                    break;
            }
        };

        const handleMenuAction = (key: string) => {
            switch (key) {
                case 'add-user':
                    menuRef.value?.close()
                    setTimeout(() => {
                        menuRef.value?.open()
                    }, 200)
                    break;
                case 'delete-all':

                    break;
                case 'end-chat':

                    break;
                case 'refer':
                    referBus.emit();
                    break;
                case 'prescribe-meds':

                    if (currentConversationId.value) {
                        if (props.contact?.nationalCode && props.contact.nationalCode.trim().length > 0) {

                        } else {
                            chatActionStore.triggerPersonalInfoRequest(currentConversationId.value ?? 0);
                        }
                    }
                    break;
            }
            menuRef.value?.close()
        }


        const openProfile = () => {
            emit('open-profile')
        }

        const goBack = () => {
            chatStore.setSelectedChat(null)
        }

        const copy = () => {
            messagesStore.copyMessageText()
        }

        const deleteMessages = () => {
            if (!canDelete.value) return
            messagesStore.triggerDelete();
        }

        const isTransitioning = ref(false)

        const handleSelect = (key: string) => {
            if (key === 'add-user') {
                isTransitioning.value = true;
                menuRef.value?.close();
                setTimeout(() => {
                    menuMode.value = 'medic';
                    setTimeout(() => {
                        menuRef.value?.open();
                        isTransitioning.value = false;
                    }, 200);
                }, 200)
            } else {
                switch (key) {
                    case 'prescribe-meds':
                        if (props.contact?.nationalCode && props.contact.nationalCode.trim().length > 0) {
                            chatActionStore.triggerPrescription(props.contact.id);
                        } else {
                            chatActionStore.triggerPersonalInfoRequest(currentConversationId.value ?? 0);
                        }
                        break;
                }
                menuRef.value?.close();
            }
        };


        const closeMenu = () => {
            menuRef.value?.close()
        }

        const callData = computed(() => {
            return {
                show: callStore.isActive,
                duration: formatDuration(callStore.elapsedTime)
            }
        })

        const initCall = () => {
            const kind = props.contact?.serviceType
            if (
                props.contact?.isActive &&
                currentConversationId.value &&
                (kind === 'voice-call' || kind === 'video-call')
            ) {
                callStore.startCall(props.contact, currentConversationId.value, kind)
            }
        }

        const isInCall = computed(() => callStore.isActive)

        const backToCall = () => {
            callStore.maximize()
        }

        return {
            t,
            copy,
            selectedChat,
            callData,
            isInCall,
            backToCall,
            formatRelativeDate,
            deleteMessages,
            actions,
            handleMenuAction,
            handleAction,
            menuRef,
            isSelectMode,
            goBack,
            canDelete,
            closeMenu,
            openProfile,
            handleSelect,
            menuMode,
            initCall,
        };
    }
})
</script>