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
