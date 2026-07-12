<script setup lang="ts">
import { ref, computed } from "vue";
import dataRaw from "@emoji-mart/data";

// Types for the untyped @emoji-mart/data package
interface EmojiSkin {
  unified: string;
  native: string;
}

interface EmojiData {
  skins: EmojiSkin[];
}

interface Category {
  id: string;
  emojis: string[];
}

interface EmojiCatalog {
  emojis: Record<string, EmojiData>;
  categories: Category[];
}

const data = dataRaw as unknown as EmojiCatalog;

interface CategoryButton {
  id: string;
  icon: string;
}

const emit = defineEmits<{
  select: [native: string];
}>();

const activeCategory = ref("people");

const categories: CategoryButton[] = [
  { id: "recent", icon: "PhClock" },
  { id: "people", icon: "PhSmiley" },
  { id: "nature", icon: "PhPawPrint" },
  { id: "foods", icon: "PhHamburger" },
  { id: "activity", icon: "PhSoccerBall" },
  { id: "places", icon: "PhBuildings" },
  { id: "objects", icon: "PhLightbulb" },
  { id: "symbols", icon: "PhMusicNotes" },
  { id: "flags", icon: "PhFlag" },
];

interface ParsedEmoji {
  hex: string;
  native: string;
}

const getEmojiData = (emojiId: string): ParsedEmoji | null => {
  const emoji = data.emojis[emojiId];
  if (!emoji?.skins?.[0]) return null;

  return {
    hex: emoji.skins[0].unified,
    native: emoji.skins[0].native,
  };
};

const currentEmojis = computed<ParsedEmoji[]>(() => {
  if (activeCategory.value === "recent") {
    const peopleCat = data.categories.find((c) => c.id === "people");
    if (!peopleCat) return [];
    return peopleCat.emojis
      .slice(0, 24)
      .map(getEmojiData)
      .filter((e): e is ParsedEmoji => e !== null);
  }

  const cat = data.categories.find((c) => c.id === activeCategory.value);
  if (!cat) return [];

  return cat.emojis
    .map(getEmojiData)
    .filter((e): e is ParsedEmoji => e !== null);
});
</script>

<template>
  <div class="flex flex-col bg-surface md:w-87.5 md:rounded-2xl" dir="rtl">
    <div
      class="grid h-49.5 grid-cols-8 content-start gap-x-1 gap-y-2 overflow-y-auto px-3 pb-3 pt-3 md:h-94.5 hide-scrollbar"
    >
      <div
        v-for="emoji in currentEmojis"
        :key="emoji.hex"
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-surface-variant"
        @click="emit('select', emoji.native)"
      >
        <img
          :src="`/emojis/apple/webp/${emoji.hex}.webp`"
          :alt="emoji.native"
          class="h-6 w-6 object-contain"
          loading="lazy"
        />
      </div>
    </div>

    <div class="flex h-10 items-center justify-between bg-surface-variant px-2">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="rounded-md p-1.5 transition-colors hover:bg-surface-variant"
        @click="activeCategory = cat.id"
      >
        <BIcon
          :icon="cat.icon"
          class="h-6 w-6 cursor-pointer transition-colors"
          :class="
            activeCategory === cat.id ? 'fill-primary' : 'fill-on-surface/50'
          "
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
