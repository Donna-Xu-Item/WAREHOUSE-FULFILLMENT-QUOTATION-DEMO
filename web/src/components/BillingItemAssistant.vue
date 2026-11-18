<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useApp } from '../lib/context';
import { catalog } from '../lib/store';
import { canPropose, examples, makeAgentItem, parsePrice, roles, scenarioOf, suggestedIds } from '../lib/billingRequests';
const { store, T }=useApp();
const open=ref(false), input=ref(''), feed=ref<HTMLElement>();
const scenario=ref<'label'|'seal'|'battery'|null>(null), stage=ref('intro'), need=ref(''), rate=ref<number|null>(null);
const messages=ref<{role:'user'|'agent';text:string}[]>([]), error=ref('');
const candidates=computed(()=>catalog.categories.flatMap(c=>c.charges).filter(c=>suggestedIds(scenario.value??'').includes(c.id)));
const item=computed(()=>scenario.value && scenario.value!=='label' && rate.value!==null ? makeAgentItem(scenario.value,rate.value,{customerId:store.customer.value?.id??'',facility:store.quote.value?.draft.header.facility??'',effectiveDate:store.quote.value?.draft.header.effectiveDate??''},need.value):null);
const items=computed(()=>store.data.value?.agentItems??[]);
const notices=computed(()=>store.agentNotifications.filter(n=>n.quoteId===store.quote.value?.id));
const sync=computed(()=>store.agentSyncs.find(s=>s.quoteId===store.quote.value?.id));
const editable=computed(()=>store.quote.value?.status==='draft'&&!store.readOnly.value);
function say(text:string){messages.value.push({role:'agent',text});}
function reset(){messages.value=[];scenario.value=null;stage.value='intro';need.value='';rate.value=null;error.value='';}
function start(text:string){reset();open.value=true;answer(text);}
function propose(){
  if(!canPropose(store.demoAccess.role)){say('你当前可以配置报价，但不能新增 Billing Item。请联系有“新增 Item”权限的报价用户或系统 Admin；已有标准 item 仍可直接选用。');return;}
  if(scenario.value==='label'){say('这个例子中的商品贴标已由现有 Item label / relabel 支持。换价格无需新增 Code，请先选用现有项目。其他服务可重新描述或选择新建演示。');return;}
  stage.value='trigger';say(scenario.value==='battery'?'我理解：针对出库电池箱，只有荷电状态超过 30% 时收费。请确认：每个符合条件的箱子只收一次，未超过 30% 的不收费，对吗？':'明白，普通贴标或拍照不能表达双人封签核验。请确认：出库前完成双人核验的每箱只收一次，未完成核验的不收费，对吗？');
}
function askPriceOrLimits(){
  if(rate.value===null){stage.value='price';say('每个符合条件的箱子收多少美元？例如：“每箱 2 美元”。');}
  else {stage.value='limits';say(`已记录每箱 USD ${rate.value}。这个收费是否没有最低费和封顶？这个演示可以回复“没有，按实际箱数计费”。`);}
}
function review(){
  stage.value='review';say(`信息已经足够生成这个演示案例：\n• 服务：${scenario.value==='battery'?'电池荷电状态合规检查':'出库双人封签核验'}\n• 分类：Outbound\n• 计费：每个符合条件的箱子一次，USD ${rate.value}/箱\n• 条件：${scenario.value==='battery'?'荷电状态超过 30%；其余不收费':'完成双人核验；未完成不收费'}\n• 无最低费、无封顶\n• 客户、仓库和生效日期沿用当前报价\n我会生成 Billing Item、Recognition Rule 和 Price List 配置草稿。${scenario.value==='battery'?'此例需要新增荷电状态 Fact，由负责人在发送后确认适配。':'此例假设 Demo Fact 已具备，仍需要负责人确认是否要开发。'}\n确认后加入报价，不会现在就创建生产配置。`);
}
function add(){
  if(stage.value!=='review'||!item.value)return;
  try{store.addAgentItem(item.value);stage.value='done';say('已加入 Outbound 分类，已选中并进入报价预览和导出。接下来保存版本、线下发送给客户，再标记 Sent：Demo 会同时生成给 Billing Engine 和业务系统负责人的通知。Archived 时再模拟同步三类配置。');}
  catch{error.value='无法新增：请确认有新增权限、当前为 Draft，且该项目尚未在此报价中。';}
}
function answer(text=input.value.trim()){
  if(!text.trim())return;input.value='';error.value='';messages.value.push({role:'user',text});
  if(stage.value==='intro'||stage.value==='done'){
    scenario.value=scenarioOf(text);need.value=text;rate.value=parsePrice(text);
    if(!scenario.value){say('这里是可交互的脚本演示，尚未连接 LLM。请选择下方三个例子之一，或描述“贴标”“双人封签核验”“电池荷电状态检查”。生产版会检索完整目录并动态追问。');return;}
    if(scenario.value==='battery'&&!/30\s*%/.test(text)){say('电池演示采用“超过 30%”的固定案例。你可以点击该案例开始；其他阈值需要接入 LLM 后支持，不会替你默默改写需求。');scenario.value=null;return;}
    stage.value='recommend';say('我先检查现有标准项目。下面列出可能相关的 item：先判断服务含义是否一致；只有价格不同，不需要新建 Code。请选择“使用这个项目”，或说明为什么仍然不满足。');
  }else if(stage.value==='recommend'){if(/不满足|不能|不支持|仍然|新增|新建|不适用/.test(text))propose();else say('可以选择下方的已有项目；如果服务本身不同，请说明现有项目缺少什么，例如“不支持双人核验，需要新建”。');}
  else if(stage.value==='trigger'){if(/对|确认|是的|正确|只收一次|yes|correct/i.test(text))askPriceOrLimits();else say('这个演示只覆盖上面的明确触发条件与按箱一次计费。如果实际需求不同，请重新开始或选择另一个例子；不会在信息不确定时生成 item。');}
  else if(stage.value==='price'){const p=parsePrice(text);if(p===null)say('请说明每箱金额和币种，例如“每箱 2 美元”。');else{rate.value=p;askPriceOrLimits();}}
  else if(stage.value==='limits'){if(/没有|不设|无|none|no /i.test(text))review();else say('已听到你有其他计价条件。当前脚本仅演示无最低费和封顶的 UNIT_RATE；不会忽略这项需求自动新增。请使用演示答案，或留给正式 LLM 扩展。');}
  else if(stage.value==='review'){if(/确认|添加|加入|可以|yes/i.test(text))add();else say('可以先查看生成配置；如摘要与实际意图不同，请重新开始，不会自动添加。');}
}
function reuse(id:string){if(!editable.value)return;const s=store.sel(id);if(!s.on&&catalog.defaultPreset[id])Object.assign(s,JSON.parse(JSON.stringify(catalog.defaultPreset[id])));s.on=true;if(rate.value!==null)s.price=rate.value;store.touch();stage.value='done';say('已选用现有标准 item，并按你明确描述的美元价格配置。本次未新建 Billing Item。请在对应分类及报价预览中核对。');}
watch(()=>messages.value.length,async()=>{await nextTick();feed.value?.scrollTo({top:feed.value.scrollHeight,behavior:'smooth'});});
watch(()=>store.quote.value?.id,reset);
</script>
<template>
<section class="agent no-print" data-training="new-item">
  <div class="bar"><div><strong>Billing AI Agent</strong><p class="hint">用一句话描述你想收费的服务，Agent 先找已有项目，再对话生成新项目。</p></div><button class="btn primary" :aria-expanded="open" @click="open=!open">{{open?'收起对话':'与 Agent 对话'}}</button></div>
  <details class="role"><summary>Demo 权限预览 · {{roles.find(r=>r.id===store.demoAccess.role)?.label}}</summary><select class="input" v-model="store.demoAccess.role"><option v-for="r in roles" :key="r.id" :value="r.id">{{r.label}}</option></select><p class="hint">只有三类角色。此切换仅用于演示；生产权限由 Admin 管理、后端校验。</p></details>
  <div v-if="open" class="workspace">
    <p class="demo">脚本演示，未接入 LLM。以下例子展示正式 Agent 的对话方式；不会发送真实通知或写入真实 Billing Engine。</p>
    <div class="examples"><button v-for="e in examples" :key="e.id" class="btn sm" :disabled="!editable" @click="start(e.prompt)">{{e.label}}</button></div>
    <div class="conversation" ref="feed" aria-live="polite"><p v-if="!messages.length" class="greeting">你好，你希望对什么服务收费？可以直接说服务、发生场景和收费方式，也可以点击上方例子开始。</p><div v-for="(m,i) in messages" :key="i" class="message" :class="m.role"><span>{{m.role==='user'?'你':'Billing Agent'}}</span><p>{{m.text}}</p></div>
      <div v-if="stage==='recommend'" class="recommendations"><article v-for="c in candidates" :key="c.id"><strong>{{T.tc(c.name)}}</strong><p class="hint">{{c.id}} · {{T.tc(c.desc)}}</p><button class="btn sm" :disabled="!editable" @click="reuse(c.id)">使用这个项目</button></article><button v-if="scenario!=='label'" class="btn" :disabled="!editable" @click="answer(scenario==='seal'?'这些项目不能表达双人封签核验，需要新建。':'这些项目不支持按每箱荷电状态超过30%触发收费，需要新建。')">仍不满足，说明缺口并继续新建</button></div>
      <button v-if="stage==='trigger'" class="btn sm" @click="answer('对，只对符合条件的每箱收一次。')">对，只对符合条件的每箱收一次</button>
      <button v-if="stage==='price'" class="btn sm" @click="answer('每箱 2 美元')">演示回答：每箱 2 美元</button>
      <button v-if="stage==='limits'" class="btn sm" @click="answer('没有最低费和封顶，按实际箱数计费。')">没有最低费和封顶</button>
      <div v-if="stage==='review'&&item" class="review"><details><summary>查看 Agent 生成的配置（开发预览）</summary><p class="hint">Code、字典及 Fact 字段为示例占位，生产版需要匹配真实字典；用户无需填写这些字段。</p><pre>{{JSON.stringify(item.configuration,null,2)}}</pre></details><button class="btn primary" :disabled="!editable||!canPropose(store.demoAccess.role)" @click="answer('确认，加入报价')">确认，加入报价</button></div>
    </div>
    <form @submit.prevent="answer()"><input class="input" v-model="input" maxlength="1200" placeholder="描述服务，或回答 Agent 的问题…" :disabled="!editable" aria-label="与 Billing Agent 对话"/><button class="btn primary" :disabled="!input.trim()||!editable">发送</button></form><button class="btn ghost sm" @click="reset">重新开始对话</button><p v-if="error" role="alert">{{error}}</p>
  </div>
  <div v-if="items.length" class="lifecycle"><strong>本报价的 Agent 新增项目：{{items.length}}</strong><p class="hint">已加入相应 Service Category，并参与报价与导出。Sent 时通知负责人评估开发；Archived 时同步 Item、Rule 和 Price List。</p>
    <article v-for="i in items" :key="i.id"><span>{{T.tc(i.charge.name)}} · {{i.requiresDevelopment?'涉及新 Fact／适配':'示例假设已有 Fact，待负责人确认'}}</span><button v-if="store.demoAccess.role==='system_admin'&&['sent','accepted'].includes(store.quote.value?.status??'')" class="btn sm" :disabled="!!store.agentReadiness[`${store.quote.value!.id}:${store.quote.value!.acceptedVersion??store.quote.value!.sentVersion}:${i.id}`]" @click="store.confirmAgentReadiness(store.quote.value!.id,i.id)">模拟负责人反馈：无需开发／适配已完成</button><details><summary>查看该项目的 AI 生成配置</summary><pre>{{JSON.stringify(i.configuration,null,2)}}</pre></details></article>
    <details v-if="notices.length"><summary>发送时的负责人通知预览（模拟）</summary><div v-for="n in notices" :key="n.id"><p>报价 v{{n.version}} → {{n.recipients.join(' + ')}}</p><p class="hint">新增：{{n.itemIds.join(', ')}}。请判断是否需要开发，并反馈 Fact／业务系统支持情况。实际未发送。</p></div></details>
    <p v-if="sync" class="note info">归档同步模拟完成：{{sync.billingItems.length}} 个 Billing Item、{{sync.recognitionRules.length}} 个 Rule，以及对应 Price List。真实系统未被修改。</p>
  </div>
</section>
</template>
<style scoped>
.agent{border:1px solid var(--border);border-radius:12px;background:var(--card);padding:16px;margin:16px 0}.bar{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}.bar p{margin:4px 0}.role{margin:12px 0;font-size:12px;color:var(--muted-fg)}summary{cursor:pointer}.demo{font-size:12px;color:var(--muted-fg)}.examples{display:flex;gap:8px;flex-wrap:wrap}.conversation{max-height:520px;overflow:auto;margin:16px 0;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--bg)}.message{padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:10px;margin:12px 8% 12px 0}.message.user{margin-left:14%;margin-right:0;background:var(--accent)}.message span{font-size:11px;color:var(--muted-fg)}.message p{white-space:pre-wrap;margin:6px 0;line-height:1.7}.recommendations article{padding:12px;border:1px solid var(--border);border-radius:8px;margin:10px 0}.review{display:grid;gap:14px;margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}form{display:flex;gap:8px}form input{flex:1;min-width:0}.lifecycle{border-top:1px solid var(--border);padding-top:14px;margin-top:14px}.lifecycle article{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 0}.lifecycle details{margin:14px 0}
</style>
