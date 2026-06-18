<template>
    <a :to="to" class="flex text-primary cursor-pointer select-none items-center gap-x-1">
        <div class=" text-label-sm">{{ title }}</div>
        <BIcon icon="PhCaretLeft" class=" w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
    </a>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'CardLink',
    props: {
        to: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        }
    }
})
</script>