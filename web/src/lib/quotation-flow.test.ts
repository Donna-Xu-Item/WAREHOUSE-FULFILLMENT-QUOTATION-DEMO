import { beforeAll, describe, expect, it } from 'vitest';
import { createStore, type Repo } from './store';
import { extraTrainingTopics } from './training';
beforeAll(() => { if (!globalThis.navigator) Object.defineProperty(globalThis, 'navigator', { value: { language: 'en' }, configurable: true }); });
const fresh = () => createStore({ load: (_key: string, fallback: unknown) => fallback, save: () => {} } as Repo);
describe('new quote and price-list clone', () => {
  it('creates a blank draft and copies a selected customer price list independently', () => {
    const s = fresh(), customer = s.state.customers[0]!;
    const blank = s.createQuote(customer.id, { blank: true });
    expect(blank.draft.selections).toEqual({});
    const p = s.priceLists.find(p => p.customerId === customer.id)!;
    p.effectiveDate = "2025-01-01";
    const original = JSON.stringify(p);
    const cloned = s.createQuote(customer.id, { priceListId: p.id });
    expect(cloned.draft.selections).toEqual(p.data.selections);
    expect(cloned).toMatchObject({status: 'draft', versions: [], clonedFrom: { priceListId: p.id }});
    expect(cloned.number).not.toBe(blank.number);
    cloned.draft.selections = {};
    expect(JSON.stringify(p)).toBe(original);
    expect(cloned.draft.header.effectiveDate).not.toBe(p.effectiveDate);
  });
  it('rejects another customer’s source and unknown sources', () => {
    const s = fresh(), source = s.priceLists[0]!;
    const other = s.state.customers.find(c => c.id !== source.customerId)!;
    const count = s.state.quotes.length;
    expect(() => s.createQuote(other.id, { priceListId: source.id })).toThrow();
    expect(() => s.createQuote(other.id, { priceListId: 'missing' })).toThrow();
    expect(s.state.quotes).toHaveLength(count);
  });
  it('creates sample price lists for newly created customers', () => {
    const s = fresh(), c = s.saveCustomer({ company: 'New demo customer' });
    expect(s.priceLists.filter(p => p.customerId === c.id)).toHaveLength(2);
  });
});
describe('manual lifecycle publishes local price lists at archive', () => {
  it('requires a saved sent version, locks acceptance, and preserves source lists on archive', () => {
    const s = fresh(); s.createQuote(s.state.customers[0]!.id, { blank: true });
    const before = JSON.stringify(s.priceLists);
    expect(() => s.setStatus('sent')).toThrow();
    s.saveVersion('final'); s.setStatus('sent');
    expect(s.quote.value?.sentVersion).toBe(1);
    s.setStatus('accepted');
    expect(s.readOnly.value).toBe(true);
    expect(s.quote.value?.acceptedVersion).toBe(1);
    expect(() => s.saveVersion('edit accepted')).toThrow();
    expect(() => s.restoreVersion(1)).toThrow();
    s.setStatus('archived');
    expect(JSON.stringify(s.priceLists.slice(0,-1))).toBe(before);
    expect(s.priceLists.at(-1)).toMatchObject({sourceQuoteId: s.quote.value!.id, sourceVersion:1, demo:true});
    expect(s.priceLists.at(-1)!.data).toEqual(s.quote.value!.versions[0]!.data);
    const n = s.priceLists.length; s.setStatus('archived'); expect(s.priceLists).toHaveLength(n);
    expect(() => s.setStatus('draft')).toThrow();
  });
  it('requires resending revisions before acceptance', () => {
    const s = fresh(); s.createQuote(s.state.customers[0]!.id); s.saveVersion('v1'); s.setStatus('sent');
    s.quote.value!.draft.header.notes = 'revision'; s.saveVersion('v2');
    expect(() => s.setStatus('accepted')).toThrow();
    s.setStatus('draft'); s.setStatus('sent'); s.setStatus('accepted');
    expect(s.quote.value?.acceptedVersion).toBe(2);
  });
});
it('offers bilingual creation, cloning, version and status learning topics', () => {
  for (const zh of [true,false]) expect(extraTrainingTopics(zh).map(t => t.target)).toEqual(['create','clone','quotes','versions','sent','accepted','archived','bnp']);
});
