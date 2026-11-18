import type { Catalog, SimpleCharge } from './types';
export type DemoRole = 'system_admin' | 'quote_user' | 'quote_creator';
export const roles: {id: DemoRole; label: string}[] = [
  {id:'system_admin',label:'系统 Admin'}, {id:'quote_user',label:'可配置 Quotation（不能新增 Item）'}, {id:'quote_creator',label:'可配置 Quotation＋新增 Item'},
];
export const canPropose = (role: DemoRole) => role === 'system_admin' || role === 'quote_creator';
// Legacy design requests are retained in storage but are not part of the agent flow.
export interface BillingRequest { id:string; quoteId:string; categoryId:string; need:string; gap:string; fields:Record<string,string>; candidateIds:string[]; status:string; createdBy:string; approvedBy?:string; factEvidence?:string; testEvidence?:string; verifiedBy?:string }
export interface AgentItem {
  id:string; scenario:'seal'|'battery'; categoryId:string; charge:SimpleCharge;
  price:number; need:string; trigger:string; quantity:string; limits:string;
  requiresDevelopment:boolean;
  configuration:{ billingItem:Record<string,unknown>; recognitionRule:Record<string,unknown>; priceList:Record<string,unknown> };
}
export interface AgentNotification { id:string; quoteId:string; version:number; itemIds:string[]; recipients:string[]; mode:'simulation'; status:'prepared'; message:string }
export interface AgentSync { id:string; quoteId:string; version:number; itemIds:string[]; billingItems:unknown[]; recognitionRules:unknown[]; priceListId:string; mode:'simulation'; status:'complete' }
export const examples = [
  { id:'label',label:'例 1 · 复用现有贴标项目',prompt:'我要对商品贴标按件收费，每件 0.35 美元。'},
  { id:'seal',label:'例 2 · 新增双人封签核验',prompt:'出库前需要双人核对封签，每箱收费 2 美元，普通贴标和拍照都不能替代。'},
  { id:'battery',label:'例 3 · 新增电池合规检查，涉及新 Fact',prompt:'出库电池箱需要检查荷电状态，超过 30% 的箱子每箱收 3 美元。'},
] as const;
export function scenarioOf(text:string): 'label'|'seal'|'battery'|null {
  if (/电池|荷电|battery|charge.percent|soc\b/i.test(text)) return 'battery';
  if (/封签|seal/i.test(text)) return 'seal';
  if (/贴标|标签|label/i.test(text)) return 'label';
  return null;
}
export function suggestedIds(scenario:string) { return scenario === 'label' ? ['VA-RELABEL','VA-FNSKU','OB-LABEL'] : scenario === 'seal' ? ['VA-PHOTO','OB-LABEL','OB-ROUTING'] : ['SC-IOT','OB-ROUTING','VA-PHOTO']; }
export function parsePrice(text:string):number|null {
  const match=text.match(/(?:\$|USD\s*)(\d+(?:\.\d+)?)/i) ?? text.match(/(\d+(?:\.\d+)?)\s*(?:美元|美金|USD|dollars?)/i);
  return match && Number.isFinite(Number(match[1])) ? Number(match[1]) : null;
}
export function makeAgentItem(scenario:'seal'|'battery',price:number,context:{customerId:string;facility:string;effectiveDate:string}, need:string):AgentItem {
  if (!Number.isFinite(price)||price<0) throw new Error('Invalid price');
  const battery=scenario==='battery';
  const code=battery?'DEMO-BATTERY-SOC-CHECK':'DEMO-DUAL-SEAL-CHECK';
  const name=battery?'Battery state-of-charge compliance check':'Dual-person seal verification';
  const trigger=battery?'Outbound carton: battery state of charge > 30%; exclude <= 30%.':'Outbound carton: dual-person seal verification completed.';
  const recordType=battery?'DEMO_BATTERY_CHECK':'DEMO_SEAL_CHECK';
  const conditions=battery?[{field:'batteryStateOfChargePercent',operator:'>',value:30}]:[{field:'dualSealCheckCompleted',operator:'=',value:true}];
  const item:AgentItem={id:code,scenario,categoryId:'outbound',price,need,trigger,quantity:'One matched Fact per carton; quantity = 1',limits:'No minimum or maximum charge',requiresDevelopment:battery,
    charge:{id:code,kind:'simple',name,desc:`${trigger} Charge per carton; no minimum or maximum.`,tier:'main',channel:'Both',codes:[],invoiceLines:0,unit:'Carton',default:price,lo:0,hi:100000,basis:'Agent demo: user-confirmed rate',pct:false,new:true},
    configuration:{
      billingItem:{billableRecordType:recordType,category:'DEMO_OUTBOUND',chargeCode:code,name,active:false,businessObject:'Outbound',aggregation:{qtyAggregationMode:'Sum',minCharge:null,maxCharge:null},rateConfigurations:[{name:'Base Rate',rateType:'UNIT_RATE',sortOrder:0,quantitySource:'Fixed Value',quantity:1,defaultPrice:price}]},
      recognitionRule:{ruleId:'Auto-generated on sync',ruleName:`${name} recognition`,factType:'OUTBOUND',priority:100,active:false,conditions:{within:'AND',conditions},outputs:[{billableRecordType:recordType,sortOrder:0,idempotencyStrategy:'Multi (1:1)',splitKeyFields:[],quantityExpression:{type:'Fixed Value',value:1}}]},
      priceList:{customerId:context.customerId,facility:context.facility,effectiveDate:context.effectiveDate,chargeCode:code,uom:'Carton',currency:'USD',price,conditions},
    }};
  return item;
}
export function effectiveCatalog(cat:Catalog,data?:{agentItems?:AgentItem[]}|null):Catalog {
  if (!data?.agentItems?.length) return cat;
  return {...cat,categories:cat.categories.map(c=>({...c,charges:[...c.charges,...data.agentItems!.filter(i=>i.categoryId===c.id&&!c.charges.some(x=>x.id===i.id)).map(i=>i.charge)]})),mapback:{...cat.mapback,newItems:{...cat.mapback.newItems,...Object.fromEntries(data.agentItems.map(i=>[i.id,i.charge.name]))}}};
}
