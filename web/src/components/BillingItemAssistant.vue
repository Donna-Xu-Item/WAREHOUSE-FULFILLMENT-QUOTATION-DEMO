<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { agentText, agentMessageText, type AgentKey, type AgentMessage } from '../i18n/billingAgent';
import { useApp } from '../lib/context';
import { catalog } from '../lib/store';
import { canPropose, makeAgentItem, parsePrice, roles, scenarioOf, suggestedIds } from '../lib/billingRequests';
const props=defineProps<{open:boolean}>();
const emit=defineEmits<{'update:open':[value:boolean]}>();
const { store,T }=useApp();
const t=(key:AgentKey,params?:Record<string,string|number>)=>agentText(store.state.prefs.lang,key,params);
const roleKey=(id:string):AgentKey=>id==='system_admin'?'roleAdmin':id==='quote_creator'?'roleCreator':'roleUser';
const input=ref(''), feed=ref<HTMLElement>(), error=ref(false);
const scenario=ref<'label'|'seal'|'battery'|null>(null), stage=ref('intro'), need=ref(''), rate=ref<number|null>(null);
const messages=ref<AgentMessage[]>([]);
const candidates=computed(()=>catalog.categories.flatMap(c=>c.charges).filter(c=>suggestedIds(scenario.value??'').includes(c.id)));
const item=computed(()=>scenario.value&&scenario.value!=='label'&&rate.value!==null?makeAgentItem(scenario.value,rate.value,{customerId:store.customer.value?.id??'',facility:store.quote.value?.draft.header.facility??'',effectiveDate:store.quote.value?.draft.header.effectiveDate??''},need.value):null);
const items=computed(()=>store.data.value?.agentItems??[]);
const notices=computed(()=>store.agentNotifications.filter(n=>n.quoteId===store.quote.value?.id));
const sync=computed(()=>store.agentSyncs.find(s=>s.quoteId===store.quote.value?.id));
const editable=computed(()=>store.quote.value?.status==='draft'&&!store.readOnly.value);
const exampleKeys:{id:'label'|'seal'|'battery';label:AgentKey;prompt:AgentKey}[]=[{id:'label',label:'exampleLabel',prompt:'promptLabel'},{id:'seal',label:'exampleSeal',prompt:'promptSeal'},{id:'battery',label:'exampleBattery',prompt:'promptBattery'}];
function say(key:AgentKey,params?:Record<string,string|number>){messages.value.push({role:'agent',key,params});}
function reset(){messages.value=[];scenario.value=null;stage.value='intro';need.value='';rate.value=null;error.value=false;}
function start(example:typeof exampleKeys[number]){reset();scenario.value=example.id;answer(t(example.prompt),example.prompt);}
function propose(){
  if(!canPropose(store.demoAccess.role)){say('denied');return;}
  if(scenario.value==='label'){say('labelCovered');return;}
  stage.value='trigger';say(scenario.value==='battery'?'askBattery':'askSeal');
}
function askPriceOrLimits(){if(rate.value===null){stage.value='price';say('askPrice');}else{stage.value='limits';say('priceRecorded',{price:rate.value});}}
function review(){stage.value='review';say('review',{scenario:scenario.value!,price:rate.value!});}
function add(){if(stage.value!=='review'||!item.value)return;try{store.addAgentItem(item.value);stage.value='done';say('added');}catch{error.value=true;}}
function answer(text=input.value.trim(),script?:AgentKey){
  if(!text.trim())return;input.value='';error.value=false;
  messages.value.push(script?{role:'user',key:script}:{role:'user',literal:text});
  if(stage.value==='intro'||stage.value==='done'){
    scenario.value=script==='promptLabel'?'label':script==='promptSeal'?'seal':script==='promptBattery'?'battery':scenarioOf(text);need.value=text;rate.value=parsePrice(text);
    if(!scenario.value){say('unsupported');return;}
    if(scenario.value==='battery'&&!/30\s*%/.test(text)){say('batteryLimit');scenario.value=null;return;}
    stage.value='recommend';say('recommend');
  }else if(stage.value==='recommend'){
    if(script==='gapSeal'||script==='gapBattery'||/不满足|不能|不支持|仍然|新增|新建|不适用|not fit|do not|don't|doesn't|new item|not suitable|不適合|新規|no encaja|nuevo/i.test(text))propose();else say('explainGap');
  }else if(stage.value==='trigger'){
    if(script==='confirmTrigger'||/^(yes|correct|confirmed|sí|si\b|はい)|对|确认|是的|正确|只收一次/i.test(text))askPriceOrLimits();else say('triggerLimit');
  }else if(stage.value==='price'){const p=parsePrice(text);if(p===null)say('askPrice');else{rate.value=p;askPriceOrLimits();}}
  else if(stage.value==='limits'){if(script==='limitsReply'||/没有|不设|无|none|^no\b|なし|sin m[ií]nimo/i.test(text))review();else say('limitsLimit');}
  else if(stage.value==='review'){if(script==='confirmAdd'||/确认|添加|加入|可以|^yes|confirm|追加|確認|confirmar/i.test(text))add();else say('reviewHint');}
}
function reply(key:AgentKey){answer(t(key),key);}
function reuse(id:string){if(!editable.value)return;const s=store.sel(id);if(!s.on&&catalog.defaultPreset[id])Object.assign(s,JSON.parse(JSON.stringify(catalog.defaultPreset[id])));s.on=true;if(rate.value!==null)s.price=rate.value;store.touch();stage.value='done';say('reused');}
watch(()=>messages.value.length,async()=>{await nextTick();feed.value?.scrollTo({top:feed.value.scrollHeight,behavior:'smooth'});});
watch(()=>store.quote.value?.id,reset);
watch(()=>props.open,async value=>{if(value){await nextTick();document.getElementById('billing-agent-panel')?.scrollIntoView({behavior:'smooth',block:'start'});}});
</script>
<template>
<section v-show="open" id="billing-agent-panel" class="agent no-print" data-training="agent-chat" :aria-label="t('title')">
  <div class="bar"><div><strong>{{t('title')}}</strong><p class="hint">{{t('intro')}}</p></div><button class="btn" @click="emit('update:open',false)">{{t('close')}}</button></div>
  <details class="role"><summary>{{t('rolePreview')}} · {{t(roleKey(store.demoAccess.role))}}</summary><select class="input" v-model="store.demoAccess.role" :aria-label="t('rolePreview')"><option v-for="r in roles" :key="r.id" :value="r.id">{{t(roleKey(r.id))}}</option></select><p class="hint">{{t('rolesNote')}}</p></details>
  <div class="workspace">
    <p class="demo">{{t('demo')}}</p>
    <div class="examples"><button v-for="e in exampleKeys" :key="e.id" class="btn sm" :disabled="!editable" @click="start(e)">{{t(e.label)}}</button></div>
    <div class="conversation" ref="feed" aria-live="polite"><p v-if="!messages.length" class="greeting">{{t('greeting')}}</p><div v-for="(m,i) in messages" :key="i" class="message" :class="m.role"><span>{{t(m.role==='user'?'you':'agent')}}</span><p>{{agentMessageText(store.state.prefs.lang,m)}}</p></div>
      <div v-if="stage==='recommend'" class="recommendations"><article v-for="c in candidates" :key="c.id"><strong>{{T.tc(c.name)}}</strong><p class="hint">{{c.id}} · {{T.tc(c.desc)}}</p><button class="btn sm" :disabled="!editable" @click="reuse(c.id)">{{t('useExisting')}}</button></article><button v-if="scenario!=='label'" class="btn" :disabled="!editable" @click="reply(scenario==='seal'?'gapSeal':'gapBattery')">{{t('continueNew')}}</button></div>
      <button v-if="stage==='trigger'" class="btn sm" @click="reply('confirmTrigger')">{{t('confirmTrigger')}}</button>
      <button v-if="stage==='price'" class="btn sm" @click="reply('priceReply')">{{t('priceExample')}}</button>
      <button v-if="stage==='limits'" class="btn sm" @click="reply('limitsReply')">{{t('noLimits')}}</button>
      <div v-if="stage==='review'&&item" class="review"><details><summary>{{t('viewConfig')}}</summary><p class="hint">{{t('placeholderNote')}}</p><pre>{{JSON.stringify(item.configuration,null,2)}}</pre></details><button class="btn primary" :disabled="!editable||!canPropose(store.demoAccess.role)" @click="reply('confirmAdd')">{{t('confirmAdd')}}</button></div>
    </div>
    <form @submit.prevent="answer()"><input class="input" v-model="input" maxlength="1200" :placeholder="t('placeholder')" :disabled="!editable" :aria-label="t('chatLabel')"/><button class="btn primary" :disabled="!input.trim()||!editable">{{t('send')}}</button></form><button class="btn ghost sm" @click="reset">{{t('restart')}}</button><p v-if="error" role="alert">{{t('addError')}}</p>
  </div>
  <div v-if="items.length" class="lifecycle"><strong>{{t('itemCount',{count:items.length})}}</strong><p class="hint">{{t('lifecycle')}}</p>
    <article v-for="i in items" :key="i.id"><span>{{t(i.scenario==='battery'?'batteryService':'sealService')}} · {{t(i.requiresDevelopment?'newFact':'existingFact')}}</span><button v-if="store.demoAccess.role==='system_admin'&&['sent','accepted'].includes(store.quote.value?.status??'')" class="btn sm" :disabled="!!store.agentReadiness[`${store.quote.value!.id}:${store.quote.value!.acceptedVersion??store.quote.value!.sentVersion}:${i.id}`]" @click="store.confirmAgentReadiness(store.quote.value!.id,i.id)">{{t('ownerReady')}}</button><details><summary>{{t('itemConfig')}}</summary><pre>{{JSON.stringify(i.configuration,null,2)}}</pre></details></article>
    <details v-if="notices.length"><summary>{{t('notifications')}}</summary><div v-for="n in notices" :key="n.id"><p>{{t('quoteVersion',{version:n.version})}} → {{t('billingOwner')}} + {{t('businessOwner')}}</p><p class="hint">{{t('notificationBody',{items:n.itemIds.join(', ')})}}</p></div></details>
    <p v-if="sync" class="note info">{{t('syncComplete',{items:sync.billingItems.length,rules:sync.recognitionRules.length})}}</p>
  </div>
</section>
</template>
<style scoped>
.agent{border:1px solid var(--border);border-radius:12px;background:var(--card);padding:16px;margin:16px 0}.bar{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}.bar p{margin:4px 0}.role{margin:12px 0;font-size:12px;color:var(--muted-fg)}summary{cursor:pointer}.demo{font-size:12px;color:var(--muted-fg)}.examples{display:flex;gap:8px;flex-wrap:wrap}.conversation{max-height:520px;overflow:auto;margin:16px 0;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--bg)}.message{padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:10px;margin:12px 8% 12px 0}.message.user{margin-left:14%;margin-right:0;background:var(--accent)}.message span{font-size:11px;color:var(--muted-fg)}.message p{white-space:pre-wrap;margin:6px 0;line-height:1.7}.recommendations article{padding:12px;border:1px solid var(--border);border-radius:8px;margin:10px 0}.review{display:grid;gap:14px;margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}form{display:flex;gap:8px}form input{flex:1;min-width:0}.lifecycle{border-top:1px solid var(--border);padding-top:14px;margin-top:14px}.lifecycle article{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 0}.lifecycle details{margin:14px 0}
</style>
