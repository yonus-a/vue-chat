<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { mode, toggleMode } = useTheme();

const isMounted = ref(false);
onMounted(() => {
  isMounted.value = true;
});

const themeIcon = computed(() =>
  mode.value === "light" ? "PhMoon" : "PhSunDim",
);

const themeTitle = computed(() =>
  mode.value === "light" ? t("general.themes.light") : t("general.themes.dark"),
);

const layoutItems = computed(() => {
  if (!isMounted.value) {
    return ["text", "icon"];
  }
  return mode.value === "dark" ? ["icon", "text"] : ["text", "icon"];
});
</script>

<style scoped>
.switch-move {
  transition: all 0.5s ease;
}
</style>
<template>
  <div
    dir="rtl"
    class="relative h-10 cursor-pointer overflow-hidden rounded-xl border-2 border-outline-variant bg-surface p-1 transition-all duration-300 -outline-offset-1"
    @click="toggleMode"
  >
    <TransitionGroup
      name="switch"
      tag="div"
      class="flex h-full w-full items-center"
    >
      <div
        v-for="item in layoutItems"
        :key="item"
        class="flex h-full items-center transition-all duration-500 ease-in-out"
      >
        <div
          v-if="item === 'icon'"
          class="flex h-full aspect-square items-center justify-center rounded-lg bg-surface-variant"
        >
          <BIcon class="h-5 w-5 fill-primary" :icon="themeIcon" />
        </div>

        <div
          v-else
          class="whitespace-nowrap px-3 text-label-sm select-none text-on-surface"
        >
          {{ themeTitle }}
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
