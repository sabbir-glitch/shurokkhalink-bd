import { describe, expect, it } from 'vitest'
import { analyzeMessage } from './analyzeMessage'

describe('v0.3 urgency false-positive regression cases', () => {
  it.each([
    'The meeting starts within 5 minutes.',
    'The bus arrives within 10 minutes.',
    "You don't need to act immediately.",
    'Please do not respond urgently.',
    'You should not click right away.',
    'Amra ekhoni cinema dekhbo, tarpor cha khabo.',
  ])('does not report urgency for benign message: %s', (message) => {
    expect(analyzeMessage(message).map((finding) => finding.kind)).not.toContain(
      'urgency',
    )
  })

  it.each([
    {
      message: 'Your account will be suspended within 5 minutes.',
      expectedEvidence: 'will be suspended',
    },
    {
      message: 'Act now or your account will be blocked.',
      expectedEvidence: 'Act now',
    },
    {
      message: 'Apnar OTP ta ekhoni send korun.',
      expectedEvidence: 'ekhoni send korun',
    },
  ])(
    'keeps a contextual warning indicator: $message',
    ({ message, expectedEvidence }) => {
      const findings = analyzeMessage(message)

      expect(findings.map((finding) => finding.id)).toContain('urgent-pressure')
      expect(
        findings.find((finding) => finding.id === 'urgent-pressure')?.evidence,
      ).toBe(expectedEvidence)
    },
  )

  it.each([
    'OTP share korben na.',
    'Ekhoni account verify korben na.',
  ])('does not flag negated Banglish instructions: %s', (message) => {
    expect(analyzeMessage(message)).toEqual([])
  })

  it('keeps time limits when the same message includes a consequential warning', () => {
    const findings = analyzeMessage(
      'Complete this within 10 minutes to prevent suspension.',
    )

    expect(findings.map((finding) => finding.id)).toContain('urgent-pressure')
    expect(
      findings.find((finding) => finding.id === 'urgent-pressure')?.evidence,
    ).toBe('within 10 minutes')
  })

  it('keeps time limits when the consequence appears before the deadline', () => {
    const findings = analyzeMessage(
      "Your account will be blocked if you don't act within 10 minutes.",
    )

    expect(findings.map((finding) => finding.id)).toContain('urgent-pressure')
    expect(
      findings.find((finding) => finding.id === 'urgent-pressure')?.evidence,
    ).toBe('will be blocked')
  })

  it('keeps positive Banglish urgency and secret-request detection', () => {
    const urgencyFindings = analyzeMessage('Ekhoni account verify korun.')
    expect(urgencyFindings.map((finding) => finding.id)).toContain(
      'urgent-pressure',
    )

    const secretFindings = analyzeMessage('Apnar OTP ta send korun.')
    expect(secretFindings.map((finding) => finding.id)).toContain(
      'secret-request',
    )
  })
})
