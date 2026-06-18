<template>
    <div @click.self.stop="close" class=" top-0 left-0 absolute z-20 w-full h-full"
        :class="[isOpen ? ' pointer-events-auto' : 'pointer-events-none']">
        <div ref="colorPickerWrapper"
            :class="[isOpen ? ' shadow-medium pointer-events-auto bg-surface' : ' pointer-events-none bg-surface/0 shadow-none']"
            class="rounded-t-2xl py-3 absolute z-30 transition-all duration-200 ease-in-out  left-0 w-full bottom-0 origin-bottom h-auto">
            <div class=" w-full transition-all duration-200 px-3 whitespace-nowrap overflow-hidden "
                :class="[isOpen ? ' h-auto opacity-100' : 'h-0 pointer-events-none opacity-0']">
                <div class=" w-full mb-4 flex items-center gap-x-1 ">
                    <div v-for="(color, index) in colors" @click="changeSelection(index)"
                        class=" aspect-square rounded-lg cursor-pointer transition-all duration-200 ease-in-out border-2"
                        :class="[index === selectedColor ? ' border-primary' : ' border-primary/0']"
                        :style="{ backgroundColor: color, width: `${100 / colors.length}%` }"></div>
                </div>
                <BButton :disabled="!canSelect" class=" min-w-full" color="primary" :text="t('chat.board.confirm')"
                    @click="submitSelection" />
            </div>
        </div>
    </div>
</template>
<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, onMounted, onUnmounted, type PropType } from 'vue';
import { useI18n } from '~/nuxt-shims';
export interface BoardColorPickerExposed {
    open: () => void;
    close: () => void;
}

export default defineComponent({
    name: 'BoardColorPicker',
    props: {
        modelValue: {
            type: String,
            default: "#000000"
        },
        colors: {
            type: Array as PropType<String[]>,
            default: () => [],
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit, expose }) {
        const { t } = useI18n()
        const isOpen = ref(false)
        const selectedColor = ref(0)
        const isTransitioning = ref(true)
        const colorPickerWrapper = ref<HTMLElement | null>(null)
        const previousSelectedColor = ref(0)
        const colors = computed(() => props.colors)


        // const colors = ref([
        //     '#2C2727', '#F49AA6', '#F897F6', '#CF40F3', '#555CEE',
        //     '#40F3E4', '#8CE25E', '#E9EF37', '#F37040', '#F34040'
        // ])

        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        onMounted(() => {
            window.addEventListener('keydown', handleGlobalKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        });

        const open = () => {
            const index = colors.value.indexOf(props.modelValue);
            previousSelectedColor.value = index !== -1 ? index : 0;
            selectedColor.value = previousSelectedColor.value;

            setTimeout(() => {
                isTransitioning.value = false;
            }, 300)
            nextTick(() => {
                isOpen.value = true;
            });
        }

        const canSelect = computed(() => selectedColor.value !== previousSelectedColor.value)


        const close = () => {
            if (isOpen.value && !isTransitioning.value) {
                isTransitioning.value = true
                isOpen.value = false;
                emit('update:modelValue', colors.value[previousSelectedColor.value]);
            }
        }


        const changeSelection = (index: number) => {
            selectedColor.value = index;
            emit('update:modelValue', colors.value[index]);
        }

        const submitSelection = () => {
            previousSelectedColor.value = selectedColor.value;
            isOpen.value = false;
        }


        expose({ open, close })

        return {
            changeSelection,
            submitSelection,
            isOpen,
            colorPickerWrapper,
            colors,
            t,
            canSelect,
            close,
            selectedColor,
        }
    }
})
</script>