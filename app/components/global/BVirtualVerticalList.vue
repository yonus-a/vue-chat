<template>
    <div ref="parentRef" class="w-full h-full overflow-y-auto " :class="[scrollbar ? '' : 'hide-scrollbar']">
        <div :style="{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
        }">
            <div v-for="virtualRow in virtualizer.getVirtualItems()" :key="virtualRow.key"
                :data-index="virtualRow.index" :ref="el => virtualizer.measureElement(el as HTMLElement)" :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                }">
                <slot name="item" :item="items[virtualRow.index]" :index="virtualRow.index" />
            </div>
        </div>

        <div v-show="pagination && hasNextPage" ref="sentinelRef" class="w-full h-13 flex items-center justify-center">
            <slot name="loader" v-if="hasNextPage">
                <LottieAnimation :animation-data="loading" :height="52" :width="52" :loop="true" :auto-play="true" />
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import loading from '~/assets/lottie/loading.json'
const props = withDefaults(defineProps<{
    items: any[];
    loading: boolean;
    hasNextPage: boolean;
    scrollbar?: boolean;
    pagination?: boolean;
}>(), {
    scrollbar: false,
    pagination: true
});
const emit = defineEmits(['load-more']);

const parentRef = ref<HTMLElement | null>(null);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const virtualizer = useVirtualizer({
    get count() { return props.items.length },
    getScrollElement: () => parentRef.value,
    // Internal default guess. TanStack will correct this instantly upon rendering.
    estimateSize: () => 45,
    overscan: 10,
});

defineExpose({
    resetScroll() {
        if (parentRef.value) {
            parentRef.value.scrollTop = 0;
        }
    },
});

// Auto-trigger load-more when reaching the bottom
onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && props.hasNextPage && !props.loading && props.pagination) {
            emit('load-more');
        }
    }, { threshold: 0.1 });

    if (sentinelRef.value) observer.observe(sentinelRef.value);
});

onUnmounted(() => {
    if (observer) observer.disconnect();
});
</script>