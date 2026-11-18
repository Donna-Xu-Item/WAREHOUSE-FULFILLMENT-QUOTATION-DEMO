import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { createStore, catalog, type Repo } from './store';
import { roles, makeAgentItem, parsePrice, scenarioOf, effectiveCatalog } from './billingRequests';
import { quoteLines } from './engine';
import { buildProposal } from './proposal';
import { buildExcel } from './export';
import { translator } from '../i18n';
import { mapQuote, setupList } from './codemap';
const fresh=()=>{const s=createStore({load:(_k:string,f:unknown)=>f,save:()=>{}} as Repo);s.createQuote(s.state.customers[0]!.id,{blank:true});return s;};
const item=(s:ReturnType<typeof fresh>,scenario:'seal'|'battery'='seal')=>makeAgentItem(scenario,2,{customerId:s.customer.value!.id,facility:'',effectiveDate:'2026-11-17'},'Charge for this service');
describe('conversational billing agent',()=>{
 it('has exactly three roles and enforces item creation without restricting standard quote editing',()=>{
  expect(roles.map(r=>r.id)).toEqual(['system_admin','quote_user','quote_creator']);const s=fresh();expect(()=>s.addAgentItem(item(s))).toThrow();s.demoAccess.role='quote_creator';s.addAgentItem(item(s));expect(s.quote.value!.draft.agentItems).toHaveLength(1);expect(()=>s.addAgentItem(item(s))).toThrow();
 });
 it('includes the new item in category, rate sheet, mapback and Excel without mutating the standard catalog',async()=>{
  const s=fresh();s.demoAccess.role='quote_creator';const i=item(s);s.addAgentItem(i);const data=s.quote.value!.draft;
  expect(catalog.categories.flatMap(c=>c.charges).some(c=>c.id===i.id)).toBe(false);
  expect(effectiveCatalog(catalog,data).categories.find(c=>c.id==='outbound')!.charges.some(c=>c.id===i.id)).toBe(true);
  expect(quoteLines(catalog,data).find(l=>l.chargeId===i.id)?.price).toBe(2);
  const proposal=buildProposal(catalog,data);expect(proposal.flatMap(p=>p.rows).some(r=>r.service===i.charge.name)).toBe(true);
  expect(mapQuote(catalog,data)[0]).toMatchObject({status:'new-item',suggestedName:i.charge.name});
  expect(setupList(catalog,mapQuote(catalog,data))[0]?.suggestedName).toBe(i.charge.name);
  const buf=await buildExcel(catalog,proposal,{quote:s.quote.value!,customer:s.customer.value,data,versionLabel:'Draft'},translator('en'));
  const wb=new ExcelJS.Workbook();await wb.xlsx.load(buf);const texts:string[]=[];wb.worksheets[0]!.eachRow(r=>r.eachCell(c=>texts.push(String(c.value))));expect(texts).toContain(i.charge.name);
 });
 it('notifies at Sent and atomically simulates all three configs at archive after owner feedback',()=>{
  const s=fresh();s.demoAccess.role='quote_creator';const i=item(s,'battery');s.addAgentItem(i);s.saveVersion('final');s.setStatus('sent');expect(s.agentNotifications).toHaveLength(1);expect(s.agentNotifications[0]?.recipients).toEqual(['Billing Engine owner','Business system owner']);s.setStatus('sent');expect(s.agentNotifications).toHaveLength(1);
  s.setStatus('accepted');const before=s.priceLists.length;expect(()=>s.setStatus('archived')).toThrow();expect(s.priceLists).toHaveLength(before);expect(s.quote.value!.status).toBe('accepted');expect(s.agentSyncs).toHaveLength(0);
  expect(()=>s.confirmAgentReadiness(s.quote.value!.id,i.id)).toThrow();s.demoAccess.role='system_admin';s.confirmAgentReadiness(s.quote.value!.id,i.id);s.setStatus('archived');expect(s.agentSyncs).toHaveLength(1);expect(s.agentSyncs[0]?.billingItems).toHaveLength(1);expect(s.agentSyncs[0]?.recognitionRules).toHaveLength(1);expect(s.priceLists.at(-1)?.data.agentItems).toHaveLength(1);expect(s.agentSyncs[0]?.mode).toBe('simulation');s.setStatus('archived');expect(s.agentSyncs).toHaveLength(1);
 });
 it('keeps definitions isolated by quote/version and preserves them in cloned price lists',()=>{
  const s=fresh();s.demoAccess.role='system_admin';const i=item(s);s.addAgentItem(i);s.saveVersion('original');s.quote.value!.draft.selections[i.id]!.price=7;s.saveVersion('revised');expect(s.quote.value!.versions[0]!.data.selections[i.id]!.price).toBe(2);s.setStatus('sent');s.confirmAgentReadiness(s.quote.value!.id,i.id);s.setStatus('accepted');s.setStatus('archived');const p=s.priceLists.at(-1)!;const q=s.createQuote(s.customer.value!.id,{priceListId:p.id});expect(quoteLines(catalog,q.draft).find(l=>l.chargeId===i.id)?.price).toBe(7);s.createQuote(s.customer.value!.id,{blank:true});expect(quoteLines(catalog,s.quote.value!.draft)).toHaveLength(0);
 });
 it('recognizes supported examples and does not fabricate a scenario or amount for unrelated text',()=>{
  expect(scenarioOf('按件贴标')).toBe('label');expect(scenarioOf('双人封签')).toBe('seal');expect(scenarioOf('电池荷电状态')).toBe('battery');expect(scenarioOf('unrelated service')).toBeNull();expect(parsePrice('每箱 2 美元')).toBe(2);expect(parsePrice('USD 0.35')).toBe(.35);expect(parsePrice('没有价格')).toBeNull();
 });
});
