import { describe, expect, it } from 'vitest';
import catalogJson from '../data/catalog.json';
import { emptySel, quoteLines, unitRows, activeUnits } from './engine';
import type { BuilderCharge, Catalog } from './types';
const catalog = catalogJson as unknown as Catalog;
const builders = catalog.categories.flatMap(c => c.charges).filter((c): c is BuilderCharge => c.kind === 'builder');
describe('shared UOM configuration', () => {
  it.each(builders.map(c => [c.id, c] as const))('%s keeps rule-local conditions independent of service conditions', (_, charge) => {
    for (const u of charge.units) {
      const s = emptySel(); s.on = true;
      s.units[u.id] = { on: true, conds: {}, multi: false };
      s.units[u.id + '#2'] = { on: true, conds: {}, multi: false };
      const before = unitRows(charge, s, u, false).rows;
      for (const cd of charge.conds) s.conds[cd.id] = { on: true, values: cd.values.slice(0,1) };
      expect(unitRows(charge, s, u, false).rows).toEqual(before);
      const cd = charge.conds.find(cd => !cd.free && cd.values.length);
      if (cd) {
        s.units[u.id + '#2'].conds![cd.id] = { on: true, values: cd.values.slice(0,1) };
        expect(unitRows(charge, s, u, false).dims).toEqual([]);
        expect(unitRows(charge, s, u, false, u.id + '#2').dims.map(d => d.id)).toContain(cd.id);
      }
      expect(activeUnits(charge, s, false).map(r => r.key)).toEqual([u.id, u.id + '#2']);
    }
  });
  it('keeps local minimum conditions and prices through serialization for a non-Picking item', () => {
    const charge = builders.find(c => c.id !== 'OB-PICK' && c.conds.some(cd => !cd.free && cd.values.length) && c.units.some(u => u.mins.length))!;
    const u = charge.units.find(u => u.mins.length)!;
    const cd = charge.conds.find(cd => !cd.free && cd.values.length)!;
    const s = emptySel(); s.on = true;
    s.units[u.id] = { on: true, conds: { [cd.id]: { on: true, values: cd.values.slice(0,1) } }, min: u.mins[0] };
    s.prices[`${u.id}|MIN|${u.mins[0]}`] = 42;
    const lines = quoteLines(catalog, {header: {} as never, selections: {[charge.id]: JSON.parse(JSON.stringify(s))}});
    expect(lines.find(l => l.col === 'min')).toMatchObject({price:42, dims:[{id:cd.id, value:cd.values[0]}]});
  });
});
