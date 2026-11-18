# Quotation Demo 当前工作流

Draft → Sent → Accepted → Archived。

- 新建报价支持空白报价及 Clone PriceList。
- Billing AI Agent 用对话替代技术表单。先推荐现有 item，仍不满足时追问必要信息，确认后将新 item 加入对应分类与报价费率。
- Sent 仍需先线下发送。Demo 同时为新 item 生成给 Billing Engine 与业务系统负责人的通知预览，供评估开发／Fact 适配。
- Accepted 锁定客户接受的发送版本。
- Archived 表示报价完成并发布。负责人确认就绪后，同步 Item、Rule 和 Price List，保留源报价版本；旧 Price List 不自动失效。
- 历史 Archived 若没有发布记录会提示核查。
- 权限仅三类：System Admin、可配置报价但不能新增 item、可配置报价并新增 item。

Demo 不连接 LLM 或真实后台。聊天有三个可交互案例，通知／同步均为浏览器内模拟；实际后端尚未被修改。

详见 billing-item-governance.md。构建及 66 项测试通过。
