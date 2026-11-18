// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import BillingItemAssistant from '../components/BillingItemAssistant.vue';
import { createStore, type Repo } from './store';
import { provideApp } from './context';
afterEach(()=>{document.body.innerHTML='';vi.restoreAllMocks();});
it('collects intent through chat and adds a priced item without a technical form',async()=>{
  HTMLElement.prototype.scrollTo=vi.fn();
  const store=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);store.createQuote(store.state.customers[0]!.id,{blank:true});store.demoAccess.role='quote_creator';
  const root=document.createElement('div');document.body.append(root);const app=createApp(defineComponent({setup(){provideApp(store);return()=>h(BillingItemAssistant);}}));app.mount(root);
  const click=async(text:string)=>{const button=[...root.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);expect(button).toBeTruthy();button!.click();await nextTick();};
  await click('与 Agent 对话');await click('例 2 · 新增双人封签核验');expect(store.quote.value!.draft.agentItems).toBeUndefined();
  await click('仍不满足，说明缺口并继续新建');await click('对，只对符合条件的每箱收一次');await click('没有最低费和封顶');
  expect(root.querySelectorAll('textarea')).toHaveLength(0);expect(root.textContent).toContain('信息已经足够');expect(store.quote.value!.draft.agentItems).toBeUndefined();
  await click('确认，加入报价');expect(store.quote.value!.draft.agentItems).toHaveLength(1);expect(store.quote.value!.draft.selections['DEMO-DUAL-SEAL-CHECK']!.price).toBe(2);app.unmount();
});
