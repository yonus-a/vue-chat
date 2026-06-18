<template>
    <BMenu>
        <template #trigger="{ isOpen }">
            <div
                class="cursor-pointer text-on-surface h-10 px-3 border-outline-variant border-2 -outline-offset-1 flex justify-center gap-x-1.5 items-center rounded-xl overflow-hidden relative transition-all duration-300 hover:bg-surface-container-low">
                <div class="w-4 h-4 rounded-full overflow-hidden shrink-0">
                    <BImage :src="flagUrl" class="w-full h-full object-cover" fit="cover" />
                </div>
                <div class="text-label-sm select-none whitespace-nowrap">{{ currentCountry.title }}</div>
                <div class="transition-transform duration-200 ease-in-out flex items-center justify-center"
                    :class="isOpen ? 'rotate-180' : 'rotate-0'">
                    <BIcon icon="PhCaretDown" class="w-4 h-4" />
                </div>
            </div>
        </template>

        <div class="flex flex-col py-1 max-w-25">
            <div v-for="(lang, idx) in languages" :key="lang.code" @click="switchLocale(lang.code)"
                class="flex items-center gap-x-1.5 px-4 h-10 hover:bg-surface-variant transition-colors cursor-pointer group">
                <div class="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-outline-variant">
                    <BImage :src="lang.flag" class="w-full h-full object-cover" />
                </div>
                <span class="text-label-sm select-none text-on-surface whitespace-nowrap">
                    {{ lang.title }}
                </span>


            </div>
        </div>
    </BMenu>
</template>

<script setup lang="ts">
import { useLocale } from '~/nuxt-shims';

// Destructuring all necessary logic from your refactored composable
const {
    locale,
    languages,
    currentCountry,
    flagUrl,
    switchLocale
} = useLocale();
</script>
