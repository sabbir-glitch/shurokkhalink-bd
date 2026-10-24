import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { analyzeMessage, type FindingKind } from '../src/lib/analyzeMessage'

interface BenchmarkCase {
  id: string
  language: 'en' | 'bn' | 'mixed'
  category: string
  message: string
  expectedKinds: FindingKind[]
  rationale: string
}

interface BenchmarkDataset {
  benchmark: string
  version: string
  purpose: string
  cases: BenchmarkCase[]
}

const root = process.cwd()
const datasetPath = resolve(root, 'research', 'shurokkhabench-v0.1.json')
const resultsPath = resolve(
  root,
  'research',
  'results',
  'shurokkhabench-v0.1-results.json',
)
const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as BenchmarkDataset
const historicalSnapshot = JSON.parse(readFileSync(resultsPath, 'utf8')) as ReturnType<
  typeof summarize
>
const supportedKinds: FindingKind[] = [
  'secret',
  'urgency',
  'prize',
  'link',
  'http',
  'credentials',
  'ip',
  'punycode',
]

function observedKinds(message: string): FindingKind[] {
  return [...new Set(analyzeMessage(message).map((finding) => finding.kind))].sort()
}

function roundMetric(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10000) / 10000
}

function metricsForKind(kind: FindingKind, cases: BenchmarkCase[]) {
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0

  for (const caseItem of cases) {
    const expected = caseItem.expectedKinds.includes(kind)
    const observed = observedKinds(caseItem.message).includes(kind)

    if (expected && observed) tp += 1
    else if (!expected && observed) fp += 1
    else if (expected && !observed) fn += 1
    else tn += 1
  }

  const precision = tp + fp === 0 ? null : tp / (tp + fp)
  const recall = tp + fn === 0 ? null : tp / (tp + fn)
  const f1 =
    precision === null || recall === null || precision + recall === 0
      ? null
      : (2 * precision * recall) / (precision + recall)
  const falsePositiveRate = fp + tn === 0 ? null : fp / (fp + tn)

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
    falsePositiveRate: roundMetric(falsePositiveRate),
  }
}

function summarize(cases: BenchmarkCase[]) {
  const caseResults = cases.map((caseItem) => {
    const actualKinds = observedKinds(caseItem.message)
    const expectedKinds = [...caseItem.expectedKinds].sort()
    const exactMatch = JSON.stringify(actualKinds) === JSON.stringify(expectedKinds)

    return {
      id: caseItem.id,
      language: caseItem.language,
      category: caseItem.category,
      expectedKinds,
      observedKinds: actualKinds,
      exactMatch,
    }
  })

  const exactMatches = caseResults.filter((caseItem) => caseItem.exactMatch).length
  const languages: Array<BenchmarkCase['language']> = ['en', 'bn', 'mixed']
  const perLanguage = languages.map((language) => {
    const group = caseResults.filter((caseItem) => caseItem.language === language)
    const groupMatches = group.filter((caseItem) => caseItem.exactMatch).length
    return {
      language,
      cases: group.length,
      exactFindingSetMatches: groupMatches,
      exactFindingSetMatchRate:
        group.length === 0 ? null : roundMetric(groupMatches / group.length),
    }
  })

  return {
    benchmark: dataset.benchmark,
    version: dataset.version,
    generatedAt: new Date().toISOString(),
    interpretation:
      'Synthetic intended-behaviour results only. These are not real-world phishing or fraud detection accuracy estimates.',
    caseCount: cases.length,
    exactFindingSetMatches: exactMatches,
    exactFindingSetMatchRate:
      cases.length === 0 ? null : roundMetric(exactMatches / cases.length),
    perLanguage,
    perKind: supportedKinds.map((kind) => metricsForKind(kind, cases)),
    cases: caseResults,
  }
}

describe('ShurokkhaBench v0.1 synthetic development corpus', () => {
  it('has unique case IDs and uses only supported expected finding kinds', () => {
    const ids = dataset.cases.map((caseItem) => caseItem.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(dataset.cases.length).toBeGreaterThanOrEqual(30)

    for (const caseItem of dataset.cases) {
      expect(
        caseItem.expectedKinds.every((kind) => supportedKinds.includes(kind)),
      ).toBe(true)
    }
  })

  it.each(dataset.cases)('$id emits its expected finding kinds', (caseItem) => {
    expect(observedKinds(caseItem.message)).toEqual([...caseItem.expectedKinds].sort())
  })

  it('matches the historical snapshot without rewriting it', () => {
    const report = summarize(dataset.cases)
    report.generatedAt = historicalSnapshot.generatedAt
    expect(report).toEqual(historicalSnapshot)
    expect(report.caseCount).toBe(dataset.cases.length)
    expect(report.perKind).toHaveLength(supportedKinds.length)
    expect(report.perLanguage.every((group) => group.cases > 0)).toBe(true)
  })
})
