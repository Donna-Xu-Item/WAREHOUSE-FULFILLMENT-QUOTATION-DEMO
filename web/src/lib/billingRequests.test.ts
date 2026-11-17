import { describe, expect, it } from 'vitest';
import { createStore, catalog, type Repo } from './store';
import { designFields, missingFields, recommendItems, assertRequestReady, type BillingRequest } from './billingRequests';
const fresh = () => createStore({load: (_k:string, fallback:unknown) => fallback, save:()=>{}} as Repo);
const input = () => ({categoryId:catalog.categories[0]!.id, need:'Special new service', gap:'Existing service lacks a verified distinct business event', fields:Object.fromEntries(designFields.map(f=>[f.id,f.options?.[0] ?? (f.type === 'number' ? '2' : f.type === 'date' ? '2026-11-17' : 'defined')])), candidateIds:[] as string[]});
describe('controlled billing-item design requests', () => {
  it('requires the proposer role and rejects duplicate names/codes', () => {
    const s=fresh(); const v=input(); v.fields.code='UNIQUE-DEMO-REQUEST'; v.fields.name='Unique demo design';
    expect(()=>s.submitBillingRequest(v)).toThrow();
    s.demoAccess.role='pricing_specialist';
    const r=s.submitBillingRequest(v); expect(r.status).toBe('submitted');
    expect(()=>s.submitBillingRequest(v)).toThrow();
    const existing=catalog.categories[0]!.charges[0]!;
    expect(()=>s.submitBillingRequest({...v,fields:{...v.fields,code:existing.id}})).toThrow();
    expect(()=>s.submitBillingRequest({...v,fields:{...v.fields,code:'ANOTHER-NEW',name:existing.name}})).toThrow();
  });
  it('requires independent approval and evidence, and never publishes an unintegrated design', () => {
    const s=fresh(); s.createQuote(s.state.customers[0]!.id,{blank:true});
    s.demoAccess.role='pricing_specialist'; const v=input(); v.fields.code='INACTIVE-DEMO'; v.fields.name='Inactive design'; const r=s.submitBillingRequest(v);
    expect(()=>s.approveBillingRequest(r.id)).toThrow();
    s.demoAccess.role='billing_admin'; s.approveBillingRequest(r.id);
    expect(()=>s.verifyBillingRequest(r.id,'fact contract','test report')).toThrow();
    s.demoAccess.role='integration_engineer';
    expect(()=>s.verifyBillingRequest(r.id,'','test report')).toThrow();
    s.verifyBillingRequest(r.id,'fact contract','dry run report');
    expect(()=>assertRequestReady(r)).not.toThrow();
    s.saveVersion('final');s.setStatus('sent');s.setStatus('accepted');s.demoAccess.role='pricing_publisher';
    const n=s.priceLists.length;expect(()=>s.setStatus('archived')).toThrow(/integration/);
    expect(s.quote.value?.status).toBe('accepted');expect(s.priceLists).toHaveLength(n);
  });
  it('requires external owner information for new Facts and validates numeric/date bounds', () => {
    const v=input();v.fields.factAvailability='New field / external adaptation required';v.fields.externalOwner='';
    expect(missingFields(v)).toContain('External owner / adaptation ticket');
    v.fields.minCharge='10';v.fields.maxCharge='2';v.fields.quotationPrice='NaN';v.fields.endDate='2025-01-01';
    expect(missingFields(v)).toContain('Minimum must not exceed maximum');
    expect(missingFields(v)).toContain('quotationPrice: valid non-negative number');
    expect(missingFields(v)).toContain('End date must not precede effective date');
  });
  it('does not interpret no keyword match as proof a new item is needed', () => {
    expect(recommendItems(catalog,'zzzxunrecognizedqx','')).toHaveLength(0);
    const c=catalog.categories.find(c=>c.charges.some(x=>/label/i.test(x.name)))!;
    const found=recommendItems(catalog,'label',c.id);expect(found.length).toBeGreaterThan(0);expect(found.every(x=>x.category.id===c.id)).toBe(true);
  });
});
