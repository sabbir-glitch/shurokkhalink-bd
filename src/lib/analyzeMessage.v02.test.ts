import { describe, expect, it } from 'vitest'
import { analyzeMessage, type FindingKind } from './analyzeMessage'

interface Case {
  id: string
  message: string
  expectedKinds: FindingKind[]
  rationale: string
}

const cases: Case[] = [
  {
    id: 'banglish-otp-urgent-send',
    message: 'Apnar OTP ta ekhoni send korun',
    expectedKinds: ['secret', 'urgency'],
    rationale: 'A Latin-script Banglish OTP request includes an immediate action cue.',
  },
  {
    id: 'banglish-pin-pathan',
    message: 'PIN ta please pathan',
    expectedKinds: ['secret'],
    rationale: 'A PIN request uses a common Banglish object marker and transliterated verb.',
  },
  {
    id: 'banglish-otp-share-positive',
    message: 'Please OTP share korun',
    expectedKinds: ['secret'],
    rationale: 'An OTP request is expressed with an English verb and Banglish grammar.',
  },
  {
    id: 'banglish-account-threat',
    message: 'Ekhoni account verify korun, na hole account bondho hoye jabe.',
    expectedKinds: ['urgency'],
    rationale: 'A time-pressured verification instruction is paired with an account-closure threat.',
  },
  {
    id: 'banglish-negation-korben-na',
    message: 'OTP share korben na',
    expectedKinds: [],
    rationale: 'Advice against sharing an OTP should not be treated as a request to share it.',
  },
  {
    id: 'banglish-negation-koro-na',
    message: 'OTP share koro na',
    expectedKinds: [],
    rationale: 'A casual Banglish negative instruction should remain defensive wording.',
  },
  {
    id: 'banglish-negation-never',
    message: 'Kokhonoi OTP share korben na',
    expectedKinds: [],
    rationale: 'Negation before and after the sensitive-secret phrase should suppress that finding.',
  },
  {
    id: 'banglish-negation-please',
    message: 'Please OTP ta send korben na.',
    expectedKinds: [],
    rationale: 'A polite warning not to send an OTP is not a request for the code.',
  },
  {
    id: 'banglish-benign-now',
    message: 'Amra ekhoni cinema dekhbo, tarpor cha khabo.',
    expectedKinds: [],
    rationale: 'Time-related everyday conversation without a pressured action should remain unflagged.',
  },
  {
    id: 'banglish-benign-account-history',
    message: 'Amar account age bondho hoye gechilo, ekhon thik ache.',
    expectedKinds: [],
    rationale: 'A resolved past account issue is not an imminent threat.',
  },
  {
    id: 'banglish-request-with-neutral-time',
    message: 'Apnar PIN ta pathan',
    expectedKinds: ['secret'],
    rationale: 'The sensitive-secret request should be detected without inferring urgency.',
  },
  {
    id: 'english-defensive-regression',
    message: 'Never share your OTP with anyone.',
    expectedKinds: [],
    rationale: 'Banglish support must not regress the existing English negation safeguard.',
  },
]

describe('ShurokkhaLink BD v0.2 Banglish and context regression cases', () => {
  it.each(cases)('$id: $rationale', ({ message, expectedKinds }) => {
    expect(analyzeMessage(message).map((finding) => finding.kind)).toEqual(expectedKinds)
  })

  it('keeps finding evidence as a literal substring of the submitted message', () => {
    for (const testCase of cases) {
      for (const finding of analyzeMessage(testCase.message)) {
        expect(testCase.message).toContain(finding.evidence)
      }
    }
  })
})
