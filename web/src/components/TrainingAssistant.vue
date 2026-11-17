<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { extraTrainingTopics } from '../lib/training';
import { useApp } from '../lib/context';

const { store } = useApp();
const emit = defineEmits<{ navigate: [target: string] }>();
const zh = computed(() => store.state.prefs.lang === 'zh');
const txt = (cn: string, en: string) => zh.value ? cn : en;
const open = ref(false), welcome = ref(false), step = ref(-1), input = ref('');
const messages = ref<{ role: 'user' | 'assistant'; text: string }[]>([]);
const feed = ref<HTMLElement>();
const key = 'unis-quotation-training-v2';
const baseTopics = computed(() => [
  { target: 'customer', title: txt('选择客户与报价', 'Choose a customer and quote'), q: txt('如何开始一份新报价？', 'How do I start a new quote?'), a: txt('点击顶部客户按钮，选择或建立客户，再点击「新建报价」。先确认当前客户和报价编号，避免修改到其他报价。', 'Use the customer button at the top to select or create a customer, then choose New quote. Check the customer and quote number before editing.'), keywords: ['客户','customer'] },
  { target: 'details', title: txt('填写报价资料', 'Set quote details'), q: txt('在哪里填写仓库和有效期？', 'Where do I set the facility and validity?'), a: txt('展开「报价信息」，填写标题、仓库、生效日期、有效天数、制表人和备注。这些信息会用于下方报价预览。', 'Expand Quote details to set the title, facility, effective date, validity in days, prepared by and notes. These details are used in the proposal preview.'), keywords: ['仓库','有效','日期','资料','facility','valid','date','detail'] },
  { target: 'template', title: txt('使用标准模板', 'Apply the standard template'), q: txt('标准模板如何使用？', 'How do I use the standard template?'), a: txt('点击「应用标准模板」，阅读页面确认提示后再应用。模板会更新当前草稿的配置；如需保留现有方案，请先保存版本。', 'Choose Apply standard template and review the confirmation before applying it. The template updates the current draft configuration. Save a version first if you need to preserve your existing work.'), keywords: ['模板','标准','template','standard'] },
  { target: 'charges', title: txt('配置服务与费率', 'Configure services and rates'), q: txt('如何找到并配置费用项目？', 'How do I find and configure charges?'), a: txt('使用搜索或 B2B / D2C 筛选找到项目，启用需要的服务，先选择 UOM，再设置各计价方式的条件，最后配置费率、阶梯和最低费用。更多项目可在各分类的高级项目中展开。不同 UOM 与计价方式独立配置，最后检查报价预览。', 'Search or filter by B2B / D2C, enable a service, choose its UOM, set conditions for each pricing method, then configure rates, tiers and minimums. Expand advanced items for additional services. Each UOM and pricing method is configured independently. Review the proposal when finished.'), keywords: ['费用','费率','服务','picking','b2b','d2c','charge','rate','service','search'] },
  { target: 'save', title: txt('保存并检查版本', 'Save and review a version'), q: txt('自动保存和保存版本有什么区别？', 'What is the difference between autosave and a saved version?'), a: txt('草稿会保留编辑状态；「保存版本」会建立可查看的版本记录。保存前检查 Charge Code Mapping，并填写版本备注。查看旧版本时页面为只读，可返回草稿或恢复该版本。', 'The draft retains your edits. Save version creates a version record you can review later. Check Charge Code Mapping and add a note before saving. Older versions are read-only; return to the draft or restore a version to continue editing.'), keywords: ['保存','mapping','save','autosave'] },
  { target: 'proposal', title: txt('预览与导出', 'Preview and export'), q: txt('如何导出报价或生成 PDF？', 'How do I export a quote or create a PDF?'), a: txt('前往页面下方的报价预览，检查客户、有效期、服务和费率，并选择报价语言。使用 Excel 导出，或点击打印，在浏览器打印窗口中选择「另存为 PDF」。发送给客户前请再次检查最终文件。', 'Go to the proposal preview, review the customer, validity, services and rates, and choose the proposal language. Export Excel, or choose Print and select Save as PDF in your browser. Review the final file before sending it to a customer.'), keywords: ['导出','打印','预览','语言','pdf','excel','export','print','preview','language'] },
]);
const topics = computed(() => { const extra = extraTrainingTopics(zh.value); const base = baseTopics.value; return [base[0]!, ...extra.slice(0, 3), ...base.slice(1, 5), extra[3]!, base[5]!, ...extra.slice(4)]; });
const active = computed(() => topics.value[step.value]);
let highlighted: HTMLElement | null = null;
function clearHighlight() { highlighted?.classList.remove('training-highlight'); highlighted = null; }
async function locate(target: string) {
  const anchor = ['sent', 'accepted', 'archived', 'bnp'].includes(target) ? 'status' : target;
  emit('navigate', target);
  await nextTick();
  clearHighlight();
  highlighted = document.querySelector<HTMLElement>(`[data-training="${anchor}"]`);
  highlighted?.classList.add('training-highlight');
  highlighted?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function remember() { try { localStorage.setItem(key, 'seen'); } catch { /* Storage may be unavailable. */ } }
function close() { open.value = false; welcome.value = false; step.value = -1; clearHighlight(); remember(); }
function start() { welcome.value = false; step.value = 0; open.value = true; remember(); locate(topics.value[0]!.target); }
function advance(delta: number) { step.value += delta; if (active.value) locate(active.value.target); else { step.value = -1; clearHighlight(); } }
function ask(index?: number) {
  const question = index === undefined ? input.value.trim() : topics.value[index]!.q;
  if (!question) return;
  step.value = -1; clearHighlight(); welcome.value = false;
  const normalized = question.toLowerCase();
  const ranked = topics.value.map(topic => ({ topic, score: topic.keywords.reduce((n, word) => n + (normalized.includes(word) ? 1 : 0), 0) })).sort((a,b) => b.score-a.score);
  const topic = index === undefined ? (ranked[0]!.score > 0 ? ranked[0]!.topic : undefined) : topics.value[index];
  messages.value.push({ role: 'user', text: question }, { role: 'assistant', text: topic?.a ?? txt('知识库暂未覆盖这个问题。你可以点击下方常见问题，或联系报价负责人确认业务规则和特殊费率。请勿在此输入客户敏感资料。', 'This question is not covered by the training knowledge base yet. Try a suggested question below, or ask your quotation owner about business rules and special rates. Please avoid entering sensitive customer information.') });
  input.value = '';
}
watch(() => messages.value.length, async () => { await nextTick(); feed.value?.scrollTo({ top: feed.value.scrollHeight, behavior: 'smooth' }); });
function escape(event: KeyboardEvent) { if(event.key === 'Escape' && open.value) close(); }
onMounted(() => { document.addEventListener('keydown', escape); try { if (!localStorage.getItem(key)) { welcome.value = true; open.value = true; } } catch { /* Launcher remains available. */ } });
watch(open, value => document.body.classList.toggle('training-open', value), { immediate: true });
onUnmounted(() => { document.body.classList.remove('training-open'); clearHighlight(); document.removeEventListener('keydown', escape); });
</script>

<template>
  <aside class="training no-print" :class="{ expanded: open }" :aria-label="txt('Quotation 学习助手', 'Quotation training assistant')">
    <section v-if="open" id="training-panel" class="panel" role="region" :aria-label="txt('学习与帮助', 'Learn and get help')">
      <header><div><span class="eyebrow">QUOTATION ACADEMY</span><h2>{{ txt('报价学习助手', 'Quotation assistant') }}</h2></div><button class="btn sm" @click="close" :aria-label="txt('关闭助手', 'Close assistant')">×</button></header>
      <div class="body" ref="feed">
        <template v-if="welcome"><span class="badge">{{ txt('首次使用 · 约 5 分钟', 'FIRST VISIT · ABOUT 5 MIN') }}</span><h3>{{ txt('从第一份报价开始', 'Build your first quotation') }}</h3><p>{{ txt('跟随 完整界面导览，了解从选择客户到导出报价的完整流程。也可以随时直接提问。', 'Take a complete tour from choosing a customer to exporting your proposal. You can also ask a question at any time.') }}</p><button class="btn primary" @click="start">{{ txt('开始界面导览 →', 'Start the tour →') }}</button><button class="btn sm" @click="welcome = false; remember()">{{ txt('自行探索', 'Explore on my own') }}</button></template>
        <template v-else-if="active"><div class="progress"><span v-for="(_, i) in topics" :key="i" :class="{done: i <= step}"></span></div><span class="eyebrow">{{ step + 1 }} / {{ topics.length }}</span><h3>{{ active.title }}</h3><p>{{ active.a }}</p><button class="btn sm" @click="locate(active.target)">{{ txt('定位此功能 ↗', 'Show this feature ↗') }}</button><div class="tour-actions"><button class="btn sm" :disabled="step === 0" @click="advance(-1)">{{ txt('上一步', 'Back') }}</button><button class="btn primary sm" @click="advance(1)">{{ step === topics.length - 1 ? txt('完成导览 ✓', 'Finish tour ✓') : txt('下一步 →', 'Next →') }}</button></div></template>
        <template v-else><p class="intro">{{ txt('你好！选择一个问题，或输入你想了解的操作。', 'Hello! Choose a question or ask how to use the quotation tool.') }}</p><div v-for="(message, i) in messages" :key="i" class="message" :class="message.role"><span class="eyebrow">{{ message.role === 'user' ? txt('你', 'YOU') : txt('学习助手', 'ASSISTANT') }}</span><p>{{ message.text }}</p></div></template>
      </div>
      <details class="questions"><summary class="question-heading"><strong>{{ txt('常见问题', 'Quick questions') }}</strong><button class="text-button" @click="start">{{ txt('重新导览', 'Restart tour') }}</button></summary><div class="question-list"><button v-for="(topic,i) in topics" :key="topic.target" @click="ask(i)">{{ topic.q }} <span>↗</span></button></div></details>
      <form @submit.prevent="ask()"><input class="input" v-model="input" maxlength="500" :placeholder="txt('询问报价操作…', 'Ask about quotation steps…')" :aria-label="txt('输入问题', 'Your question')"/><button class="btn primary sm" :disabled="!input.trim()" type="submit">{{ txt('发送', 'Send') }}</button></form><p class="disclosure">{{ txt('基于操作知识库回答 · 特殊报价请向负责人确认', 'Answers from the training knowledge base · Confirm special rates with your quotation owner') }}</p>
    </section>
    <button v-if="!open" class="launcher" :aria-expanded="open" aria-controls="training-panel" @click="open ? close() : open = true"><span aria-hidden="true">✦</span> {{ txt('Training AI · 学习与帮助', 'Training AI · Learn & help') }}</button>
  </aside>
</template>

<style scoped>
.training{position:fixed;bottom:22px;right:24px;z-index:55;color:var(--fg);font-size:14px}.training.left{left:24px;right:auto}.launcher{display:flex;gap:10px;align-items:center;margin:12px 0 0 auto;border:1px solid var(--border);background:var(--primary);color:#fff;border-radius:28px;padding:13px 20px;font:inherit;font-weight:600;cursor:pointer;box-shadow:0 6px 24px #0002}.launcher span{font-size:22px}.panel{width:390px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:0 16px 64px #0003;overflow:hidden;display:flex;flex-direction:column;max-height:calc(100dvh - 110px)}header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--border)}h2{margin:4px 0 0;font-size:18px}.eyebrow{font-size:10px;letter-spacing:1px;color:var(--muted-fg);font-weight:600}.body{padding:20px;overflow:auto;min-height:100px;flex:1}h3{font-size:21px;margin:14px 0 10px}p{line-height:1.7;margin:6px 0 16px}.badge{background:var(--accent);color:var(--primary-text);padding:5px 8px;border-radius:6px;font-size:11px}.body>.btn{margin:0 6px 6px 0}.progress{display:flex;gap:5px;margin-bottom:16px}.progress span{height:4px;background:var(--border);border-radius:4px;flex:1}.progress .done{background:var(--primary)}.tour-actions{display:flex;justify-content:space-between;margin-top:20px}.questions{padding:14px 20px;border-top:1px solid var(--border)}.question-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px}.text-button{border:0;background:none;color:var(--primary-text);cursor:pointer;font:inherit}.question-list{display:flex;flex-direction:column;gap:5px;max-height:150px;overflow:auto}.question-list button{display:flex;justify-content:space-between;gap:10px;text-align:left;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:8px 10px;font:inherit;font-size:12px;color:var(--fg);cursor:pointer}.question-list button:hover{background:var(--accent)}form{display:flex;gap:8px;padding:0 20px}form input{min-width:0;flex:1}.disclosure{font-size:10px;color:var(--muted-fg);padding:8px 20px 12px;margin:0}.message{padding:10px 12px;background:var(--bg);border-radius:10px;margin-top:12px;white-space:pre-wrap}.message p{margin:4px 0}.message.user{margin-left:30px;background:var(--accent)}.intro{color:var(--muted-fg)}@media(max-width:600px){.training{bottom:12px;right:12px}.panel{width:calc(100vw - 24px);max-height:calc(100dvh - 90px)}.body{padding:16px}.questions{padding:10px 16px}.question-list{max-height:110px}}
</style>
<style>
.training-highlight{outline:3px solid var(--primary)!important;outline-offset:5px;box-shadow:0 0 0 8px var(--accent);scroll-margin-top:160px;transition:outline .2s}@media print{.training{display:none!important}.training-highlight{outline:none!important;box-shadow:none!important}}
</style>

<style>
html:has(body.training-open){scroll-padding-right:380px}
body.training-open{padding-right:380px;box-sizing:border-box}
body.training-open .scrim,body.training-open .modal,body.training-open .workflow-modal{right:380px}
@media(max-width:1400px) and (min-width:1101px){body.training-open .layout{grid-template-columns:minmax(0,1fr)}body.training-open .side{position:static;flex-direction:row;flex-wrap:wrap}}
@media(max-width:1100px){html:has(body.training-open){scroll-padding-right:0;scroll-padding-bottom:46dvh}body.training-open{padding-right:0;padding-bottom:46dvh}body.training-open .scrim,body.training-open .modal,body.training-open .workflow-modal{right:0;bottom:46dvh}body.training-open .drawer{height:100%}}
@media print{body.training-open{padding:0}}
</style>
<style scoped>
.training.expanded{top:0;bottom:0;right:0;left:auto;width:380px;z-index:55}
.expanded .panel{width:100%;height:100dvh;max-height:100dvh;max-width:100%;border-radius:0;border-top:0;border-bottom:0;box-shadow:none}
.questions summary{cursor:pointer}.questions .question-list{margin-top:8px;max-height:180px}.body{min-height:0}.progress{flex-shrink:0}
@media(max-width:1100px){.training.expanded{top:auto;bottom:0;width:100%;height:46dvh}.expanded .panel{height:46dvh;max-height:46dvh}.expanded header{padding:10px 16px}.expanded h2{font-size:15px}.expanded .body{padding:12px 16px}.expanded h3{font-size:17px;margin:6px 0}.expanded p{margin-bottom:8px}.questions{padding:8px 16px}.expanded .disclosure{padding-bottom:6px}.question-list{max-height:90px}}
</style>
