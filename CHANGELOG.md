# Email Standards Migration Changelog

## SCAN & MAP RESULTS
### Backend
- `smartspend-backend/src/mail/mail.service.ts` -> Apply shared template and department mapping (`noreply@cashtro.in`, `admin@cashtro.in`).

### Frontend (smartspend-landing)
- `src/components/Footer.tsx`: `security@` -> `legal@`
- `src/components/FAQSection.tsx`: `support@` (keep)
- `src/app/security-policy/page.tsx`: `security@`, `privacy@` -> `legal@`
- `src/app/community-guidelines/page.tsx`: `trust@`, `security@` -> `legal@`
- `src/app/invoice-disclaimer/page.tsx`: `support@` (keep)
- `src/app/documents/terms/page.tsx`: `security@`, `legal@` -> `legal@`
- `src/app/documents/refund-policy/page.tsx`: `billing@`, `support@` (keep)
- `src/app/documents/cookie-policy/page.tsx`: `privacy@` -> `legal@`
- `src/app/documents/privacy/page.tsx`: `privacy@`, `security@` -> `legal@`
- `src/app/data-retention/page.tsx`: `privacy@` -> `legal@`
- `src/app/ai-usage/page.tsx`: `ai@` -> `support@`
- `src/app/contact/page.tsx`: Update list to display the official 4 customer departments + `admin@` internally.
- `src/app/layout.tsx`: `support@` (keep)

### Mobile (SmartSpend)
- `SmartSpend/screens/SettingsScreen.js`: `support@` (keep)

### Admin (smartspend-admin)
- `smartspend-admin/src/app/settings/page.tsx`: `support@`, `noreply@` (keep)

## ACTION LOG
- `smartspend-backend/src/mail/mail.service.ts`: Rewrote email templates using the shared Base CSS/HTML, added department-specific FROM addresses and signatures.
- `smartspend-landing/src/components/Footer.tsx`: Updated `security@cashtro.in` mailto link to `legal@cashtro.in`.
- `smartspend-landing/src/app/security-policy/page.tsx`: Updated `security@` and `privacy@` addresses to `legal@`.
- `smartspend-landing/src/app/community-guidelines/page.tsx`: Updated `trust@` and `security@` addresses to `legal@`.
- `smartspend-landing/src/app/documents/terms/page.tsx`: Updated account security contact to `legal@`.
- `smartspend-landing/src/app/documents/cookie-policy/page.tsx`: Updated privacy contact to `legal@`.
- `smartspend-landing/src/app/documents/privacy/page.tsx`: Consolidated privacy and security contacts to `legal@`.
- `smartspend-landing/src/app/data-retention/page.tsx`: Updated privacy officer contact to `legal@`.
- `smartspend-landing/src/app/ai-usage/page.tsx`: Changed `ai@` contact email to `support@cashtro.in`.
- `smartspend-landing/src/app/contact/page.tsx`: Completely rewrote the page to feature only the official 3 customer-facing departments (Support, Billing, Legal) and updated the response SLA table.
