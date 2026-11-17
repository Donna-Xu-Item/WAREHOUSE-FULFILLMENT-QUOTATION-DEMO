<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useApp } from '../lib/context';
import { catalog } from '../lib/store';
import { designFields, roles, canPropose, canApprove, missingFields, recommendItems } from '../lib/billingRequests';
import type { BillingRequest } from '../lib/billingRequests';
const { store, T } = useApp();
const t = (cn: string, en: string) => store.state.prefs.lang === 'zh' ? cn : en;
const open = ref(false), searched = ref(false), extending = ref(false), message = ref('');
const need = ref(''), categoryId = ref(''), gap = ref('');
const fields = reactive<Record<string,string>>({ wms: 'Disabled', factAvailability: 'Unknown' });
const factEvidence = ref(''), testEvidence = ref('');
const candidates = computed(() => recommendItems(catalog, need.value, categoryId.value));
const requests = computed(() => store.billingRequests.filter(r => r.quoteId === store.quote.value?.id));
const groups = [...new Set(designFields.map(f => f.group))];
const editable = computed(() => store.quote.value?.status === 'draft' && !store.readOnly.value);
const missing = computed(() => missingFields({categoryId:categoryId.value, need:need.value, gap:gap.value, fields}));
function useExisting(id: string) {
  if (!editable.value) return;
  const s = store.sel(id);
  if (!s.on) {
    if (catalog.defaultPreset[id]) Object.assign(s, JSON.parse(JSON.stringify(catalog.defaultPreset[id])));
    s.on = true;
  }
  store.touch(); message.value = t('已选用标准项目，请在对应分类检查 UOM、条件和报价费率。', 'Standard item selected. Review its UOM, conditions and quotation rate in the service category.');
  document.getElementById(`ch-${id}`)?.scrollIntoView({behavior:'smooth', block:'center'});
}
function submit() {
  try {
    store.submitBillingRequest({categoryId:categoryId.value, need:need.value, gap:gap.value, fields:{...fields}, candidateIds:candidates.value.map(x=>x.charge.id)});
    message.value = t('已提交设计申请，等待目录管理员审批。', 'Design request submitted for catalog-admin review.'); extending.value = false;
  } catch (e) { message.value = t('无法提交：请补全必填信息、检查重复 Code／名称及当前角色。', 'Unable to submit: complete required information and check duplicate codes/names and your role.'); }
}
function approve(r: BillingRequest) { try { store.approveBillingRequest(r.id); message.value = t('模拟审批通过：仅保存设计包，尚未创建真实 Billing Item 或 Rule。', 'Simulated approval recorded. No real Billing Item or Rule has been created.'); } catch { message.value = t('审批失败，请检查权限和申请内容。', 'Approval failed. Check permissions and request details.'); } }
function verify(r: BillingRequest) { try { store.verifyBillingRequest(r.id, factEvidence.value, testEvidence.value); message.value = t('已模拟登记技术就绪；正式系统必须实际验证后端配置与试算。', 'Technical readiness recorded in the simulation. Production requires actual backend validation and dry-run results.'); } catch { message.value = t('需要审批通过、Integration Engineer 角色及两项证据。', 'Requires approval, Integration Engineer role and both evidence fields.'); } }
function exportPacket(r: BillingRequest) {
  const blob = new Blob([JSON.stringify({mode:'DESIGN_PREVIEW_NOT_DEPLOYED', request:r, itemStatus:'Inactive', recognitionRuleStatus:'Inactive', activation:'Only after archive publication succeeds and effective date is reached'},null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href=url; a.download=`billing-design-${r.id}.json`; a.click(); URL.revokeObjectURL(url);
}
</script>
<template>
  <section class="item-assistant no-print" data-training="new-item">
    <div class="bar"><div><strong>{{ t('标准收费项目', 'Standard charge catalog') }}</strong><div class="hint">{{ t('先复用，再申请；新增设计不会自动成为可计费项目。', 'Reuse before requesting. A design request is not an active billable item.') }}</div></div><button class="btn sm" :aria-expanded="open" @click="open = !open">{{ open ? t('收起', 'Collapse') : t('查找 / 申请项目', 'Find / request an item') }}</button></div>
    <details class="access"><summary>{{ t('Demo 角色预览（不是真实权限配置）', 'Demo role preview (not real access control)') }} · {{ roles.find(r => r.id === store.demoAccess.role)?.label }}</summary><label>{{ t('模拟角色', 'Simulated role') }} <select class="input" v-model="store.demoAccess.role"><option v-for="role in roles" :key="role.id" :value="role.id">{{ role.label }}</option></select></label><p class="hint">{{ t('正式系统由管理员分配用户组，并在 API 校验权限、客户及仓库范围。此切换只演示不同角色的操作。', 'Production roles are assigned by an administrator and enforced by APIs with customer/facility scope. This switch demonstrates roles only.') }}</p></details>
    <div v-if="open" class="workspace">
      <h3>{{ t('1. 描述需求，先找现有项目', '1. Describe the need and find existing items') }}</h3>
      <p class="note info">{{ t('AI 工作流原型：当前仅做本地目录关键词匹配，尚未连接大模型、Billing Engine、BNP 或 Fact 字典。没有匹配结果不代表需要新增项目。', 'AI workflow prototype: local keyword matching only. No LLM, Billing Engine, BNP or Fact dictionary is connected. No match does not prove a new item is needed.') }}</p>
      <label>{{ t('Service category（查找可不选，申请必选）', 'Service category (required for requests)') }}<select class="input" v-model="categoryId"><option value="">{{ t('所有分类', 'All categories') }}</option><option v-for="c in catalog.categories" :key="c.id" :value="c.id">{{ T.tc(c.name) }}</option></select></label>
      <label>{{ t('你想对什么服务收费？什么情况下发生？按什么数量和单位计费？', 'What service is charged, when does it occur, and what quantity/UOM drives the charge?') }}<textarea class="input" rows="3" v-model="need" :placeholder="t('例如：对贴标服务按每张标签收费，仅特定客户适用。可输入 label / labeling 等目录关键词。', 'Example: charge per label for labeling, for selected customers only.')" /></label>
      <button class="btn primary sm" :disabled="!need.trim()" @click="searched = true; message = ''">{{ t('查找现有标准项目', 'Find existing standard items') }}</button>
      <div v-if="searched" class="results"><p v-if="!candidates.length">{{ t('暂无关键词匹配，请尝试英文服务关键词或其他分类，再由目录管理员确认。', 'No keyword matches. Try English service terms or another category, then ask a catalog admin to review.') }}</p><article v-for="candidate in candidates" :key="candidate.charge.id"><div><strong>{{ T.tc(candidate.charge.name) }}</strong><div class="hint">{{ candidate.charge.id }} · {{ T.tc(candidate.category.name) }}</div><p>{{ T.tc(candidate.charge.desc) }}</p></div><button class="btn sm" :disabled="!editable" @click="useExisting(candidate.charge.id)">{{ t('选用现有项目', 'Use existing item') }}</button></article>
      <p class="hint">{{ t('现有服务能支持、只是价格或条件不同：配置已有项目，不新建 Code。', 'If only rates or conditions differ, configure the existing service rather than creating a new code.') }}</p>
      <button v-if="canPropose(store.demoAccess.role)" class="btn sm" :disabled="!editable" @click="extending = !extending">{{ t('现有项目不支持 → 说明缺口并申请', 'Existing items do not fit → explain the gap') }}</button><p v-else class="hint">{{ t('当前角色不能提交新项目。Pricing Specialist 才可发起；Catalog Admin 审批。', 'This role cannot request new items. Pricing Specialists propose; Catalog Admins review.') }}</p></div>
      <form v-if="extending && canPropose(store.demoAccess.role)" @submit.prevent="submit">
        <h3>{{ t('2. 说明缺口并补齐设计信息', '2. Explain the gap and complete the design') }}</h3>
        <label>{{ t('为什么推荐的现有项目无法支持？具体缺少什么？', 'Why do the existing recommendations fail? What is missing?') }}<textarea required class="input" v-model="gap" rows="3" /></label>
        <p class="hint">{{ t('字段依据你提供的页面整理。正式版本必须使用后端字典及 Schema 校验；Default Rate 不自动填入客户报价。规则及新 Item 默认 Inactive。', 'Fields reflect the supplied screens. Production must use backend dictionaries and schema validation. Default Rate must not populate customer pricing. New items and rules default to Inactive.') }}</p>
        <details v-for="(group,i) in groups" :key="group" :open="i === 0" class="group"><summary>{{ group }} · {{ designFields.filter(f => f.group === group && f.required && !fields[f.id]?.trim()).length }} {{ t('项待填', 'required remaining') }}</summary><div class="fields"><label v-for="f in designFields.filter(f => f.group === group)" :key="f.id" :class="{wide:f.type === 'textarea'}">{{ f.label }}{{ f.required ? ' *' : '' }}<select v-if="f.options" class="input" v-model="fields[f.id]" :disabled="!editable"><option v-for="option in f.options" :key="option">{{ option }}</option></select><textarea v-else-if="f.type === 'textarea'" class="input" rows="3" v-model="fields[f.id]" :disabled="!editable"/><input v-else class="input" :type="f.type || 'text'" v-model="fields[f.id]" :disabled="!editable" :min="f.type === 'number' ? '0' : undefined" :step="f.type === 'number' ? 'any' : undefined" /></label></div></details>
        <p role="status">{{ t('必填与校验待处理', 'Required fields / validation remaining') }}: {{ missing.length }}</p><button class="btn primary" type="submit" :disabled="!editable || !!missing.length">{{ t('提交新项目设计审批', 'Submit design for approval') }}</button>
      </form>
      <div v-if="requests.length"><h3>{{ t('3. 审批与技术就绪（模拟）', '3. Approval and technical readiness (simulation)') }}</h3><p class="hint">{{ t('这些是设计申请，不会出现在当前报价金额或导出费率中；须由开发接入真实项目后才能报价。', 'These are design requests, excluded from quoted/exported rates. Development must integrate real items before they can be quoted.') }}</p><article v-for="r in requests" :key="r.id" class="request"><strong>{{ r.fields.name }} · {{ r.fields.code }}</strong><span class="tag">{{ r.status }}</span><p>{{ T.tc(catalog.categories.find(c => c.id === r.categoryId)?.name) }} · {{ r.fields.factAvailability }}</p><p>{{ r.gap }}</p><div class="actions"><button class="btn sm" @click="exportPacket(r)">{{ t('导出设计包', 'Export design packet') }}</button><button v-if="canApprove(store.demoAccess.role) && r.status === 'submitted'" class="btn sm" @click="approve(r)">{{ t('模拟审批：预建 Inactive 配置', 'Simulate approval: prepare inactive configuration') }}</button></div><div v-if="store.demoAccess.role === 'integration_engineer' && r.status === 'approved'"><label>{{ t('Fact 合同、真实样例及外部适配验收证据', 'Fact contract, source sample and adaptation evidence') }}<textarea class="input" v-model="factEvidence" /></label><label>{{ t('试算、重复／重放、缺失字段和生效边界测试结果', 'Dry run, duplicate/replay, missing-field and effective-boundary test evidence') }}<textarea class="input" v-model="testEvidence" /></label><button class="btn sm" :disabled="!factEvidence.trim() || !testEvidence.trim()" @click="verify(r)">{{ t('模拟登记技术就绪', 'Simulate technical readiness') }}</button></div></article></div>
      <p v-if="message" class="note info" role="status">{{ message }}</p>
    </div>
  </section>
</template>
<style scoped>
.item-assistant{border:1px solid var(--border);background:var(--card);border-radius:10px;margin:12px 0 20px;padding:14px 16px}.bar,.actions{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.access{margin-top:10px;font-size:12px;color:var(--muted-fg)}summary{cursor:pointer}.workspace{border-top:1px solid var(--border);margin-top:14px;padding-top:8px}.workspace label{display:flex;flex-direction:column;gap:6px;margin:12px 0}.workspace p{line-height:1.6}.results article,.request{border:1px solid var(--border);padding:12px;border-radius:8px;margin:12px 0}.results article{display:flex;align-items:center;justify-content:space-between;gap:16px}.results article p{margin:4px 0}.group{border-top:1px solid var(--border);padding:14px 0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.fields .wide{grid-column:span 2}.input{min-width:0;max-width:100%}.tag{margin-left:10px}.request .actions{justify-content:flex-start}@media(max-width:750px){.fields{grid-template-columns:minmax(0,1fr)}.fields .wide{grid-column:auto}.results article{align-items:stretch;flex-direction:column}}
</style>
