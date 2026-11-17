import type { Catalog } from './types';
export type DemoRole = 'quote_user' | 'pricing_specialist' | 'billing_admin' | 'integration_engineer' | 'pricing_publisher';
export const roles: { id: DemoRole; label: string }[] = [
  { id: 'quote_user', label: 'Quotation User' }, { id: 'pricing_specialist', label: 'Pricing Specialist' },
  { id: 'billing_admin', label: 'Billing Catalog Admin' }, { id: 'integration_engineer', label: 'Integration Engineer' }, { id: 'pricing_publisher', label: 'Pricing Publisher' },
];
export const canPropose = (role: DemoRole) => role === 'pricing_specialist';
export const canApprove = (role: DemoRole) => role === 'billing_admin';
export interface DesignField { id: string; label: string; group: string; required?: boolean; type?: string; options?: string[] }
/** Screenshot field inventory. Controlled values must come from the real APIs before production. */
export const designFields: DesignField[] = [
  {id:'segment',label:'Target segment',group:'Quotation / Price List',required:true},
  {id:'billTo',label:'BillTo / Customer scope',group:'Quotation / Price List',required:true},
  {id:'facility',label:'Facility / service scope',group:'Quotation / Price List',required:true},
  {id:'effectiveDate',label:'Effective date',group:'Quotation / Price List',required:true,type:'date'},
  {id:'endDate',label:'End date (blank = no end date)',group:'Quotation / Price List',type:'date'},
  {id:'currency',label:'Currency',group:'Quotation / Price List',required:true},
  {id:'quotationPrice',label:'Customer quotation price (separate from default rate)',group:'Quotation / Price List',required:true,type:'number'},
  {id:'billableRecordType',label:'Billable Record Type',group:'Billing Item',required:true},
  {id:'billingCategory',label:'Billing Category',group:'Billing Item',required:true},
  {id:'code',label:'Charge Code',group:'Billing Item',required:true},
  {id:'name',label:'Item Name',group:'Billing Item',required:true},
  {id:'description',label:'Description',group:'Billing Item',required:true},
  {id:'businessObject',label:'Business Object / cutoff policy',group:'Billing Item',required:true},
  {id:'uom',label:'UOM',group:'Billing Item',required:true},
  {id:'accountingItem',label:'Accounting Item / category default',group:'Billing Item',required:true},
  {id:'qtyAggregation',label:'Qty Aggregation Mode (when idempotency = Once)',group:'Billing Item'},
  {id:'minCharge',label:'Min Charge',group:'Billing Item',type:'number'},
  {id:'maxCharge',label:'Max Charge',group:'Billing Item',type:'number'},
  {id:'department',label:'Department',group:'Billing Item profile'},
  {id:'processStage',label:'Process Stage',group:'Billing Item profile'},
  {id:'industryLow',label:'Industry Low',group:'Billing Item profile',type:'number'},
  {id:'industryTypical',label:'Industry Typical',group:'Billing Item profile',type:'number'},
  {id:'industryHigh',label:'Industry High',group:'Billing Item profile',type:'number'},
  {id:'rateType',label:'Rate Type (authoritative dictionary)',group:'WMS / Rate configurations',required:true},
  {id:'defaultRate',label:'Default Rate (not customer quotation price)',group:'WMS / Rate configurations',required:true,type:'number'},
  {id:'wms',label:'Automatic billing for WMS (prevent double triggering)',group:'WMS / Rate configurations',required:true,options:['Disabled','Enabled']},
  {id:'rateConfigurations',label:'Rate configurations: name, rate type, sort order, quantity source/expression, default price, formula/tier rules',group:'WMS / Rate configurations',required:true,type:'textarea'},
  {id:'ruleName',label:'Recognition Rule Name',group:'Recognition Rule',required:true},
  {id:'factType',label:'Fact Type',group:'Recognition Rule',required:true},
  {id:'priority',label:'Priority / conflict resolution',group:'Recognition Rule',required:true},
  {id:'conditions',label:'Conditions: AND/OR groups, Fact field, operator, input/field value',group:'Recognition Rule',required:true,type:'textarea'},
  {id:'outputs',label:'Outputs: billable record type, sort order, idempotency, split key fields, quantity expression',group:'Recognition Rule',required:true,type:'textarea'},
  {id:'priceConditions',label:'Price List conditions: Fact field, operator, value, units and data source',group:'Fact dependency',required:true,type:'textarea'},
  {id:'factFields',label:'All Fact dependencies: field, type, unit, source, missing/null behavior, quantity/event time',group:'Fact dependency',required:true,type:'textarea'},
  {id:'factAvailability',label:'Fact availability',group:'Fact dependency',required:true,options:['Unknown','Existing - unverified','New field / external adaptation required']},
  {id:'externalOwner',label:'WMS / source-system owner and adaptation ticket (if missing)',group:'Fact dependency'},
  {id:'sampleFact',label:'Sample Fact payload / fixture reference',group:'Fact dependency',required:true,type:'textarea'},
  {id:'testPlan',label:'Expected charges: positive, negative, boundary, missing Fact, duplicate, replay and effective-date cases',group:'Validation',required:true,type:'textarea'},
];
export interface BillingRequest {
  id: string; quoteId: string; categoryId: string; need: string; gap: string; fields: Record<string,string>;
  candidateIds: string[]; status: 'submitted' | 'approved' | 'ready'; createdBy: string; approvedBy?: string;
  factEvidence?: string; testEvidence?: string; verifiedBy?: string;
}
export function missingFields(r: Pick<BillingRequest, 'categoryId' | 'need' | 'gap' | 'fields'>) {
  const missing = designFields.filter(f => f.required && !r.fields[f.id]?.trim()).map(f => f.label);
  if (!r.categoryId) missing.push('Service category');
  if (!r.need.trim()) missing.push('Business need');
  if (!r.gap.trim()) missing.push('Why existing items cannot support it');
  for (const id of ['quotationPrice','defaultRate','minCharge','maxCharge','industryLow','industryTypical','industryHigh']) {
    const value = r.fields[id]; if (value?.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0)) missing.push(`${id}: valid non-negative number`);
  }
  if (r.fields.minCharge && r.fields.maxCharge && Number(r.fields.minCharge) > Number(r.fields.maxCharge)) missing.push('Minimum must not exceed maximum');
  if (r.fields.endDate && r.fields.endDate < r.fields.effectiveDate) missing.push('End date must not precede effective date');
  if (r.fields.factAvailability === 'New field / external adaptation required' && !r.fields.externalOwner?.trim()) missing.push('External owner / adaptation ticket');
  return missing;
}
export function recommendItems(catalog: Catalog, query: string, categoryId: string) {
  const words = query.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]/g) ?? [];
  return catalog.categories.flatMap(category => category.charges.map(charge => {
    const text = `${charge.id} ${charge.name} ${charge.desc}`.toLowerCase();
    return { charge, category, score: words.reduce((sum,w) => sum + (text.includes(w) ? 1 : 0), 0) };
  })).filter(x => (!categoryId || x.category.id === categoryId) && x.score > 0).sort((a,b) => b.score-a.score).slice(0,5);
}
export function assertRequestReady(r: BillingRequest) {
  if (r.status !== 'ready' || missingFields(r).length || !r.approvedBy || !r.verifiedBy || !r.factEvidence?.trim() || !r.testEvidence?.trim()) throw new Error('Billing request is not technically ready');
}
