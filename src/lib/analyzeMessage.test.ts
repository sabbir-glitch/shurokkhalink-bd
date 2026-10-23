import { describe, expect, it } from 'vitest'
import { analyzeMessage } from './analyzeMessage'

describe('analyzeMessage', () => {
  it('returns no findings for empty or ordinary harmless text', () => {
    expect(analyzeMessage('')).toEqual([])
    expect(analyzeMessage('   \n\t')).toEqual([])
    expect(
      analyzeMessage('Your appointment is confirmed for Tuesday at 10 am.'),
    ).toEqual([])
    expect(analyzeMessage('আজ বিকেলে দেখা হবে, ভালো থেকো।')).toEqual([])
  })

  it('detects English requests to share an OTP or password', () => {
    expect(
      analyzeMessage('Please share your OTP to keep your account active.'),
    ).toContainEqual(
      expect.objectContaining({
        kind: 'secret',
        evidence: 'share your OTP',
      }),
    )
    expect(
      analyzeMessage('Enter your password to verify your account.'),
    ).toContainEqual(expect.objectContaining({ kind: 'secret' }))
    expect(
      analyzeMessage('Reply with your verification code to continue.'),
    ).toContainEqual(expect.objectContaining({ kind: 'secret' }))
    expect(analyzeMessage('Send your PIN to the support agent.')).toContainEqual(
      expect.objectContaining({ kind: 'secret' }),
    )
  })

  it('detects Bangla and mixed-language requests for verification secrets', () => {
    expect(analyzeMessage('আপনার OTP এখনই পাঠান।')).toContainEqual(
      expect.objectContaining({ kind: 'secret', evidence: 'OTP এখনই পাঠান' }),
    )
    expect(analyzeMessage('আপনার পিন দিন।')).toContainEqual(
      expect.objectContaining({ kind: 'secret' }),
    )
    expect(analyzeMessage('ভেরিফিকেশন কোড শেয়ার করুন।')).toContainEqual(
      expect.objectContaining({ kind: 'secret' }),
    )
    expect(analyzeMessage('আপনার পাসওয়ার্ড দিন।')).toContainEqual(
      expect.objectContaining({ kind: 'secret' }),
    )
    expect(analyzeMessage('Share করুন আপনার OTP।')).toContainEqual(
      expect.objectContaining({ kind: 'secret' }),
    )
  })

  it('does not mistake explicit advice against sharing secrets for a request', () => {
    expect(analyzeMessage('Never share your OTP with anyone.')).toEqual([])
    expect(analyzeMessage('Do not send your password to anyone.')).toEqual([])
    expect(analyzeMessage('আপনার OTP শেয়ার করবেন না।')).toEqual([])
  })

  it('detects urgency and prize or money claims independently', () => {
    const urgent = analyzeMessage('Act now or your account will be blocked.')
    expect(urgent).toContainEqual(expect.objectContaining({ kind: 'urgency' }))
    expect(urgent).toContainEqual(
      expect.objectContaining({ kind: 'urgency', evidence: 'Act now' }),
    )
    expect(
      analyzeMessage('আপনার অ্যাকাউন্ট এখনই বন্ধ হয়ে যাবে, দ্রুত OTP দিন।').map(
        (finding) => finding.kind,
      ),
    ).toEqual(['secret', 'urgency'])
    expect(analyzeMessage('আজই দেখা হবে, ভালো থেকো।')).toEqual([])

    expect(analyzeMessage('অভিনন্দন, আপনি ৫০,০০০ টাকা জিতেছেন!')).toContainEqual(
      expect.objectContaining({ kind: 'prize' }),
    )
    expect(analyzeMessage('You have won a cash prize.')).toContainEqual(
      expect.objectContaining({ kind: 'prize' }),
    )
    expect(analyzeMessage('Your reward points balance is 1200.')).not.toContainEqual(
      expect.objectContaining({ kind: 'prize' }),
    )
    expect(
      analyzeMessage('Lottery results were published in the newspaper.'),
    ).not.toContainEqual(expect.objectContaining({ kind: 'prize' }))
    expect(analyzeMessage('পুরস্কারের নিয়মাবলি ও শর্তাবলি পড়ুন।')).not.toContainEqual(
      expect.objectContaining({ kind: 'prize' }),
    )
  })

  it('returns all independent findings in one message', () => {
    expect(
      analyzeMessage(
        'Act now! Share your OTP to claim your prize at http://example.com',
      ).map((finding) => finding.kind),
    ).toEqual(['secret', 'urgency', 'prize', 'link', 'http'])
  })

  it('treats link presence as informational, not as proof of fraud', () => {
    const findings = analyzeMessage('Read more at https://example.com/news.')
    expect(findings).toEqual([
      expect.objectContaining({
        kind: 'link',
        evidence: 'https://example.com/news',
      }),
    ])
    expect(findings.some((finding) => finding.kind === 'secret')).toBe(false)
    expect(findings.some((finding) => finding.kind === 'urgency')).toBe(false)
    expect(findings.some((finding) => finding.kind === 'prize')).toBe(false)
  })

  it('identifies each supported URL structure characteristic locally', () => {
    expect(analyzeMessage('http://example.com').map((finding) => finding.kind)).toEqual(
      ['link', 'http'],
    )
    expect(
      analyzeMessage('https://user:pass@example.com').map((finding) => finding.kind),
    ).toEqual(['link', 'credentials'])
    expect(
      analyzeMessage('https://192.0.2.1/login').map((finding) => finding.kind),
    ).toEqual(['link', 'ip'])
    expect(
      analyzeMessage('https://[2001:db8::1]/login').map((finding) => finding.kind),
    ).toEqual(['link', 'ip'])
    expect(
      analyzeMessage('https://xn--e1afmkfd.example/').map((finding) => finding.kind),
    ).toEqual(['link', 'punycode'])
    expect(
      analyzeMessage('https://example.com').map((finding) => finding.kind),
    ).toEqual(['link'])
  })

  it('handles malformed links, unusual Unicode, and long input without throwing', () => {
    expect(() =>
      analyzeMessage(`Notice: http://[invalid ${'🛡️'.repeat(2000)} \u0000`),
    ).not.toThrow()
    expect(
      analyzeMessage('Notice: http://[invalid').map((finding) => finding.kind),
    ).toEqual(['link'])
  })
})
