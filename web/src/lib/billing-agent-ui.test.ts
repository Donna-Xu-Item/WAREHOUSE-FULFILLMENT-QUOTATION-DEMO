// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import BillingItemAssistant from '../components/BillingItemAssistant.vue';
import { createStore, type Repo } from './store';
import { provideApp } from './context';
afterEach(()=>{document.body.innerHTML='';vi.restoreAllMocks();});
it('collects intent through chat and adds a priced item without a technical form',async()=>{
  HTMLElement.prototype.scrollTo=vi.fn();
  const store=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);store.createQuote(store.state.customers[0]!.id,{blank:true});store.demoAccess.role='quote_creator';store.state.prefs.lang='zh';
  const root=document.createElement('div');document.body.append(root);const app=createApp(defineComponent({setup(){provideApp(store);return()=>h(BillingItemAssistant,{open:true});}}));app.mount(root);
  const click=async(text:string)=>{const button=[...root.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);expect(button).toBeTruthy();button!.click();await nextTick();};
  await click('例 2 · 新增双人封签核验');expect(store.quote.value!.draft.agentItems).toBeUndefined();
  await click('仍不满足，说明缺口并继续新建');await click('对，只对符合条件的每箱收一次');await click('没有最低费和封顶');
  expect(root.querySelectorAll('textarea')).toHaveLength(0);expect(root.textContent).toContain('信息已经足够');expect(store.quote.value!.draft.agentItems).toBeUndefined();
  await click('确认，加入报价');expect(store.quote.value!.draft.agentItems).toHaveLength(1);expect(store.quote.value!.draft.selections['DEMO-DUAL-SEAL-CHECK']!.price).toBe(2);app.unmount();
});

it('switches UI and earlier scripted replies in all four languages without losing the conversation',async()=>{
  HTMLElement.prototype.scrollTo=vi.fn();
  const store=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);store.state.prefs.lang='zh';store.demoAccess.role='quote_creator';
  const root=document.createElement('div');document.body.append(root);const app=createApp(defineComponent({setup(){provideApp(store);return()=>h(BillingItemAssistant,{open:true});}}));app.mount(root);
  const click=async(text:string)=>{[...root.querySelectorAll('button')].find(b=>b.textContent?.trim()===text)!.click();await nextTick();};
  await click('例 2 · 新增双人封签核验');await click('仍不满足，说明缺口并继续新建');
  store.state.prefs.lang='en';await nextTick();expect(root.textContent).toContain('Example 2 · New dual-person seal check');expect(root.textContent).toContain('Ordinary labeling or photos do not express');expect(root.textContent).not.toContain('普通贴标');
  await click('Yes — charge each qualifying carton once');expect(root.textContent).toContain('Recorded: USD 2 per carton');
  store.state.prefs.lang='ja';await nextTick();expect(root.textContent).toContain('最低料金や上限はなしですか');
  store.state.prefs.lang='es';await nextTick();expect(root.textContent).toContain('Registrado: USD 2 por caja');
  store.state.prefs.lang='zh';await nextTick();expect(root.textContent).toContain('已记录每箱 USD 2');app.unmount();
});
it('keeps the agent collapsed until the filter-bar button opens it, and preserves chat on close',async()=>{
  HTMLElement.prototype.scrollTo=vi.fn();HTMLElement.prototype.scrollIntoView=vi.fn();localStorage.setItem('unis-quotation-training-v2','seen');
  const {default:App}=await import('../App.vue');const store=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);store.state.prefs.lang='en';
  const root=document.createElement('div');document.body.append(root);const app=createApp(App,{store});app.mount(root);await nextTick();
  const panel=root.querySelector('#billing-agent-panel') as HTMLElement;expect(panel.style.display).toBe('none');
  const button=root.querySelector('[data-training="new-item"]') as HTMLButtonElement;expect(button.closest('.filters')).not.toBeNull();expect(button.textContent).toContain('New billing item');button.click();await nextTick();expect(panel.style.display).not.toBe('none');
  const example=[...panel.querySelectorAll('button')].find(b=>b.textContent?.trim()==='Example 1 · Reuse a labeling item')!;example.click();await nextTick();
  [...panel.querySelectorAll('button')].find(b=>b.textContent?.trim()==='Close agent')!.click();await nextTick();expect(panel.style.display).toBe('none');button.click();await nextTick();expect(panel.textContent).toContain('I want to charge USD 0.35');app.unmount();localStorage.clear();
});
