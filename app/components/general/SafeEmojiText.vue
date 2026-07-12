<script setup lang="ts">
import { computed } from "vue";
import { parseEmojiArray } from "~/utils/emojiParser";

const props = withDefaults(
  defineProps<{
    text?: string;
    truncate?: boolean;
  }>(),
  {
    text: "",
    truncate: false,
  },
);

const parsedText = computed(() => parseEmojiArray(props.text));
</script>

<template>
  <component
    :is="truncate ? 'div' : 'span'"
    :class="[
      truncate
        ? 'line-clamp-1 overflow-hidden text-ellipsis break-all w-full'
        : 'inline whitespace-pre-wrap wrap-break-word',
    ]"
  >
    <template v-for="(chunk, index) in parsedText" :key="index">
      <img
        v-if="chunk.type === 'emoji'"
        :src="`/emojis/apple/webp/${chunk.hex}.webp`"
        :alt="chunk.content"
        class="inline-block h-4.5 w-4.5 align-middle select-text pointer-events-none"
        loading="lazy"
      />
      <span v-else>{{ chunk.content }}</span>
    </template>
  </component>
</template>
