<template>
    <div class="w-full flex gap-x-2 select-none items-center">
        <div class="flex text-left flex-col gap-y-0.5 flex-1 min-w-0">
            <div class="text-on-surface text-label-md truncate" v-loading="isLoading">{{ fileName }}</div>
            <div dir="ltr" class="text-body-sm text-on-surface/70" v-loading="isLoading">{{ formattedSize }}</div>
        </div>

        <div v-loading="isLoading" class="relative shrink-0 cursor-pointer active:scale-95 transition-transform">
            <BIcon icon="PhFile" class="  fill-surface-variant-3 w-10 h-10" weight="fill" />
            <div class="absolute bottom-2 right-0 bg-error rounded-sm px-1 py-0.5 flex items-center justify-center">
                <div class="text-center text-white text-[7px] font-bold leading-none uppercase tracking-wide">
                    {{ fileExt }}
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n, formatBytes } from '~/nuxt-shims';

export default defineComponent({
    name: 'ProfileFileDisplay',
    props: {
        url: {
            type: String,
            required: true
        },
        loading: {
            type: Boolean,
            default: true,
        }
    },
    setup(props) {
        const { t } = useI18n()
        const fetchedSize = ref<number | null>(null);
        const isLoading = computed(() => props.loading)



        const fileName = computed(() => {
            try {
                const urlObj = new URL(props.url);
                const path = urlObj.pathname;
                return decodeURIComponent(path.split('/').pop() || 'Unknown_File');
            } catch {
                return 'File';
            }
        });

        // Fix 2: Robust extension extraction and forced Uppercase
        const fileExt = computed(() => {
            const name = fileName.value;
            const lastDot = name.lastIndexOf('.');
            if (lastDot !== -1) {
                return name.substring(lastDot + 1).toUpperCase().substring(0, 4);
            }
            return 'FILE';
        });

        const getFileSize = async () => {
            try {
                // Perform a lightweight HEAD request just to get the size
                const res = await fetch(props.url, { method: 'HEAD' });
                const length = res.headers.get('Content-Length');
                if (length) fetchedSize.value = parseInt(length, 10);
            } catch (e) {
                console.warn('Could not fetch file size upfront:', e);
                fetchedSize.value = 0; // Fallback
            }
        };



        const formattedSize = computed(() => {

            return fetchedSize.value ? formatBytes(fetchedSize.value) : t('chat.file.calculating');
        });

        onMounted(() => {
            getFileSize()
        })


        return {
            formattedSize,
            fileExt,
            fileName,
            isLoading,
        }
    }
})
</script>