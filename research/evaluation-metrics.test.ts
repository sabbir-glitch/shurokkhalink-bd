import { describe, expect, it } from 'vitest'
import { calculateExactAgreement, calculateKindMetrics } from './evaluation-metrics.mjs'

describe('ShurokkhaBench evaluation metrics', () => {
  const fixture = [
    {
      expectedKinds: ['secret'],
      observedKinds: ['secret', 'urgency'],
      exactMatch: false,
    },
    { expectedKinds: ['urgency'], observedKinds: [], exactMatch: false },
    { expectedKinds: [], observedKinds: [], exactMatch: true },
    { expectedKinds: [], observedKinds: ['secret'], exactMatch: false },
  ]

  it('calculates TP, FP, FN, TN, precision, recall, and F1 for a finding kind', () => {
    expect(calculateKindMetrics('secret', fixture)).toEqual({
      kind: 'secret',
      cases: 4,
      expectedPositive: 1,
      tp: 1,
      fp: 1,
      fn: 0,
      tn: 2,
      precision: 0.5,
      recall: 1,
      f1: 0.6667,
    })
  })

  it('reports zero metrics for a present class that is always missed', () => {
    expect(calculateKindMetrics('urgency', fixture)).toEqual({
      kind: 'urgency',
      cases: 4,
      expectedPositive: 1,
      tp: 0,
      fp: 1,
      fn: 1,
      tn: 2,
      precision: 0,
      recall: 0,
      f1: 0,
    })
  })

  it('uses null when precision, recall, and F1 have no positive denominator', () => {
    expect(
      calculateKindMetrics('prize', [{ expectedKinds: [], observedKinds: [] }]),
    ).toEqual({
      kind: 'prize',
      cases: 1,
      expectedPositive: 0,
      tp: 0,
      fp: 0,
      fn: 0,
      tn: 1,
      precision: null,
      recall: null,
      f1: null,
    })
  })

  it('calculates exact finding-set agreement', () => {
    expect(calculateExactAgreement(fixture)).toEqual({
      cases: 4,
      exactFindingSetMatches: 1,
      exactFindingSetMatchRate: 0.25,
    })
  })
})
