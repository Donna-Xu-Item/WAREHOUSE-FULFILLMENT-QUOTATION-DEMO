# Quotation Demo：当前业务规则与实现边界

本文件替代此前“归档不发布”的建议。以本轮用户确认的规则为准。

## 确认的状态含义

Draft → Sent → Accepted → Archived。
- Draft：编辑与技术准备。
- Sent：已在线下发送指定保存版本，不自动发送邮件；修改后返回 Draft、保存并重新发送。
- Accepted：客户接受已发送版本，锁定报价快照。
- Archived：本次报价完成，发布到客户正式 Price List。不是失效、拒绝、取消或价格过期。
- 正式系统只有在 Price List、所需 Billing Item／Recognition Rule 发布成功、验证通过后才写 Archived。失败保留 Accepted 与错误记录，允许幂等重试。
- 未成交、取消、失效应使用另外的商业终态，不要复用这个“完成并发布”的 Archived。
- Price List 自身有生效日期、结束日期与有效状态。Quotation 有效期也不等于正式 Price List 的费率结束日期。

## 本次 Demo 已实现

1. 学习助手展开时留出页面空间：大屏右侧独立栏，窄屏底部保留区域。抽屉／确认窗口也避开学习区；常见问题默认折叠。
2. 新建／Clone PriceList、版本下拉框与历史快照继续保留。
3. Archived 需先 Accepted 和 Pricing Publisher 模拟角色，模拟生成本地 Price List；绑定已接受的不可变版本，同一来源版本不重复发布。
4. 原 Price List 不自动改结束日期；历史 Archived 若没有发布记录，会显示核查提示。
5. “查找／申请项目”先搜索现有目录；普通角色可选用标准项目，仅 Pricing Specialist 可提交新项目设计。
6. 按用户截图收集 Billing Item、Rate Configuration、Recognition Rule、Price List 及 Fact 依赖字段。按 Service Category 展示设计申请；支持导出设计包。
7. 模拟目录管理员审批、工程师登记 Fact／试算证据；检查必填项、重复 Code／名称、价格与日期边界、外部 Fact 负责人。
8. 新项目设计尚未接入真实报价费率和引擎，因此不出现在报价金额／导出费率中，并会阻止归档发布。不能把设计包误当成已部署的 Billing Item。

## 明确边界

这是浏览器 Demo。角色切换不是身份系统，审批与技术就绪登记不是真实后端操作；目录搜索是关键词匹配，不是大模型语义检索。没有调用 BNP、Billing Engine、WMS、工单或消息接口；没有创建真实 Billing Item／Recognition Rule。

现有项目的归档仅模拟本地 Price List 发布；它不证明真实客户可以开始计费。正式系统需按 billing-item-governance.md 实施真实 API、Schema 校验、权限和发布门禁。

验证：构建／类型检查及 64 项测试通过。浏览器控制服务响应超时，最新布局仍需人工视觉验收。
