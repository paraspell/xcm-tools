/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const processAssetsDepositedEvents = (events: any[], amount: bigint): bigint | undefined => {
  const assetsDepositedEvents = events.filter(
    event => event.type === 'Assets' && event.value.type === 'Deposited'
  )

  if (assetsDepositedEvents.length === 0) {
    return undefined
  }

  if (assetsDepositedEvents.length === 1) {
    return BigInt(assetsDepositedEvents[0].value.value.amount)
  }

  // Start with all events
  let currentEvents = [...assetsDepositedEvents]
  const threshold = (amount * BigInt(90)) / BigInt(100) // 90% of amount

  while (currentEvents.length > 0) {
    // 1. Make a sum of all amounts in events
    const sum = currentEvents.reduce(
      (total, event) => total + BigInt(event.value.value.amount),
      BigInt(0)
    )

    // 2. If that sum is bigger than 90% of amount, remove the biggest event
    if (sum > threshold) {
      // Sort events by amount (descending) and remove the biggest
      currentEvents.sort((a, b) =>
        Number(BigInt(b.value.value.amount) - BigInt(a.value.value.amount))
      )
      currentEvents = currentEvents.slice(1) // Remove the biggest event
    } else {
      // If not, return the summed value
      return sum
    }
  }

  // If we've removed all events, return undefined
  return undefined
}
