<template>
    <BPopup ref="popup" no-padding :has-close="false" @closed="onClosed">
        <div ref="popupContent" :class="[selectedPeriod.value !== '' ? 'overflow-y-auto ' : ' overflow-visible']"
            class="w-full flex lg:gap-y-0 gap-y-4 gap-x-4 px-6 flex-col lg:pt-4 lg:flex-row max-h-[85vh] pb-6 items-start lg:justify-center transition-all duration-300 ease-in-out">

            <div v-show="!isMobile || step === 1" class="w-full relative   lg:w-86 shrink-0 transition-all">
                <div class=" w-full ">

                    <div class="mb-4 flex items-center gap-x-3">
                        <BIcon icon="PhX" class="cursor-pointer w-4 h-4 fill-on-surface" @click="closePopup" />
                        <div class="select-none text-on-surface text-label-sm">{{ t('chat.prescription.title') }}</div>
                    </div>
                    <!-- Customizable section requested by parent components -->
                    <slot name="prescription-content" v-bind="prescriptionContentSlotProps">
                        <div class="w-full flex max-h-[85vh] relative overflow-y-auto flex-col">
                            <BSelect :placeholder="t('general.select')" :title="t('chat.prescription.period')"
                                :options="periodOptions" v-model="selectedPeriod.value" :color="selectedPeriod.color"
                                :message="selectedPeriod.message" />

                            <div v-if="selectedPeriod.value === 'hospitalization'" class="w-full flex flex-col">
                                <BInput :title="t('chat.prescription.timePeriod')" :placeholder="t('general.write')"
                                    v-model="hospitalizationPeriod" />
                                <BInput textarea :title="t('chat.prescription.descriptions')"
                                    :placeholder="t('general.write')" v-model="hospitalizationDescriptions" />
                                <BButton class="min-w-full mt-2" :loading="isSending"
                                    :text="t('chat.prescription.submit')" @click="handleHospitalization({
                                        period: hospitalizationPeriod,
                                        descriptions: hospitalizationDescriptions
                                    })" />
                            </div>

                            <div v-if="selectedPeriod.value === 'prescription'" class="w-full flex flex-col">
                                <BInput :title="t('chat.prescription.medicationName')" :placeholder="t('general.write')"
                                    v-model="fallbackMedicationName" />
                                <BInput :title="t('chat.prescription.dose')" :placeholder="t('general.write')"
                                    v-model="fallbackDose" />
                                <BInput :title="t('chat.prescription.repetitionAmount')"
                                    :placeholder="t('general.write')" v-model="fallbackRepetitionAmount" />
                                <BInput textarea :title="t('chat.prescription.usageMethod')"
                                    :placeholder="t('general.write')" v-model="fallbackUsageMethod" />
                                <BButton class="mt-2 lg:min-w-auto min-w-full w-full lg:w-auto" right-icon="PhPlus"
                                    :text="t('chat.prescription.addMedications')" type="outline"
                                    @click="addFallbackMedication" />
                            </div>
                        </div>
                    </slot>
                </div>
                <div v-if="selectedPeriod.value === 'prescription'"
                    class=" right-0 px-6 bg-linear-to-b  z-10005 py-4 w-full fixed min-w-full lg:hidden bottom-0"
                    :class="[prescribedMeds.length === 0 ? 'from-surface/0 to-surface/0 pointer-events-none' : ' pointer-events-auto from-surface/0 to-surface']">
                    <BButton class="w-full min-w-full transition-all duration-200 ease-in-out "
                        :class="[prescribedMeds.length === 0 ? ' translate-y-[200%]' : 'translate-y-0']"
                        :text="t('chat.prescription.continue')" @click="goToStep(2)" />
                </div>
            </div>

            <Transition :name="isMobile ? '' : 'width-expand'">
                <div v-show="(!isMobile || step === 2) && selectedPeriod.value === 'prescription' && prescribedMeds.length > 0"
                    class="lg:w-102 w-full flex flex-col  lg:h-160 max-h-[75vh] h-auto">

                    <div class="w-full h-full min-h-full flex flex-col gap-y-4">
                        <div
                            class="w-full overflow-y-auto md:overflow-hidden rounded-xl bg-surface-variant select-none px-3 pt-3 flex flex-col gap-y-3 flex-1 min-h-0">
                            <div class="shrink-0 text-body-sm text-on-surface/50">
                                {{ t('chat.prescription.medicine') }}
                            </div>
                            <div class="w-full flex flex-col flex-1 gap-y-2 pb-3 overflow-y-auto hide-scrollbar">
                                <div v-for="(medicine, index) in prescribedMeds" :key="medicine.id"
                                    class="w-full p-3 rounded-xl bg-surface border border-outline-variant">
                                    <div class="w-full flex items-start justify-between gap-x-3">
                                        <div class="text-label-md text-on-surface">
                                            {{ medicine.medication.title }}
                                        </div>
                                        <BIcon icon="PhTrash" class="cursor-pointer w-5 h-5 fill-on-surface/60"
                                            @click="deleteMedicine(index)" />
                                    </div>
                                    <div class="mt-2 text-body-sm text-on-surface/80">
                                        {{ t('chat.prescription.dose') }}: {{ medicine.dose }}
                                    </div>
                                    <div class="mt-1 text-body-sm text-on-surface/80">
                                        {{ t('chat.prescription.usageMethod') }}: {{ medicine.usageMethod }}
                                    </div>
                                    <div class="mt-1 text-body-sm text-on-surface/80">
                                        {{ t('chat.prescription.usage', {
                                            amount: medicine.period.amount,
                                            period: medicine.period.period === 'day'
                                                ? t('calendar.form.repetition.day')
                                                : t('calendar.form.repetition.hour')
                                        }) }}
                                    </div>
                                    <div v-if="medicine.warning" class="mt-1 text-body-sm text-on-surface/80">
                                        {{ t('chat.prescription.warning') }}: {{ medicine.warning }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="w-full flex gap-x-3 justify-end items-center mt-4 shrink-0">
                        <BButton v-if="isMobile && step === 2" color="secondary" :disabled="isSending"
                            class="flex-1 lg:hidden" :text="t('chat.prescription.back')" @click="goToStep(1)" />

                        <BButton class="flex-1  lg:max-w-90 w-full" :loading="isSending"
                            :text="t('chat.prescription.submit')" @click="handlePrescription" />
                    </div>
                </div>
            </Transition>
        </div>
    </BPopup>
</template>

<script lang="ts">
import { defineComponent, useTemplateRef, computed, ref, watch, nextTick, onUnmounted, type SlotsType } from 'vue';
import { useChatActionStore, useI18n, useWindowSize, useAppToast } from '#imports';
import type { Popup } from '~/types/components/popup';
import type { PrescribedMedication } from '~/types/medication';
import type { DropdownOption } from '~/types/components/select';

interface PeriodValueState {
    value: '' | 'hospitalization' | 'prescription';
    color: 'primary' | 'error';
    message: string;
}

/**
 * Props exposed by the `prescription-content` slot.
 * Parent components can use these to render a custom form while preserving
 * the shared popup state and submission flow.
 */
interface PrescriptionContentSlotProps {
    selectedPeriod: PeriodValueState;
    periodOptions: DropdownOption[];
    prescribedMeds: PrescribedMedication[];
    addMedication: (medication: PrescribedMedication) => void;
    deleteMedicine: (index: number) => void;
    setPeriodValue: (value: PeriodValueState['value']) => void;
    goToStep: (targetStep: number) => void;
    isMobile: boolean;
    step: number;
}

export default defineComponent({
    name: 'PrescriptionDisplay',
    slots: Object as SlotsType<{
        'prescription-content': (props: PrescriptionContentSlotProps) => any;
    }>,
    setup() {
        const { t } = useI18n();
        const chatActionStore = useChatActionStore();
        const { width } = useWindowSize();
        const { openToast } = useAppToast();

        const popup = useTemplateRef<Popup>('popup');
        const popupContent = useTemplateRef<HTMLElement>('popupContent');

        const isMobile = computed(() => width.value < 1024);
        const step = ref(1);
        const isTransitioning = ref(false);
        const isSending = ref(false);

        const prescribedMeds = ref<PrescribedMedication[]>([]);
        const selectedPeriod = ref<PeriodValueState>({
            value: '',
            color: 'primary',
            message: '',
        });
        const fallbackMedicationName = ref('');
        const fallbackDose = ref('');
        const fallbackRepetitionAmount = ref('');
        const fallbackUsageMethod = ref('');
        const hospitalizationPeriod = ref('');
        const hospitalizationDescriptions = ref('');

        const periodOptions = computed<DropdownOption[]>(() => [
            { value: 'hospitalization', label: t('chat.prescription.periodOptions.hospitalization') },
            { value: 'prescription', label: t('chat.prescription.periodOptions.prescriptionDrugs') }
        ]);

        watch(() => selectedPeriod.value.value, () => {
            if (selectedPeriod.value.color === 'error') {
                selectedPeriod.value.color = 'primary';
                selectedPeriod.value.message = '';
            }
        });

        // Bus listener
        const unsubscribe = chatActionStore.prescriptionBus.on(() => {
            popup.value?.open();
        });
        onUnmounted(() => unsubscribe());

        const addMedication = (med: PrescribedMedication) => {
            prescribedMeds.value.push(med);
        };

        const addFallbackMedication = () => {
            const name = fallbackMedicationName.value.trim();
            const dose = fallbackDose.value.trim();
            const repetition = fallbackRepetitionAmount.value.trim();
            const usageMethod = fallbackUsageMethod.value.trim();

            if (!name || !dose || !repetition || !usageMethod) {
                openToast(t('validation.required', { field: t('chat.prescription.medicationName') }), 'error');
                return;
            }

            addMedication({
                id: Date.now(),
                medication: {
                    id: Date.now(),
                    title: name,
                    englishTitle: name,
                    brands: [],
                },
                repetitionAmount: repetition,
                usageMethod,
                dose,
                period: {
                    period: 'day',
                    amount: Number(repetition) || 1,
                },
            });

            fallbackMedicationName.value = '';
            fallbackDose.value = '';
            fallbackRepetitionAmount.value = '';
            fallbackUsageMethod.value = '';
        };

        const scrollToBottom = () => {
            nextTick(() => {
                if (popupContent.value) {
                    popupContent.value.scrollTo({
                        top: popupContent.value.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            });
        };

        watch(
            () => prescribedMeds.value.length,
            (newLength, oldLength) => {
                if (newLength === 1 && oldLength === 0) {
                    setTimeout(() => {
                        scrollToBottom();
                    }, 200)
                }
            }
        );

        const goToStep = (targetStep: number) => {
            if (isTransitioning.value) return;
            isTransitioning.value = true;
            popup.value?.close();
            setTimeout(() => {
                step.value = targetStep;
                popup.value?.open();
                setTimeout(() => { isTransitioning.value = false; }, 300);
            }, 300);
        };

        const setPeriodValue = (value: PeriodValueState['value']) => {
            selectedPeriod.value.value = value;
        };

        const handleHospitalization = async (data: any) => {
            if (!data.period?.trim() || !data.descriptions?.trim()) {
                openToast(t('validation.required', { field: t('chat.prescription.descriptions') }), 'error');
                return;
            }
            isSending.value = true;
            try {
                // Mock API Delay
                await new Promise(res => setTimeout(res, 1500));
                openToast(t('chat.prescription.hospitalizationSuccess'), 'success');
                closePopup();
            } finally {
                isSending.value = false;
            }
        };

        const handlePrescription = async () => {
            if (prescribedMeds.value.length === 0) {
                openToast(t('chat.prescription.emptyList'), 'error');
                return;
            }
            isSending.value = true;
            try {
                // Mock API Delay
                await new Promise(res => setTimeout(res, 1500));
                openToast(t('chat.prescription.success'), 'success');
                closePopup();
            } finally {
                isSending.value = false;
            }
        };

        const deleteMedicine = (index: number) => {
            prescribedMeds.value.splice(index, 1);
        };

        const prescriptionContentSlotProps = computed<PrescriptionContentSlotProps>(() => ({
            selectedPeriod: selectedPeriod.value,
            periodOptions: periodOptions.value,
            prescribedMeds: prescribedMeds.value,
            addMedication,
            deleteMedicine,
            setPeriodValue,
            goToStep,
            isMobile: isMobile.value,
            step: step.value,
        }));

        const onClosed = () => {
            if (isTransitioning.value) return;
            // Fully reset state when user explicitly closes or after success
            selectedPeriod.value = { value: '', color: 'primary', message: '' };
            prescribedMeds.value = [];
            step.value = 1;
            fallbackMedicationName.value = '';
            fallbackDose.value = '';
            fallbackRepetitionAmount.value = '';
            fallbackUsageMethod.value = '';
            hospitalizationPeriod.value = '';
            hospitalizationDescriptions.value = '';
        };

        const closePopup = () => {
            popup.value?.close();
        };

        return {
            t, periodOptions, popup,
            selectedPeriod, prescribedMeds, step, isMobile, isSending,
            addMedication, goToStep, handleHospitalization, handlePrescription,
            closePopup, onClosed, popupContent, deleteMedicine,
            addFallbackMedication, fallbackMedicationName, fallbackDose,
            fallbackRepetitionAmount, fallbackUsageMethod, hospitalizationPeriod,
            hospitalizationDescriptions, prescriptionContentSlotProps,
        };
    }
});
</script>
<style scoped>
/* Vertical Form Animation */
.form-fade-enter-active,
.form-fade-leave-active {
    transition: opacity 0.2s ease-in-out;
}

.form-fade-enter-from,
.form-fade-leave-to {
    opacity: 0;
}

.form-fade-enter-to,
.form-fade-leave-from {
    opacity: 1;
}

/* Horizontal List Animation */
.width-expand-enter-active,
.width-expand-leave-active {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    white-space: nowrap;
}

.width-expand-enter-from,
.width-expand-leave-to {
    opacity: 0;
    max-width: 0;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
}

.width-expand-enter-to,
.width-expand-leave-from {
    opacity: 1;
    max-width: 408px;
    /* lg:w-102 equates to approx 25.5rem or 408px */
}
</style>

