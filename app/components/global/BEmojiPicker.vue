<template>
  <div class="md:w-87.5 flex bg-surface md:rounded-2xl flex-col " dir="rtl">

    <!-- Emoji Grid (Search Removed) -->
    <!-- Added pt-3 so it doesn't look cramped at the top without the search bar -->
    <div class=" h-49.5 md:h-94.5 overflow-y-auto hide-scrollbar px-3 pt-3 pb-3 grid grid-cols-8 gap-x-1 gap-y-2 content-start">
      <div v-for="emoji in currentEmojis" :key="emoji.hex" @click="$emit('select', emoji.native)"
        class="flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-surface-variant rounded-md transition-colors">
        <!-- Loads exactly from your specified WebP path -->
        <img :src="`/emojis/apple/webp/${emoji.hex}.webp`" :alt="emoji.native" class="w-6 h-6 object-contain"
          loading="lazy" />
      </div>
    </div>

    <!-- Bottom Navigation (With the exact purple border) -->
    <div class="flex h-10 items-center justify-between px-2  bg-surface-variant">
      <button v-for="cat in categories" :key="cat.id" @click="activeCategory = cat.id"
        class="p-1.5 rounded-md hover:bg-surface-variant transition-colors">
        <BIcon :icon="cat.icon" class="w-6 h-6 cursor-pointer transition-colors"
          :class="activeCategory === cat.id ? 'fill-primary' : 'fill-on-surface/50'" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// We only import the raw category and hex data from emoji-mart
import dataRaw from '@emoji-mart/data';
// `@emoji-mart/data` no longer ships top-level typings for `.categories` /
// `.emojis`; cast at the import boundary.
const data = dataRaw as unknown as {
  emojis: Record<string, { skins: Array<{ unified: string; native: string }> }>;
  categories: Array<{ id: string; emojis: string[] }>;
};

const emit = defineEmits(['select']);
const activeCategory = ref('people'); // Default starting category

// Maps your bottom icons to the exact category IDs in the emoji-mart JSON
const categories = [
  { id: 'recent', icon: 'PhClock' }, // Note: We mock 'recent' below
  { id: 'people', icon: 'PhSmiley' },
  { id: 'nature', icon: 'PhPawPrint' },
  { id: 'foods', icon: 'PhHamburger' },
  { id: 'activity', icon: 'PhSoccerBall' },
  { id: 'places', icon: 'PhBuildings' },
  { id: 'objects', icon: 'PhLightbulb' },
  { id: 'symbols', icon: 'PhMusicNotes' },
  { id: 'flags', icon: 'PhFlag' }
];

// Dynamically grab the emojis for the selected category
const currentEmojis = computed(() => {
  // Mock logic for "Recent" since we don't have a database saving them yet
  if (activeCategory.value === 'recent') {
    const peopleCat = data.categories.find(c => c.id === 'people');
    return peopleCat.emojis.slice(0, 24).map(getEmojiData);
  }

  // Normal category loading
  const cat = data.categories.find(c => c.id === activeCategory.value);
  if (!cat) return [];

  return cat.emojis.map(getEmojiData);
});

// Helper to extract the hex code and native character from the raw JSON
const getEmojiData = (emojiId: string) => {
  const e = data.emojis[emojiId];
  return {
    // e.skins[0].unified is the hex code (e.g., '1f600')
    hex: e.skins[0].unified,
    // e.skins[0].native is the actual character (e.g., '😀')
    native: e.skins[0].native
  };
};
</script>

<style scoped>
/* Hides the ugly native scrollbar but allows scrolling */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>