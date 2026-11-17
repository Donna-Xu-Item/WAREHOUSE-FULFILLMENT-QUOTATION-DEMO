# Quotation Demo: clone, versions and manual lifecycle

## Implemented in this demo
- New quote opens a customer-specific creation form with Blank quotation / Clone PriceList.
- Blank quotes have no enabled charges. Existing standard-template action remains available after creation.
- Clone copies services, UOMs, conditions, rates and facility into an independent Draft, with a new number and current date. Versions and acceptance metadata are not copied.
- Price-list number and effective/end dates appear in the selector; source metadata is retained on the new quote.
- Demo price lists are synthetic local fixtures, separate from quote versions. No BNP data is loaded. Existing user data is preserved in browser storage.
- Quote version dropdown provides read-only snapshots; Versions drawer provides comparison and restore. Restore overwrites a draft. Accepted/Archived quotes are locked.
- Sent is manually recorded after offline sending. Accepted is manually recorded after customer confirmation and must match the saved sent version.
- The tutorial has 14 steps plus preset bilingual questions covering creation, cloning, versions, offline sending, acceptance, archive and BNP.

## Proposed business policy — confirmation required
Quotation lifecycle and formal price-list lifecycle should be separate.

Draft -> Sent -> Accepted -> Archived.
Draft/Sent may also be archived without acceptance; Sent may return to Draft for revisions.
Accepted freezes the accepted quote version. Archived closes the quotation and retains history.
Neither status change writes a formal price list in this demo.

Suggested future integration:
1. Accepted quote version is submitted to BNP through a separate, auditable synchronization action.
2. Track Not submitted / Pending / Synced / Failed, external ID and error details. Retrying must be idempotent.
3. Confirm customer, warehouse, service scope, currency, dates and overlapping price lists before activation.
4. Rates become invoice-ready only after successful synchronization and the effective date.
5. End-date the prior price list only for replaced scope, without removing history required for prior service dates and invoices.
6. Archived quotation status must not trigger synchronization or invalidate a formal price list.

Confirm whether BNP is the authoritative price-list system, who may approve/synchronize rates, the effective-date rules, and whether partial service-scope replacements are supported before implementing production sync.

Validation: frontend build/typecheck and 59 tests passed. Computer-use preview timed out, so visual verification remains pending.
