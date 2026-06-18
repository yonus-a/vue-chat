<template>
    <div class="px-3 flex gap-x-2 select-none items-center">
        <div dir="ltr" class="flex text-left flex-col gap-y-0.5 flex-1 min-w-0">
            <div class="text-on-surface text-label-md truncate">{{ fileName }}</div>
            <div class=" w-20">
                <div 
                    class="text-body-sm text-left text-on-surface/70 w-full line-clamp-1 text-ellipsis overflow-hidden">{{
                    formattedSize }}</div>
            </div>
        </div>
        <FileFormatDisplay :width="30" :height="33" :label="fileExt" v-if="status === 'downloaded' && !isUploading"
            @click="toggleDownload" />
        <LoadingStatus v-else :class="[isUploading ? 'cursor-default' : 'cursor-pointer']" :progress="displayProgress"
            :is-uploading="isUploading" :is-downloading="status === 'downloading'" @click="toggleDownload" />
    </div>
</template>

<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useI18n, useLocale, formatBytes } from '~/nuxt-shims';
import { useChatActionStore } from '~/stores/chatActionStore';
import LoadingStatus from '~/components/general/LoadingStatus.vue';
import FileFormatDisplay from '~/components/general/FileFormatDisplay.vue';

export default defineComponent({
    name: 'FileDisplay',
    components: {
        LoadingStatus,
        FileFormatDisplay,
    },
    props: {
        url: { type: String, required: true },
        isMine: { type: Boolean, default: true },
        messageId: { type: Number, required: false },
        isSent: { type: Boolean, default: true }
    },
    setup(props) {
        const { t } = useI18n();
        const { dir } = useLocale();
        const chatActionStore = useChatActionStore();

        const status = ref<'idle' | 'downloading' | 'downloaded'>('idle');
        const progress = ref(0); // This is 0-100 internally
        const fetchedSize = ref<number | null>(null);
        let abortController: AbortController | null = null;
        const dbName = 'ChatFileCache';

        const uploadData = computed(() => props.messageId ? chatActionStore.uploadProgress.get(props.messageId) : null);
        const isUploading = computed(() => !props.isSent && uploadData.value);

        // FIX: Progress logic must handle both Uploading and Downloading
        const displayProgress = computed(() => {
            if (isUploading.value && uploadData.value) {
                return uploadData.value.progress / 100;
            }
            if (status.value === 'downloading') {
                return progress.value / 100;
            }
            return 0; // Idle/Default
        });

        // REMOVED: circumference and dashOffset (The new component handles this now)

        const getDB = () => new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onupgradeneeded = () => request.result.createObjectStore('files');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const checkLocalExistence = async () => {
            const db = await getDB();
            const tx = db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const request = store.get(props.url);
            request.onsuccess = () => { if (request.result) status.value = 'downloaded'; };
        };

        const fileName = computed(() => {
            try {
                const urlObj = new URL(props.url);
                return decodeURIComponent(urlObj.pathname.split('/').pop() || 'Unknown_File');
            } catch { return 'File'; }
        });

        const fileExt = computed(() => {
            const name = fileName.value;
            const lastDot = name.lastIndexOf('.');
            return lastDot !== -1 ? name.substring(lastDot + 1).toUpperCase().substring(0, 4) : 'FILE';
        });

        const formattedSize = computed(() => {
            if (isUploading.value && uploadData.value) {
                const realTotal = fetchedSize.value || uploadData.value.total;
                const currentUploaded = (uploadData.value.progress / 100) * realTotal;
                return `${formatBytes(currentUploaded)} / ${formatBytes(realTotal)}`;
            }
            if (status.value === 'downloading' && fetchedSize.value) {
                const downloaded = (progress.value / 100) * fetchedSize.value;
                return `${formatBytes(downloaded)} / ${formatBytes(fetchedSize.value)}`;
            }
            return fetchedSize.value ? formatBytes(fetchedSize.value) : t('chat.file.calculating');
        });

        const getFileSize = async () => {
            try {
                if (props.url.startsWith('blob:')) {
                    const res = await fetch(props.url);
                    const blob = await res.blob();
                    fetchedSize.value = blob.size;
                } else {
                    const res = await fetch(props.url, { method: 'HEAD' });
                    const length = res.headers.get('Content-Length');
                    if (length) fetchedSize.value = parseInt(length, 10);
                }
            } catch (e) {
                fetchedSize.value = 0;
            }
        };

        const toggleDownload = async () => {
            if (isUploading.value) return;

            if (status.value === 'downloaded') {
                const db = await getDB();
                const tx = db.transaction('files', 'readonly');
                const store = tx.objectStore('files');
                const fileBlob = await new Promise<Blob | undefined>((res) => {
                    store.get(props.url).onsuccess = (e: any) => res(e.target.result);
                });

                if (fileBlob) {
                    const blobUrl = URL.createObjectURL(fileBlob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = fileName.value;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                } else {
                    status.value = 'idle';
                    toggleDownload();
                }
                return;
            }

            if (status.value === 'downloading') {
                abortController?.abort();
                status.value = 'idle';
                progress.value = 0;
                return;
            }

            status.value = 'downloading';
            progress.value = 0;
            abortController = new AbortController();

            try {
                const response = await fetch(props.url, { signal: abortController.signal });
                const total = parseInt(response.headers.get('content-length') || '0', 10);
                let loaded = 0;
                const chunks: Uint8Array[] = [];
                const reader = response.body?.getReader();

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        if (value) {
                            chunks.push(value);
                            loaded += value.length;
                            if (total) progress.value = Math.round((loaded / total) * 100);
                        }
                    }
                }

                const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
                const db = await getDB();
                const tx = db.transaction('files', 'readwrite');
                tx.objectStore('files').put(blob, props.url);
                status.value = 'downloaded';
            } catch (error: any) {
                status.value = 'idle';
                progress.value = 0;
            }
        };

        onMounted(() => {
            getFileSize();
            checkLocalExistence();
        });

        return {
            status, progress, fileName, fileExt, formattedSize,
            dir, toggleDownload, isUploading, displayProgress,
        };
    }
});
</script>