import { describe, expect, it } from 'vitest';
import catalog from '../data/catalog.json';
import { activeUnits, emptySel, matchingPickingRule, quoteLines, unitRows } from './engine';
import type { BuilderCharge, Catalog } from './types';
const cat = catalog as unknown as Catalog;
const pick = cat.categories.flatMap(c => c.charges).find(c => c.id === 'OB-PICK') as BuilderCharge;
const unit = (id: string) => pick.units.find(u => u.id === id)!;
const cond = (value: string) => ({ on: true, values: [value] });
describe('Picking UOM rules', () => {
  it('keeps default and exceptions independent without condition combinations', () => {
    const s = emptySel();
    s.conds.businessType = cond('D2C');
    s.units.case = { on: true, conds: {} };
    s.units['case#2'] = { on: true, conds: { retailer: cond('Amazon') } };
    s.units.pallet = { on: true, conds: {} };
    expect(activeUnits(pick, s, false).map(r => r.key)).toEqual(['pallet', 'case', 'case#2']);
    expect(unitRows(pick, s, unit('case'), false).rows).toHaveLength(1);
    expect(unitRows(pick, s, unit('case'), false, 'case#2').rows.map(r => r.cells)).toEqual([['Amazon']]);
    expect(unitRows(pick, s, unit('pallet'), false).dims).toEqual([]);
    expect(matchingPickingRule(pick, s, 'case', { retailer: 'Amazon' })).toBe('case#2');
    expect(matchingPickingRule(pick, s, 'case', { retailer: 'Walmart' })).toBe('case');
  });
  it('uses specificity and stable order without adding overlapping rules', () => {
    const s = emptySel();
    s.units.case = { on: true, conds: {} };
    s.units['case#2'] = { on: true, conds: { retailer: cond('Amazon') } };
    s.units['case#3'] = { on: true, conds: { retailer: cond('Amazon'), businessType: cond('B2B') } };
    s.units['case#4'] = structuredClone(s.units['case#3']);
    expect(matchingPickingRule(pick, s, 'case', { retailer: 'Amazon', businessType: 'B2B' })).toBe('case#3');
    s.units.case.on = false;
    expect(matchingPickingRule(pick, s, 'case', { retailer: 'Other' })).toBeUndefined();
  });
  it('preserves explicit multi-dimensional tiers, minimums and prices through serialization', () => {
    const s = emptySel(); s.on = true;
    const drivers = unit('case').drivers.slice(0, 2);
    s.units.case = { on: true, conds: {}, multi: true, drivers: drivers.map(d => d.id), calc: { [drivers[0].id]: 'incremental' }, min: 'order' };
    s.units['case#2'] = { on: true, conds: { retailer: cond('Amazon') }, min: 'order' };
    s.prices['case#2|Amazon|p'] = 0.85;
    s.prices['case#2|MIN|order'] = 5;
    const restored = JSON.parse(JSON.stringify(s));
    expect(unitRows(pick, restored, unit('case'), true).rows).toHaveLength(drivers.reduce((n, d) => n * d.values.length, 1));
    const lines = quoteLines(cat, { header: {} as never, selections: { 'OB-PICK': restored } });
    expect(lines.find(l => l.key === 'OB-PICK|case#2|Amazon|p')?.price).toBe(.85);
    expect(lines.find(l => l.key === 'OB-PICK|case#2|MIN|order')).toMatchObject({ price: 5, dims: [{ value: 'Amazon' }] });
  });
});
