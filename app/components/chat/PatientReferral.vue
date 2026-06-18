<template>
    <BPopup @closed="resetFields" no-padding ref="popup">
        <div class="md:max-w-86 w-dvw flex flex-col items-center py-4 px-6">
            <div class=" pb-4 flex items-center gap-x-3 w-full">
                <BIcon icon="PhX" class=" cursor-pointer w-4 h-4 fill-on-surface/50" @click="close" />
                <div class=" text-label-sm text-on-surface">{{ t('chat.patientReferral.referTo') }}</div>
            </div>
            <BSelect :placeholder="t('chat.patientReferral.select')" :title="t('chat.patientReferral.speciality')"
                :loading="isLoading" v-model="field.value" :color="field.color" :message="field.message"
                :options="serviceOptions" />
            <BSelect :placeholder="t('chat.patientReferral.select')" :title="t('chat.patientReferral.priority.title')"
                :loading="isLoading" v-model="priority.value" :color="priority.color" :message="priority.message"
                :options="referStates" />
            <BInput :placeholder="t('chat.patientReferral.write')" :title="t('chat.patientReferral.description')"
                textarea v-model="description.value" :color="description.color" :message="description.message" />
            <BButton @click="validateFields" class=" min-w-full w-full" color="primary" :disabled="hasErrors"
                :loading="isSending" :text="t('chat.patientReferral.submit')" />
        </div>
    </BPopup>
</template>
<script lang="ts">
import { defineComponent, watch, type PropType } from 'vue';
import type { Popup } from '~/types/components/popup';
import { useServiceStore, useI18n, useAppToast } from '~/nuxt-shims';
import { useEventBus } from '@vueuse/core';
import type { Contact } from '~/types/chat';
export interface PatientRefferalExposed {
    open: () => void;
    close: () => void;
}

export default defineComponent({
    name: 'PatientReferral',
    props: {
        contact: {
            type: Object as PropType<Contact>,
            required: true,
        }
    },
    setup(props, { expose }) {
        const serviceStore = useServiceStore()
        const { openToast } = useAppToast()
        const { t } = useI18n()

        const referBus = useEventBus('open-referral');
        referBus.on(() => open());

        const field = ref({
            value: [],
            message: '',
            color: 'primary'
        })

        const priority = ref({ value: 'high', color: 'primary', message: '' })

        const referStates = computed(() => [
            {
                label: t('chat.patientReferral.priority.high'),
                value: 'high'
            },
            {
                label: t('chat.patientReferral.priority.medium'),
                value: 'medium'
            },
            {
                label: t('chat.patientReferral.priority.low'),
                value: 'low'
            },
        ])

        const description = ref({
            value: '', color: 'primary', message: ''
        })

        const popup = ref<Popup | null>(null)
        const isLoading = computed(() => serviceStore.isLoadingServices)
        const isSending = ref(false)
        const hasErrors = ref(false)

        const serviceOptions = computed(() =>
            serviceStore.services.map(service => ({
                label: service.label,
                value: service.id,
            }))
        );


        const validateFields = () => {
            let errorsFound = false;

            if (!field.value.value || (Array.isArray(field.value.value) && field.value.value.length === 0)) {
                field.value.color = 'error';
                field.value.message = t('validation.required', { field: t('chat.patientReferral.speciality') });
                errorsFound = true;
            }

            if (!priority.value.value) {
                priority.value.color = 'error';
                priority.value.message = t('validation.required', { field: t('chat.patientReferral.priority.title') });
                errorsFound = true;
            }

            if (!description.value.value || !description.value.value.trim()) {
                description.value.color = 'error';
                description.value.message = t('validation.required', { field: t('chat.patientReferral.description') });
                errorsFound = true;
            }

            hasErrors.value = errorsFound;

            if (!errorsFound && !isSending.value) {
                submitReferral();
            }
        }

        watch(
            [
                () => field.value.value,
                () => priority.value.value,
                () => description.value.value
            ],
            ([newField, newPriority, newDesc], [oldField, oldPriority, oldDesc]) => {
                hasErrors.value = false;

                if (JSON.stringify(newField) !== JSON.stringify(oldField)) {
                    field.value.color = 'primary';
                    field.value.message = '';
                }
                if (newPriority !== oldPriority) {
                    priority.value.color = 'primary';
                    priority.value.message = '';
                }
                if (newDesc !== oldDesc) {
                    description.value.color = 'primary';
                    description.value.message = '';
                }
            },
            { deep: true }
        );

        const submitReferral = async () => {
            if (isSending.value || hasErrors.value) return
            try {
                isSending.value = true;
                openToast(t('chat.patientReferral.submitSuccess'), 'success')
                popup.value?.close()
            } catch (error) {
                openToast(t('chat.patientReferral.submitFail'), 'error')

            } finally {
                isSending.value = false;
            }
        }

        const open = () => {
            popup.value?.open()
        }

        const close = () => {
            popup.value?.close()
        }

        expose({ close, open } as PatientRefferalExposed);

        const resetFields = () => {
            field.value.value = []
            priority.value.value = 'high'
            description.value.value = ''
        }


        return {
            popup,
            t,
            isLoading,
            close,
            resetFields,
            field,
            description,
            priority,
            serviceOptions,
            hasErrors,
            isSending,
            validateFields,
            referStates,
        }
    }
})
</script>