<template>
    <div class="whitespace-nowrap overflow-hidden relative text-wrap  select-none w-dvw md:max-w-135 ">
        <div class=" flex flex-col p-4 w-full h-full ">
            <div class="flex items-center gap-x-3 shrink-0">
                <BIcon icon="PhX" class="cursor-pointer fill-on-surface/50 w-5 h-5" @click="$emit('close')" />
                <div class="text-on-surface text-label-sm">{{ t('chat.board.title') }}</div>
            </div>

            <!-- CANVAS WRAPPER -->
            <div
                class="flex-1 shrink-0 min-h-117 w-full border-2 rounded-2xl border-primary mt-4 relative overflow-hidden bg-white">
                <canvas ref="canvasRef" class="w-full h-full absolute top-0 left-0 touch-none"></canvas>
            </div>

            <div class="flex items-center justify-between mt-2 shrink-0">
                <BButton icon="PhTrayArrowDown" color="primary" type="fill" @click="saveToFiles" />
                <div dir="rtl" class="flex items-center gap-x-2">
                    <!-- Color Picker (You can attach an input type="color" or a menu here later) -->
                    <div v-if="pages.length === 1" @click.stop="handleAction('add-page')"
                        class="aspect-square w-11 rounded-full flex items-center justify-center cursor-pointer bg-surface-variant">
                        <BIcon icon="PhPlus" class="w-6 h-6 fill-on-surface" />
                    </div>
                    <BMenu v-else :options="pageOptions" @select="handlePageSelect">
                        <template #trigger>
                            <div
                                class="rounded-full gap-x-2.5 p-2.5 flex items-center justify-center cursor-pointer bg-surface-variant relative h-11">
                                <div class=" text-label-sm text-on-surface select-none">+{{ pages.length - 1 }}</div>
                                <BIcon icon="PhFiles" class=" fill-on-surface w-6 h-6" />
                            </div>
                        </template>

                    </BMenu>
                    <BMenu :align="'top'" ref="colorPickerMenu">
                        <template #trigger>
                            <div @click.stop="handleAction('color')"
                                class="aspect-square w-11 rounded-full flex items-center justify-center cursor-pointer bg-surface-variant relative overflow-hidden">
                                <div class="rounded-full aspect-square w-6 h-6 pointer-events-none"
                                    :style="{ backgroundColor: selectedColor }">
                                </div>
                            </div>
                        </template>
                        <div class=" p-3 flex flex-col gap-y-4">
                            <div class=" text-on-surface select-none  text-label-md">{{ t('chat.board.selectColor') }}
                            </div>
                            <div class=" w-50 hidden md:grid grid-cols-5 gap-1">
                                <div @click="setColor(color)"
                                    :class="[selectedColor === color ? 'border-primary' : 'border-primary/0']"
                                    class=" cursor-pointer transition-all duration-200 ease-in-out border w-8 aspect-square rounded-lg"
                                    v-for="(color, index) in colors" :style="{ backgroundColor: color }">
                                </div>
                            </div>
                        </div>
                    </BMenu>
                    <div @click="handleAction('erase')"
                        class="aspect-square w-11 rounded-full flex items-center justify-center cursor-pointer bg-surface-variant">
                        <BIcon icon="PhEraser" class="w-6 h-6 fill-on-surface" />
                    </div>
                    <!-- VERTICAL BRUSH SIZE SLIDER IN BMENU -->
                    <BMenu align="top">
                        <template #trigger="{ isOpen }">
                            <div
                                class="aspect-square w-11 rounded-full flex items-center justify-center cursor-pointer bg-surface-variant">
                                <BIcon icon="PhPencilLine" class="w-6 h-6 fill-on-surface" />
                            </div>
                        </template>

                        <!-- @click.stop prevents the BPopup from closing when you click the menu -->
                        <div class="py-2" @click.stop @pointerdown.stop>
                            <BrushSizeSlider v-model="brushSize" :color="selectedColor" />
                        </div>
                    </BMenu>
                    <div @click="handleAction('redo')"
                        class="aspect-square w-11 rounded-full flex items-center justify-center cursor-pointer bg-surface-variant">
                        <BIcon icon="PhArrowUUpRight" class="w-6 h-6 fill-on-surface" />
                    </div>
                    <div @click="handleAction('undo')"
                        class="aspect-square w-11 rounded-full flex items-center justify-center cursor-pointer bg-surface-variant">
                        <BIcon icon="PhArrowUUpLeft" class="w-6 h-6 fill-on-surface" />
                    </div>
                </div>
            </div>
        </div>
        <BoardColorPicker :colors="colors" v-show="isMobile" ref="boardColorPicker" class=" md:hidden"
            v-model="selectedColor" />
    </div>
</template>

<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n, useCallStore, useAppToast, useWindowSize } from '~/nuxt-shims';
import BrushSizeSlider from './BrushSizeSlider.vue';
import BoardColorPicker from './BoardColorPicker.vue';
import type { BoardColorPickerExposed } from './BoardColorPicker.vue';
import type { Menu } from '~/types/components/menu';
import { storeToRefs } from 'pinia';
export default defineComponent({
    name: 'CallPaintBoard',
    emits: ['close'],
    props: {
        isOpen: {
            type: Boolean,
            default: false,
        }
    },
    components: {
        BrushSizeSlider,
        BoardColorPicker,
    },
    setup(props) {
        const { t } = useI18n();
        const callStore = useCallStore();
        const { openToast } = useAppToast()
        const { width } = useWindowSize()
        const isMobile = computed(() => width.value < 768)
        const boardColorPicker = useTemplateRef<BoardColorPickerExposed>('boardColorPicker');
        const colorPickerMenu = useTemplateRef<Menu>('colorPickerMenu')

        const colors = ref([
            '#2C2727', '#F49AA6', '#F897F6', '#CF40F3', '#555CEE',
            '#40F3E4', '#8CE25E', '#E9EF37', '#F37040', '#F34040'
        ])

        const setColor = (color: string) => {
            selectedColor.value = color
            colorPickerMenu.value?.close()
        }

        const {
            boardPages: pages,
            boardSelectedPage: selectedPage,
            boardSelectedColor: selectedColor,
            boardBrushSize: brushSize,
            boardHistory: history,
            boardRedoHistory: redoHistory
        } = storeToRefs(callStore);


        // State
        const canvasRef = ref<HTMLCanvasElement | null>(null);
        let signaturePadInstance: any = null;

        //const selectedColor = ref('#2C2727');
        //const brushSize = ref(3);

        // History for Undo/Redo
        //const history = ref<any[]>([]);
        //const redoHistory = ref<any[]>([]);

        // Handle Canvas Resizing correctly to prevent stretching
        const resizeCanvas = () => {
            const canvas = canvasRef.value;
            if (!canvas) return;

            // Prevent resizing to 0x0 if the menu is closed/hidden
            if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return;

            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d")?.scale(ratio, ratio);

            if (signaturePadInstance) {
                if (history.value.length > 0) {
                    signaturePadInstance.fromData(history.value);
                } else {
                    // Crucial: Re-apply the white background color after resizing
                    signaturePadInstance.clear();
                }
            }
        };
        onMounted(async () => {
            const SignaturePadModule = await import('signature_pad');
            const SignaturePad = SignaturePadModule.default;

            if (canvasRef.value) {
                signaturePadInstance = new SignaturePad(canvasRef.value, {
                    minWidth: brushSize.value,
                    maxWidth: brushSize.value + 2,
                    penColor: selectedColor.value,
                    backgroundColor: 'rgb(255, 255, 255)'
                });

                resizeCanvas();
                window.addEventListener("resize", resizeCanvas);

                signaturePadInstance.addEventListener("endStroke", () => {
                    history.value = signaturePadInstance.toData();
                    redoHistory.value = [];
                });
            }
        });


        onBeforeUnmount(() => {
            stopStreaming();
            window.removeEventListener("resize", resizeCanvas);
            if (signaturePadInstance) {
                signaturePadInstance.off();
            }
        });


        watch(brushSize, (newSize) => {
            if (signaturePadInstance) {
                signaturePadInstance.minWidth = newSize;
                signaturePadInstance.maxWidth = newSize + 2;
            }
        });

        watch(selectedColor, (newColor) => {
            if (signaturePadInstance) {
                signaturePadInstance.penColor = newColor;
            }
        });

        const saveToFiles = () => {
            if (!signaturePadInstance || signaturePadInstance.isEmpty()) return;

            // Save as JPEG (which relies on the backgroundColor we set to white)
            const dataUrl = signaturePadInstance.toDataURL("image/jpeg");

            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `drawing-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            openToast(t('chat.board.savedSuccessfully'), 'success')
        };

        const handleAction = (action: string) => {
            if (!signaturePadInstance) return;

            switch (action) {
                case 'erase':
                    if (signaturePadInstance.isEmpty()) return;
                    const snapshot = signaturePadInstance.toData();
                    history.value.push({ isClearAction: true, snapshot });
                    signaturePadInstance.clear();
                    redoHistory.value = [];
                    break;
                case 'color':
                    if (isMobile.value) {
                        boardColorPicker.value?.open()
                    } else {
                        colorPickerMenu.value?.open()
                    }
                    break;
                case 'add-page':
                    pages.value[selectedPage.value] = {
                        data: signaturePadInstance.toData(),
                        history: [...history.value],
                        redo: [...redoHistory.value]
                    };
                    pages.value.push({ data: [], history: [], redo: [] });
                    selectedPage.value = pages.value.length - 1;

                    signaturePadInstance.clear();

                    history.value = [];
                    redoHistory.value = [];
                    break;
                case 'undo':
                    if (history.value.length > 0) {
                        const lastAction = history.value.pop();
                        redoHistory.value.push(lastAction);
                        signaturePadInstance.fromData(history.value);
                    }
                    break;

                case 'redo':
                    if (redoHistory.value.length > 0) {
                        const nextAction = redoHistory.value.pop();
                        history.value.push(nextAction);
                        signaturePadInstance.fromData(history.value);
                    }
                    break;
            }
        };

        const pageOptions = computed(() => {
            const options = pages.value.map((_, index) => ({
                key: (index + 1).toString(),
                label: t('chat.board.page', { page: index + 1 }),
                icon: 'PhFiles'
            }));

            options.push({
                key: 'add-new-page',
                label: t('chat.board.addPage'),
                icon: 'PhPlus',
                color: 'primary'
            });

            return options;
        });

        // 2. Add the switching logic
        const switchPage = (index: number) => {
            if (!signaturePadInstance || index === selectedPage.value) return;

            // Save current page state before leaving
            pages.value[selectedPage.value] = {
                data: signaturePadInstance.toData(),
                history: [...history.value],
                redo: [...redoHistory.value]
            };

            // Load target page state
            selectedPage.value = index;
            const target = pages.value[index];

            signaturePadInstance.fromData(target.data || []);
            history.value = [...(target.history || [])];
            redoHistory.value = [...(target.redo || [])];
        };

        // 3. Handle the menu selection event
        const handlePageSelect = (key: string) => {
            if (key === 'add-new-page') {
                setTimeout(() => {
                    handleAction('add-page');
                }, 300)
            } else {
                const targetIndex = Number(key) - 1;
                switchPage(targetIndex);
            }
        };

        const startStreaming = () => {
            if (!canvasRef.value || !signaturePadInstance) return;

            const stream = (canvasRef.value as any).captureStream(30);
            callStore.setScreenStream(stream);

            if (history.value && history.value.length > 0) {
                signaturePadInstance.fromData(history.value);
            } else {
                signaturePadInstance.clear();
            }
        };
        const stopStreaming = () => {
            callStore.stopScreenShare();
        };

        watch(() => props.isOpen, (val) => {
            if (val) {
                setTimeout(() => {
                    resizeCanvas();
                    startStreaming();
                }, 50);
            } else {
                callStore.stopScreenShare();
            }
        }, { immediate: true });

        return {
            t,
            canvasRef,
            saveToFiles,
            selectedColor,
            setColor,
            brushSize,
            boardColorPicker,
            handleAction,
            pages,
            selectedPage,
            pageOptions,
            colorPickerMenu,
            handlePageSelect,
            switchPage,
            colors,
            isMobile,
        };
    }
})
</script>
