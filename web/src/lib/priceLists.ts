import type { Customer, PriceList, QuoteData } from './types';

/** Synthetic local fixtures only; never a BNP response. */
export function demoPriceLists(customer: Customer, base: QuoteData): PriceList[] {
  return [
    { id: `demo-${customer.id}-current`, customerId: customer.id, number: `${customer.code || 'DEMO'}-PL-003`, effectiveDate: '2026-11-17', endDate: null, data: JSON.parse(JSON.stringify(base)), demo: true },
    { id: `demo-${customer.id}-previous`, customerId: customer.id, number: `${customer.code || 'DEMO'}-PL-002`, effectiveDate: '2026-01-01', endDate: '2026-11-16', data: JSON.parse(JSON.stringify(base)), demo: true },
  ];
}
