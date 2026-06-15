<template>
    <div @click="toggleCheck" class="group inline-flex items-center transition-all duration-200"
        :class="{ 'gap-x-3': hasContent, 'cursor-pointer': !disabled, 'opacity-50 cursor-not-allowed': disabled }">
        <div class="shrink-0 flex items-center justify-center">

            <div
                class="w-5 h-5 p-0.5 relative rounded-md flex justify-center items-center overflow-hidden  transition-all duration-200 bg-outline">
                <div class="absolute inset-0 transition-opacity duration-200 ease-in-out bg-diamond-primary-secondary"
                    :class="[isActive ? 'opacity-100' : 'opacity-0']">
                </div>
                <div
                    class="z-10 w-full h-full bg-surface relative rounded-[3px] overflow-hidden flex justify-center items-center">
                    <div class="absolute inset-0 transition-all duration-200 flex justify-center items-center ease-in-out bg-diamond-primary-secondary"
                        :class="[isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0']">
                        <BIcon class="w-3.5 h-3.5 fill-white" weight="bold" icon="PhCheck" />
                    </div>
                </div>
            </div>
        </div>

        <div v-if="hasContent" class="select-none flex-1">
            <slot>
                <span class="text-body-md text-on-surface">{{ label }}</span>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, useSlots } from 'vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
        required: true,
    },
    label: {
        type: String,
        default: ''
    },
    disabled: {
        type: Boolean,
        default: false,
    }
});

const emit = defineEmits(['update:modelValue']);
const slots = useSlots();

const isActive = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
    isActive.value = newVal;
});

const toggleCheck = () => {
    if (props.disabled) return
    emit('update:modelValue', !isActive.value);
};

const hasContent = computed(() => !!props.label || !!slots.default);
</script>
