<script setup lang="ts">
import { VueButton, VueIcon, VueInput } from '@vue-devtools-next/ui'

// TODO: keyboard shortcut, esc to cancel, enter to submit
//       and show tooltip on button when hovering

const props = defineProps<{
  modelValue: string
  type: string // typeof value
}>()

const emit = defineEmits<{
  'cancel': []
  'submit': [value: string]
  'update:modelValue': [value: string]
}>()

const value = useVModel(props, 'modelValue', emit)

const isWarning = computed(() => props.type === 'number' && (value.value.trim().length === 0 || Number.isNaN(Number(value.value))))
</script>

<template>
  <span class="flex-inline items-center gap4px">
    <VueInput v-model="value" :variant="isWarning ? 'warning' : 'normal'" class="w120px h25px px4px" auto-focus />
    <template v-if="!isWarning">
      <VueButton size="mini" flat class="p2px!" @click="$emit('cancel')">
        <template #icon>
          <VueIcon icon="i-material-symbols-cancel" />
        </template>
      </VueButton>
      <VueButton size="mini" flat class="p2px!" @click="$emit('submit', value)">
        <template #icon>
          <VueIcon icon="i-material-symbols-save" />
        </template>
      </VueButton>
    </template>
    <template v-else>
      <VueIcon icon="i-material-symbols-warning" class="color-warning-500 dark:color-warning-300" />
    </template>
  </span>
</template>