import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { FindingKind } from '../src/lib/analyzeMessage'

interface ChallengeCase {
  id: string
  language: 'en' | 'bn' | 'mixed'
  category: string
  message: string
  expectedFindings: Array<{ kind: FindingKind; rationale: string }>
  rationale: string
  labelStatus: 'DRAFT'
  reviewStatus: 'requires-human-review'
  contrastGroupId?: string
}

interface ChallengeDataset {
  benchmark: string
  version: string
  status: string
  reviewStatus: string
  supportedKinds: FindingKind[]
  cases: ChallengeCase[]
}

const root = process.cwd()
const dataset = JSON.parse(
  readFileSync(resolve(root, 'research', 'shurokkhabench-v0.2-challenge.json'), 'utf8'),
) as ChallengeDataset
const historicalDataset = JSON.parse(
  readFileSync(resolve(root, 'research', 'shurokkhabench-v0.1.json'), 'utf8'),
) as { cases: Array<{ message: string }> }
const priorAnalyzerTests = [
  'src/lib/analyzeMessage.test.ts',
  'src/lib/analyzeMessage.v02.test.ts',
  'src/lib/urgencyFalsePositiveReduction.test.ts',
].map((file) => readFileSync(resolve(root, file), 'utf8'))

describe('ShurokkhaBench v0.2 draft challenge corpus', () => {
  it('contains 90 unique synthetic cases split evenly by language', () => {
    expect(dataset.cases).toHaveLength(90)
    expect(new Set(dataset.cases.map((caseItem) => caseItem.id)).size).toBe(90)
    expect(
      Object.fromEntries(
        ['en', 'bn', 'mixed'].map((language) => [
          language,
          dataset.cases.filter((caseItem) => caseItem.language === language).length,
        ]),
      ),
    ).toEqual({ en: 30, bn: 30, mixed: 30 })
  })

  it('marks every case as draft and requiring human review', () => {
    expect(dataset.status).toContain('DRAFT')
    expect(dataset.reviewStatus).toBe('not independently reviewed')
    expect(
      dataset.cases.every(
        (caseItem) =>
          caseItem.labelStatus === 'DRAFT' &&
          caseItem.reviewStatus === 'requires-human-review',
      ),
    ).toBe(true)
  })

  it('has rationales for every expected finding and each case', () => {
    for (const caseItem of dataset.cases) {
      expect(caseItem.rationale.trim(), caseItem.id).not.toBe('')
      for (const expected of caseItem.expectedFindings) {
        expect(dataset.supportedKinds, caseItem.id).toContain(expected.kind)
        expect(expected.rationale.trim(), caseItem.id).not.toBe('')
      }
    }
  })

  it('uses distinct messages from the v0.1 corpus', () => {
    const historicalMessages = new Set(
      historicalDataset.cases.map((caseItem) => caseItem.message),
    )
    expect(
      dataset.cases.filter((caseItem) => historicalMessages.has(caseItem.message)),
    ).toEqual([])
  })

  it('does not reuse exact messages from existing analyser regression tests', () => {
    expect(
      dataset.cases.filter((caseItem) =>
        priorAnalyzerTests.some((source) => source.includes(caseItem.message)),
      ),
    ).toEqual([])
  })

  it('uses only reserved domains and documentation IP addresses in URLs', () => {
    const addressPattern = /(?:https?:\/\/|www\.)[^\s<>"']+/giu
    const trailingPunctuation = /[.,!?;:)\]}]+$/u

    for (const caseItem of dataset.cases) {
      for (const match of caseItem.message.matchAll(addressPattern)) {
        const address = match[0].replace(trailingPunctuation, '')
        const parsed = new URL(
          address.toLowerCase().startsWith('www.') ? `https://${address}` : address,
        )
        const host = parsed.hostname.toLowerCase()
        const reservedDomain = ['.test', '.example', '.invalid'].some((suffix) =>
          host.endsWith(suffix),
        )
        const documentationIpv4 =
          /^(?:192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/u.test(host)
        const documentationIpv6 = host.startsWith('[2001:db8:')

        expect(
          reservedDomain || documentationIpv4 || documentationIpv6,
          `${caseItem.id} contains non-reserved URL host ${host}`,
        ).toBe(true)
      }
    }
  })

  it('provides contrast groups with at least two related cases', () => {
    const groups = new Map<string, number>()
    for (const caseItem of dataset.cases) {
      if (caseItem.contrastGroupId) {
        groups.set(
          caseItem.contrastGroupId,
          (groups.get(caseItem.contrastGroupId) ?? 0) + 1,
        )
      }
    }
    expect([...groups.values()].every((count) => count >= 2)).toBe(true)
  })
})
