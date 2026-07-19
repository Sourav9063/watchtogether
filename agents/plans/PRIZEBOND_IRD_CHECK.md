# Prize Bond IRD Result Check Plan

## Goal

Add direct IRD bulk-result checking to `src/app/prizebond` so saved prize-bond numbers can be checked without exporting a workbook and manually uploading it at the government site.

## Current State

- `src/app/prizebond/page.js` stores scanned/imported numbers in `localStorage` and can generate an `.xlsx` workbook with `xlsx`.
- Current `Export` downloads that workbook and opens `https://prizebond.ird.gov.bd/MultipleNumbers.php` for manual upload.
- Current `Check` opens Bangladesh Bank searches in chunks of 100 and does not use the IRD upload endpoint.
- `src/app/prizebond/page.js` contains hard-coded winning numbers for display logic; these are stale and must not be treated as authoritative results.
- No `agents/knowledge/` directory exists in the repository. Existing execution notes use `agents/plan/`, but project instructions require new plans under `agents/plans/`; this plan follows the current instruction.

## External Contract

- Upstream endpoint: `POST https://prizebond.ird.gov.bd/multiple_action.php`.
- Request body: multipart form with one `file` field containing a valid Excel workbook.
- Do not copy the curl boundary or manually set `Content-Type`; server-side `FormData` must generate the boundary and include actual workbook bytes. The supplied curl body declares a filename but contains no file bytes.
- Upstream response is Bengali HTML, including a result table, uploaded-number count, matched-number count, optional result PDF links, and a claim-form link.
- IRD/Bangladesh Bank remains authoritative. Upstream wording or markup can change, so parsing failures need an explicit error state rather than “no winners.”

## Backend Feasibility Check (2026-07-06)

- Generated a valid one-row `.xlsx` workbook containing dummy number `0000000` (15,843 bytes); no user bond data was sent.
- A command-line multipart upload returned HTTP `200`, `text/html; charset=UTF-8`, 6,140 response bytes in 1.124 seconds.
- A Node 22 native `fetch` + `FormData` upload—the relevant Vercel Function request mechanism—returned HTTP `200` in 1.091 seconds.
- The response was semantically recognized as a valid zero-match result: one uploaded number and no matches.
- Therefore the endpoint works from a backend process without browser cookies, CAPTCHA, or CSRF token in this environment.
- Vercel currently documents a 4.5 MB Function request/response payload limit and a 300-second Hobby maximum duration. The measured request and response are comfortably within both limits.
- This does not prove that IRD accepts traffic from Vercel datacenter IP ranges. Deploy the smallest proxy to a Vercel preview and repeat the dummy-workbook check before completing UI integration.

## Implementation

### 1. Add same-origin server proxy

Create `src/app/api/prizebond/check/route.js` with Node runtime behavior:

- Accept `multipart/form-data` from the prize-bond page and read the `file` field.
- Validate presence, non-empty size, supported Excel MIME/extension, and a conservative maximum upload size.
- Forward the file to IRD using native `fetch`, `FormData`, and `Blob/File`; set only necessary upstream headers such as `Accept`, `Origin`, and `Referer` when required. Let `fetch` set multipart headers.
- Apply a request timeout and disable caching.
- Treat non-2xx responses, timeouts, network failures, and non-HTML/unrecognizable responses as upstream failures (`502`/`504`) with stable JSON errors.
- Parse the HTML server-side into normalized JSON instead of returning/injecting third-party markup:
  - `uploadedCount`
  - `matchedCount`
  - `matches[]`: seven-digit number, prize rank, gross amount, draw date, and absolute draw-PDF URL when present
  - absolute claim-form URL when present
- Convert Bengali digits to ASCII for machine fields while preserving or deliberately formatting Bengali labels only in UI.
- Return `Cache-Control: no-store`; do not persist uploaded bond numbers or log workbook contents.

Keep parser/normalization helpers in a small server-only module (for example `src/helper/prizebondResult.server.js`) if route-level code becomes difficult to test or read. No new HTML-parser dependency unless inspection shows regex/string parsing cannot safely recognize the narrow response contract.

### 2. Generate and submit workbook in the client

Update `src/app/prizebond/page.js`:

- Extract workbook creation from `exportToExcel` so both download and direct checking use the same one-column, headerless workbook format already accepted by IRD.
- Preserve every bond as a normalized seven-character digit string so leading zeroes survive workbook generation.
- Add a direct `checkWithIrd` action that creates the workbook as an `ArrayBuffer`, wraps it in a client `File`, appends it under `file`, and posts to `/api/prizebond/check`.
- Disable checking when there are no saved numbers and while a request is active.
- Track explicit idle/loading/success/error state. A successful response with zero matches is distinct from an upstream/parser error.
- Do not mutate `savedNumbers` during rendering (`savedNumbers.reverse()` currently mutates state); render a copied reversed array while touching this flow.
- Remove or stop using hard-coded `winningNumbers`/`checkWinning` as result truth. Winner highlighting must come only from the latest IRD response.
- Keep Excel export/import and the Bangladesh Bank chunk links only if they remain useful as clearly labeled fallback actions; rename controls so “Check with IRD,” “Export backup,” and fallback behavior are unambiguous.

### 3. Render result summary and matches

Update `src/app/prizebond/page.js` and `src/app/prizebond/prizebond.module.css`:

- Show submitted count and matched count after a successful check.
- Show a clear zero-match state.
- Render each match with normalized bond number, prize rank, gross amount, draw date, and safe external PDF link when supplied.
- Link to the claim form only when returned by the API.
- Add loading, disabled, success, and error styling consistent with the existing page and usable at mobile widths.
- Use normal React text/link rendering; never use `dangerouslySetInnerHTML` with the IRD response.

## Error and Compatibility Rules

- Validate saved/imported values as exactly seven digits before submission; report skipped invalid entries or block submission with a useful message.
- Preserve leading zeroes throughout local data, workbook cells, API parsing, and display.
- Open external PDFs with `target="_blank"` and `rel="noopener noreferrer"`.
- Do not expose a general-purpose proxy URL; API destination remains hard-coded to the IRD endpoint.
- Keep all upstream access server-side to avoid browser CORS restrictions and leaking brittle request details into UI code.

## Verification

### Automated/local

- Run `npm run lint`.
- Run `npm run build` because this adds an App Router API route and server/client boundary.
- Deploy the API-only slice to a Vercel preview and run the same dummy-workbook request against `/api/prizebond/check`; this is the final egress/IP compatibility gate.
- Exercise parser fixtures for:
  - supplied HTML with 624 uploaded and one match (`0826754`, fifth prize, `10000`, `2025-07-31`)
  - valid zero-match HTML
  - malformed/unexpected HTML
  - Bengali digit conversion and relative-link resolution

If the repository has no test runner, keep representative HTML fixtures and test the parser with a narrow Node script, or verify via route calls during development without introducing a full framework solely for this feature.

### Manual

- With no saved numbers, direct check is unavailable and explains why.
- Submit a small known workbook and verify request reaches the internal API with real file bytes.
- Confirm zero-match response does not display an error.
- Confirm supplied sample response renders one match and correct counts.
- Confirm leading-zero bond numbers remain seven digits.
- Confirm timeout, offline/upstream error, and changed/unparseable markup show retryable errors.
- Confirm repeated clicks cannot create concurrent submissions.
- Confirm export/import, OCR scanning, edit/delete, deduplicate, and Bangladesh Bank fallback still work.
- Check desktop and mobile layout.

## Assumptions and Risks

- “Implement the curl” means direct checking of the page's saved numbers through the IRD bulk-upload endpoint, not merely displaying the returned HTML.
- The IRD endpoint permits server-originated requests without cookies, CAPTCHA, or CSRF tokens. Verify this early with a generated workbook; if it rejects automated/server requests, retain export-and-open as the supported fallback and report the constraint.
- The upstream service and HTML schema are outside this application's control. Parser recognition and honest failure states are required; a silent empty result is unacceptable.
- Prize claims and final result authority remain with IRD/Bangladesh Bank; UI should state that returned data is informational.
