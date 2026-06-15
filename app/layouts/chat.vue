<template>
  <div class="bg-surface w-dvw h-dvh overflow-hidden flex">
    <div class="flex-1 h-full flex flex-col min-w-0 max-h-full">
      <div
        ref="pageContainer"
        @scroll="handleScroll"
        class="flex-1 w-full overflow-y-auto"
      >
        <div class="h-full w-full">
          <NuxtPage />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
const chatStore = useChatStore();
const pageContainer = ref<HTMLElement | null>(null);

const lastScrollY = ref(0);

const handleScroll = () => {
  const currentScrollY = pageContainer.value?.scrollTop;
  if (!currentScrollY) return;
  lastScrollY.value = currentScrollY;
};

onBeforeMount(() => {
  chatStore.fetchConversations("", 1);
});
</script>
