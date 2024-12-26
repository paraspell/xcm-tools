export const isPrimitive = (obj: unknown): boolean => {
  return obj !== Object(obj)
}

export const deepEqual = (obj1: unknown, obj2: unknown): boolean => {
  if (obj1 === obj2) return true

  if (isPrimitive(obj1) && isPrimitive(obj2)) return obj1 === obj2

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false
  }

  const obj1Keys = Object.keys(obj1).map(key => key.toLowerCase())
  const obj2Keys = Object.keys(obj2).map(key => key.toLowerCase())

  if (obj1Keys.length !== obj2Keys.length) return false

  for (const key of obj1Keys) {
    const keyInObj2 = obj2Keys.find(k => k === key)
    if (!keyInObj2) return false

    const obj1Value = (obj1 as Record<string, unknown>)[
      Object.keys(obj1).find(k => k.toLowerCase() === key)!
    ]
    const obj2Value = (obj2 as Record<string, unknown>)[
      Object.keys(obj2).find(k => k.toLowerCase() === key)!
    ]

    if (!deepEqual(obj1Value, obj2Value)) return false
  }

  return true
}
