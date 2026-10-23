export type FindingKind =
  'secret' | 'urgency' | 'prize' | 'link' | 'http' | 'credentials' | 'ip' | 'punycode'

export interface Finding {
  id: string
  kind: FindingKind
  evidence: string
}

const secretRequestPattern =
  /(?:\b(?:send|share|tell|provide|give|reply with|enter|submit|confirm|verify)\b.{0,55}\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b|\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b.{0,55}\b(?:send|share|tell|provide|give|reply|enter|submit|confirm|verify)\b|\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b.{0,45}(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই)|(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই).{0,45}\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b|(?:ওটিপি|ও টি পি|পিন|পাসওয়ার্ড|পাসওয়ার্ড|যাচাইকরণ কোড|ভেরিফিকেশন কোড|গোপন কোড).{0,45}(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই)|(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই).{0,45}(?:ওটিপি|ও টি পি|পিন|পাসওয়ার্ড|পাসওয়ার্ড|যাচাইকরণ কোড|ভেরিফিকেশন কোড|গোপন কোড))/iu

const urgencyPattern =
  /\b(?:act now|immediately|urgent(?:ly)?|right away|within \d+ (?:minutes?|hours?)|account.{0,20}(?:blocked|suspended|closed)|will be (?:blocked|suspended|closed))\b|অবিলম্বে|জরুরি|দ্রুত করুন|এখন না করলে|এখনই.{0,15}(?:করুন|পাঠান|দিন|ক্লিক|যোগাযোগ|জমা|দাবি|না করলে)|আজই.{0,15}(?:করুন|পাঠান|দিন|ক্লিক|জমা|দাবি|না করলে|শেষ)|বন্ধ হয়ে যাবে|বন্ধ হয়ে যাবে|ব্লক হবে|অ্যাকাউন্ট বন্ধ/iu

const prizePattern =
  /\b(?:you (?:have )?won|you(?:'re| are) (?:a )?winner|selected as (?:a )?winner|claim (?:your )?(?:money|reward|prize)|free (?:gift|money)|cash prize|unclaimed funds|win (?:a |the )?(?:prize|lottery|cash|money)|(?:prize|reward|lottery).{0,35}(?:claim|winner|won|selected))\b|অভিনন্দন.{0,35}(?:জিতেছেন|পুরস্কার|লটারি)|(?:জিতেছেন|জিতেছ|বিজয়ী|বিজয়ী).{0,25}(?:টাকা|পুরস্কার|লটারি|উপহার)|(?:টাকা|পুরস্কার|লটারি|উপহার).{0,30}(?:জিতেছেন|জিতেছ|দাবি|পেতে|পেয়েছেন|পেয়েছেন)|(?:পুরস্কার|লটারি).{0,20}(?:দাবি|জিত|পেতে|ক্লিক)/iu

const urlPattern = /(?:https?:\/\/|www\.)[^\s<>"']+/giu
const trailingUrlPunctuation = /[.,!?;:)\]}]+$/u

function findEvidence(text: string, pattern: RegExp): string | undefined {
  return text.match(pattern)?.[0]
}

function findSecretRequest(text: string): string | undefined {
  const pattern = new RegExp(
    secretRequestPattern.source,
    `${secretRequestPattern.flags}g`,
  )

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    const end = start + match[0].length
    const precedingText = text.slice(Math.max(0, start - 50), start)
    const followingText = text.slice(end, end + 12)
    const negatedBefore =
      /(?:\b(?:do not|don't|never)\b|কখনোই?)[^.!?।\n]{0,35}$/iu.test(precedingText)
    const negatedAfter =
      /^\s*(?:not\b|না(?=[\s।.!?,;:]|$)|(?:করবেন|দেবেন|পাঠাবেন|জানাবেন|লিখবেন)\s+না(?=[\s।.!?,;:]|$))/iu.test(
        followingText,
      )

    if (!negatedBefore && !negatedAfter) return match[0]
  }

  return undefined
}

function isIpv4(hostname: string): boolean {
  const parts = hostname.split('.')
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/u.test(part) && Number(part) <= 255)
  )
}

function isIpAddress(hostname: string): boolean {
  return isIpv4(hostname) || (hostname.startsWith('[') && hostname.endsWith(']'))
}

function inspectLinks(text: string): Finding[] {
  const urls = [...text.matchAll(urlPattern)]
  const findings: Finding[] = []

  urls.forEach((match, index) => {
    const url = match[0].replace(trailingUrlPunctuation, '')
    if (!url) return

    const id = `link-${index + 1}`
    findings.push({ id, kind: 'link', evidence: url })

    try {
      const parsed = new URL(
        url.toLowerCase().startsWith('www.') ? `https://${url}` : url,
      )
      if (parsed.protocol === 'http:') {
        findings.push({ id: `${id}-http`, kind: 'http', evidence: url })
      }
      if (parsed.username || parsed.password) {
        findings.push({
          id: `${id}-credentials`,
          kind: 'credentials',
          evidence: url,
        })
      }
      if (isIpAddress(parsed.hostname)) {
        findings.push({ id: `${id}-ip`, kind: 'ip', evidence: url })
      }
      if (parsed.hostname.split('.').some((part) => part.startsWith('xn--'))) {
        findings.push({
          id: `${id}-punycode`,
          kind: 'punycode',
          evidence: url,
        })
      }
    } catch {
      // A malformed URL is still shown as a link; no structural claim is made.
    }
  })

  return findings
}

/**
 * Checks text locally for a small set of explainable warning signs.
 * Findings are indicators only and do not determine whether a message is fraudulent.
 */
export function analyzeMessage(message: string): Finding[] {
  if (typeof message !== 'string' || !message.trim()) return []

  const findings: Finding[] = []
  const secretEvidence = findSecretRequest(message)
  const urgencyEvidence = findEvidence(message, urgencyPattern)
  const prizeEvidence = findEvidence(message, prizePattern)

  if (secretEvidence) {
    findings.push({ id: 'secret-request', kind: 'secret', evidence: secretEvidence })
  }
  if (urgencyEvidence) {
    findings.push({ id: 'urgent-pressure', kind: 'urgency', evidence: urgencyEvidence })
  }
  if (prizeEvidence) {
    findings.push({ id: 'prize-claim', kind: 'prize', evidence: prizeEvidence })
  }

  findings.push(...inspectLinks(message))
  return findings
}
