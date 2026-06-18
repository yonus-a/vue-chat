<template>
    <div class="bg-surface flex flex-col border border-outline-variant w-full h-full overflow-hidden">
        <ChatListSearch class=" shrink-0" v-model="searchText" />

        <div class="flex-1 w-full flex flex-col overflow-hidden">

            <div class="w-full shrink-0 px-5 py-2 flex items-center gap-x-2">
                <BLabel class="cursor-pointer" size="lg" :text="filter.label" @action="setFilter('')"
                    :color="filterProps(filter.key).color" v-for="filter in filters"
                    :icon="filterProps(filter.key).icon" :key="filter.key" @click="setFilter(filter.key)" />
            </div>

            <div v-if="currentState.loading || chats.length > 0"
                class="w-full flex-1 px-2.5 pt-2.5 overflow-hidden relative">
                <BVirtualVerticalList ref="listRef" :items="chats" :loading="currentState.loading"
                    :has-next-page="currentState.hasNextPage" @load-more="chatStore.loadNextPage(activeFilter)"
                    class="h-full w-full">
                    <template #item="{ item }">
                        <ChatContactDisplay :contact="item"
                            :loading="currentState.loading && currentState.page === 0" />
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
import { computed, defineComponent, onMounted } from 'vue';
import { useChatStore } from '~/nuxt-shims';
import { useI18n } from '~/nuxt-shims';
import type { ChatFilter, FilterKeys } from '~/types/chat';
import ChatContactDisplay from './ChatContactDisplay.vue';
import ChatListSearch from './ChatListSearch.vue';
import NoData from '~/assets/lib-images/dashboard/no-contacts.webp'
import NoDataDisplay from '~/components/general/NoDataDisplay.vue';
export default defineComponent({
    name: 'ChatList',
    components: {
        ChatContactDisplay,
        ChatListSearch,
        NoDataDisplay,
    },
    setup() {
        const { t } = useI18n();
        const chatStore = useChatStore();
        const activeFilter = ref<FilterKeys>('');
        const searchText = ref('');
        const listRef = ref(null);

        const currentState = computed(() => chatStore.conversationStates[activeFilter.value]);
        const isLoading = computed(() => chatStore.conversationStates[activeFilter.value].loading)
        const currentPage = computed(() => chatStore.conversationStates[activeFilter.value].page)
        const chats = computed(() => chatStore.getDisplayedContacts(activeFilter.value));

        const filters = computed<ChatFilter[]>(() => [
            { key: 'online', label: t('chat.filters.online') },
            { key: 'ended', label: t('chat.filters.ended') },
            { key: 'active', label: t('chat.filters.active') },
        ]);

        const setFilter = (type: FilterKeys) => {
            if (activeFilter.value === type) return;
            activeFilter.value = type;
        };

        // Handle Filter Changes
        watch(activeFilter, (newFilter) => {
            // 1. Scroll to top (Assuming Virtual List has a scroll div)
            const scrollEl = listRef.value?.$el;
            if (scrollEl) scrollEl.scrollTop = 0;

            // 2. Fetch if category is empty
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

        watch(searchText, (newQuery) => {
            // Clear the pending search every time a new letter is typed
            if (searchTimeout) clearTimeout(searchTimeout);

            // Only trigger after 500ms of "silence"
            searchTimeout = setTimeout(() => {
                // Reset to page 1 and pass the search query
                chatStore.fetchConversations(activeFilter.value, 1, newQuery);

                // Optional: Scroll the virtual list back to top for new results
                const scrollEl = listRef.value?.$el;
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
            searchText,
            listRef,
            chatStore,
            currentPage,
            NoData,
            isLoading,
        };
    }
})
</script>