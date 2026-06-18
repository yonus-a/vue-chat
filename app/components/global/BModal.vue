<template>
    <BPopup @closed="handleOnClosed" :auto-close="!isLoading" ref="popup" no-padding>
        <div v-if="!card" class=" p-6  w-dvw md:max-w-120 flex flex-col items-center text-wrap">
            <div class=" w-16 h-16 rounded-full flex items-center justify-center " :class="[modalColorings?.bgColor]">
                <BIcon :icon="modalIcon" class=" w-8 h-8" :class="[modalColorings?.iconColor]" weight="fill" />
            </div>
            <div class=" mt-4 flex flex-col w-full gap-y-3 items-center select-none">
                <div v-if="modalTitle.trim().length > 0" class=" text-label-lg text-on-surface">{{ modalTitle }}</div>
                <div class=" text-body-md text-on-surface/50" v-if="modalText.trim().length > 0">{{ modalText }}</div>
            </div>
            <div class=" w-full min-w-full flex items-center mt-8 gap-x-3">
                <div :class="[hasAction ? 'basis-1/2' : 'basis-full']">
                    <BButton class=" max-w-full w-full min-w-full" @click="handleAction" :loading="isLoading"
                        :text="actionButtonText" :type="primaryButtonMode.type" :color="primaryButtonMode.color" />
                </div>
                <div :class="[hasAction ? 'basis-1/2' : 'basis-0']">
                    <BButton class=" max-w-full w-full min-w-full" @click="closeModal" type="outline" color="primary"
                        :text="t('general.cancel')" />
                </div>
            </div>
        </div>
        <div v-else class=" w-dvw max-w-120">
            <div class=" flex items-center p-5 gap-x-2 w-full border-b border-b-outline-variant">
                <BIcon :icon="modalIcon" :class="[modalColorings?.iconColor]" class=" w-7 h-7" weight="fill" />
                <div class=" select-none  text-on-surface text-label-lg">{{ modalTitle }}</div>
            </div>
            <div class="border-b text-wrap border-b-outline-variant w-full p-5 select-none">
                <p class=" text-body-md text-on-surface/50">{{ modalText }}</p>
            </div>
            <div class=" w-full flex items-center p-5 gap-x-3">
                <BButton :text="actionButtonText" :type="primaryButtonMode.type" :color="primaryButtonMode.color"
                    :loading="isLoading" @click="handleAction" />
                <BButton @click="closeModal" color="secondary" type="outline" :text="t('chat.permissions.notNow')" />
            </div>
        </div>
    </BPopup>
</template>
<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';
import { type Popup } from '~/types/components/popup';
import { useI18n } from '~/nuxt-shims';
import type { ModalState } from '~/types/components/modal';
export default defineComponent({
    name: 'TheModal',
    props: {
        loading: {
            type: Boolean,
            default: false,
        },
        card: {
            type: Boolean,
            default: false
        }
    },
    emits: ['cancel', 'action', 'closed'],
    setup(props, { emit, expose }) {
        const { t } = useI18n()
        const popup = ref<Popup | null>(null)
        const modalState = ref<ModalState>('success')
        const modalText = ref('')
        const modalTitle = ref('')
        const hasAction = ref(false)
        const actionButtonText = ref(t('general.confirm'))
        const isLoading = computed(() => props.loading)

        const modalIcon = computed(() => {
            switch (modalState.value) {
                case 'error':
                    return 'PhWarningOctagon'
                case 'warning':
                    return 'PhWarning'
                case 'success':
                    return 'PhCheckCircle'
            }
        })

        const primaryButtonMode = computed(() => {
            let buttonType = ''
            let buttonColor = ''
            if (hasAction.value && modalState.value !== 'success') {
                buttonType = 'outline'
                buttonColor = modalState.value
            } else {
                buttonType = 'fill'
                buttonColor = 'primary'
            }
            return {
                color: buttonColor,
                type: buttonType
            }
        })

        const modalColorings = computed(() => {
            let finalColor = modalState.value === 'success' ? 'secondary' : modalState.value
            return {
                bgColor: `bg-${finalColor}/10`,
                iconColor: `fill-${finalColor}`
            }
        })

        const closeModal = () => {
            popup.value?.close()
        }

        const openModal = (title: string, description: string, color: ModalState, action: boolean = false, actionText?: string
        ) => {
            modalText.value = description
            modalTitle.value = title;
            modalState.value = color;
            hasAction.value = action;
            actionButtonText.value = actionText || t('general.confirm')
            popup.value?.open()
        }

        expose({
            openModal, closeModal
        })

        const handleAction = () => {
            if (hasAction.value) {
                emit('action')
            } else {
                closeModal()
                emit('cancel')
            }
        }


        const handleOnClosed = () => {
            emit('closed')
        }


        return {
            popup,
            modalColorings,
            modalIcon,
            isLoading,
            primaryButtonMode,
            modalTitle,
            modalText,
            actionButtonText,
            t,
            handleAction,
            closeModal,
            hasAction,
            handleOnClosed,
        }
    }
}) 
</script>