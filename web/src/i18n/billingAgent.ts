import type { Lang } from './index';
// Each entry is EN / 中文 / 日本語 / ES. Messages store keys, so language changes also update earlier scripted turns.
const copy = {
 recommend:['I will check existing standard items first. Review the related services below. A price change alone does not require a new code. Choose an existing item or explain why it does not fit.', '我先检查现有标准项目。请查看下面相关服务；只有价格不同不需要新建 Code。可以选用现有项目，或说明为什么不满足。', 'まず既存の標準項目を確認します。以下の関連サービスを確認してください。価格変更だけで新コードは不要です。既存項目を選ぶか、不適合の理由を説明してください。', 'Primero revisaré los conceptos estándar existentes. Revisa los servicios relacionados. Un cambio de precio no requiere otro código. Elige uno o explica por qué no encaja.'],
 title:['Billing AI Agent','Billing AI Agent','Billing AI Agent','Billing AI Agent'],
 newItem:['+ New billing item','＋ 新增计费项目','＋ 請求項目を追加','＋ Nuevo concepto de cobro'],
 close:['Close agent','关闭 Agent','エージェントを閉じる','Cerrar agente'],
 intro:['Describe the service in your own words. I will check existing items before creating a new one.','用自然语言描述收费服务，我会先检查现有项目，再判断是否需要新建。','課金したいサービスを説明してください。新規作成の前に既存項目を確認します。','Describe el servicio con tus palabras. Revisaré los conceptos existentes antes de crear uno nuevo.'],
 rolePreview:['Demo permissions','Demo 权限预览','デモ権限','Permisos de demostración'],
 roleAdmin:['System Admin','系统 Admin','システム管理者','Administrador del sistema'],
 roleUser:['Configure quotations · no new items','可配置 Quotation（不能新增 Item）','見積設定のみ・項目追加不可','Configurar cotizaciones · sin crear conceptos'],
 roleCreator:['Configure quotations + create items','可配置 Quotation＋新增 Item','見積設定・項目追加可','Configurar cotizaciones y crear conceptos'],
 rolesNote:['Three roles only. This selector simulates permissions; production access is managed by an Admin and enforced by the backend.','只有三类角色。此切换仅用于演示；生产权限由 Admin 管理、后端校验。','権限は3種類です。この選択はデモ用です。本番では管理者が設定し、サーバーが検証します。','Solo tres roles. Este selector simula permisos; en producción los administra un Admin y los valida el servidor.'],
 demo:['Scripted demo · no LLM connected. Notifications and Billing Engine sync are simulated.','脚本演示，未接入 LLM；通知和 Billing Engine 同步均为模拟。','台本付きデモ・LLM未接続。通知と計算エンジンへの同期はシミュレーションです。','Demostración con guion · sin LLM conectado. Las notificaciones y la sincronización son simuladas.'],
 exampleLabel:['Example 1 · Reuse a labeling item','例 1 · 复用现有贴标项目','例1・既存ラベル項目を利用','Ejemplo 1 · Reutilizar etiquetado'],
 exampleSeal:['Example 2 · New dual-person seal check','例 2 · 新增双人封签核验','例2・2名による封印確認を追加','Ejemplo 2 · Nueva verificación de sellos'],
 exampleBattery:['Example 3 · Battery check with a new Fact','例 3 · 电池合规检查，涉及新 Fact','例3・新しいFactを使うバッテリー検査','Ejemplo 3 · Baterías con un Fact nuevo'],
 promptLabel:['I want to charge USD 0.35 per item for product labeling.','我要对商品贴标按件收费，每件 0.35 美元。','商品ラベル貼付に1個あたり0.35米ドルを請求したいです。','Quiero cobrar USD 0.35 por unidad por etiquetar productos.'],
 promptSeal:['We need a dual-person seal check before outbound shipment, at USD 2 per carton. Ordinary labeling and photos cannot replace it.','出库前需要双人核对封签，每箱收费 2 美元，普通贴标和拍照都不能替代。','出荷前に2名で封印を確認し、1箱あたり2米ドルを請求します。通常のラベルや写真では代替できません。','Necesitamos verificar los sellos entre dos personas antes del envío, a USD 2 por caja. Las etiquetas y fotos no lo sustituyen.'],
 promptBattery:['For outbound battery cartons, charge USD 3 per carton only when state of charge is above 30%.','出库电池箱需要检查荷电状态，超过 30% 的箱子每箱收 3 美元。','出荷するバッテリー箱の充電率が30%を超える場合のみ、1箱あたり3米ドルを請求します。','Para cajas de baterías salientes, cobrar USD 3 por caja solo cuando la carga supere el 30%.'],
 greeting:['Hello! What service would you like to charge for? Describe the service, when it occurs and how it is charged, or try an example.','你好，你希望对什么服务收费？描述服务、发生场景和收费方式，或点击示例开始。','どのサービスに課金しますか？サービス、発生する状況、課金方法を説明するか、例を選んでください。','¿Qué servicio quieres cobrar? Describe el servicio, cuándo ocurre y cómo se cobra, o prueba un ejemplo.'],
 you:['You','你','あなた','Tú'],
 agent:['Billing Agent','Billing Agent','Billing Agent','Billing Agent'],
 useExisting:['Use this item','使用这个项目','この項目を使う','Usar este concepto'],
 continueNew:['Still unsuitable — explain the gap and create new','仍不满足，说明缺口并继续新建','不適合の理由を伝えて新規作成へ','No encaja: explicar y crear uno nuevo'],
 gapSeal:['These items cannot express a dual-person seal check; I need a new item.','这些项目不能表达双人封签核验，需要新建。','既存項目では2名による封印確認を表せないため、新規項目が必要です。','Estos conceptos no representan la verificación de sellos entre dos personas; necesito uno nuevo.'],
 gapBattery:['These items do not support charging per carton when state of charge is above 30%; I need a new item.','这些项目不支持按每箱荷电状态超过30%触发收费，需要新建。','充電率が30%を超える箱に課金する条件に対応していないため、新規項目が必要です。','No permiten cobrar por caja cuando la carga supera el 30%; necesito un concepto nuevo.'],
 confirmTrigger:['Yes — charge each qualifying carton once','对，只对符合条件的每箱收一次','はい。該当する箱ごとに1回のみ課金','Sí, cobrar una vez por caja que cumpla'],
 priceExample:['Demo answer: USD 2 per carton','演示回答：每箱 2 美元','デモ回答：1箱あたり2米ドル','Respuesta: USD 2 por caja'],
 priceReply:['USD 2 per carton','每箱 2 美元','1箱あたり2米ドル','USD 2 por caja'],
 noLimits:['No minimum or maximum charge','没有最低费和封顶','最低料金・上限なし','Sin mínimo ni máximo'],
 limitsReply:['No minimum or maximum; charge by the actual number of qualifying cartons.','没有最低费和封顶，按实际箱数计费。','最低料金や上限はなく、該当する実際の箱数で課金します。','Sin mínimo ni máximo; cobrar por la cantidad real de cajas que cumplan.'],
 viewConfig:['View agent-generated configuration (developer preview)','查看 Agent 生成的配置（开发预览）','生成された設定を見る（開発者プレビュー）','Ver configuración generada (vista para desarrollo)'],
 placeholderNote:['Codes, dictionary values and Fact fields are illustrative placeholders. Production must map them to authoritative schemas; users do not fill these fields.','Code、字典及 Fact 字段为示例占位；生产版须匹配真实字典，用户无需填写。','コード、辞書値、Fact項目は例示です。本番では正式なスキーマに対応付けます。ユーザーの入力は不要です。','Los códigos, valores y campos Fact son ilustrativos. En producción se asignarán a esquemas oficiales; el usuario no los rellena.'],
 confirmAdd:['Confirm and add to quotation','确认，加入报价','確認して見積に追加','Confirmar y añadir a la cotización'],
 placeholder:['Describe a service or answer the agent…','描述服务，或回答 Agent 的问题…','サービスを説明するか、質問に回答…','Describe un servicio o responde al agente…'],
 chatLabel:['Chat with the Billing Agent','与 Billing Agent 对话','Billing Agentと対話','Conversar con Billing Agent'],
 send:['Send','发送','送信','Enviar'],
 restart:['Start a new conversation','重新开始对话','対話をやり直す','Iniciar otra conversación'],
 denied:['You can configure quotes but cannot create billing items. Contact a user with item-creation permission or a System Admin. Existing standard items remain available.','你可以配置报价，但不能新增 Billing Item。请联系有新增权限的用户或系统 Admin；仍可选用现有项目。','見積設定はできますが、項目は追加できません。追加権限を持つユーザーか管理者に連絡してください。既存項目は使えます。','Puedes configurar cotizaciones, pero no crear conceptos. Contacta con un usuario autorizado o un Admin. Puedes usar los conceptos existentes.'],
 labelCovered:['Product labeling is already covered by Item label / relabel. A different price does not require a new code. Use an existing item or start another service example.','商品贴标已由 Item label / relabel 支持。换价格无需新建 Code，请选用现有项目，或重新描述其他服务。','商品ラベル貼付は既存項目で対応できます。価格変更だけで新しいコードは不要です。既存項目を使うか、別の例を選んでください。','El etiquetado ya está cubierto por Item label / relabel. Un precio distinto no requiere otro código. Usa el existente o prueba otro servicio.'],
 askSeal:['Ordinary labeling or photos do not express a dual-person seal check. Confirm: charge each outbound carton once only after both people finish verification; no charge otherwise?','普通贴标或拍照不能表达双人封签核验。请确认：出库前完成双人核验的每箱只收一次，未完成的不收费，对吗？','通常のラベルや写真では2名の封印確認を表せません。出荷前に2名で確認済みの箱に1回だけ課金し、未確認は課金しない、でよいですか？','Las etiquetas o fotos no representan esta verificación. ¿Cobrar una vez por caja solo después de la revisión por dos personas, y no cobrar si no se completa?'],
 askBattery:['Confirm: charge each outbound battery carton once only when state of charge is above 30%; do not charge cartons at or below 30%?','请确认：出库电池箱只有荷电状态超过30%时每箱收一次，不超过30%的不收费，对吗？','充電率が30%を超える出荷バッテリー箱に1回だけ課金し、30%以下には課金しない、でよいですか？','¿Cobrar una vez por caja de baterías saliente solo si la carga supera el 30%, y no cobrar si es igual o inferior?'],
 askPrice:['How many US dollars per qualifying carton? For example: “USD 2 per carton”.','每个符合条件的箱子收多少美元？例如“每箱 2 美元”。','該当する箱ごとに何米ドルですか？例：「1箱あたり2米ドル」。','¿Cuántos dólares por caja que cumpla? Por ejemplo: «USD 2 por caja».'],
 priceRecorded:['Recorded: USD {price} per carton. Is there no minimum or maximum charge?','已记录每箱 USD {price}。是否没有最低费和封顶？','1箱あたり{price}米ドルと記録しました。最低料金や上限はなしですか？','Registrado: USD {price} por caja. ¿Sin mínimo ni máximo?'],
 sealService:['Dual-person seal verification','出库双人封签核验','2名による出荷封印確認','Verificación de sellos entre dos personas'],
 batteryService:['Battery state-of-charge compliance check','电池荷电状态合规检查','バッテリー充電率の適合確認','Control de carga de baterías'],
 sealCondition:['Verification completed; no charge if incomplete.','完成双人核验；未完成不收费。','2名の確認完了時のみ課金。','Verificación completada; sin cargo si está incompleta.'],
 batteryCondition:['State of charge > 30%; no charge otherwise.','荷电状态超过30%；其余不收费。','充電率が30%を超える場合のみ課金。','Carga superior al 30%; sin cargo en otros casos.'],
 sealDependency:['This example assumes the demo Fact exists. Owners still need to assess development needs after Sent.','此例假设 Demo Fact 已具备，仍需负责人在 Sent 后评估是否开发。','この例ではデモ用Factが存在すると仮定します。送付後に担当者が開発要否を確認します。','El ejemplo supone que existe el Fact de demostración. Los responsables deben evaluar el desarrollo al marcar Sent.'],
 batteryDependency:['This example needs a new state-of-charge Fact. Owners assess the adaptation after Sent.','此例需要新增荷电状态 Fact，由负责人在 Sent 后评估适配。','新しい充電率Factが必要です。送付後に担当者が連携対応を確認します。','Se necesita un nuevo Fact de carga. Los responsables evaluarán la adaptación al marcar Sent.'],
 review:['I have enough information for this example:\n• Service: {service}\n• Category: Outbound\n• Charge once per qualifying carton: USD {price}\n• Condition: {condition}\n• No minimum or maximum\n• Customer, facility and effective date follow the current quote.\nI will generate Billing Item, Recognition Rule and Price List drafts. {dependency}\nConfirm to add it to the quote; production configuration is not created yet.','信息已经足够生成这个演示案例：\n• 服务：{service}\n• 分类：Outbound\n• 符合条件的每箱一次，USD {price}\n• 条件：{condition}\n• 无最低费、无封顶\n• 客户、仓库和生效日期沿用当前报价。\n我会生成 Billing Item、Recognition Rule 和 Price List 配置草稿。{dependency}\n确认后加入报价，不会现在创建生产配置。','この例の情報が揃いました：\n• サービス：{service}\n• 分類：Outbound\n• 該当箱ごとに1回、{price}米ドル\n• 条件：{condition}\n• 最低料金・上限なし\n• 顧客・倉庫・適用日は現在の見積に従います。\n項目・認識ルール・価格表の設定案を生成します。{dependency}\n確認後に見積へ追加します。本番設定はまだ作成しません。','Ya hay información suficiente:\n• Servicio: {service}\n• Categoría: Outbound\n• Una vez por caja que cumpla: USD {price}\n• Condición: {condition}\n• Sin mínimo ni máximo\n• Cliente, almacén y fecha según la cotización.\nGeneraré borradores de Item, Rule y Price List. {dependency}\nConfirma para añadirlo; todavía no se crea configuración de producción.'],
 added:['Added to Outbound and included in the quote preview and exports. Save a version, send it offline, then mark Sent to prepare owner notifications. Archived simulates syncing all three configurations.','已加入 Outbound，并进入报价预览和导出。保存版本并线下发送后标记 Sent，生成负责人通知；Archived 时模拟同步三类配置。','Outboundに追加し、見積と出力に反映しました。版を保存してオフライン送付後にSentにすると担当者通知を準備します。Archivedで3種類の設定を模擬同期します。','Añadido a Outbound y a la vista previa y exportaciones. Guarda una versión, envíala fuera del sistema y marca Sent para preparar avisos. Archived simula sincronizar las tres configuraciones.'],
 addError:['Cannot add: check creation permission, Draft status, and whether the item is already in this quote.','无法新增：请检查新增权限、Draft 状态，以及项目是否已在本报价中。','追加権限、Draft状態、項目の重複を確認してください。','No se puede añadir: revisa el permiso, el estado Draft y si ya existe en la cotización.'],
 unsupported:['This is a scripted demo, not a connected LLM. Try a labeling, dual-person seal-check or battery state-of-charge example. Production will search the full catalog and ask dynamic follow-ups.','这是脚本演示，尚未连接 LLM。请选择贴标、双人封签核验或电池荷电检查示例；正式版将检索完整目录并动态追问。','LLM未接続の台本付きデモです。ラベル、2名の封印確認、バッテリー検査の例を選んでください。本番では全カタログから検索し追加質問します。','Esta demostración usa guiones, no un LLM. Prueba los ejemplos de etiquetas, sellos o baterías. En producción buscará en todo el catálogo y hará preguntas dinámicas.'],
 batteryLimit:['The battery script covers “above 30%”. Choose that example; other thresholds need the LLM integration. I will not silently change your requirement.','电池脚本只覆盖“超过30%”。可选择该示例；其他阈值需正式 LLM 支持，不会默默改写需求。','この台本は「30%超」の例のみ対応します。他の閾値はLLM連携が必要です。要件を勝手に変更しません。','El guion de baterías cubre «más del 30%». Otros umbrales requieren el LLM; no cambiaré tu requisito sin avisar.'],
 explainGap:['Choose an existing item, or explain why its service definition does not fit and why a new item is required.','请选择已有项目，或说明服务定义为什么不满足、为何需要新增。','既存項目を選ぶか、サービス定義が合わず新規項目が必要な理由を説明してください。','Elige un concepto existente o explica por qué no encaja su servicio y necesitas uno nuevo.'],
 triggerLimit:['This script only supports the stated condition and one charge per qualifying carton. Restart or choose another example if your intent differs; no item is generated from uncertain information.','此脚本只覆盖上面的明确条件与符合条件每箱一次计费。若需求不同请重新开始或选其他示例，不会凭不确定信息生成项目。','この台本は提示条件と該当箱ごとに1回の課金のみ対応します。異なる要件はやり直すか別の例を選んでください。不確実な情報では項目を生成しません。','Este guion solo cubre la condición indicada y un cargo por caja que cumpla. Reinicia o elige otro ejemplo si difiere; no se genera un concepto con información incierta.'],
 limitsLimit:['You have additional pricing conditions. This script only supports UNIT_RATE without a minimum or maximum. I will not ignore your requirement; try the demo answer or extend it with the production LLM.','你有额外计价条件。当前脚本仅支持无最低费和封顶的 UNIT_RATE，不会忽略需求自动新增；可用演示答案，或由正式 LLM 扩展。','追加条件があります。この台本は最低料金・上限なしのUNIT_RATEのみ対応し、要件を無視して追加しません。デモ回答を使うか本番LLMで拡張してください。','Hay condiciones adicionales. El guion solo admite UNIT_RATE sin mínimo ni máximo; no ignoraré el requisito. Usa la respuesta de ejemplo o amplíalo con el LLM.'],
 reviewHint:['Review the generated configuration. If the summary differs from your intent, restart; it will not be added automatically.','可先查看生成配置。若摘要与意图不同，请重新开始，不会自动添加。','生成設定を確認してください。意図と違う場合はやり直してください。自動では追加しません。','Revisa la configuración. Si no refleja tu intención, reinicia; no se añadirá automáticamente.'],
 reused:['Existing standard item selected with your stated USD rate. No Billing Item was created. Review the category and quote preview.','已选用现有项目并配置你明确说明的美元价格，未新建 Billing Item。请核对分类及报价预览。','既存項目に指定の米ドル料金を設定しました。新規項目は作成していません。分類と見積を確認してください。','Seleccionado un concepto existente con la tarifa USD indicada. No se creó uno nuevo. Revisa la categoría y la cotización.'],
 itemCount:['Agent-created items in this quote: {count}','本报价的 Agent 新增项目：{count}','この見積の追加項目：{count}','Conceptos del agente en esta cotización: {count}'],
 lifecycle:['Included in service categories, quoted rates and exports. Sent notifies owners to assess development; Archived syncs Items, Rules and the Price List.','已进入分类、报价与导出。Sent 时通知负责人评估开发；Archived 时同步 Item、Rule 和 Price List。','分類・見積料金・出力に反映済みです。Sentで開発要否の確認を通知し、Archivedで項目・ルール・価格表を同期します。','Incluidos en categorías, tarifas y exportaciones. Sent prepara avisos para evaluar desarrollo; Archived sincroniza Items, Rules y Price List.'],
 newFact:['New Fact / adaptation required','涉及新 Fact／适配','新規Fact・連携対応が必要','Requiere nuevo Fact / adaptación'],
 existingFact:['Example assumes existing Fact; owner review needed','示例假设已有 Fact，待负责人确认','既存Factを仮定・担当者確認待ち','Supone un Fact existente; requiere revisión'],
 ownerReady:['Simulate owner feedback: no development needed / adaptation complete','模拟负责人反馈：无需开发／适配已完成','担当者回答を模擬：開発不要・対応完了','Simular respuesta: sin desarrollo / adaptación completa'],
 itemConfig:['View generated configuration for this item','查看该项目的 AI 生成配置','この項目の生成設定を見る','Ver configuración generada para este concepto'],
 notifications:['Owner notification preview at Sent (simulated)','发送时的负责人通知预览（模拟）','Sent時の担当者通知プレビュー（模擬）','Vista de avisos a responsables al marcar Sent (simulados)'],
 quoteVersion:['Quote v{version}','报价 v{version}','見積 v{version}','Cotización v{version}'],
 billingOwner:['Billing Engine owner','Billing Engine 负责人','Billing Engine担当者','Responsable de Billing Engine'],
 businessOwner:['Business system owner','业务系统负责人','業務システム担当者','Responsable del sistema de negocio'],
 notificationBody:['New: {items}. Assess development and Fact/business-system support. Nothing was actually sent.','新增：{items}。请评估开发及 Fact／业务系统支持情况；实际未发送。','追加：{items}。開発とFact・業務システム対応を確認してください。実際には送信していません。','Nuevos: {items}. Evaluar desarrollo y soporte de Fact/sistemas. No se envió nada realmente.'],
 syncComplete:['Archive sync simulated: {items} Billing Items, {rules} Rules and the corresponding Price List. No production system was modified.','归档同步模拟完成：{items} 个 Billing Item、{rules} 个 Rule 及对应 Price List；真实系统未被修改。','模擬同期完了：項目{items}件、ルール{rules}件、対応する価格表。本番システムは変更していません。','Sincronización simulada: {items} Items, {rules} Rules y la Price List correspondiente. No se modificó producción.'],
} as const;
export type AgentKey = keyof typeof copy;
export function agentText(lang:Lang,key:AgentKey,params:Record<string,string|number>={}) {
  const index=({en:0,zh:1,ja:2,es:3} as const)[lang];
  let value:string=copy[key][index];
  for(const [name,replacement] of Object.entries(params)) value=value.split(`{${name}}`).join(String(replacement));
  return value;
}
export interface AgentMessage {role:'user'|'agent';key?:AgentKey;params?:Record<string,string|number>;literal?:string}
export function agentMessageText(lang:Lang,message:AgentMessage) {
  if(!message.key)return message.literal??'';
  const p={...message.params};
  if(message.key==='review') {
    const battery=p.scenario==='battery';
    p.service=agentText(lang,battery?'batteryService':'sealService');
    p.condition=agentText(lang,battery?'batteryCondition':'sealCondition');
    p.dependency=agentText(lang,battery?'batteryDependency':'sealDependency');
  }
  return agentText(lang,message.key,p);
}
