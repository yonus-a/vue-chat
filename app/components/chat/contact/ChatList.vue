<template>
    <div class="bg-surface flex flex-col border border-outline-variant w-full h-full overflow-hidden">
        <ChatListSearch class=" shrink-0" v-model="searchTextProxy" />

        <div class="flex-1 w-full flex flex-col overflow-hidden">

            <div class="w-full shrink-0 px-5 py-2 flex items-center gap-x-2">
                <BLabel class="cursor-pointer" size="lg" :text="filter.label" @action="setFilter('')"
                    :color="filterProps(filter.key).color" v-for="filter in filters"
                    :icon="filterProps(filter.key).icon" :key="filter.key" @click="setFilter(filter.key)" />
            </div>

            <div v-if="currentState.loading || chats.length > 0"
                class="w-full flex-1 px-2.5 pt-2.5 overflow-hidden relative">
                <BVirtualVerticalList ref="listRef" :items="chats" :loading="currentState.loading"
                    :has-next-page="currentState.hasNextPage" @load-more="loadMore"
                    class="h-full w-full">
                    <template #item="{ item }">
                        <ChatContactDisplay :contact="item"
                            :active="item.id === selectedId"
                            :loading="currentState.loading && currentState.page === 0"
                            @select="selectChat" />
                    </template>
                </BVirtualVerticalList>
            </div>
            <div v-else class=" w-full flex-1 flex items-center justify-center">
                <NoDataDisplay :image-path="NoData" :title="t('chat.noMessages')" />
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useChatStore } from '#imports';
import { useI18n } from '#imports';
import type { ChatFilter, FilterKeys } from '~/types/chat';
import ChatContactDisplay from './ChatContactDisplay.vue';
import ChatListSearch from './ChatListSearch.vue';
import NoData from '/images/dashboard/no-contacts.webp'
import NoDataDisplay from '~/components/general/NoDataDisplay.vue';
export default defineComponent({
    name: 'ChatList',
    components: {
        ChatContactDisplay,
        ChatListSearch,
        NoDataDisplay,
    },
    props: {
        searchText: {
            type: String,
            default: '',
        },
    },
    emits: ['update:searchText'],
    setup(props, { emit }) {
        const { t } = useI18n();
        const chatStore = useChatStore();
        const activeFilter = ref<FilterKeys>('');
        const listRef = ref<any>(null);

        const searchTextProxy = computed<string>({
            get: () => props.searchText,
            set: (v) => emit('update:searchText', v),
        });

        const currentState = computed(() => chatStore.conversationStates[activeFilter.value]);
        const isLoading = computed(() => chatStore.conversationStates[activeFilter.value].loading)
        const currentPage = computed(() => chatStore.conversationStates[activeFilter.value].page)
        const chats = computed(() => chatStore.getDisplayedContacts(activeFilter.value));

        const selectedId = computed(() => chatStore.activeConversationId);
        const selectChat = (id: number) => chatStore.selectChat(id);
        const loadMore = () => chatStore.loadNextPage(activeFilter.value);

        const filters = computed<ChatFilter[]>(() => [
            { key: 'online', label: t('chat.filters.online') },
            { key: 'ended', label: t('chat.filters.ended') },
            { key: 'active', label: t('chat.filters.active') },
        ]);

        const setFilter = (type: FilterKeys) => {
            if (activeFilter.value === type) return;
            activeFilter.value = type;
        };

        watch(activeFilter, (newFilter) => {
            const scrollEl = (listRef.value as any)?.$el;
            if (scrollEl) scrollEl.scrollTop = 0;

            if (chatStore.conversationStates[newFilter].data.length === 0) {
                chatStore.fetchConversations(newFilter, 1);
            }
        });

        const filterProps = (type: FilterKeys) => {
            return activeFilter.value === type
                ? { color: 'primary', icon: 'PhX' }
                : { color: 'neutral', icon: '' };
        };

        let searchTimeout: any = null;

        watch(() => props.searchText, (newQuery) => {
            if (searchTimeout) clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                chatStore.fetchConversations(activeFilter.value, 1, newQuery);

                const scrollEl = (listRef.value as any)?.$el;
                if (scrollEl) scrollEl.scrollTop = 0;
            }, 500);
        });

        return {
            setFilter,
            t,
            filterProps,
            filters,
            chats,
            activeFilter,
            currentState,
            searchTextProxy,
            listRef,
            currentPage,
            NoData,
            isLoading,
            selectedId,
            selectChat,
            loadMore,
        };
    }
})
</script>
