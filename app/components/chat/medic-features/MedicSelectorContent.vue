<template>
    <div class="  max-w-dvw w-full lg:w-90 lg:p-5 flex items-center justify-center ">
        <div class=" w-full max-w-90">
            <div class=" flex items-center gap-x-3">
                <BIcon icon="PhX" class=" w-5 h-5 cursor-pointer fill-on-surface/50 " @click="close" />
                <div class=" text-on-surface text-label-sm select-none">{{ t('chat.addMedic.title') }}</div>
            </div>
            <BSelect v-model="field" :title="t('chat.addMedic.expertise')" :placeholder="t('chat.addMedic.select')"
                :loading="isLoadingServices" :options="serviceOptions" class=" max-w-full min-w-full w-full pt-4" />
            <BCheckBox :disabled="isLoadingServices" v-model="autoSelect" :label="t('chat.addMedic.autoSelect')"
                mode="switch" />
            <div class=" w-full transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden"
                :class="[autoSelect ? 'h-0 pt-0 opacity-0 pointer-events-none' : 'h-auto pt-4 opacity-100 pointer-events-auto']">
                <BInput class=" max-w-full min-w-full w-full" icon="PhMagnifyingGlass" v-model="searchText"
                    :placeholder="t('chat.addMedic.search')" />
                <div class=" flex items-center gap-x-2">
                    <BLabel class="cursor-pointer" size="lg" :text="filter.label" @action="setFilter('')"
                        :color="filterProps(filter.key).color" v-for="filter in filters"
                        :icon="filterProps(filter.key).icon" :key="filter.key" @click="setFilter(filter.key)" />
                </div>
                <div class=" w-full h-90.5 mt-4 relative">
                    <div v-if="isLoading || providers.length > 0" class="w-full h-full">
                        <BVirtualVerticalList :items="providers" @load-more="serviceStore.fetchProviders(true)"
                            :hasNextPage="serviceStore.hasProviderNextPage" :loading="isLoading">
                            <template #item="{ item: medic }">
                                <div class=" w-full pb-2">
                                    <MedicDisplay @click="toggleSelect(medic)" :isSelected="isSelected(medic.id)"
                                        :medic="medic" :loading="isLoading && serviceStore.currentResultPage === 1" />
                                </div>
                            </template>
                        </BVirtualVerticalList>
                    </div>
                    <div v-else-if="!isLoading && providers.length === 0"
                        class=" w-full h-full flex items-center justify-center">
                        <NoDataDisplay :image-path="NoProviderImage" :title="t('chat.noProviders')" />
                    </div>
                    <div
                        class="pt-6 bg-linear-to-b from-surface/0 via-surface to-surface absolute bottom-0 left-0 z-20 w-full">

                    </div>
                </div>
            </div>
            <BButton :disabled="buttonProps.disabled" class=" transition-all duration-200 ease-in-out min-w-full"
                :class="[!autoSelect ? ' mt-0' : 'mt-4']" :text="buttonProps.text" @click="selectMedic" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, onMounted, watch } from 'vue';
import { useServiceStore, useI18n, useChatActionStore, useAppToast, useChatStore } from '~/nuxt-shims';
import MedicDisplay from './MedicDisplay.vue';
import NoDataDisplay from '~/components/general/NoDataDisplay.vue';
import NoProviderImage from '~/assets/lib-images/chat/no-provider-found.webp';
import type { Provider } from '~/types/service';

export default defineComponent({
    name: 'MedicSelector',
    emits: ['close'],
    components: {
        MedicDisplay,
        NoDataDisplay,
    },
    setup(_, { emit }) {
        const { t } = useI18n()
        const chatStore = useChatStore()
        const serviceStore = useServiceStore()
        const chatActionStore = useChatActionStore()
        const activeFilter = ref('')
        const autoSelect = ref(true)


        const { openToast } = useAppToast()

        const currentConversationId = computed(() => chatStore.activeConversationId ?? 0);

        const field = computed({
            get: () => serviceStore.selectedServiceId,
            set: (val) => serviceStore.selectedServiceId = val
        })
        const searchText = computed({
            get: () => serviceStore.searchText,
            set: (val) => serviceStore.searchText = val
        })

        const isLoadingServices = computed(() => serviceStore.isLoadingServices)
        const isLoading = computed(() => serviceStore.isLoading)
        const providers = computed(() => serviceStore.providers)


        const selectedExpertiseLabel = computed(() => {
            const selected = serviceStore.services.find(s => s.id === field.value);
            return selected ? selected.label : t('chat.addMedic.select');
        });



        const filters = computed(() => [
            { key: 'available', label: t('chat.addMedic.available') },
            { key: 'online', label: t('chat.addMedic.online') },
        ]);

        const setFilter = (type: string) => {
            if (activeFilter.value === type) return;
            activeFilter.value = type;
        };

        const close = () => {
            emit('close')
        }

        const serviceOptions = computed(() =>
            serviceStore.services.map(service => ({
                label: service.label,
                value: service.id,
            }))
        );

        // Trigger the fetch when the selector opens
        onMounted(async () => {
            // 1. Fetch services first
            if (serviceStore.services.length === 0) {
                await serviceStore.fetchServices();
            }

            // 2. Set default expertise if none selected
            if (!field.value && serviceStore.services.length > 0) {
                field.value = serviceStore.services[0].id;
            }
            await serviceStore.fetchProviders(false);
        });

        // 2. Watcher: When filters, search, or expertise changes, reset and fetch providers
        watch([field, searchText, activeFilter], () => {
            serviceStore.resetProviderData();
            // Trigger initial fetch with explicit parameters for serviceId and searchString
            serviceStore.fetchProviders(false, field.value, searchText.value);
        }, { immediate: false });

        const filterProps = (type: string) => {
            return activeFilter.value === type
                ? { color: 'primary', icon: 'PhX' }
                : { color: 'neutral', icon: '' };
        };

        const selectedMedics = ref<Provider[]>([]);

        const toggleSelect = (medic: Provider) => {
            if (isLoading.value || !medic.id) return;

            const index = selectedMedics.value.findIndex(p => p.id === medic.id);

            if (index > -1) {
                selectedMedics.value.splice(index, 1);
            } else {
                if (selectedMedics.value.length >= 5) {
                    openToast(t('chat.addMedic.error.maxMedics'), 'error');
                    return;
                }
                selectedMedics.value.push(medic);
            }
        };

        const isSelected = (id: string) => selectedMedics.value.some(p => p.id === id);

        const buttonProps = computed(() => {
            let buttonText = t('chat.addMedic.buttonText.single')
            let disabled = !autoSelect.value && (selectedMedics.value.length > 5 || selectedMedics.value.length === 0);
            if (selectedMedics.value.length > 1) {
                buttonText = t('chat.addMedic.buttonText.multiple', { count: selectedMedics.value.length })
            }
            return {
                disabled: disabled,
                text: buttonText,
            }
        })




        const resetComponent = () => {
            if (!autoSelect.value) {
                searchText.value = ''
                activeFilter.value = ''
                selectedMedics.value = []
            }
        }




        const selectMedic = () => {
            if (!field.value) return;
            if (!autoSelect.value && selectedMedics.value.length === 0) return;

            // Directly use the stored objects
            const providersToSend = autoSelect.value ? [] : [...selectedMedics.value];

            chatActionStore.sendServiceRequest(
                currentConversationId.value,
                field.value,
                selectedExpertiseLabel.value,
                providersToSend
            );

            emit('close');
            setTimeout(() => {
                autoSelect.value = true;
                resetComponent();
            }, 300);
        };


        return {
            t,
            isLoading,
            isLoadingServices,
            filterProps,
            toggleSelect,
            selectMedic,
            selectedExpertiseLabel,
            filters,
            searchText,
            setFilter,
            close,
            providers,
            buttonProps,
            serviceStore,
            serviceOptions,
            autoSelect,
            field,
            NoProviderImage,
            isSelected,
        }
    }
})
</script>