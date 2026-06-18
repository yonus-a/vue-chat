<template>
    <div>
        <BMenu ref="attachementMenu">
            <template #trigger>
                <BIcon icon="PhPaperclip" class=" cursor-pointer w-6 h-6 fill-on-surface shrink-0" />
            </template>
            <div class=" w-41 bg-surface rounded-2xl p-3 flex flex-col gap-y-1">

                <div v-image-pick="{ multiple: true, onSelect: handleMediaSelected }" @click="resetSelections"
                    class=" px-3 transition-all duration-200 ease-in-out bg-surface-variant-2/0 hover:bg-surface-variant-2 cursor-pointer select-none w-full flex items-center gap-x-2 h-11 rounded-xl ">
                    <BIcon icon="PhImage" class=" w-5 h-5 fill-on-surface/50" />
                    <div class=" text-body-sm text-on-surface/70">{{ t('chat.file.attachMedia') }}</div>
                </div>

                <div v-file-pick="{ multiple: true, onSelect: handleFilesSelected }" @click="resetSelections"
                    class=" px-3 transition-all duration-200 ease-in-out bg-surface-variant-2/0 hover:bg-surface-variant-2 cursor-pointer select-none w-full flex items-center gap-x-2 h-11 rounded-xl ">
                    <BIcon icon="PhFile" class=" w-5 h-5 fill-on-surface/50" />
                    <div class=" text-body-sm text-on-surface/70">{{ t('chat.file.attachFile') }}</div>
                </div>

            </div>
        </BMenu>
        <BPopup @closed="resetSelections" no-padding ref="popup">
            <div class=" md:max-w-114 w-dvw">
                <div class=" border-b border-b-outline-variant w-full flex items-center gap-x-3 p-5">
                    <BIcon @click="closePopup" icon="PhX" class=" w-5 h-5 cursor-pointer fill-on-surface/50" />
                    <div class=" select-none text-label-md text-on-surface">{{ popupTitle }}</div>
                </div>
                <div class="md:max-w-114 items-center w-full pt-5 px-5 flex flex-col gap-y-3">
                    <div class=" w-full" v-if="popupMode === 'single-image'">
                        <div class=" w-full">
                            <div class=" w-full h-full">
                                <BImage auto-size fit="cover" :src="selectedMedia[0]?.path"
                                    class="w-full overflow-hidden  rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div v-else-if="popupMode === 'multi-image'" class=" max-h-109 overflow-y-auto w-full">
                        <div class=" w-full grid grid-cols-4 gap-x-3">
                            <div class=" h-25" v-for="(image, index) in selectedMedia" :key="index">
                                <BImage fit="cover"
                                    class=" overflow-hidden rounded-xl w-full h-full min-w-full min-h-full max-w-full max-h-full"
                                    :src="image.path" />
                            </div>
                        </div>
                    </div>
                    <div v-else-if="popupMode === 'file'"
                        class=" flex flex-col gap-y-3 w-full max-h-109 overflow-y-auto">
                        <AttachementFileDisplay v-for="(file, index) in selectedFiles" :key="index" :file="file" />
                    </div>
                    <BInput class=" min-w-full" textarea :placeholder="t('chat.caption')" v-model="caption" />
                </div>
                <div class="border-t border-t-outline-variant w-full p-5 flex items-center gap-x-3">
                    <div class=" basis-1/2">
                        <BButton @click="sendMessages" class=" min-w-full" :text="t('chat.send')" />
                    </div>
                    <div class=" basis-1/2">
                        <BButton @click="closePopup" color="secondary" class=" min-w-full"
                            :text="t('chat.file.cancel')" />
                    </div>
                </div>
            </div>
        </BPopup>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useI18n, useAppToast } from '~/nuxt-shims';
import type { Menu } from '~/types/components/menu';
import type { Popup } from '~/types/components/popup';
import AttachementFileDisplay from './AttachementFileDisplay.vue';
type PopupMode = 'single-image' | 'multi-image' | 'file'
export default defineComponent({
    name: 'InputAttachement',
    components: {
        AttachementFileDisplay,
    },
    props: {
        initialCaption: {
            type: String,
            default: ''
        }
    },
    emits: ['send-attachments'],
    setup(props, { emit }) {
        const popup = ref<Popup | null>(null)
        const { t } = useI18n()
        const { openToast } = useAppToast()
        const attachementMenu = ref<Menu | null>(null)
        const popupMode = ref<PopupMode>('file')
        const caption = ref('')

        watch(() => props.initialCaption, (newVal) => {
            caption.value = newVal;
        }, { immediate: true });

        const selectedMedia = ref<any[]>([])
        const selectedFiles = ref<any[]>([])

        const handleMediaSelected = (pathOrArray: any, file?: File) => {
            let incoming: any[] = [];

            if (Array.isArray(pathOrArray)) {
                incoming = pathOrArray;
            } else if (typeof pathOrArray === 'string' && file) {
                incoming = [{ path: pathOrArray, file }];
            }

            const maxAllowed = 10;
            const remaining = maxAllowed - selectedMedia.value.length;

            if (remaining <= 0) {
                openToast(t('chat.errors.maxFilesReached'), 'error');
                return;
            }

            selectedMedia.value = [...selectedMedia.value, ...incoming.slice(0, remaining)];
            popupMode.value = selectedMedia.value.length === 1 ? 'single-image' : 'multi-image'
            popup.value?.open()
       
        }

        const handleFilesSelected = (files: any[]) => {
            selectedFiles.value = [...selectedFiles.value, ...files];
            popupMode.value = 'file'
            popup.value?.open()
        }

        const closePopup = () => {
            popup.value?.close()
        }

        const resetSelections = () => {
            selectedMedia.value = [];
            selectedFiles.value = [];
            attachementMenu.value?.close();
        }

        const popupTitle = computed(() => {
            switch (popupMode.value) {
                case 'file':
                    return t('chat.file.sendFile')
                case 'multi-image':
                    return t('chat.file.sendImages')
                case 'single-image':
                    return t('chat.file.sendImage')

            }
        })

        const sendMessages = () => {
            const messagesToEmit = [];

            if (caption.value.trim()) {
                messagesToEmit.push({
                    type: 'text',
                    text: caption.value
                });
            }

            if (selectedMedia.value.length > 0) {
                messagesToEmit.push({
                    type: 'image',
                    imageUrl: selectedMedia.value.map(m => m.path),
                    files: selectedMedia.value.map(m => m.file)
                });
            }

            if (selectedFiles.value.length > 0) {
                selectedFiles.value.forEach(fileData => {
                    messagesToEmit.push({
                        type: 'file',
                        fileUrl: fileData.path,
                        file: fileData.file,
                        fileName: fileData.name
                    });
                });
            }

            emit('send-attachments', messagesToEmit);

            popup.value?.close();
            resetSelections();
        };



        return {
            sendMessages,
            t,
            attachementMenu,
            resetSelections,
            handleMediaSelected,
            handleFilesSelected,
            closePopup,
            selectedMedia,
            selectedFiles,
            popupMode,
            caption,
            popup,
            popupTitle,
        }
    }
})
</script>