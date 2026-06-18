<template>
  <div class="w-full flex items-center gap-x-2">
    <div class="w-10 h-10 shrink-0">
      <ContactAvatar :contact="provider" />
    </div>
    <div class="flex-1 text-on-surface">
      <div class="text-label-md" v-loading="isLoading">
        {{ `${provider.name} ${provider.lastName}` }}
      </div>
      <div
        class="text-body-sm max-w-full text-ellipsis overflow-hidden line-clamp-1 opacity-50"
        v-loading="isLoading"
      >
        {{ fellowshipString }}
      </div>
    </div>
    <div class="shrink-0 select-none text-on-surface text-label-md">
      <div class="flex items-center gap-x-2" v-if="!isPending">
        <div>{{ formatCurrency(provider.service.price) }}</div>
        <div>{{ t("general.currency") }}</div>
      </div>
      <div v-else class="flex items-center gap-x-1">
        <BIcon icon="PhClock" class="w-4 h-4 fill-primary" />
        <div class="text-primary text-[10px]">
          {{ t("chat.requestCard.addMedic.pending") }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType, computed } from "vue";
import type { RequestProvider } from "~/types/chat";
import ContactAvatar from "../../contact/ContactAvatar.vue";
import { useI18n } from "~/nuxt-shims";
import { formatCurrency } from "~/nuxt-shims";
export default defineComponent({
  name: "ProviderDisplay",
  components: {
    ContactAvatar,
  },
  props: {
    provider: {
      type: Object as PropType<RequestProvider>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const provider = computed(() => props.provider);
    const isLoading = computed(() => props.loading);

    const fellowshipString = computed(() => {
      if (
        !provider.value.fellowships ||
        provider.value.fellowships.length === 0
      ) {
        return provider.value.expertise || "";
      }
      return provider.value.fellowships.map((f) => f.title).join(", ");
    });

    const isPending = computed(() => {
      return props.provider.status === "pending";
    });

    return {
      fellowshipString,
      isPending,
      t,
      isLoading,
      formatCurrency,
    };
  },
});
</script>
