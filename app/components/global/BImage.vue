<template>
    <div id="image" ref="rootEl" :class="rootClasses">
        <div id="piece-of-shit" :style="[wrapperStyles, { borderRadius: 'inherit' }]" :class="wrapperClasses">

            <div id="not-piece-of-shit" v-if="autoAspect" :style="autoAspectStyles" :class="autoAspectContainerClasses">
                <img :key="displayedImage" :alt="alt" @load="loadImage" :src="displayedImage"
                    :class="autoAspectImageClasses" style="border-radius: inherit;" />
            </div>

            <template v-else>
                <div :class="standardContainerClasses" style="border-radius: inherit;">
                    <img :key="displayedImage" :alt="alt" @load="loadImage" :src="displayedImage"
                        style="border-radius: inherit;" :class="standardImageClasses" />
                </div>
            </template>

        </div>

        <div :title="title" :class="overlayClasses" style="border-radius: inherit;">
            <div class="relative w-full h-full"
                :class="[!!$slots.default ? 'pointer-events-auto' : 'pointer-events-none']"
                style="border-radius: inherit;">
                <div ref="content" style="border-radius: inherit;" :class="contentClasses">
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onUnmounted, onMounted, watch, ref, computed } from 'vue'

export default defineComponent({
    name: 'DopeImage',
    props: {
        src: { type: String, default: '' },
        title: { type: String, default: '' },
        alt: { type: String, default: '' },
        fit: { type: String, default: 'fit' },
        fitToContent: { type: Boolean, default: false },
        hasFade: { type: Boolean, default: false },
        noLoading: { type: Boolean, default: false },
        autoSize: { type: Boolean, default: false },
        autoAspect: { type: Boolean, default: false },
        imageClass: { type: String, default: '' }
    },
    emits: ['load'],
    setup(props, { emit }) {
        const rootEl = ref<HTMLElement | null>(null)
        const content = ref<HTMLElement | null>(null)

        // Exact pixel math references
        const containerWidth = ref(0)
        const containerHeight = ref(0)
        const imgRatio = ref<number | null>(null)

        const isLoaded = ref(false)
        const imageTransitionComplete = ref(true)
        const elementHeight = ref(0)
        const displayedImage = ref(props.src)

        let resizeObserver: ResizeObserver | null = null

        const showImage = computed(() => isLoaded.value && props.src !== '' && imageTransitionComplete.value)

        const rootClasses = computed(() => [
            // Added pointer-events-none
            'relative transition-all duration-500 ease-in-out flex justify-center items-center pointer-events-none',
            props.autoSize && !props.autoAspect ? 'w-auto h-auto' : 'w-full h-full'
        ])

        const wrapperClasses = computed(() => [
            // Added pointer-events-none
            'w-full transition-all duration-500 ease-in-out flex justify-center items-center pointer-events-none',
            props.autoSize && !props.autoAspect ? 'relative' : 'absolute inset-0 h-full'
        ])

        const wrapperStyles = computed(() => props.fitToContent ? { height: `${elementHeight.value}px` } : {})

        // THE FIX: Math-based boundary detection
        const autoAspectStyles = computed(() => {
            // Default placeholder size until we have the measurements
            if (!props.autoAspect || !imgRatio.value || !containerWidth.value || !containerHeight.value) {
                return { width: '100%', height: '100%', borderRadius: 'inherit' };
            }

            const cRatio = containerWidth.value / containerHeight.value;

            if (imgRatio.value > cRatio) {
                // Image is mathematically wider than container -> Force width 100%, let height scale down
                return {
                    width: '100%',
                    height: 'auto',
                    aspectRatio: `${imgRatio.value}`,
                    borderRadius: 'inherit'
                };
            } else {
                // Image is mathematically taller than container -> Force height 100%, let width scale down
                return {
                    width: 'auto',
                    height: '100%',
                    aspectRatio: `${imgRatio.value}`,
                    borderRadius: 'inherit'
                };
            }
        })

        const autoAspectContainerClasses = computed(() => [
            'overflow-hidden relative  flex justify-center items-center transition-all duration-500',
            showImage.value ? 'bg-transparent' : !props.noLoading ? 'bg-black/20 animate-pulse' : ''
        ])

        const autoAspectImageClasses = computed(() => [
            'select-none block w-full h-full object-cover ',
            showImage.value ? 'opacity-100' : 'opacity-0',
            props.noLoading ? ' transition-none' : 'transition-all duration-500 ease-in-out',
            props.imageClass
        ])

        const standardContainerClasses = computed(() => [
            'w-full h-full relative transition-all duration-500  overflow-hidden',
            showImage.value ? 'bg-transparent' : !props.noLoading ? 'bg-black/20 animate-pulse' : ''
        ])

        const standardImageClasses = computed(() => [
            'select-none block transition-all duration-500 ease-in-out',
            props.autoSize ? 'w-full h-auto' : 'w-full h-full',
            `object-${props.fit}`,
            showImage.value ? 'opacity-100' : 'opacity-0',
            props.imageClass
        ])

        const overlayClasses = computed(() => [
            'absolute inset-0 flex z-10 justify-center items-center pointer-events-none',
            props.autoSize || props.autoAspect ? 'h-full' : ''
        ])

        const contentClasses = computed(() => [
            'content',
            props.fitToContent ? '' : 'w-full h-full'
        ])

        const updateDimensions = () => {
            // Actively measures the actual pixel size of your viewer container
            if (rootEl.value) {
                containerWidth.value = rootEl.value.clientWidth
                containerHeight.value = rootEl.value.clientHeight
            }
            if (content.value) {
                elementHeight.value = content.value.offsetHeight - 13
            }
        }

        const loadImage = (e: Event) => {
            isLoaded.value = true
            emit('load')
            const target = e.target as HTMLImageElement
            if (target && target.naturalWidth && target.naturalHeight) {
                imgRatio.value = target.naturalWidth / target.naturalHeight
            }
        }

        const swapImage = (newSrc: string) => {
            if (props.hasFade) {
                isLoaded.value = false;
                imageTransitionComplete.value = false;
                setTimeout(() => {
                    imageTransitionComplete.value = true;
                    displayedImage.value = newSrc;
                    updateDimensions();
                }, 200);
            } else {
                isLoaded.value = false;
                displayedImage.value = newSrc;
                updateDimensions();
            }
        }

        // Silent pre-loader prevents layout shifts during image swaps
        watch(() => props.src, (newSrc) => {
            if (!newSrc) return;
            if (props.autoAspect) {
                const img = new Image();
                img.onload = () => {
                    imgRatio.value = img.naturalWidth / img.naturalHeight;
                    swapImage(newSrc);
                };
                img.onerror = () => swapImage(newSrc);
                img.src = newSrc;
            } else {
                swapImage(newSrc);
            }
        })

        onMounted(() => {
            resizeObserver = new ResizeObserver(updateDimensions)
            if (rootEl.value) resizeObserver.observe(rootEl.value)
            if (content.value) resizeObserver.observe(content.value)

            updateDimensions()

            if (props.autoAspect && props.src) {
                const img = new Image();
                img.onload = () => {
                    imgRatio.value = img.naturalWidth / img.naturalHeight;
                };
                img.src = props.src;
            }
        })

        onUnmounted(() => {
            if (resizeObserver) resizeObserver.disconnect()
        })

        return {
            rootEl,
            content,
            loadImage,
            displayedImage,
            rootClasses,
            wrapperClasses,
            wrapperStyles,
            autoAspectStyles,
            autoAspectContainerClasses,
            autoAspectImageClasses,
            standardContainerClasses,
            standardImageClasses,
            overlayClasses,
            contentClasses,
            showImage
        }
    }
})
</script>