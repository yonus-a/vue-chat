<template>
    <div class="w-full flex gap-x-2 select-none items-center">
        <div class="flex text-left flex-col gap-y-0.5 flex-1 min-w-0">
            <div class="text-on-surface text-label-md truncate">{{ fileName }}</div>
            <div dir="ltr" class="text-body-sm text-on-surface/70">{{ formattedSize }}</div>
        </div>

        <div class="relative shrink-0 cursor-pointer active:scale-95 transition-transform">
            <BIcon icon="PhFile" class="fill-white w-10 h-10" />
            <div class="absolute bottom-2 right-0 bg-error rounded-sm px-1 py-0.5 flex items-center justify-center">
                <div class="text-center text-white text-[7px] font-bold leading-none uppercase tracking-wide">
                    {{ fileExt }}
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import { formatBytes } from '~/nuxt-shims';
export default defineComponent({
    name: 'AttachementFileDisplay',
    props: {
        file: {
            type: Object as PropType<{ name: string; size: number; format: string; path: string }>,
            required: true
        }
    },
    setup(props) {
        // Extract up to 4 characters of the extension for the little UI badge
        const fileExt = computed(() => {
            if (!props.file?.name) return 'FILE';
            const parts = props.file.name.split('.');
            return parts.length > 1 ? (parts.pop()?.substring(0, 4) || 'FILE') : 'FILE';
        });

        const fileName = computed(() => props.file?.name || 'Unknown File');
        const fileSize = computed(() => props.file?.size || 0);



        const formattedSize = computed(() => {
            return formatBytes(fileSize.value);
        });

        return {
            formattedSize,
            fileExt,
            fileName,
        }
    }
})
</script>