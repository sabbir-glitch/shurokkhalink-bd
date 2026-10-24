export type FindingKind =
  | 'secret'
  | 'urgency'
  | 'prize'
  | 'link'
  | 'http'
  | 'credentials'
  | 'ip'
  | 'punycode'

export interface Finding {
  id: string
  kind: FindingKind
  evidence: string
}

const secretRequestPattern =
  /(?:\b(?:send|share|tell|provide|give|reply with|enter|submit|confirm|verify)\b.{0,55}\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b|\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b.{0,55}\b(?:send|share|tell|provide|give|reply|enter|submit|confirm|verify)\b|\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b.{0,45}(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই)|(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই).{0,45}\b(?:otp|pin|password|passcode|verification code|security code|one[- ]time code)\b|(?:ওটিপি|ও টি পি|পিন|পাসওয়ার্ড|পাসওয়ার্ড|যাচাইকরণ কোড|ভেরিফিকেশন কোড|গোপন কোড).{0,45}(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই)|(?:পাঠান|দিন|শেয়ার|শেয়ার|বলুন|জানান|দিতে|লিখুন|দরকার|চাই).{0,45}(?:ওটিপি|ও টি পি|পিন|পাসওয়ার্ড|পাসওয়ার্ড|যাচাইকরণ কোড|ভেরিফিকেশন কোড|গোপন কোড))/iu

// Targeted Latin-script Banglish patterns; these complement, rather than replace,
// the English and native-Bangla patterns above.
const banglishSecretRequestPattern =
  /(?:\b(?:otp|o\s*t\s*p|pin|password|passcode|verification code|security code|one[- ]time code)\b.{0,55}\b(?:send|share|tell|provide|give|reply|enter|submit|confirm|verify|pathan|pathaben|den|diben|din|korun|koren|koro|korben)\b|\b(?:send|share|tell|provide|give|reply|enter|submit|confirm|verify|pathan|pathaben|den|diben|din|korun|koren|koro|korben)\b.{0,55}\b(?:otp|o\s*t\s*p|pin|password|passcode|verification code|security code|one[- ]time code)\b)/iu

const urgencyPattern =
  /\b(?:act now|within \d+ (?:minutes?|hours?)|(?:will be|may be|is about to be)\s+(?:blocked|suspended|closed))\b|\b(?:act|respond|reply|complete|verify|send|share|submit|pay|click|confirm|provide|update)\b[^.!?।\n]{0,20}\b(?:immediately|urgently|right away)\b|\b(?:immediately|right away)\s+(?:act|respond|reply|complete|verify|send|share|submit|pay|click|confirm|provide|update)\b|\burgent(?:ly)?(?=\s*(?:[:!—-]|\b(?:action|response|verification|payment|deadline|required)\b))|(?:অবিলম্বে|জরুরি)\s*(?::|!|।)|(?:অবিলম্বে|জরুরি)[^.!?।\n]{0,15}(?:করুন|পাঠান|দিন|ক্লিক|যোগাযোগ|জমা|দাবি|শেষ|যাচাই)|দ্রুত করুন|এখন না করলে|এখনই.{0,15}(?:করুন|পাঠান|দিন|ক্লিক|যোগাযোগ|জমা|দাবি|না করলে)|আজই.{0,15}(?:করুন|পাঠান|দিন|ক্লিক|জমা|দাবি|না করলে|শেষ)|(?:অ্যাকাউন্ট|সেবা|সিম|কার্ড).{0,15}(?:বন্ধ হয়ে যাবে|বন্ধ হয়ে যাবে|ব্লক হবে)|(?:বন্ধ হয়ে যাবে|বন্ধ হয়ে যাবে|ব্লক হবে).{0,15}(?:অ্যাকাউন্ট|সেবা|সিম|কার্ড)/iu

const banglishUrgencyPattern =
  /\b(?:ekhoni|ekhuni|ekhonoi|taratari|joldi)\b.{0,35}\b(?:act|respond|reply|complete|verify|send|share|submit|pay|click|confirm|provide|update|call|pathan|pathaben|den|diben|din|korun|koren|koro|korben)\b|\b(?:act|respond|reply|complete|verify|send|share|submit|pay|click|confirm|provide|update|call|pathan|pathaben|den|diben|din|korun|koren|koro|korben)\b.{0,35}\b(?:ekhoni|ekhuni|ekhonoi|taratari|joldi)\b|\b(?:account|sim|card|service)\b.{0,30}\b(?:bondho|block|suspend|off)\b.{0,25}\b(?:hoye jabe|hobe)\b/iu

const prizePattern =
  /\b(?:you (?:have )?won|you(?:'re| are) (?:a )?winner|selected as (?:a )?winner|claim (?:your )?(?:money|reward|prize)|free (?:gift|money)|cash prize|unclaimed funds|win (?:a |the )?(?:prize|lottery|cash|money)|(?:prize|reward|lottery).{0,35}(?:claim|winner|won|selected))\b|অভিনন্দন.{0,35}(?:জিতেছেন|পুরস্কার|লটারি)|(?:জিতেছেন|জিতেছ|বিজয়ী|বিজয়ী).{0,25}(?:টাকা|পুরস্কার|লটারি|উপহার)|(?:টাকা|পুরস্কার|লটারি|উপহার).{0,30}(?:জিতেছেন|জিতেছ|দাবি|পেতে|পেয়েছেন|পেয়েছেন)|(?:পুরস্কার|লটারি).{0,20}(?:দাবি|জিত|পেতে|ক্লিক)/iu

const urlPattern = /(?:https?:\/\/|www\.)[^\s<>"']+/giu
const trailingUrlPunctuation = /[.,!?;:)\]}]+$/u

function findEvidence(text: string, pattern: RegExp): string | undefined {
  return text.match(pattern)?.[0]
}

function findSecretRequest(text: string): string | undefined {
  const combinedSecretPattern = new RegExp(
    `(?:${secretRequestPattern.source})|(?:${banglishSecretRequestPattern.source})`,
    'giu',
  )

  for (const match of text.matchAll(combinedSecretPattern)) {
    const start = match.index ?? 0
    const end = start + match[0].length
    const precedingText = text.slice(Math.max(0, start - 50), start)
    const followingText = text.slice(end, end + 18)
    const negatedBefore =
      /(?:\b(?:do not|don't|never)\b|\b(?:kokhono(?:i)?|kokhonoi)\b|কখনোই?)[^.!?।\n]{0,35}$/iu.test(
        precedingText,
      )
    const crossesSentenceBoundary = /[.!?।\n]/u.test(match[0])
    const negatedAfter =
      /^\s*(?:not\b|না(?=[\s।.!?,;:]|$)|(?:করবেন|দেবেন|পাঠাবেন|জানাবেন|লিখবেন)\s+না(?=[\s।.!?,;:]|$)|(?:korben|korbo|korbe|koro|korun|koren|diben|dibo|den|din|pathan|pathaben|bolben|bolbo|likhben|likho)\s+na\b)/iu.test(
        followingText,
      )

    if (!crossesSentenceBoundary && !negatedBefore && !negatedAfter) {
      return match[0]
    }
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
  const urgencyEvidence =
    findEvidence(message, urgencyPattern) ??
    findEvidence(message, banglishUrgencyPattern)
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
