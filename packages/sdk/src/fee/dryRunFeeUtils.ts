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

  const sortedEvents = [...assetsDepositedEvents].sort((a, b) =>
    Number(BigInt(b.value.value.amount) - BigInt(a.value.value.amount))
  )

  // Remove the biggest value (first in sorted array)
  let filteredEvents = sortedEvents.slice(1)

  let sum = filteredEvents.reduce(
    (total, event) => total + BigInt(event.value.value.amount),
    BigInt(0)
  )

  // If sum is still bigger than amount, remove one more event (the next biggest)
  while (sum > amount && filteredEvents.length > 0) {
    filteredEvents = filteredEvents.slice(1)
    sum = filteredEvents.reduce(
      (total, event) => total + BigInt(event.value.value.amount),
      BigInt(0)
    )
  }

  return sum > 0 ? sum : undefined
}
