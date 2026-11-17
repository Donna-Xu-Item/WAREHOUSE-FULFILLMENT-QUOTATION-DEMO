# Warehouse Fulfillment Quotation Demo

Independent UI demo based on https://github.com/tommyyula/item-Quote-fulfillment . The original repository is unchanged.

## Features
- UOM-first configuration for all charge items, with independent conditions and pricing methods.
- Rates, tiers, minimums, first/additional-unit pricing and billing settings.
- First-visit guided tour and Chinese/English training knowledge-base chat with suggested questions (no LLM integration).
- Proposal preview and Excel/print exports.

## Run locally
Requires Node.js compatible with Vite 7 (for example Node.js 24).

```sh
cd web
npm ci
npm run dev
```

## Validate and rebuild
```sh
cd web
npm test
npm run build
```

The `docs/` folder contains the built demo. After rebuilding, copy the contents of `web/dist/` to `docs/` and retain `docs/.nojekyll`.

## Publish with GitHub Pages
In repository Settings > Pages, choose Deploy from a branch, select main and /docs, then Save.
Expected URL after successful publication: https://Donna-Xu-Item.github.io/WAREHOUSE-FULFILLMENT-QUOTATION-DEMO/?lang=zh

Quote data is stored in each visitor's browser and is not shared across users. This demo does not connect to production billing. Confirm business rules before integrating into the development application.

Validation: frontend build/typecheck and 53 tests passed. Browser visual verification remains pending.
