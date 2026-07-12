<script setup lang="ts">
defineProps<{
  imagePath?: string;
  title?: string;
}>();
</script>
<template>
  <div class="w-full h-full flex flex-col items-center justify-center gap-y-5">
    <div class="h-50 w-50">
      <BImage
        class="w-full h-full min-w-full min-h-full max-w-full max-h-full"
        :src="imagePath"
      />
    </div>
    <div class="select-none text-label-sm text-center text-on-surface/50">
      {{ title }}
    </div>
  </div>
</template>
