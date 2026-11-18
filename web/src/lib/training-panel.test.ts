// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { provideApp } from './context';
import { createStore, type Repo } from './store';
import TrainingAssistant from '../components/TrainingAssistant.vue';
afterEach(()=>{document.body.innerHTML='';document.body.className='';localStorage.clear();});
it('reserves page space while open and releases it on close and unmount', async()=>{
  const store=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);
  const root=document.createElement('div');document.body.append(root);
  const app=createApp(defineComponent({setup(){provideApp(store);return ()=>h(TrainingAssistant);}}));app.mount(root);await nextTick();
  expect(document.body.classList.contains('training-open')).toBe(true);
  expect(root.querySelector('.panel')).not.toBeNull();
  (root.querySelector('header button') as HTMLButtonElement).click();await nextTick();
  expect(document.body.classList.contains('training-open')).toBe(false);
  (root.querySelector('.launcher') as HTMLButtonElement).click();await nextTick();expect(document.body.classList.contains('training-open')).toBe(true);
  app.unmount();expect(document.body.classList.contains('training-open')).toBe(false);
});
it('guides through current agent features automatically without a redundant show-feature button',async()=>{
  HTMLElement.prototype.scrollIntoView=()=>{};
  const store=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);store.state.prefs.lang='en';const targets:string[]=[];
  const root=document.createElement('div');document.body.append(root);const app=createApp(defineComponent({setup(){provideApp(store);return()=>h(TrainingAssistant,{onNavigate:(target:string)=>targets.push(target)});}}));app.mount(root);await nextTick();
  const click=async(text:string)=>{const b=[...root.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);expect(b).toBeTruthy();b!.click();await nextTick();};
  await click('Start the tour →');expect(root.textContent).toContain('1 / 18');expect(root.textContent).not.toContain('Show this feature');
  for(let i=0;i<8;i++)await click('Next →');
  expect(targets).toContain('new-item');expect(targets.at(-1)).toBe('agent-chat');expect(root.textContent).toContain('Agent: from intent to a quoted item');app.unmount();
});
