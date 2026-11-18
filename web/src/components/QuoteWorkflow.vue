<script setup lang="ts">
import { computed, ref } from 'vue';
import { useApp } from '../lib/context';
import type { QuoteStatus } from '../lib/types';
const { store } = useApp();
const text = (zh: string, en: string) => store.state.prefs.lang === 'zh' ? zh : en;
const help = ref(false), pending = ref<QuoteStatus | null>(null), error = ref('');
const statuses: QuoteStatus[] = ['draft', 'sent', 'accepted', 'archived'];
const next: Record<QuoteStatus, QuoteStatus[]> = { draft: ['sent'], sent: ['draft', 'accepted'], accepted: ['archived'], archived: [] };
const labels = computed(() => ({ draft: text('草稿 Draft', 'Draft'), sent: text('已线下发送 Sent', 'Sent'), accepted: text('客户已接受 Accepted', 'Accepted'), archived: text('报价完成 / 已发布 Archived', 'Completed / Published (Archived)') }));
const description = (s: QuoteStatus) => ({draft: text('编辑中。修改报价后，需要保存新版本并重新线下发送。', 'Editing in progress. Save a new version and send it offline after changes.'),sent: text('确认已在线下将最终保存版本发给客户。此操作不会自动发送邮件。', 'Confirm that you sent the final saved version to the customer offline. This does not send email.'),accepted: text('确认客户已接受上次发送的版本。这里只记录客户确认，不代表已经同步 BNP 或可用于开票。', 'Confirm that the customer accepted the version you sent. This records acceptance only; it does not confirm BNP sync or invoice readiness.'),archived: text('完成本次报价流程，将客户接受的固定版本同步到正式 Price List。Archived 不是报价失效。本 Demo 仅生成本地 Price List 副本；真实 BNP 尚未连接。', 'Complete the quotation and publish the accepted version to the formal price list. Archived does not mean expired. This demo creates a local price-list copy only; real BNP is not connected.')}[s]);
function request(e: Event) { const select = e.target as HTMLSelectElement; pending.value = select.value as QuoteStatus; select.value = store.quote.value!.status; error.value = ''; }
function confirm() {
  try { store.setStatus(pending.value!); pending.value = null; }
  catch { error.value = text('请检查最终版本与已发送版本一致。新增 Item 需要负责人确认是否开发、适配是否完成；可用系统 Admin 模拟负责人反馈后重试归档。', 'Check the saved/sent version and owner readiness for new items. A system Admin can simulate owner feedback before retrying archive publication.'); }
}
</script>
<template>
  <div v-if="store.quote.value" data-training="status" class="workflow">
    <label class="field"><span class="lbl">{{ text('报价状态 · 手动记录', 'Quote status · manual') }}</span><select class="input" :value="store.quote.value.status" :disabled="store.state.viewingVersion !== null" @change="request"><option v-for="s in statuses" :key="s" :value="s" :disabled="s !== store.quote.value.status && !next[store.quote.value.status].includes(s)">{{ labels[s] }}</option></select></label>
    <button class="btn ghost sm" @click="help = true" :aria-label="text('了解状态与 BNP 同步', 'Learn about status and BNP sync')">ⓘ</button>
    <div v-if="pending || help" class="workflow-modal" @click.self="pending = null; help = false">
      <section class="workflow-dialog" role="dialog" aria-modal="true" aria-labelledby="workflow-title" @keydown.esc="pending = null; help = false">
        <h3 id="workflow-title">{{ pending ? labels[pending] : text('报价状态与 Price List 生命周期', 'Quotation and price-list lifecycle') }}</h3>
        <template v-if="pending"><p>{{ description(pending) }}</p><p v-if="pending === 'sent' || pending === 'accepted'" class="hint">{{ text('记录版本', 'Recorded version') }}: v{{ store.latestVersion.value?.v ?? '—' }}</p><p v-if="error" role="alert" class="note warn">{{ error }}</p><div class="actions"><button class="btn" @click="pending = null">{{ text('取消', 'Cancel') }}</button><button class="btn primary" @click="confirm">{{ text('确认状态变更', 'Confirm status') }}</button></div></template>
        <template v-else><ol><li v-for="s in statuses" :key="s"><strong>{{ labels[s] }}</strong><p>{{ description(s) }}</p></li></ol><div class="note info"><strong>{{ text('已确定：归档时发布', 'Confirmed: publish at archive') }}</strong><p>{{ text('聊天 Agent 确认信息足够后，将新 Item 加入报价分类与费率。Sent 时通知 Billing Engine 和业务系统负责人判断是否开发、是否缺 Fact。Accepted 锁定客户确认版本；Archived 时统一同步 Billing Item、Recognition Rule 和 Price List。负责人未反馈就绪或同步失败时保留 Accepted。', 'The chat agent adds confirmed items and rates to the quotation. At Sent, notify Billing Engine and business-system owners to review development and Fact needs. Accepted freezes the agreed version. At Archived, synchronize Billing Items, Recognition Rules and the Price List together. Missing readiness or failed sync leaves the quote Accepted.') }}</p><p>{{ text('旧 Price List 在适用范围相同、由新版替换时设置结束日期，并保留历史；不要因报价被归档而直接作废旧费率。', 'When a replacement covers the same scope, close the old price list at the correct end date and retain its history. Archiving a quotation alone must not invalidate existing rates.') }}</p></div><p class="hint">{{ text('当前 Demo 未接入 BNP；所有状态变更仅保存于本地浏览器。', 'This demo is not connected to BNP. Status changes are stored in this browser only.') }}</p><button class="btn primary" @click="help = false">{{ text('了解', 'Got it') }}</button></template>
      </section>
    </div>
  </div>
</template>
<style scoped>
.workflow{display:flex;align-items:flex-end}.field{display:flex;flex-direction:column}.lbl{font-size:11px;color:var(--muted-fg)}.workflow-modal{position:fixed;inset:0;z-index:70;background:#0008;display:grid;place-items:center;padding:20px}.workflow-dialog{background:var(--card);border:1px solid var(--border);border-radius:14px;width:min(640px,95vw);max-height:85dvh;overflow:auto;padding:24px}.workflow-dialog p{line-height:1.7}.workflow-dialog h3{margin-top:0}.actions{display:flex;justify-content:flex-end;gap:10px}.workflow-dialog li{margin-bottom:14px}.workflow-dialog li p{margin:4px 0}
</style>
