<template>
    <div class="relative w-full h-full overflow-hidden pointer-events-none" ref="containerRef"
        :dir="isRtl ? 'rtl' : 'ltr'">

        <div class="flex w-[300%] h-full ease-out pointer-events-none" :style="{
            transform: `translate3d(${baseTranslate + touchTranslate}%, 0, 0)`,
            transitionDuration: isDragging ? '0ms' : `${slideTime}ms`
        }">

            <div class="w-1/3 h-full flex items-center justify-center relative pointer-events-none">
                <div class="pointer-events-auto max-w-full max-h-full flex items-center justify-center"
                    @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @click.stop>
                    <slot name="slide" :item="leftItem" :index="leftIndex" v-if="leftItem"></slot>
                </div>
            </div>

            <div class="w-1/3 h-full flex items-center justify-center relative pointer-events-none">
                <div class="pointer-events-auto max-w-full max-h-full flex items-center justify-center"
                    @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @click.stop>
                    <slot name="slide" :item="centerItem" :index="centerIndex" v-if="centerItem"></slot>
                </div>
            </div>

            <div class="w-1/3 h-full flex items-center justify-center relative pointer-events-none">
                <div class="pointer-events-auto max-w-full max-h-full flex items-center justify-center"
                    @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @click.stop>
                    <slot name="slide" :item="rightItem" :index="rightIndex" v-if="rightItem"></slot>
                </div>
            </div>

        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, computed } from 'vue';
import { useLocale } from '~/nuxt-shims';

export default defineComponent({
    name: 'BCarousel',
    props: {
        items: { type: Array, required: true },
        modelValue: { type: Number, required: true },
        slideTime: { type: Number, default: 300 }
    },
    emits: ['update:modelValue'],
    setup(props, { emit, expose }) {
        const { dir } = useLocale();
        const isRtl = computed(() => dir.value === 'rtl');

        const containerRef = ref<HTMLElement | null>(null);

        // Virtual Track Indexes
        const centerIndex = ref(props.modelValue);
        const leftIndex = ref(props.modelValue - 1);
        const rightIndex = ref(props.modelValue + 1);

        const leftItem = computed(() => props.items[leftIndex.value]);
        const centerItem = computed(() => props.items[centerIndex.value]);
        const rightItem = computed(() => props.items[rightIndex.value]);

        // Math: RTL flex layout flips the track. 
        // LTR needs -33.333% to center the middle item. RTL needs +33.333% to center the middle item.
        const baseTranslate = computed(() => isRtl.value ? 33.3333 : -33.3333);
        const touchTranslate = ref(0);
        const isDragging = ref(false);
        const isAnimating = ref(false);

        let startX = 0;
        let containerWidth = 0;

        // --- Touch Event Handlers ---
        const onTouchStart = (e: TouchEvent) => {
            if (isAnimating.value) return;
            startX = e.touches[0].clientX;
            if (containerRef.value) containerWidth = containerRef.value.offsetWidth;
            isDragging.value = true;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!isDragging.value || containerWidth === 0) return;
            const deltaX = e.touches[0].clientX - startX;
            let percent = (deltaX / containerWidth) * 33.3333;

            // Add resistance at the absolute start/end of the gallery array
            if (!isRtl.value) {
                if (centerIndex.value === 0 && percent > 0) percent *= 0.3;
                if (centerIndex.value === props.items.length - 1 && percent < 0) percent *= 0.3;
            } else {
                if (centerIndex.value === 0 && percent < 0) percent *= 0.3;
                if (centerIndex.value === props.items.length - 1 && percent > 0) percent *= 0.3;
            }

            touchTranslate.value = percent;
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (!isDragging.value) return;
            isDragging.value = false;

            const deltaX = e.changedTouches[0].clientX - startX;

            if (Math.abs(deltaX) > 50) {
                const swipedLeft = deltaX < 0;
                const goNext = isRtl.value ? !swipedLeft : swipedLeft;

                if (goNext && centerIndex.value < props.items.length - 1) {
                    emit('update:modelValue', centerIndex.value + 1);
                    return;
                }
                if (!goNext && centerIndex.value > 0) {
                    emit('update:modelValue', centerIndex.value - 1);
                    return;
                }
            }
            touchTranslate.value = 0; // Snap back if threshold not met
        };

        // --- The Virtual Jump Logic ---
        watch(() => props.modelValue, async (newIdx, oldIdx) => {
            if (newIdx === centerIndex.value || newIdx < 0 || newIdx >= props.items.length) return;
            isAnimating.value = true;

            const isNext = newIdx > centerIndex.value;

            // Silently preload the incoming slide into the correct neighbor slot
            if (isNext) rightIndex.value = newIdx;
            else leftIndex.value = newIdx;

            await nextTick();

            // Trigger CSS Slide
            let offset = isRtl.value ? 33.3333 : -33.3333;
            if (!isNext) offset = -offset;
            touchTranslate.value = offset;

            // Wait for transition, then silently reset the track geometry instantly
            setTimeout(() => {
                isDragging.value = true; // Kills the CSS transition for an instant reset
                centerIndex.value = newIdx;
                leftIndex.value = newIdx - 1;
                rightIndex.value = newIdx + 1;
                touchTranslate.value = 0;

                requestAnimationFrame(() => {
                    isDragging.value = false; // Restores transition
                    isAnimating.value = false;
                });
            }, props.slideTime);
        });

        expose({
            next: () => { if (props.modelValue < props.items.length - 1) emit('update:modelValue', props.modelValue + 1); },
            prev: () => { if (props.modelValue > 0) emit('update:modelValue', props.modelValue - 1); }
        });

        return {
            isRtl, containerRef,
            leftItem, leftIndex, centerItem, centerIndex, rightItem, rightIndex,
            baseTranslate, touchTranslate, isDragging,
            onTouchStart, onTouchMove, onTouchEnd
        };
    }
});
</script>