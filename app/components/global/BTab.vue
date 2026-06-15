<template>
    <div class="flex flex-col gap-y-2">
        <div class="flex items-center gap-x-5 select-none text-label-md relative">
            <div v-for="(tab, index) in tabs" :key="index" ref="tabRefs" @click="setTab(index)"
                class="cursor-pointer transition-colors duration-200 py-1"
                :class="[modelValue === index ? 'text-on-surface' : 'text-on-surface/50']">
                {{ tab }}
            </div>
        </div>

        <div class="w-full relative h-0.5 rounded-full bg-outline-variant">
            <div class="absolute bottom-0 h-full bg-gradient-primary-secondary rounded-full transition-all duration-200 ease-in-out"
                :style="indicatorStyle"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType, ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';

export default defineComponent({
    name: 'TheTab',
    props: {
        modelValue: {
            type: Number,
            default: 0
        },
        tabs: {
            type: Array as PropType<string[]>,
            default: () => []
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const tabRefs = ref<HTMLElement[]>([]);
        const indicatorStyle = ref({
            width: '0px',
            left: '0px'
        });

        const updateIndicator = () => {
            const activeEl = tabRefs.value[props.modelValue];
            if (activeEl) {
                const width = activeEl.offsetWidth;
                const left = activeEl.offsetLeft;

                indicatorStyle.value = {
                    width: `${width}px`,
                    left: `${left}px`
                };
            }
        };

        const setTab = (index: number) => {
            emit('update:modelValue', index);
        };

        watch(() => props.modelValue, () => {
            nextTick(() => {
                updateIndicator();
            });
        });

        onMounted(() => {
            nextTick(() => {
                updateIndicator();
            });

            setTimeout(updateIndicator, 100);

            window.addEventListener('resize', updateIndicator);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('resize', updateIndicator);
        });

        return {
            setTab,
            tabRefs,
            indicatorStyle
        };
    }
})
</script>

<style scoped>
.bg-gradient-primary-secondary {
    min-height: 2px;
    z-index: 10;
}

.transition-all {
    will-change: left, width;
}
</style>
