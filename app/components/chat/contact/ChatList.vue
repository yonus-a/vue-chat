<script setup lang="ts">
import BVirtualVerticalList from "~/components/global/BVirtualVerticalList.vue";
import { useConversationHandlers } from "~/providers/conversations.js";
import NoData from "~/assets/lib-images/dashboard/no-contacts.webp";
import NoDataDisplay from "~/components/general/NoDataDisplay.vue";
import ChatContactDisplay from "./ChatContactDisplay.vue";
import type { ChatFilter, StateKeys } from "~/types/chat";
import BLabel from "~/components/global/BLabel.vue";
import ChatListSearch from "./ChatListSearch.vue";
import { computed, ref } from "vue";

const { t } = useI18n();
const { data, loading, currentPage, totalPages, handleFilter, loadNextPage } =
  useConversationHandlers();

const hasNextPage = computed(() => currentPage.value < totalPages.value);
const activeState = ref<StateKeys>("");
const searchText = ref("");

const setState = (state: StateKeys) => {
  if (activeState.value === state) return;
  handleFilter({ state: activeState.value });
};

watch([searchText], () => {
  handleFilter({ search: searchText.value });
});

const states = computed<ChatFilter[]>(() => [
  { key: "online", label: t("chat.filters.online") },
  { key: "ended", label: t("chat.filters.ended") },
  { key: "active", label: t("chat.filters.active") },
]);

const filterProps = (type: StateKeys) => {
  return activeState.value === type
    ? { color: "primary", icon: "PhX" }
    : { color: "neutral", icon: "" };
};
</script>
<template>
  <div
    class="bg-surface flex flex-col border border-outline-variant w-full h-full overflow-hidden"
  >
    <ChatListSearch class="shrink-0" v-model="searchText" />

    <div class="flex-1 w-full flex flex-col overflow-hidden">
      <div class="w-full shrink-0 px-5 py-2 flex items-center gap-x-2">
        <BLabel
          v-for="filter in states"
          :color="filterProps(filter.key).color"
          :icon="filterProps(filter.key).icon"
          @click="setState(filter.key)"
          @action="setState('')"
          class="cursor-pointer"
          :text="filter.label"
          :key="filter.key"
          size="lg"
        />
      </div>

      <div
        v-if="loading || data.length > 0"
        class="w-full flex-1 px-2.5 pt-2.5 overflow-hidden relative"
      >
        <BVirtualVerticalList
          ref="listRef"
          :items="data"
          :loading="loading"
          :has-next-page="hasNextPage"
          @load-more="loadNextPage"
          class="h-full w-full"
        >
          <template #item="{ item }">
            <ChatContactDisplay
              :contact="item"
              :loading="loading && currentPage === 0"
            />
          </template>
        </BVirtualVerticalList>
      </div>
      <div v-else class="w-full flex-1 flex items-center justify-center">
        <NoDataDisplay :image-path="NoData" :title="t('chat.noMessages')" />
      </div>
    </div>
  </div>
</template>
