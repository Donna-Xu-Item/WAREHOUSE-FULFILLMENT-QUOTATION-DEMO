<script setup lang="ts">
import { computed } from 'vue';
import { useApp } from '../lib/context';
import { activeConds, chosenDriverIds, nextUnitKey, passes, unitKeys, unitRows } from '../lib/engine';
import type { BuilderCharge, ChargeSel, Cond, Unit } from '../lib/types';
import RateTable from './RateTable.vue';
const props = defineProps<{ charge: BuilderCharge; s: ChargeSel; readOnly: boolean }>();
const { store, T } = useApp();
const text = (en: string, zh: string) => store.state.prefs.lang === 'zh' ? zh : en;
const edit = () => { store.touch(); return store.sel(props.charge.id); };
const legacyAll = computed(() => store.state.prefs.showAll || !!props.s.showAll);
const rules = computed(() => props.charge.units.flatMap(unit => unitKeys(unit, props.s).filter(key => props.s.units[key]?.on).map(key => ({ key, unit }))));
const isMulti = (k: string) => props.s.units[k].multi ?? (props.charge.id === "OB-PICK" ? false : legacyAll.value);
const local = (k: string) => ({ ...props.s, conds: conditions(k) });
const availableDrivers = (u: Unit, k: string) => u.drivers.filter(d => passes(props.charge, local(k), d.when, false));
const outside = (u: Unit, k: string) => availableDrivers(u, k).filter(d => chosenDriverIds(props.s.units[k], isMulti(k)).includes(d.id)).flatMap(d => Object.entries(d.when).flatMap(([id, allowed]) => (activeConds(props.charge, local(k)).find(x => x.cond.id === id)?.values ?? []).filter(v => !allowed.includes(v))));
const perUnit = (u: Unit) => rules.value.filter(r => r.unit.id === u.id);
function toggle(u: Unit) {
  const s = edit(), group = perUnit(u);
  if (group.length) group.forEach(r => s.units[r.key].on = false);
  else {
    const previous = Object.keys(s.units).filter(k => k === u.id || k.startsWith(u.id + '#'));
    if (previous.length) previous.forEach(k => s.units[k].on = true);
    else s.units[u.id] = { on: true, conds: {}, multi: false };
  }
}
function add(u: Unit) { edit().units[nextUnitKey(u, props.s)] = { on: true, conds: {}, multi: false }; }
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
  if (isMulti(k)) { const ids = chosenDriverIds(us, true); us.drivers = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]; }
  else { us.driver = id || null; us.multi = false; }
}
function multi(k: string, value: boolean) {
  const us = edit().units[k], ids = chosenDriverIds(us, isMulti(k));
  us.multi = value; us.drivers = ids; us.driver = ids[0] ?? null;
}
function calc(k: string, id: string, value: string) { const us = edit().units[k]; us.calc = { ...us.calc, [id]: value }; }
</script>

<template>
  <div class="uom-builder">
    
    <h4>1. {{ text('Charge per (UOM)', '选择收费单位（UOM）') }}</h4>
    <div class="chips">
      <button v-for="u in charge.units" :key="u.id" class="chip" :class="{ sel: perUnit(u).length }" :disabled="readOnly" @click="toggle(u)">{{ T.tc(u.label) }}</button>
    </div>
    <p class="hint">{{ text('Each UOM and pricing method has independent conditions and prices. Empty conditions match Any.', '每个 UOM 及计价方式独立配置条件和价格，条件未选即 Any。') }}</p>
    <section v-for="u in charge.units.filter(u => perUnit(u).length)" :key="u.id" class="uom">
      <div class="uhead"><h4>{{ T.tc(u.label) }}</h4><button class="btn ghost sm" :disabled="readOnly" @click="add(u)">+ {{ T.t('e.addMethod') }}</button></div>
      <article v-for="({ key: k }, i) in perUnit(u)" :key="k" class="rule">
        <div class="uhead"><strong>{{ T.tc(u.label) }} · {{ T.t('e.method', { n: i + 1 }) }} · {{ hasConditions(k) ? text('Specific rule', '特殊条件规则') : text('Base / default price · Any', '基础 / 默认价格 · Any') }}</strong><button class="btn ghost sm" :disabled="readOnly" @click="remove(k)">{{ T.t('e.remove') }}</button></div>
        <section v-if="charge.conds.length" class="condition-questions">
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
        <div class="question">{{ charge.conds.length ? 3 : 2 }}. {{ T.t('e.step3') }}</div>
        <div class="row"><span>{{ T.t('e.varies') }}</span><div class="chips">
          <button class="chip sm" :class="{ sel: !chosenDriverIds(s.units[k], !!isMulti(k)).length }" :disabled="readOnly" @click="isMulti(k) ? (edit().units[k].drivers = []) : driver(k, '')">{{ T.t('e.flat') }}</button>
          <button v-for="d in availableDrivers(u, k)" :key="d.id" class="chip sm" :class="{ sel: chosenDriverIds(s.units[k], !!isMulti(k)).includes(d.id) }" :disabled="readOnly" @click="driver(k, d.id)">{{ T.tc(d.label) }}</button>
        </div></div>
        <label v-if="u.drivers.length > 1" class="row"><input type="checkbox" :checked="!!isMulti(k)" :disabled="readOnly" @change="multi(k, ($event.target as HTMLInputElement).checked)" />{{ text('Combine multiple price dimensions', '组合多个价格维度') }}</label>
        <div v-for="d in u.drivers.filter(d => d.calc && chosenDriverIds(s.units[k], !!isMulti(k)).includes(d.id))" :key="d.id" class="row"><span>{{ T.tc(d.label) }} · {{ text('Pricing method', '定价方式') }}</span><button v-for="method in ['range', 'incremental']" :key="method" class="chip sm" :class="{ sel: (s.units[k].calc?.[d.id] || 'range') === method }" :disabled="readOnly" @click="calc(k, d.id, method)">{{ T.t(`e.calc.${method}`) }}</button></div>
        <div v-if="u.mins.length" class="row"><span>{{ T.t('e.minimum') }}</span><select class="input" :value="s.units[k].min || ''" :disabled="readOnly" @change="edit().units[k].min = ($event.target as HTMLSelectElement).value || null"><option value="">{{ T.t('e.none') }}</option><option v-for="m in u.mins" :key="m" :value="m">{{ T.t('e.minPer', { basis: T.t(`basis.${m}`) }) }}</option></select></div>
        <label v-if="u.second" class="row"><input type="checkbox" :checked="!!s.units[k].second" :disabled="readOnly" @change="edit().units[k].second = ($event.target as HTMLInputElement).checked" />{{ T.t('e.second') }}</label>
        <div v-if="outside(u, k).length" class="row"><span>{{ T.t('e.flatOtherwise', { values: [...new Set(outside(u, k))].map(v => T.tc(v)).join(', ') }) }}</span><select class="input" :value="s.units[k].flatOtherwise ? 'flat' : 'skip'" :disabled="readOnly" @change="edit().units[k].flatOtherwise = ($event.target as HTMLSelectElement).value === 'flat'"><option value="skip">{{ T.t('e.notPriced') }}</option><option value="flat">{{ T.t('e.flat') }}</option></select></div>
        <p v-if="!unitRows(charge, s, u, legacyAll, k).rows.length" class="hint" role="status">{{ text('No applicable rates for these conditions. Review the conditions or choose another UOM.', '当前条件没有适用费率，请检查条件或选择其他 UOM。') }}</p>
        <RateTable :charge="charge" :unit="u" :unit-key="k" :s="s" :show-all="legacyAll" :read-only="readOnly" />
        <p v-if="u.note" class="hint">{{ T.tc(u.note) }}</p>
      </article>
    </section>
    <section v-if="charge.settings.length" class="uom"><h4>{{ T.t('e.settings') }}</h4><label v-for="setting in charge.settings" :key="setting.id" class="row"><span>{{ T.tc(setting.label) }}</span><select class="input" :value="s.settings[setting.id] || setting.options[0]" :disabled="readOnly" @change="edit().settings[setting.id] = ($event.target as HTMLSelectElement).value"><option v-for="option in setting.options" :key="option" :value="option">{{ T.tc(option) }}</option></select></label></section>
  </div>
</template>
<style scoped>
.uom-builder { padding: 0 20px 20px 50px; }
.uom { margin-top: 22px; }
.uhead, .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 10px 0; }
.uhead { justify-content: space-between; }
.rule { border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin: 12px 0; }
.condition-questions { margin: 14px 0 20px; }
.question { font-weight: 600; margin-bottom: 10px; }
.values { margin: 12px 0 12px 22px; }
.value-label { color: var(--muted-fg); font-size: 13px; margin-bottom: 6px; }
@media(max-width:700px) { .uom-builder { padding-left: 16px; } }
</style>
