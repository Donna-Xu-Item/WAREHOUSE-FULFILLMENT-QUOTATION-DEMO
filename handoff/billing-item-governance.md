# Billing AI Agent：对话演示与当前业务约定

本文件替代此前多角色／技术表单方案，以用户最新需求为准。

## 用户体验

用户只描述想收费的服务，Agent 先推荐现有标准 item。若已有项目适用，直接选用并配置该客户价格，不创建新 Code。

用户认为仍不适用时，在聊天中说明缺口。Agent 根据服务、触发场景、计费数量／单位、金额、例外以及最低／封顶等必要信息继续追问。信息足够后生成业务摘要供确认，再加入 Quotation 对应的 Service Category，并参与报价预览、版本保存及导出。

技术字段由 Agent 生成，用户不用填写。生成配置可在聊天里展开，供开发人员检查。

## 三类权限

1. System Admin：管理系统用户权限；可以配置报价和新增 item。本 Demo 可模拟负责人反馈。
2. Quotation User：可以配置报价和使用现有 item，不能新增 item；Agent 提示联系有新增权限的用户。
3. Quotation + Item Creator：可以配置报价，也可以通过 Agent 新增 item。

不额外设置 Pricing Publisher、Catalog Admin、Integration Engineer 等必选用户角色。正式后台应将配置报价与新增 item 作为独立权限，由 Admin 分配；前端角色选择器仅用于 Demo，不是真实权限系统。

## 配置范围：仅按最新五张截图

### Billing Item
- Basic Info：Billable Record Type、Category、Charge Code、Name、Active、Business Object。
- Aggregation Settings：Qty Aggregation Mode、Min Charge、Max Charge；只在对应 IdempotencyStrategy 适用时使用。
- Rate Configurations：可有多个；各自 Name、Rate Type、Sort Order、Quantity Source／值、Default Price、Formula Preview。

### Recognition Rule
- Basic Info：Rule ID 系统生成，Rule Name、Fact Type、Priority、Status。
- Conditions：Group 内 AND／OR、Field、Operator、Input／字段值、Value。
- Outputs：Billable Record Type、Sort Order、Idempotency Strategy、Split Key Fields、Quantity Expression 类型／值。

### Price List
- Customer／Facility／生效日期沿用 Quotation 上下文。
- 由已确认服务意图生成对应 charge code、UOM、价格和实际所需条件。

不再向用户收集上一版额外要求的 Department、Industry Benchmark、Accounting Item、工单表单、测试计划表单等信息。正式后台字典、Fact Schema 与公式语法由系统提供，不能让 LLM 编造。

## 状态与负责人通知

- Draft：Agent 收集意图并加入报价；此时不创建生产 Billing Item 或 Rule。
- Sent：线下发给客户后标记。对该发送版本中的新增 item，通知 Billing Engine 及业务系统负责人，包含项目、生成配置、可能的新 Fact／开发需求。负责人判断是否需要开发并反馈；相关反馈属于后台工作流，不要求销售用户填写技术表单。
- Accepted：锁定客户接受的版本；开发／适配反馈仍可在外部工作流更新。
- Archived：报价流程完成并发布。同步该接受版本涉及的 Billing Items、Recognition Rules 和 Price List；三类配置全部成功才完成归档。未就绪或失败时保留 Accepted，允许重试。

Archived 不表示报价／价格失效。旧 Price List 的结束日期按替换范围及生效日期另行处理。

正式系统通知需解析实际负责人和渠道、记录接收状态。发送同一版本不重复通知；重发新版本需通知变更内容。通知与同步使用 quote ID + version 关联，不能拿后来修改的草稿替代客户接受版本。

## 三个可交互演示案例

### 例 1：复用现有项目
用户：“我要对商品贴标按件收费，每件 0.35 美元。”
Agent 推荐 Item label / relabel、FNSKU／marketplace label、Shipping label；用户选择符合服务定义的项目，按已明确金额配置。没有新建 Code。

### 例 2：新增双人封签核验
用户：“出库前需要双人核对封签，每箱收费 2 美元，普通贴标和拍照都不能替代。”
Agent 先推荐 Photo on request、Shipping label、Routing／retailer compliance。用户仍认为不满足；Agent 确认“完成核验每箱一次，未完成不收”及无最低费／封顶。确认摘要后生成配置，加入 Outbound，报价为 USD 2／Carton。
生成示例：UNIT_RATE，Fixed Value 1；OUTBOUND Fact、核验完成条件、Multi(1:1) 输出、默认 Priority 100。该案例假设 Demo Fact 已具备，但负责人仍需确认是否开发。

### 例 3：电池荷电状态检查
用户：“出库电池箱需要检查荷电状态，超过 30% 的箱子每箱收 3 美元。”
Agent 先推荐现有相近服务；用户确认不适用，Agent 确认仅 >30% 收费、每箱一次，其余不收，以及无最低费／封顶。确认摘要后加入 Outbound。
此例明确涉及示例新 Fact batteryStateOfChargePercent。Sent 时通知中说明需要负责人评估字段和业务系统适配；尚未反馈就绪时 Archived 被阻止。

## Demo 边界与开发交接

这是脚本对话演示，没有 LLM。它支持上述三个自然语言案例与快捷回答，并在不支持的意图／金额／边界下明确说明限制，不把未识别信息静默补成默认值。

生成 Code、Billable Record Type、Fact 字段及 Category 是 Demo 占位，不声称属于真实系统字典。真实 Agent 应读取后端字典／Schema、检索现有 item、逐项判断缺失信息并生成受校验的配置。

Demo 会实际将新增项目加入浏览器中的报价，报价／Excel／JSON／版本快照均保留定义和价格。新 item 不污染全局标准目录，也不出现在不相关报价中。

负责人通知仅保存在浏览器供预览，没有调用邮件、消息或工单接口。System Admin 可模拟负责人反馈。Archived 的三类配置同步也仅为本地原子模拟，不修改真实 Billing Engine、BNP 或业务系统。

正式开发需实现：组权限与 API 校验、LLM 检索／追问、真实字典映射、通知路由与负责人反馈、Fact 适配状态、三类配置的幂等同步和失败恢复。遇到新 Fact，在 Sent 时尽早评估开发，并在第一次业务事件产生前确保数据可采集；未就绪时不能让相关项目进入正式计费。

验证：构建／类型检查及 66 项测试通过，包含完整对话、创建权限、分类／报价／Excel、新版本通知、接受版本、负责人反馈与三类配置同步。
