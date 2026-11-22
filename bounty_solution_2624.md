2. Code Patch / Fix

**File:** `packages/swap/src/transfer/getRouterFees.ts`

```typescript
// ... existing imports and context ...

export const getRouterFees = async (
  // ... existing params ...
) => {
  // ... existing logic to fetch sendingChain, receivingChain, swapChain ...

  // FIX: Always include the exchange hop if a swap chain exists.
  // Previously, this was conditional on both sendingChain && receivingChain.
  const mergedHops = [
    ...(sendingChain ? [sendingChain] : []),
    // The exchange hop is always present if swapChain exists.
    // It absorbs the receiving leg's origin fee if a receiving leg exists.
    ...(swapChain
      ? [
          {
            chain: exchange.chain,
            result: {
              ...swapChain,
              fee: swapChain.fee + (receivingChain?.origin.fee ?? 0n),
              isExchange: true,
            },
          },
        ]
      : []),
    ...(receivingChain ? [receivingChain] : []),
  ];

  // ... rest of the function remains unchanged ...
};
```

**File:** `packages/swap/src/transfer/getSwapInfo.ts`

```typescript
// ... existing imports and context ...

export const getSwapInfo = async (
  // ... existing params ...
) => {
  // ... existing logic to fetch sendingInfo, receivingInfo, swapInfo ...

  // FIX: Ensure the exchange hop is included even if receivingInfo is missing.
  const hops = [
    ...(sendingInfo ? [sendingInfo] : []),
    ...(swapInfo
      ? [
          {
            chain: exchange.chain,
            result: {
              ...swapInfo,
              fee: swapInfo.fee + (receivingInfo?.origin.fee ?? 0n),
              isExchange: