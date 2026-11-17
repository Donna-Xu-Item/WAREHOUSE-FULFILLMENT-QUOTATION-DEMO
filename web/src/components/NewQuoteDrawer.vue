<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Drawer from './Drawer.vue';
import { useApp } from '../lib/context';
const props = defineProps<{ customerId?: string; startClone?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const { store } = useApp();
const text = (zh: string, en: string) => store.state.prefs.lang === 'zh' ? zh : en;
const customerId = ref(props.customerId ?? store.customer.value?.id ?? store.state.customers[0]?.id ?? '');
const mode = ref<'blank' | 'clone'>(props.startClone ? 'clone' : 'blank'), priceListId = ref(''), error = ref('');
const lists = computed(() => store.priceLists.filter(p => p.customerId === customerId.value).sort((a,b) => b.effectiveDate.localeCompare(a.effectiveDate)));
const source = computed(() => lists.value.find(p => p.id === priceListId.value));
watch(customerId, () => { priceListId.value = ''; error.value = ''; });
function create() {
  try {
    store.createQuote(customerId.value, mode.value === 'clone' ? { priceListId: priceListId.value } : { blank: true });
    emit('close');
  } catch { error.value = text('创建失败，请检查客户和 Price List 选择。', 'Unable to create. Check the customer and price list.'); }
}
</script>
<template>
  <Drawer :title="text('创建新报价', 'Create quotation')" @close="emit('close')">
    <div data-training="create" class="creation">
      <p class="hint">{{ text('先选择客户，再选择空白报价或复制现有 Price List。', 'Choose a customer, then start blank or clone an existing price list.') }}</p>
      <label>{{ text('客户', 'Customer') }}<select class="input" v-model="customerId"><option disabled value="">{{ text('选择客户', 'Select customer') }}</option><option v-for="c in store.state.customers" :key="c.id" :value="c.id">{{ c.code }} · {{ c.company }}</option></select></label>
      <div class="seg modes" role="group" :aria-label="text('报价来源', 'Quote source')"><button :class="{ on: mode === 'blank' }" :aria-pressed="mode === 'blank'" @click="mode = 'blank'">{{ text('空白报价', 'Blank quotation') }}</button><button :class="{ on: mode === 'clone' }" :aria-pressed="mode === 'clone'" @click="mode = 'clone'">Clone PriceList</button></div>
      <div v-if="mode === 'clone'" data-training="clone" class="clone">
        <label>{{ text('Price List 版本', 'Price List version') }}<select class="input" v-model="priceListId"><option disabled value="">{{ text('请选择现有 Price List', 'Select an existing price list') }}</option><option v-for="p in lists" :key="p.id" :value="p.id">{{ p.number }} · {{ p.effectiveDate }} — {{ p.endDate || text('无结束日期', 'No end date') }}</option></select></label>
        <p v-if="!lists.length" class="hint">{{ text('该客户暂无可复制的 Price List。', 'No price lists are available for this customer.') }}</p>
        <p class="note info">{{ text('Demo 示例数据：当前未连接 BNP。复制只生成新草稿，不会修改来源 Price List，也不会复制旧报价版本及接受状态。', 'Demo sample data: BNP is not connected. Cloning creates a new draft, preserving the source price list. Old quote versions and acceptance status are not copied.') }}</p>
        <p v-if="source" class="hint">{{ text('将复制服务、UOM、条件和费率；新报价使用今天的日期及新的报价编号。', 'Services, UOMs, conditions and rates are copied. The new quote gets a new number and today’s date.') }}</p>
      </div>
      <p v-else class="hint">{{ text('从空白费用配置开始，创建后也可应用标准模板。', 'Start with no charges selected. You can apply the standard template after creation.') }}</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <div class="actions"><button class="btn" @click="emit('close')">{{ text('取消', 'Cancel') }}</button><button class="btn primary" :disabled="!customerId || (mode === 'clone' && !source)" @click="create">{{ text('创建报价', 'Create quotation') }}</button></div>
    </div>
  </Drawer>
</template>
<style scoped>
.creation label{display:flex;flex-direction:column;gap:8px;margin:16px 0}.creation select{width:100%;max-width:100%}.modes{margin:20px 0}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.clone{border:1px solid var(--border);border-radius:10px;padding:0 16px 12px}
</style>
