<script setup lang="ts">
import { computed } from "vue";
import BImage from "~/components/global/BImage.vue";
import type { Contact } from "~/types";

const props = withDefaults(
  defineProps<{
    contact: Contact;
    showOnline?: boolean;
  }>(),
  { showOnline: true },
);

const hasImage = computed(
  () => props.contact.imageUrl && props.contact.imageUrl.trim().length > 0,
);

const initials = computed(() => {
  const first = props.contact?.name?.trim() || "";
  const last = props.contact?.lastName?.trim() || "";

  if (!first && !last) return "";

  const firstInitial = first.charAt(0);
  const lastInitial = last.charAt(0);

  const isRTL = /[؀-ۿ]/.test(firstInitial);

  if (isRTL) {
    return lastInitial ? `${firstInitial} ${lastInitial}` : firstInitial;
  } else {
    return (firstInitial + lastInitial).toUpperCase();
  }
});
</script>
<template>
  <div class="w-full h-full relative z-10">
    <BImage
      draggable="false"
      :src="contact.imageUrl"
      @click.stop
      @mousedown.stop
      v-if="hasImage"
      class="pointer-events-none select-none w-full h-full min-w-full rounded-full overflow-hidden min-h-full max-w-full max-h-full"
    />
    <div
      v-else
      class="w-full h-full bg-chat-primary/10 flex items-center justify-center rounded-full overflow-hidden"
    >
      <div class="select-none text-chat-primary text-sm font-semibold">
        {{ initials }}
      </div>
    </div>
    <div
      v-if="contact.isOnline && showOnline"
      class="absolute right-0 bottom-0 bg-chat-primary rounded-full w-2.5 h-2.5 border-2 border-chat-background"
    ></div>
  </div>
</template>
