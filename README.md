# Warehouse Fulfillment Quotation Demo

Independent demo based on https://github.com/tommyyula/item-Quote-fulfillment . The original repository is unchanged.

## Current experience

Open the chat from **+ New billing item** on the right of the search/filter bar. Agent UI, examples and earlier scripted replies update live in English, Chinese, Japanese and Spanish. Free-text user input remains unchanged. The training tour has 18 current-feature steps with automatic highlighting and no redundant Show this feature button.


Billing AI Agent uses a conversation rather than technical forms. Three interactive examples demonstrate reusing a label item, adding dual-person seal verification, and adding a battery state-of-charge check requiring a new Fact. This is a scripted demo, not a connected LLM.

Confirmed new items enter their service category, quotation rates, version snapshots and exports. At Sent, owner notifications are prepared in the browser; at Archived, Billing Items, Recognition Rules and the Price List are synchronized in a local simulation after owner readiness is confirmed. No real notifications or backend changes occur.

There are exactly three demo roles: System Admin, Quotation User without item creation, and Quotation User with item creation. Production permissions require backend enforcement.

See [agent examples and current requirements](handoff/billing-item-governance.md) and [quotation workflow](handoff/quotation-workflow.md).

## Run and build

Requires Node.js compatible with Vite 7 (for example Node.js 24).

```sh
cd web
npm ci
npm run dev
npm test
npm run build
```

The docs folder contains the built site. Copy web/dist contents to docs after rebuilding, retaining docs/.nojekyll. GitHub Pages uses main /docs.

Quotation data is stored in each browser. BNP, Billing Engine, business systems, notifications and LLM integrations are not connected. Demo dictionary names and Fact fields are illustrative placeholders, not production schema claims.

Validation: frontend build/typecheck and 69 tests passed.
