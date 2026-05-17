# Frameworks — Vue 3

Componentes Redwood en Vue 3 con `<script setup>` y Composition API.
Usan `@theme` v4 → clases `redwood-*` para proyectos con Vite.
Para proyectos sin build (CDN play), ajustar clases a `rw-*`.

---

## FilterSelect (single dropdown compacto)

Extraído del chatbot LatamReady. Usado en workspace headers para filtros como País/Motor.

```vue
<!-- FilterSelect.vue -->
<template>
  <div ref="containerEl" class="relative inline-block">
    <button type="button"
      @click="!locked && (open = !open)"
      :class="[
        'inline-flex items-center gap-[5px] h-8 px-[11px] border rounded-rw-md bg-rw-surface text-xs cursor-pointer whitespace-nowrap transition-all',
        open ? 'border-rw-focus shadow-[0_0_0_3px_rgba(42,104,139,.10)]' : 'border-rw-border hover:border-[#a0a0a0] hover:bg-rw-surface-soft',
        locked ? 'opacity-65 cursor-default' : ''
      ]">
      <span class="text-[9px] font-extrabold uppercase tracking-[.12em] text-rw-muted">{{ label }}</span>
      <span class="w-px h-[10px] bg-rw-border" />
      <span class="text-xs font-medium text-rw-text">{{ selectedLabel }}</span>
      <svg v-if="!locked" class="w-3 h-3 text-rw-muted transition-transform"
        :class="open ? 'rotate-180' : ''"
        fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <div v-if="open && !locked"
      class="absolute z-[60] top-[calc(100%+5px)] right-0 min-w-[130px]
      bg-rw-surface border border-rw-border rounded-xl shadow-rw-md p-[5px] grid gap-0.5">
      <button v-for="opt in options" :key="opt.value" type="button"
        @click="select(opt.value)"
        :class="[
          'w-full border-0 rounded-[7px] px-2.5 py-[7px] text-left text-xs font-semibold flex items-center gap-[7px] transition-colors',
          opt.value === value ? 'bg-rw-selected text-rw-selected-bd' : 'bg-transparent text-rw-text hover:bg-rw-hover'
        ]">
        <span class="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0"
          :class="opt.value === value ? 'opacity-100' : 'opacity-0'" />
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  label: string
  value: string
  options: { value: string; label: string }[]
  locked?: boolean
}>()
const emit = defineEmits<{ change: [value: string] }>()

const open = ref(false)
const containerEl = ref<HTMLElement | null>(null)
const selectedLabel = computed(() => props.options.find(o => o.value === props.value)?.label ?? props.value)

function select(val: string) { emit('change', val); open.value = false }
function onClickOutside(e: MouseEvent) {
  if (containerEl.value && !containerEl.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
```
Props: `label`, `value`, `options: {value,label}[]`, `locked?`
Events: `change: string`

---

## CopyButton

```vue
<!-- CopyButton.vue -->
<template>
  <button @click="handleCopy"
    :class="['bg-transparent border border-transparent text-rw-muted px-2 py-1 rounded-[6px] inline-flex items-center gap-1 text-xs transition-colors cursor-pointer hover:bg-rw-hover hover:text-rw-text hover:border-rw-border',
      copied ? 'bg-[rgba(67,106,40,0.08)] border-[rgba(67,106,40,0.2)]' : '']"
    :title="copied ? 'Copiado' : 'Copiar'">
    <span style="animation:icon-pop .2s cubic-bezier(.34,1.56,.64,1)">
      <!-- check icon si copied, copy icon si no -->
      <svg v-if="copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        :stroke="copied ? 'var(--rw-success)' : 'currentColor'" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ text: string }>()
const copied = ref(false)
function handleCopy() {
  navigator.clipboard.writeText(props.text || '').then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>
```

---

## EmployeeMultiSelect (Vue 3)

```vue
<!-- EmployeeMultiSelect.vue -->
<template>
  <div ref="containerEl" class="relative w-full">
    <button type="button" @click="open = !open"
      :class="['h-9 w-full flex items-center justify-between gap-2 rounded-sm border bg-white px-3 text-sm outline-none transition',
        open ? 'border-redwood-focus-ring ring-2 ring-redwood-focus-ring/20' : 'border-redwood-border']">
      <span class="truncate text-redwood-text">
        {{ allActive ? `Todos (${options.length})` : activeCount === 0 ? 'Ninguno' : `${activeCount} de ${options.length}` }}
      </span>
      <span class="flex shrink-0 items-center gap-1.5">
        <span v-if="excludedIds.size > 0"
          class="rounded-full bg-redwood-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-redwood-danger">
          -{{ excludedIds.size }}
        </span>
        <svg class="h-4 w-4 text-redwood-muted transition-transform duration-150"
          :class="open ? '-rotate-180' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </span>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden
        rounded-lg border border-redwood-border bg-white shadow-xl" style="min-width:100%">
        <!-- estructura completa en components/select.md -->
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ options: {value:string;label:string}[]; excludedIds: Set<string> }>()
const emit = defineEmits<{ change: [Set<string>] }>()

const open = ref(false)
const search = ref('')
const containerEl = ref<HTMLElement | null>(null)

const filtered = computed(() => props.options.filter(o =>
  o.label.toLowerCase().includes(search.value.toLowerCase())))
const activeCount = computed(() => props.options.filter(o => !props.excludedIds.has(o.value)).length)
const allActive = computed(() => props.excludedIds.size === 0)

function toggle(value: string) {
  const next = new Set(props.excludedIds)
  next.has(value) ? next.delete(value) : next.add(value)
  emit('change', next)
}
function selectAll()   { emit('change', new Set()) }
function deselectAll() { emit('change', new Set(props.options.map(o => o.value))) }

function onClickOutside(e: MouseEvent) {
  if (containerEl.value && !containerEl.value.contains(e.target as Node)) {
    open.value = false; search.value = ''
  }
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
```
Props: `options: {value,label}[]`, `excludedIds: Set<string>`
Events: `change: Set<string>`

---

## Composer (Vue 3 — chat)

```vue
<!-- Composer.vue -->
<template>
  <div class="border-t border-rw-border px-[18px] py-3 pb-3.5 flex-shrink-0">
    <div class="flex items-end gap-2 border border-rw-border rounded-2xl px-3.5 py-1.5 pr-1.5
      bg-rw-surface focus-within:border-rw-focus focus-within:shadow-[0_0_0_3px_rgba(42,104,139,.10)] transition-all">
      <textarea ref="textareaEl" :value="value"
        @input="$emit('update:value', ($event.target as HTMLTextAreaElement).value)"
        @keydown.enter.exact.prevent="$emit('submit', value)"
        placeholder="Escribe tu pregunta aquí..."
        class="flex-1 min-h-[36px] max-h-[180px] resize-none border-0 bg-transparent text-rw-text
        text-sm leading-[1.6] py-[5px] outline-none placeholder:text-[#8c8c8c]" />
      <button type="button" @click="$emit('submit', value)"
        :disabled="disabled || !value.trim()"
        class="w-[38px] h-[38px] flex-shrink-0 border-0 rounded-rw-md bg-rw-primary text-white
        grid place-items-center hover:bg-rw-primary-h active:scale-[.96]
        disabled:bg-rw-solid disabled:text-rw-muted disabled:cursor-default transition-all">
        <span v-if="disabled" class="w-[7px] h-[7px] rounded-full bg-white/80"
          style="animation:pulse 1.2s ease-in-out infinite" />
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div class="flex justify-between pt-[5px] text-[10px] font-semibold uppercase tracking-[.06em] text-rw-muted opacity-55">
      <span>Enter envía · Shift+Enter nueva línea</span>
      <span v-if="value.trim()">{{ value.length }} chars</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
const props = defineProps<{ value: string; disabled: boolean }>()
defineEmits<{ 'update:value': [string]; submit: [string] }>()
const textareaEl = ref<HTMLTextAreaElement | null>(null)
watch(() => props.value, () => {
  nextTick(() => {
    const el = textareaEl.value
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  })
})
</script>
```
Props: `value: string`, `disabled: boolean` · Events: `update:value`, `submit`
