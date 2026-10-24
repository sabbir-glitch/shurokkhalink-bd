function roundMetric(value) {
  return value === null ? null : Math.round(value * 10000) / 10000
}

export function calculateKindMetrics(kind, cases) {
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0

  for (const caseResult of cases) {
    const expected = caseResult.expectedKinds.includes(kind)
    const observed = caseResult.observedKinds.includes(kind)

    if (expected && observed) tp += 1
    else if (!expected && observed) fp += 1
    else if (expected && !observed) fn += 1
    else tn += 1
  }

  const precision = tp + fp === 0 ? null : tp / (tp + fp)
  const recall = tp + fn === 0 ? null : tp / (tp + fn)
  const f1Denominator = 2 * tp + fp + fn
  const f1 = f1Denominator === 0 ? null : (2 * tp) / f1Denominator

  return {
    kind,
    cases: cases.length,
    expectedPositive: tp + fn,
    tp,
    fp,
    fn,
    tn,
    precision: roundMetric(precision),
    recall: roundMetric(recall),
    f1: roundMetric(f1),
  }
}

export function calculateExactAgreement(caseResults) {
  const exactMatches = caseResults.filter((item) => item.exactMatch).length
  return {
    cases: caseResults.length,
    exactFindingSetMatches: exactMatches,
    exactFindingSetMatchRate:
      caseResults.length === 0 ? null : roundMetric(exactMatches / caseResults.length),
  }
}
