<template>
    <div>
        <div @click="emit('click')" :class="[
            'relative inline-flex items-center justify-center select-none rounded-full transition-all duration-200 ease-in-out text-primary bg-primary/10 border-gradient-active',
            sizeClasses,
            paddingClasses,
            icon.trim().length == 0 ? 'gap-x-0' : 'gap-x-1',
        ]">

            <Transition name="icon-expand">
                <div v-if="icon"
                    :class="['shrink-0 z-10 flex items-center justify-center overflow-hidden', iconSizeClass, { 'rtl:ml-0 ltr:mr-0': !text }]"
                    :style="{ order: isRtl ? 2 : 1 }">
                    <BIcon @click.stop="emit('action')" :icon="icon" class="w-full h-full" />
                </div>
            </Transition>

            <span v-if="text" :class="['z-10 truncate transition-all duration-200 ease-in-out', textSizeClass]"
                :style="{ order: isRtl ? 1 : 2, marginInlineStart: icon ? '8px' : '0' }">
                {{ text }}
            </span>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useLocale } from '#imports';

const props = defineProps({
    size: {
        type: String as PropType<'md' | 'lg'>,
        default: 'md'
    },
    icon: {
        type: String,
        default: ''
    },
    text: {
        type: String,
        default: ''
    }
});

const { dir } = useLocale();
const isRtl = computed(() => dir.value === 'rtl');

const emit = defineEmits(['click', 'action']);

const sizeClasses = computed(() => props.size === 'lg' ? 'h-[32px]' : 'h-[28px]');
const iconSizeClass = computed(() => props.size === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4');
const textSizeClass = computed(() => props.size === 'lg' ? 'text-label-md' : 'text-label-sm');

const paddingClasses = computed(() => {
    if (props.icon && props.text) return 'ltr:pl-2 ltr:pr-3 rtl:pr-2 rtl:pl-3';
    if (props.icon) return 'px-1.5';
    return 'px-3';
});
</script>

<style scoped>
.border-gradient-active {
    position: relative;
    border: none !important;
}

.border-gradient-active::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    padding: 1px;
    background: var(--background-image-diamond-primary-secondary);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

.icon-expand-enter-active,
.icon-expand-leave-active {
    transition: width 200ms ease-in-out, opacity 200ms ease-in-out, transform 200ms ease-in-out;
}

.icon-expand-enter-from,
.icon-expand-leave-to {
    width: 0 !important;
    opacity: 0;
    transform: scale(0.5);
}
</style>
