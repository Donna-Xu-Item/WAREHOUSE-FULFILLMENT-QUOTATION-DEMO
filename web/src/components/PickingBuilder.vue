<script setup lang="ts">
import { computed } from 'vue';
import { useApp } from '../lib/context';
import { activeUnits, chosenDriverIds, nextUnitKey } from '../lib/engine';
import type { BuilderCharge, ChargeSel, Cond, Unit } from '../lib/types';
import RateTable from './RateTable.vue';
const props = defineProps<{ charge: BuilderCharge; s: ChargeSel; readOnly: boolean }>();
const { store, T } = useApp();
const text = (en: string, zh: string) => store.state.prefs.lang === 'zh' ? zh : en;
const edit = () => { store.touch(); return store.sel(props.charge.id); };
const rules = computed(() => activeUnits(props.charge, props.s, false));
const perUnit = (u: Unit) => rules.value.filter(r => r.unit.id === u.id);
function toggle(u: Unit) {
  const s = edit(), group = perUnit(u);
  if (group.length) group.forEach(r => s.units[r.key].on = false);
  else {
    const previous = Object.keys(s.units).filter(k => k === u.id || k.startsWith(u.id + '#'));
    if (previous.length) previous.forEach(k => s.units[k].on = true);
    else s.units[u.id] = { on: true, conds: {} };
  }
}
function add(u: Unit) { edit().units[nextUnitKey(u, props.s)] = { on: true, conds: {} }; }
function remove(k: string) {
  const s = edit(); delete s.units[k];
  Object.keys(s.prices).filter(p => p.startsWith(k + '|')).forEach(p => delete s.prices[p]);
}
const conditions = (k: string) => props.s.units[k].conds ?? props.s.conds;
function conditionSelection(k: string, cd: Cond) {
  const us = edit().units[k];
  us.conds ??= JSON.parse(JSON.stringify(props.s.conds));
  return us.conds![cd.id] ??= { on: false, values: [] };
}
function toggleCondition(k: string, cd: Cond) {
  const cs = conditionSelection(k, cd); cs.on = !cs.on;
}
function toggleValue(k: string, cd: Cond, value: string) {
  const cs = conditionSelection(k, cd);
  cs.values = cs.values.includes(value) ? cs.values.filter(v => v !== value) : [...cs.values, value];
}
function allValues(k: string, cd: Cond, on: boolean) {
  conditionSelection(k, cd).values = on ? [...cd.values] : [];
}
function conditionText(k: string, cd: Cond, value: string) { conditionSelection(k, cd).text = value; }
const hasConditions = (k: string) => Object.values(conditions(k)).some(c => c.on && (c.values.length || c.text));
function driver(k: string, id: string) {
  const us = edit().units[k];
  if (us.multi) { const ids = chosenDriverIds(us, true); us.drivers = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]; }
  else us.driver = id || null;
}
function multi(k: string, value: boolean) {
  const us = edit().units[k], ids = chosenDriverIds(us, !!us.multi);
  us.multi = value; us.drivers = ids; us.driver = ids[0] ?? null;
}
function calc(k: string, id: string, value: string) { const us = edit().units[k]; us.calc = { ...us.calc, [id]: value }; }
</script>

<template>
  <div class="picking-builder">
    <p class="hint">{{ text("NEW DEMO · Independent copy", "新版 Demo · 独立副本") }}</p>
    <h4>1. {{ text('Charge per (UOM)', '选择收费单位（UOM）') }}</h4>
    <div class="chips">
      <button v-for="u in charge.units" :key="u.id" class="chip" :class="{ sel: perUnit(u).length }" :disabled="readOnly" @click="toggle(u)">{{ T.tc(u.label) }}</button>
    </div>
    <p class="hint">{{ text('Each UOM has independent rules and prices. Empty conditions match Any. The most specific matching rule wins; ties use the first rule shown. Rules do not add together within a UOM.', '每个 UOM 独立配置规则和价格。条件未选即 Any；优先采用匹配条件最多的规则，同等具体时采用排列在前的规则。同一 UOM 内规则不叠加收费。') }}</p>
    <section v-for="u in charge.units.filter(u => perUnit(u).length)" :key="u.id" class="uom">
      <div class="uhead"><h4>{{ T.tc(u.label) }}</h4><button class="btn ghost sm" :disabled="readOnly" @click="add(u)">+ {{ T.t('e.addMethod') }}</button></div>
      <article v-for="({ key: k }, i) in perUnit(u)" :key="k" class="rule">
        <div class="uhead"><strong>{{ T.tc(u.label) }} · {{ T.t('e.method', { n: i + 1 }) }} · {{ hasConditions(k) ? text('Specific rule', '特殊条件规则') : text('Base / default price · Any', '基础 / 默认价格 · Any') }}</strong><button class="btn ghost sm" :disabled="readOnly" @click="remove(k)">{{ T.t('e.remove') }}</button></div>
        <section class="condition-questions">
          <div class="question">2. {{ T.t('e.step1') }}</div>
          <div class="chips">
            <button v-for="cd in charge.conds" :key="cd.id" class="chip" :class="{ sel: conditions(k)[cd.id]?.on }" :disabled="readOnly" @click="toggleCondition(k, cd)">{{ T.tc(cd.label) }}</button>
          </div>
          <div v-for="cd in charge.conds.filter(cd => conditions(k)[cd.id]?.on)" :key="cd.id" class="values">
            <div class="value-label">{{ T.t('e.valuesQ', { label: T.tc(cd.label) }) }}
              <template v-if="!cd.free">
                <button class="btn ghost sm" :disabled="readOnly" @click="allValues(k, cd, true)">{{ T.t('e.selectAll') }}</button>
                <button class="btn ghost sm" :disabled="readOnly" @click="allValues(k, cd, false)">{{ T.t('e.clear') }}</button>
              </template>
            </div>
            <input v-if="cd.free" class="input" :value="conditions(k)[cd.id]?.text || ''" :placeholder="T.t('e.freeTextPh')" :disabled="readOnly" @change="conditionText(k, cd, ($event.target as HTMLInputElement).value)" />
            <div v-else class="chips">
              <button v-for="v in cd.values" :key="v" class="chip sm" :class="{ sel: conditions(k)[cd.id]?.values.includes(v) }" :disabled="readOnly" @click="toggleValue(k, cd, v)">{{ T.tc(v) }}</button>
            </div>
            <div v-if="cd.free ? !conditions(k)[cd.id]?.text?.trim() : !conditions(k)[cd.id]?.values.length" class="hint">{{ text('No values selected · Any', '未选择值 · 匹配 Any') }}</div>
          </div>
        </section>
        <div class="question">3. {{ T.t('e.step3') }}</div>
        <div class="row"><span>{{ T.t('e.varies') }}</span><div class="chips">
          <button class="chip sm" :class="{ sel: !chosenDriverIds(s.units[k], !!s.units[k].multi).length }" :disabled="readOnly" @click="s.units[k].multi ? (edit().units[k].drivers = []) : driver(k, '')">{{ T.t('e.flat') }}</button>
          <button v-for="d in u.drivers" :key="d.id" class="chip sm" :class="{ sel: chosenDriverIds(s.units[k], !!s.units[k].multi).includes(d.id) }" :disabled="readOnly" @click="driver(k, d.id)">{{ T.tc(d.label) }}</button>
        </div></div>
        <label class="row"><input type="checkbox" :checked="!!s.units[k].multi" :disabled="readOnly" @change="multi(k, ($event.target as HTMLInputElement).checked)" />{{ text('Combine multiple price dimensions', '组合多个价格维度') }}</label>
        <div v-for="d in u.drivers.filter(d => d.calc && chosenDriverIds(s.units[k], !!s.units[k].multi).includes(d.id))" :key="d.id" class="row"><span>{{ T.tc(d.label) }} · {{ text('Pricing method', '定价方式') }}</span><button v-for="method in ['range', 'incremental']" :key="method" class="chip sm" :class="{ sel: (s.units[k].calc?.[d.id] || 'range') === method }" :disabled="readOnly" @click="calc(k, d.id, method)">{{ T.t(`e.calc.${method}`) }}</button></div>
        <div class="row"><span>{{ T.t('e.minimum') }}</span><select class="input" :value="s.units[k].min || ''" :disabled="readOnly" @change="edit().units[k].min = ($event.target as HTMLSelectElement).value || null"><option value="">{{ T.t('e.none') }}</option><option v-for="m in u.mins" :key="m" :value="m">{{ T.t('e.minPer', { basis: T.t(`basis.${m}`) }) }}</option></select></div>
        <label v-if="u.second" class="row"><input type="checkbox" :checked="!!s.units[k].second" :disabled="readOnly" @change="edit().units[k].second = ($event.target as HTMLInputElement).checked" />{{ T.t('e.second') }}</label>
        <RateTable :charge="charge" :unit="u" :unit-key="k" :s="s" :show-all="false" :read-only="readOnly" />
      </article>
    </section>
  </div>
</template>
<style scoped>
.picking-builder { padding: 0 20px 20px 50px; }
.uom { margin-top: 22px; }
.uhead, .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 10px 0; }
.uhead { justify-content: space-between; }
.rule { border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin: 12px 0; }
.condition-questions { margin: 14px 0 20px; }
.question { font-weight: 600; margin-bottom: 10px; }
.values { margin: 12px 0 12px 22px; }
.value-label { color: var(--muted-fg); font-size: 13px; margin-bottom: 6px; }
@media(max-width:700px) { .picking-builder { padding-left: 16px; } }
</style>
