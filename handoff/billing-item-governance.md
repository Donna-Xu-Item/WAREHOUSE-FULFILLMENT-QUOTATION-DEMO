# 标准收费项目治理与 AI 申请方案

## 1. 业务结论

标准目录应稳定。价格不同、客户不同或已有条件参数不同，原则上配置现有 Item 的 Price List，不创建新 Code。真正新增的服务事件、数量口径或无法由现有 Item 表达的计价能力，才进入新项目申请。

建议将“定义建立”提前到 Draft，但把“正式发布与启用”保留在 Archived。Inactive Item／Rule 不得识别实时事件或生成费用。创建定义不等于启用收费。

## 2. 用户组与职责

| 建议用户组 | 建议成员 | 允许操作 | 不允许操作 |
|---|---|---|---|
| QUOTATION_USERS | Sales、AM、CSR | 配置已授权标准目录与报价 | 直接新增标准 Item／Rule |
| BILLING_ITEM_REQUESTERS | 少量 Pricing Specialist／商业定价负责人 | AI 检索、说明缺口、提交设计申请 | 审批自己的申请、直接启用 |
| BILLING_CATALOG_ADMINS | Billing 产品／目录负责人、资深 Billing Ops | 语义查重、字典校验、审批、建立 Inactive 定义 | 越过 Fact 验证与发布门禁 |
| FACT_INTEGRATION_MAINTAINERS | Billing／WMS／集成工程师 | Fact 合同、映射、适配、端到端测试、技术签核 | 批准客户价格或自行发布价格 |
| PRICELIST_PUBLISHERS | 定价／财务运营负责人 | 核对 Accepted 版本、发布 Price List、按日期启用 | 改写已接受版本、忽略缺 Fact |
| ACCESS_ADMINS | 企业身份管理员 | 管理用户组、范围与审计 | 因为管理账号就自动拥有定价审批权 |

实现方式：在现有身份系统建立安全组 → 后端映射细粒度权限（catalog.read、item.request、item.review、item.stage、fact.verify、pricing.publish）→ 加客户／仓库／租户范围 → 每个 API 检查权限和资源范围。默认不给新增权限；申请人与审批人按真实 user ID 分离。仅隐藏按钮不构成权限控制。

AI 服务账号仅能读授权目录和字典、写设计草稿，不能批准、启用、同步生产价格或修改用户组。对目录搜索也要检查范围；客户专属数据不得泄露给其他客户。

权限实现参考：https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

## 3. AI 申请交互

1. 用户用自然语言描述服务、发生时点、适用客户／仓库、按什么计量和收费，并提供 2–3 个应收费／不收费例子。
2. AI 从当前有效及已停用的标准目录、别名、Code、UOM、Recognition Rule、可用 Fact 和已存在申请中检索。展示候选及“支持什么／缺什么”的依据，不能只给相似名称或置信度分数。
3. 如果只是换价格或已有条件，带用户配置现有 Item；如果是新 Rule 可识别同类服务，先评估复用已有 Item；用户明确说明仍不支持的原因后，才继续新项目申请。
4. AI 根据实际 API Schema 分阶段追问缺失字段；已有客户、BillTo、仓库与报价上下文从页面读取并让用户核对。字典值必须来自权威接口，不能由模型自由创造。
5. AI 输出结构化设计草稿、字段来源、缺失／不确定项、重复候选及差异说明；用户确认后提交目录管理员审批，不让 AI 直接创建 Active Item。
6. 审批时再次服务端查重并使用唯一约束／版本检查，防止两人同时提交同一项目。近似语义重复由负责人判定，不能只靠 Code 不重复就放行。
7. 审批通过后归入对应 Service Category，标注技术状态：Inactive prepared／Waiting for Fact／Testing／Ready；尚未报价可用的设计不得静默进入正式费率。

正式 AI 的检索范围、提示词与工具调用权限必须由服务端约束。没有匹配结果不等于证明确需新增；没有 Fact 文档不等于 Fact 不存在。

## 4. 必须收集的数据（根据提供的页面）

| 配置对象 | 信息 |
|---|---|
| Quotation 分类／范围 | Service Category、Target Segment、Customer／BillTo、Facility／服务范围、币种、客户报价、价格生效／结束日期；Default Rate 与客户报价分开 |
| Billing Item Basic Info | Billable Record Type、Billing Category、Charge Code、Name、Description、初始 Inactive、Business Object／cutoff、UOM、Accounting Item 或已确认的分类默认 |
| Aggregation | Qty Aggregation Mode、Min／Max Charge；按 Billable Record Type 的 IdempotencyStrategy = Once 等实际条件验证是否适用 |
| Item Profile | Department、Process Stage、Industry Low／Typical／High；非必填的基准信息不应阻止合理的新项目 |
| Rate Configurations | 一个或多个配置的名称、Rate Type、Sort Order、Quantity Source／Expression、Default Price、Formula／阶梯／增量规则、UOM／舍入规则 |
| WMS 设置 | 是否 Automatic Billing for WMS、谁触发事件、是否与 Rule 重复触发；只能选择一条明确的收费责任链 |
| Recognition Rule Basic Info | Rule Name、Fact Type、Priority、初始 Inactive；Rule ID 由系统生成 |
| Recognition Conditions | AND／OR 组结构，每个条件的 Fact 字段、类型、操作符、输入常量或字段引用、值；明确空值／缺失字段处理 |
| Recognition Outputs | 一个或多个输出的 Billable Record Type、Sort Order、Idempotency Strategy、Split Key Fields、Qty Expression 类型／值 |
| Price List Conditions | 字段／操作符／值及组合结构、来源 Fact、与客户／仓库／时间范围的绑定；Recognition 条件与价格条件分别收集 |
| Fact 合同 | 字段名、类型、枚举、计量单位、源系统／事件、数量和业务时间、粒度、版本、缺失／空值语义、来源负责人、样例 payload |
| 测试与证据 | 业务例子、预期数量／金额、真实 Fact 样例、正确命中／不命中、边界、缺字段、重复、重放、金额与会计映射结果 |

上表是字段清单，不等于已验证的生产 API Schema。截图未提供的枚举、内部字段名、公式语法和字典需要从系统接口读取。AI 不能编造字段或未确认的默认值。复杂表达式应以受限制 DSL／结构化 Schema 表达，不直接执行模型生成的代码。

## 5. Fact 依赖决策

- 字段已有且有数据：复用；核对粒度、单位、业务时间、null 行为，不能只核对字段名。
- 可由已有 Fact 确定性推导：先评估受控计算／映射，未必需要仓库系统加字段；记录推导表达式与测试。
- 新字段／新事件：登记源系统 owner、适配工单、合同版本、预计上线时间、测试 payload 和验收人。用户点击“提交适配请求”后再发工单／通知；不能只在内部页面勾选“存在”。
- 未知：标记 Unknown／Blocked，不能由 AI 自动改成 Ready。

缺 Fact 时应隔离／挂起相关事件或费用，不能无声按 0 计费或凭空补值。需要定义从业务生效时点开始的 Fact 留存、补传／回放、幂等和追补／冲销策略；已生效但没收集到的数据可能事后无法恢复，因此上线承诺前就应确认源系统准备度。

## 6. 推荐创建时点

| Quotation 阶段 | Billing Item／Recognition Rule | Fact 与验证 | 客户 Price List |
|---|---|---|---|
| Draft：确认需求 | 查重、提交设计；审批通过即可在草稿／隔离环境或 production Inactive 区预建定义，记录版本和关联申请 | 验证已有 Fact；缺失则立即登记外部适配，执行测试样例 | 仅报价草稿 |
| Sent | 设计基线版本固定；承诺的范围／日期需有可行性确认 | 适配可继续，但风险和就绪日期必须可见 | 不发布 |
| Accepted | 锁定客户确认版本，不能静默更改定义／价格 | 未就绪保持等待状态，不自动启用；可禁止在就绪前承诺业务上线 | 不发布 |
| Archived 发布操作 | 核对已批准 Item／Rule 版本；按发布事务统一启用或设定未来生效，禁止先识别事件后才写价格 | 必须通过生产合同、真实样例、试算、幂等和生效边界检查 | 按用户确定的规则在此同步，全部成功后才写 Archived |
| 到达业务生效日期 | 按已确认事件时间／cutoff 应用配置 | 监测真实事件和命中率；异常隔离、对账 | 同步成功且生效的价格才供 Invoice 使用 |

因此，“新增到引擎”应拆为两个动作：**Draft 阶段创建 Inactive 定义，Archived 阶段发布并按生效时间启用**。如果引擎不支持 Inactive staging，应在隔离配置区／环境准备；不能为了提前创建就让未成交的规则参与生产计费。

## 7. 发布门禁与可靠性

Archived 不是单纯改标签。后端执行有审计的 publication job，内部可以有 Pending／Validating／Publishing／Failed 状态，但对外 Quotation 在成功前保持 Accepted。

必须核对：
- Customer／BillTo、Facility／服务范围、币种、UOM、有效日期及重叠价格处理。
- 所有新 Item／Rule 已审批、版本固定、未自审批，Code 唯一；没有错误复用其他客户专属定义。
- Rule Conditions、Outputs 和 Price List Conditions 引用的 Fact 全部已具备可用数据。
- 数量、金额、幂等／Split Key、Aggregation、Min／Max、WMS 触发与 Rule 触发不重复。
- 正例、反例、缺字段、重复投递／回放、跨生效日期与首张 Invoice 的端到端试算通过。
- 报价中每个新服务已经成为真实可报价 Item，有金额且导出与客户接受版本一致；设计草稿不能作为发布结果。

对 Item／Rule／Price List 使用同一 publication ID 和版本校验；重试使用幂等键（quote ID + accepted version + publish revision）。跨系统不能假装单数据库原子事务：使用编排／outbox、分步回执和补偿，失败时保持部分资源 Inactive，禁止对外声称 Archived。读到某个 Item 创建成功，不代表整个发布成功。

旧 Price List 只有被同客户、仓库、服务范围的新价格替换时，才结束对应有效区间；部分服务变更不应把整张旧表作废。保留历史供按业务发生时间重算／追溯，不能因今天的状态影响历史 Invoice。

## 8. 本 Demo 的演示范围

可以体验：先检索标准项目 → 解释缺口 → 收集设计信息 → 按 Service Category 显示申请 → 模拟审批／登记证据 → 导出设计包；也可切换模拟角色查看入口差异。

未接入：大模型语义检索／动态追问、权威字典与 JSON Schema、实际组成员权限、Engine／BNP／WMS／工单、真实 Inactive 预建／试算／启用。

设计申请不计入报价费率，含设计申请的归档发布被阻止，防止演示误导为“新项目已可计费”。现有标准项目可演示归档后生成本地 Price List。正式开发完成上述接入与验收后，才可以解除门禁。
