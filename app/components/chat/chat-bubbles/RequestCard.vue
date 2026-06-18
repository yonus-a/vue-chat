<template>
    <div class=" p-3 w-80 flex flex-col gap-y-3 select-none bg-surface rounded-2xl shadow-floating">
        <div class=" w-full flex flex-col gap-y-3 h-full" v-if="isServiceRequest">
            <div class=" transition-all duration-200 ease-in-out select-none text-label-sm"
                :class="[isPending ? 'text-on-surface/50' : 'text-on-surface']">{{ t('chat.addMedic.title') }}</div>
            <div v-if="providers.length > 0" class=" w-full flex flex-col gap-y-3">
                <ProviderDisplay v-for="provider in providers" :key="provider.id" :provider="provider" />
            </div>
            <div v-else class=" h-14 w-full rounded-full flex items-center justify-center gap-x-2">
                <div class=" shrink-0 w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                    <BIcon icon="PhIdentificationCard" class=" fill-primary w-6 h-6" />
                </div>
                <div class="flex-1 flex-col h-full flex select-none text-on-surface justify-center">
                    <div class=" text-label-md" v-loading="isPending">
                        <div class=" h-7 w-30"></div>
                    </div>
                    <div class=" text-body-sm opacity-50">{{ request?.request.service.label }}</div>
                </div>
                <div class=" h-7 w-20 " v-loading="isPending"></div>
            </div>
            <div class=" w-full text-center select-none text-label-sm"
                :class="[isCanceled ? 'text-error' : 'text-primary']">{{ cardSubText }}
            </div>

        </div>
        <div class=" w-full flex flex-col justify-center gap-y-3 items-center" v-else>
            <div v-if="infoAccessContent && request?.request.status == 'pending'" class="w-full flex flex-col gap-y-2">
                <div class="text-label-sm text-on-surface opacity-50 select-none">
                    {{ infoAccessContent.title }}
                </div>
                <div class="text-body-sm text-on-surface leading-relaxed">
                    {{ infoAccessContent.description }}
                </div>
            </div>
            <div v-else-if="infoAccessContent"
                class="w-full flex flex-col gap-y-3 items-center select-none justify-center py-2">
                <BIcon weight="fill" :icon="infoAccessContent.icon" :class="[`fill-${infoAccessContent.color}`]"
                    class="w-14 h-14" />
                <div :class="[`text-${infoAccessContent.color}`]" class="text-label-md font-medium text-center">
                    {{ infoAccessContent.text }}
                </div>
            </div>
        </div>
        <div class=" w-full flex items-center gap-x-3">
            <BButton v-loading="isSending" class=" shrink-0 flex-1 " v-for="button in requestButtonProps"
                :key="button.key" :disabled="button.disabled || !!chatActionStore.processingActions.get(message.id)"
                :loading="button.loading" :color="button.color" :type="button.type" :text="button.text"
                @click="handleAction(button.key)" />
        </div>
        <div @click="handleCopyCode" class=" gap-x-3 w-full flex items-center justify-center cursor-pointer"
            v-if="isMedic && message.request?.type === 'add-person' && message.request.request.status === 'approved'">
            <div class=" text-on-surface text-label-lg select-none">{{ contact.nationalCode }}</div>
            <BIcon :icon="isCopied ? 'PhCheckCircle' : 'PhCopy'" class=" w-4.5 h-4.5 fill-on-surface/50" />
        </div>
        <BModal @action="handleModalAction" ref="modal" />
    </div>
</template>
<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, type PropType, computed } from 'vue';
import type { Message, Contact } from '~/types/chat';
import { useI18n, useChatStore, useChatActionStore, useAppToast } from '~/nuxt-shims';
import ContactAvatar from '../contact/ContactAvatar.vue';
import type { Modal } from '~/types/components/modal';
import ProviderDisplay from './request-card/ProviderDisplay.vue';
export default defineComponent({
    name: 'RequestCard',
    props: {
        message: {
            type: Object as PropType<Message>,
            required: true,
        },
        contact: {
            type: Object as PropType<Contact>,
            required: true,
        }
    },
    components: {
        ContactAvatar,
        ProviderDisplay,
    },
    setup(props) {
        const { t } = useI18n()
        const { openToast } = useAppToast()
        const modal = ref<Modal | null>(null)
        const isCopied = ref(false)




        const isSending = computed(() => !props.message.isSent)
        const chatActionStore = useChatActionStore()
        const chatStore = useChatStore()
        const role = computed(() => chatStore.chosenRole)
        const request = computed(() => props.message.request)
        const isServiceRequest = computed(() => request.value?.type === 'add-person');
        const providers = computed(() => {
            if (request.value?.type !== 'add-person') return null
            return request.value.request.provider
        })

        const handleCopyCode = async () => {
            if (!props.contact.nationalCode) return
            try {
                await navigator.clipboard.writeText(props.contact.nationalCode);
                isCopied.value = true;
                openToast(t('chat.requestCard.infoAccess.copySuccess'), 'success');
                setTimeout(() => {
                    isCopied.value = false;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        };


        const isPending = computed(() => {
            if (request.value?.type === 'add-person') {
                if (!request.value?.request.status) return true
                let finalKeys = ['approved', 'rejected', 'expired']
                const providers = request.value.request.provider;
                return !finalKeys.includes(request.value.request.status) && providers && providers.length !== 1
            } else {

            }
        })


        const isMedic = computed(() => chatStore.currentUserId == props.message.senderId && chatStore.chosenRole !== 'user')

        const cardSubText = computed(() => {
            let text = ''
            let status = request.value.request.status
            if (request.value?.type === 'add-person') {
                switch (status) {
                    case 'payment':
                        text = isMedic.value ? t('chat.requestCard.addMedic.awaitingPayment') : t('chat.requestCard.addMedic.awaitingPatientPayment')
                        break;
                    case 'searching':
                        text = t('chat.requestCard.addMedic.searching')
                        break;
                    case 'pending':
                        text = !isMedic.value ? t('chat.requestCard.addMedic.awaitingApproval') : t('chat.requestCard.addMedic.awaitingMedicApproval')
                        break;
                    case 'rejected':
                        text = t('chat.requestCard.addMedic.rejected')
                        break;
                    case 'expired':
                        text = t('chat.requestCard.addMedic.expired')
                }
            }
            return text
        })

        const isCanceled = computed(() => {
            if (request.value?.type === 'personal-info') return false
            return request.value?.request.status === 'expired' || request.value?.request.status === 'rejected'
        })


        const messageId = computed(() => props.message.id)
        const chatId = computed(() => chatStore.activeConversationId)


        const requestButtonProps = computed(() => {
            const isBusy = (key: string) => chatActionStore.isActionBusy(messageId.value, key);
            if (request.value?.type === 'add-person') {




                const status = request.value.request.status;
                const isSelf = isMedic.value;
                const providersList = providers.value || [];

                // 1. Handle Failed/Ended states
                if (['expired', 'rejected'].includes(status)) {
                    return [{ type: 'fill', color: 'secondary', text: t('chat.requestCard.addMedic.retry'), key: 'resend-request' }];
                }

                // 2. Handle Active/Searching states
                if (['pending', 'searching'].includes(status)) {
                    return isSelf
                        ? [{
                            type: 'outline', color: 'error', text: t('chat.requestCard.addMedic.cancel'), key: 'cancel-request',
                            loading: isBusy('cancel-request')
                        }]
                        : [
                            { type: 'fill', color: 'primary', text: t('chat.requestCard.addMedic.confirmRequest'), key: 'approve-request-user' },
                            { type: 'fill', color: 'secondary', text: t('chat.requestCard.addMedic.reject'), key: 'reject-medic-request' }
                        ];
                }

                // 3. Handle Payment state (Only shown to the patient)
                if (status === 'payment' && !isSelf) {
                    // Condition: Disabled if NO provider has reached the 'payment' status
                    const hasPaymentProvider = providersList.some(p => p.status === 'payment');

                    return [{
                        type: 'fill',
                        color: 'primary',
                        text: t('chat.requestCard.addMedic.pay'),
                        key: 'pay-request',
                        disabled: !hasPaymentProvider
                    }];
                }
            } else {
                const status = request.value?.request.status

                if (status !== 'pending') return null;

                if (isMedic.value) {
                    return [{
                        type: 'fill',
                        color: 'secondary',
                        text: t('chat.requestCard.infoAccess.cancelRequest'),
                        key: 'cancel-request',
                        loading: isBusy('cancel-request')
                    }];
                } else {
                    return [
                        {
                            type: 'fill',
                            color: 'primary',
                            text: t('chat.requestCard.infoAccess.confirmAndShare'),
                            key: 'confirm-access',
                            loading: isBusy('confirm-access'),
                        },
                        {
                            type: 'fill',
                            color: 'secondary',
                            text: t('chat.requestCard.infoAccess.cancel'),
                            key: 'reject-access',
                            loading: isBusy('reject-access'),
                        }
                    ];
                }
            }

            return null;
        });

        const handleAction = (key: string) => {
            if (isSending.value) return
            if (chatActionStore.processingActions.has(props.message.id)) return;
            switch (key) {
                case 'cancel-request':
                    // Pass the current message ID in an array to trigger the delete flow
                    chatActionStore.triggerDelete([props.message.id]);
                    break;
                case 'confirm-access':
                    chatActionStore.handleAccessResponse(
                        messageId.value,
                        chatId.value,
                        key as 'confirm-access',
                        request.value
                    );
                    break;
                case 'reject-access':
                    modal.value?.openModal(t('chat.requestCard.infoAccess.rejectModal.title'), t('chat.requestCard.infoAccess.rejectModal.description'), 'error', true, t('chat.requestCard.infoAccess.rejectModal.reject'))
                    break;
                case 'approve-request-user':
                    // Handle approval logic
                    break;

                case 'reject-medic-request':
                    // Handle rejection logic
                    break;

                case 'pay-request':
                    // Handle payment logic
                    break;

                case 'resend-request':
                    // Handle retry/resend logic
                    break;
            }
        };

        const infoAccessContent = computed(() => {
            const req = request.value;
            if (req?.type !== 'personal-info') return null;

            const status = req.request.status
            const isSelf = isMedic.value;

            if (status === 'pending') {
                return {
                    title: isSelf
                        ? t('chat.requestCard.infoAccess.medicTitle')
                        : t('chat.requestCard.infoAccess.patientTitle'),
                    description: isSelf
                        ? t('chat.requestCard.infoAccess.medicDescription')
                        : t('chat.requestCard.infoAccess.patientDescription')
                };
            } else {
                let icon = 'PhXSquare';
                let color = 'error';
                let text = '';

                if (status === 'approved') {
                    color = 'secondary';
                    icon = 'PhCheckSquare';
                }

                switch (status) {
                    case 'approved':
                        text = isSelf
                            ? t('chat.requestCard.infoAccess.medicSuccess')
                            : t('chat.requestCard.infoAccess.patientSuccess');
                        break;
                    case 'expired':
                        text = t('chat.requestCard.infoAccess.requestExpired');
                        break;
                    case 'rejected':
                        text = t('chat.requestCard.infoAccess.medicReject');
                        break;
                }

                return { icon, color, text };
            }
        });

        const handleModalAction = () => {
            modal.value?.closeModal()
            chatActionStore.handleAccessResponse(
                messageId.value,
                chatId.value,
                'reject-access',
                request.value
            );
        }


        return {
            handleAction,
            t,
            isPending,
            role,
            isServiceRequest,
            request,
            cardSubText,
            providers,
            isSending,
            chatActionStore,
            handleCopyCode,
            requestButtonProps,
            isMedic,
            modal,
            isCanceled,
            handleModalAction,
            isCopied,
            infoAccessContent,
        }
    }
})
</script>
