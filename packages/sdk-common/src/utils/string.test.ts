import { describe, expect, it } from 'vitest'

import { snakeToCamel } from './string'

describe('snakeToCamel', () => {
  it('converts snake_case to camelCase', () => {
    expect(snakeToCamel('foo_bar_baz')).toBe('fooBarBaz')
  })

  it('converts kebab-case to camelCase', () => {
    expect(snakeToCamel('foo-bar')).toBe('fooBar')
  })
})
