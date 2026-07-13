<script setup lang="ts">
import BIcon from "~/components/global/BIcon.vue";
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const model = defineModel<string>({ default: "" });

const { t } = useI18n();
const isOpen = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const toggleSearch = () => {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) {
    model.value = "";
  }
};
watch(isOpen, async (val) => {
  if (val) {
    await nextTick();
    setTimeout(() => {
      inputRef.value?.focus();
    }, 150);
  }
});
</script>
<template>
  <div class="w-full">
    <div
      class="px-5 h-16 md:h-20 w-full shrink-0 border-b border-b-outline-variant flex justify-between items-center"
    >
      <div
        :class="[isOpen ? 'opacity-0 max-w-0' : 'max-w-37.5 opacity-100']"
        class="transition-all duration-300 overflow-hidden text-nowrap ease-in-out select-none text-on-surface text-label-lg"
      >
        {{ t("chat.title") }}
      </div>

      <div class="flex-1">
        <div
          class="flex transition-all duration-200 ease-in-out justify-end items-center"
          :class="[isOpen ? 'gap-x-4' : 'gap-x-0']"
        >
          <BIcon
            @click="toggleSearch"
            icon="PhMagnifyingGlass"
            class="cursor-pointer w-5 h-5 fill-on-surface/50 shrink-0"
          />
          <input
            ref="inputRef"
            v-model="model"
            :placeholder="t('general.search')"
            :class="[
              isOpen ? 'opacity-100 flex-1 w-full ml-3' : 'w-0 opacity-0',
            ]"
            type="text"
            class="transition-all text-label-sm duration-300 ease-in-out outline-none bg-transparent text-on-surface"
          />
          <BIcon
            :class="[
              isOpen
                ? ' w-5 h-5 opacity-100 pointer-events-auto'
                : ' pointer-events-none opacity-0 w-0 h-0 ',
            ]"
            class="overflow-hidden cursor-pointer fill-on-surface/50 transition-all duration-200 shrink-0 ease-in-out"
            @click="toggleSearch"
            icon="PhX"
          />
        </div>
      </div>
    </div>
  </div>
</template>
