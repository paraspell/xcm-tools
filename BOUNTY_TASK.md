# Bounty Fix

**Reward:** $10.00
**Issue:** https://github.com/paraspell/xcm-tools/issues/2304
**Repo:** https://github.com/paraspell/xcm-tools

---

## Issue

[Bug bounty] Swap with AMOUNT_ALL ('ALL') crashes in normalizeAmountAll and SwapBuilder.amount() double-scales bigint amounts

# 🐞 Bug Report

## 🔍 Describe the Bug

Transferring or quoting with `AMOUNT_ALL` (`'ALL'`) when `.swap(...)` is enabled on `Builder` (as well as passing a `bigint` base-unit amount to `Builder(...).swap(...)` or `SwapBuilder.amount(...)`) fails due to three connected issues across `@paraspell/sdk-core` and `@paraspell/swap`:

1. **`normalizeAmountAll` passes raw `amount: 'ALL'` into `executeWithSwap`:**
   In [`packages/sdk-core/src/builder/normalizeAmountAll.ts#L47-L60`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/sdk-core/src/builder/normalizeAmountAll.ts#L47-L60), the non-swap branch overrides `currency: { ...currency, amount: MIN_AMOUNT }` (`'2'`) before estimating transferable balance, but the `swapOptions` branch forwards `options` unchanged where `options.currency.amount` is still `'ALL'`:
   ```ts
   const transferable = swapOptions
     ? await executeWithSwap({ ...options, api, from, swapOptions }, builder =>
         builder.getTransferableAmount()
       )
     : await getTransferableAmountInternal({
         ...
         currency: { ...currency, amount: MIN_AMOUNT }
       })
   ```
   `executeWithSwap` -> `createSwapBuilder` passes `'ALL'` to `SwapBuilder.amount('ALL')`. Inside `builder.getTransferableAmount()`, `prepareTransformedOptions` (and `selectBestExchangeCommon` when exchange auto-selection runs) calls `applyDecimalAbstraction('ALL', decimals, ...)`, which immediately throws:
   - `InvalidDecimalNumberError: Number "ALL" is not a valid decimal number.` (when `abstractDecimals !== false`), or
   - `SyntaxError: Cannot convert ALL to a BigInt` (when `abstractDecimals === false`).

2. **`Builder.dryRun()`, `dryRunPreview()`, `signAndSubmit()`, and `signAndSubmitAll()` skip `prepareNormalizedOptions` when `swapOptions` is set:**
   In [`packages/sdk-core/src/builder/Builder.ts#L511-L515`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/sdk-core/src/builder/Builder.ts#L511-L515), [`#L534-L538`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/sdk-core/src/builder/Builder.ts#L534-L538), [`#L1047-L1060`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/sdk-core/src/builder/Builder.ts#L1047-L1060), and [`#L1085-L1095`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/sdk-core/src/builder/Builder.ts#L1085-L1095), the `if (swapOptions)` early-return paths pass `this._options` directly to `executeWithSwap` without calling `this.prepareNormalizedOptions(this._options)` (unlike `build`, `buildAll`, `getXcmFee`, `getOriginXcmFee`, `getTransferableAmount`, `getMinTransferableAmount`, and `getTransferInfo`), leaving `currency.amount` as `'ALL'`.

3. **`SwapBuilderCore.amount()` coerces `bigint` amounts to `string`, causing `applyDecimalAbstraction` to multiply planck amounts by $10^{\text{decimals}}$ a second time:**
   In [`packages/sdk-core/src/utils/transfer/abstractDecimals.ts#L24-L27`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/sdk-core/src/utils/transfer/abstractDecimals.ts#L24-L27), `applyDecimalAbstraction` treats `typeof amount === 'bigint'` as already in base/planck units (`return amount`), while `string` and `number` inputs are scaled by $10^{\text{decimals}}$ via `parseUnits(amount.toString(), decimals)`.
   However, [`packages/swap/src/builder/SwapBuilder.ts#L96-L100`](https://github.com/paraspell/xcm-tools/blob/b7e9a6b05fe89686412c85be70f41792acbdd223/packages/swap/src/builder/SwapBuilder.ts#L96-L100) converts every `TAmount` to a `string`:
   ```ts
   amount(
     amount: TAmount,
   ): SwapBuilderCore<TApi, TRes, TSigner, T & { amount: TAmount }, TCustomChain> {
     return new SwapBuilderCore(this._api, { ...this._options, amount: amount.toString() });
   }
   ```
   Consequently:
   - After `normalizeAmountAll` resolves `transferable: bigint` (in planck units, e.g. `10_000_000_000n` for 1 DOT) and stores `currency: { ...currency, amount: transferable }`, `executeWithSwap` calls `SwapBuilder.amount(10_000_000_000n)`, which turns it into `"10000000000"`.
   - Likewise, any caller passing a `bigint` planck amount directly to `Builder(...).currency({ symbol: 'DOT', amount: 10_000_000_000n }).swap(...)` or `SwapBuilder(api).amount(10_000_000_000n)` has its `bigint` coerced to `"10000000000"`.
   - When `prepareTransformedOptions`, `selectBestExchangeCommon`, or `getBestAmountOut` calls `applyDecimalAbstraction(amount, decimals, true)`, `typeof amount === 'bigint'` is `false`, so `parseUnits("10000000000", 10)` scales it a second time to `100_000_000_000_000_000_000n` ($10^{10}$ DOT instead of 1 DOT).

## 🧪 To Reproduce

1. Check out `main` (`b7e9a6b05fe89686412c85be70f41792acbdd223`).
2. Call `Builder(api)` with `currency({ symbol: 'ACA', amount: AMOUNT_ALL })` and `.swap({ currencyTo: { symbol: 'DOT' }, exchange: 'Hydration' })`:
   - `normalizeAmountAll` invokes `executeWithSwap` with `currency.amount === 'ALL'`, causing `applyDecimalAbstraction('ALL', decimals, true)` to throw `InvalidDecimalNumberError: Number "ALL" is not a valid decimal number.`
   - Calling `.dryRun()`, `.dryRunPreview()`, `.signAndSubmit()`, or `.signAndSubmitAll()` with `swapOptions` skips `prepareNormalizedOptions` altogether and passes `'ALL'` directly to `executeWithSwap`.
3. Call `SwapBuilder(api)...amount(10_000_000_000n).build()`:
   - `SwapBuilderCore.amount()` stores `amount: "10000000000"` (`string`) instead of `10_000_000_000n` (`bigint`), which `applyDecimalAbstraction("10000000000", 10, true)` scales by $10^{10}$ a second time to `100_000_000_000_000_000_000n`.

## 🖥️ Environment

- OS: Linux (x86_64)
- XCM Tool version: `@paraspell/sdk-core` & `@paraspell/swap` (`main` @ `b7e9a6b05fe89686412c85be70f41792acbdd223`)
- NodeJS version: v26.12.1

## 📸 Screenshots / Logs

```text
FAIL src/builder/normalizeAmountAll.test.ts > normalizeAmountAll > uses executeWithSwap when swapOptions is provided and amount is AMOUNT_ALL
Expected currency.amount: "2" (MIN_AMOUNT)
Received currency.amount: "ALL" (AMOUNT_ALL)

FAIL src/builder/SwapBuilder.test.ts > Builder > should preserve bigint amount without converting to string
- "amount": 10000000000n,
+ "amount": "10000000000",
```

## 💡 Expected Behavior

1. `normalizeAmountAll` should pass `currency: { ...currency, amount: MIN_AMOUNT }` when calling `executeWithSwap(..., builder => builder.getTransferableAmount())`, matching the non-swap branch.
2. `Builder.dryRun()`, `dryRunPreview()`, `signAndSubmit()`, and `signAndSubmitAll()` should normalize options via `await this.prepareNormalizedOptions(this._options)` before delegating to `executeWithSwap`.
3. `SwapBuilderCore.amount(amount: TAmount)` should store `amount` as-is (`{ ...this._options, amount }`) without `.toString()` so `bigint` planck amounts (both from `normalizeAmountAll` and direct `bigint` inputs) preserve their `bigint` type for `applyDecimalAbstraction`.

## 📍 Additional Context

- Tested locally with `vitest` across `@paraspell/sdk-core` and `@paraspell/swap`. I have a clean fix and unit tests ready and would like to reserve this issue once triaged.
- AI disclosure: AI tools (Gemini / Antigravity) were used to assist with code tracing and drafting this report; all findings and tests were verified locally by me.

---

## ✅ Contributor Eligibility

- [x] My GitHub account's commit history is at least 6 months old.
- [x] I have set an on-chain identity on the Polkadot People Chain for my AssetHub address (below) and requested a registrar judgement of at least `Reasonable` (verifiable via [Subscan](https://people-polkadot.subscan.io/)).
- [x] I disclose any AI tools used to help write this report (or confirm none were used), and I understand and can explain its contents myself.
- [x] This report was authored and submitted by a human — not opened autonomously by an AI agent.
- [x] I will respond to maintainer questions with specific, on-topic answers within 5 days.
- [x] If I go on to fix this issue myself, I understand every commit must be signed (`-S`) and include `Signed-off-by` and `AI-Assisted-By` trailers.
- [x] This is the only bug bounty issue I currently have reserved.

---

## 💸 Polkadot Asset Hub Address (Optional – for reward eligibility)

Polkadot Asset Hub Address: `14TQ46yQa7zUUsVGjDQt9LmbNDdj8mxDh31oU2CzJZjXyXSt`

---

## Process

### 1. Orient yourself first
Before touching any code:
- Read the README and any relevant docs
- Run: find . -type f | grep -v node_modules | grep -v .git | grep -v dist | head -60
- Grep for the key terms from the issue title to find the relevant files
- Read the files around the bug — understand what's currently happening

### 2. Find and read the tests
- Look for test files near the relevant code (*.test.ts, *.spec.js, __tests__, etc.)
- Read them — they tell you what behavior is expected
- Understand what a passing fix looks like before writing a line

### 3. Implement the fix
- Make the MINIMAL change that fixes the issue — nothing more
- Do not refactor, rename, reorganize, or clean up unrelated code
- Do not add dependencies unless the issue explicitly requires it
- Do not modify config files (package.json, tsconfig.json, etc.) unless that IS the fix
- One logical change, one commit

### 4. Verify
- Run the test suite: check package.json scripts for "test", "lint", "typecheck"
  Common commands: npm test, yarn test, pnpm test, pytest, go test ./..., cargo test
- If TypeScript is present: npx tsc --noEmit
- Fix any test failures your change caused — if a test was wrong before, update it

### 5. Commit and document
- git add -A
- git commit -m "fix: [Bug bounty] Swap with AMOUNT_ALL ('ALL') crashes in normalizeAmountAll "
- Write AGENT_SUMMARY.md with:
  - Root cause: what was wrong and why
  - Fix: what you changed and the reasoning
  - Verification: how to confirm it works
  - Concerns: anything a reviewer should know

---

## Stop conditions

If ANY of these are true, write "UNCERTAIN: [reason]" at the top of AGENT_SUMMARY.md, make NO code changes, and stop:
- The fix requires changing more than ~5 files
- You cannot determine what the correct behavior should be
- The issue requires a database migration, API key, or external service
- You find 3+ open PRs already attempting this fix (high competition)
- The repo is not in a language/framework you can reason about confidently

A clean UNCERTAIN is better than a bad PR.
