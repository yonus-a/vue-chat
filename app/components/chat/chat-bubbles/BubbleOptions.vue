<template>
    <Teleport to="body">
        <div :style="{ position: 'fixed', top: `${position.y}px`, left: `${position.x}px`, zIndex: 99999, pointerEvents: 'none' }"
            dir="rtl">

            <BMenu @select="handleOption" :options="options" ref="menuRef" @close="onMenuClosed">
                <template #trigger>
                    <div style="width: 1px; height: 1px;"></div>
                </template>
            </BMenu>
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, type PropType } from 'vue';
import { useI18n } from '~/nuxt-shims';
import { useChatActionStore } from '~/stores/chatActionStore';
import type { Menu } from '~/types/components/menu';
import type { ExtendedMessage } from '~/types/chat';
export default defineComponent({
    name: 'BubbleOptions',
    props: {
        message: {
            type: Object as PropType<ExtendedMessage>,
            required: true,
        }
    },
    setup(props, { expose }) {
        const { t } = useI18n();
        const chatActionStore = useChatActionStore();
        const isOpen = ref(false);

        const menuRef = ref<Menu | null>(null);
        const position = ref({ x: 0, y: 0 });

        const openMenu = (x: number, y: number) => {
            // Adjust bounds so the menu doesn't clip off the right/bottom edges of the screen
            const adjustedX = Math.min(x, window.innerWidth - 250);
            const adjustedY = Math.min(y, window.innerHeight - 300);

            position.value = { x: adjustedX, y: adjustedY };
            isOpen.value = true;
            chatActionStore.isMenuOpen = true;

            // Wait 1 frame for the wrapper to mount at the coordinates, then fire BMenu
            nextTick(() => {
                menuRef.value?.open();
            });
        };

        const closeMenu = () => {
            menuRef.value?.close();
            chatActionStore.isMenuOpen = false;
        };

        const onMenuClosed = () => {
            isOpen.value = false;
            chatActionStore.isMenuOpen = false;
        };

        expose({ openMenu, closeMenu });


        const showAsDeselect = computed(() => {
            return chatActionStore.isSelectMode && chatActionStore.selectedMessages.has(props.message.id);
        });
        const options = computed(() => {
            const allOptions = [
                { icon: 'PhArrowBendUpLeft', key: 'reply', label: t('chat.messageOptions.reply'), canShow: props.message.isSent },
                { icon: 'PhPencilSimpleLine', key: 'edit', label: t('chat.messageOptions.edit'), canShow: chatActionStore.canEdit },
                { icon: 'PhCopy', key: 'copy', label: t('chat.messageOptions.copy'), canShow: true },
                {
                    icon: showAsDeselect.value ? 'PhXCircle' : 'PhCheckCircle',
                    key: 'select_toggle',
                    label: showAsDeselect.value ? t('chat.messageOptions.deselect') : t('chat.messageOptions.select'),
                    canShow: true
                },
                { icon: 'PhTrash', key: 'delete', label: t('chat.messageOptions.delete'), canShow: chatActionStore.canDelete, color: 'error' }
            ];
            return allOptions.filter((option) => option.canShow);
        });

        const handleOption = (key: string) => {

            const targetIds = chatActionStore.isSelectMode && chatActionStore.selectedMessages.has(props.message.id)
                ? chatActionStore.selectedArray.map(m => m.id)
                : [props.message.id];


            closeMenu();

            setTimeout(() => {
                switch (key) {
                    case 'delete':
                        chatActionStore.triggerDelete(targetIds);
                        break;
                    case 'select_toggle':
                        if (!chatActionStore.isSelectMode) {
                            chatActionStore.startSelectMode(props.message);
                        } else {
                            chatActionStore.toggleSelection(props.message);
                        }
                        break;
                    case 'edit':
                        chatActionStore.triggerEdit(props.message);
                        break;
                    case 'reply':
                        if (!props.message.isSent) return;
                        chatActionStore.replyingTo = props.message;
                        break;
                    case 'copy':
                        chatActionStore.copyMessageText();
                        break;
                }
            }, 300);
        };


        return {
            t, options, position, menuRef,
            closeMenu, openMenu, handleOption, onMenuClosed, isOpen,
        };
    }
});
</script>