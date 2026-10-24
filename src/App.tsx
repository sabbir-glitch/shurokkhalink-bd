import { useState, type FormEvent } from 'react'
import { AiAnalysisError, analyzeWithAi, createRedactedPreview } from './lib/aiClient'
import type { AiAnalysisSuccessV1, ScamIndicatorV1 } from './lib/aiContracts'
import './App.css'

type Language = 'bn' | 'en'

const copy = {
  bn: {
    languageLabel: 'ভাষা নির্বাচন',
    homeLabel: 'ShurokkhaLink BD-এর শুরুতে যান',
    bengali: 'বাংলা',
    english: 'English',
    eyebrow: 'সচেতন থাকুন, নিরাপদে থাকুন',
    title: 'সন্দেহজনক বার্তা?',
    subtitle:
      'অনুমতি দিলে বার্তাটি অনুবাদ ও AI বিশ্লেষণের জন্য তৃতীয় পক্ষের সেবায় পাঠানো হবে।',
    privacyShort: 'তৃতীয় পক্ষের AI সেবায় পাঠানোর আগে আপনার অনুমতি লাগবে',
    analyzerTitle: 'বার্তাটি পরীক্ষা করুন',
    analyzerHint:
      'SMS, চ্যাট, ইমেইলের অংশ বা অন্য কোনো সন্দেহজনক লেখা এখানে পেস্ট করুন।',
    textareaLabel: 'সন্দেহজনক বার্তা',
    placeholder: 'বার্তার লেখা এখানে পেস্ট বা টাইপ করুন…',
    characterCount: (count: number) => `${count} অক্ষর`,
    analyze: 'AI দিয়ে বার্তা বিশ্লেষণ করুন',
    clear: 'মুছে ফেলুন',
    examples: 'নমুনা দিয়ে দেখুন',
    sampleOne: 'OTP অনুরোধ',
    sampleTwo: 'পুরস্কারের বার্তা',
    sampleThree: 'লিংকসহ বার্তা',
    emptyError: 'বিশ্লেষণের আগে বার্তার লেখা যোগ করুন।',
    consentError: 'চালিয়ে যেতে তৃতীয় পক্ষের AI প্রক্রিয়াকরণে সম্মতি দিন।',
    consentLabel:
      'আমি বুঝেছি যে মূল বার্তাটি অনুবাদ ও AI বিশ্লেষণের জন্য তৃতীয় পক্ষের সেবায় পাঠানো হবে।',
    consentNote:
      'মূল লেখাটি পাঠানো হবে। পূর্বরূপটি কিছু পরিচিত তথ্য আড়াল করে, তবে সংবেদনশীল তথ্য বাদ পড়তে পারে—পাঠানোর আগে যাচাই করে OTP, PIN, পাসওয়ার্ড ও ব্যক্তিগত তথ্য মুছে দিন।',
    previewTitle: 'পাঠানোর আগে গোপনীয়তা-রক্ষিত পূর্বরূপ',
    previewEmpty: 'পূর্বরূপ এখানে দেখানো হবে।',
    loading: 'AI বিশ্লেষণ চলছে…',
    unavailable:
      'AI বিশ্লেষণ সেবা এখনো কনফিগার করা হয়নি। কোনো ফলাফল তৈরি বা দেখানো হয়নি।',
    serviceUnavailable:
      'AI সেবা সাময়িকভাবে পাওয়া যাচ্ছে না। কোনো ফলাফল দেখানো হয়নি; পরে আবার চেষ্টা করুন।',
    rateLimited:
      'AI সেবায় এখন অনেক অনুরোধ রয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন; কোনো বিশ্লেষণ দেখানো হয়নি।',
    timeout: 'বিশ্লেষণে সময়সীমা অতিক্রান্ত হয়েছে। কোনো ফলাফল দেখানো হয়নি।',
    networkError:
      'বিশ্লেষণ সেবায় সংযোগ করা যায়নি। আপনার বার্তাকে নিরাপদ বা বিপজ্জনক বলা হয়নি।',
    malformed: 'সেবা থেকে বৈধ ফলাফল পাওয়া যায়নি। কোনো বিশ্লেষণ দেখানো হয়নি।',
    serviceError:
      'AI বিশ্লেষণ সম্পন্ন করা যায়নি। পরে আবার চেষ্টা করুন; ফলাফলকে নিরাপদ বলে ধরে নেবেন না।',
    translationTitle: 'ইংরেজি অনুবাদ',
    verdictTitle: 'AI বিশ্লেষণ',
    verdictSuspicious: 'সতর্কতার যোগ্য কিছু লক্ষণ পাওয়া গেছে',
    verdictNoIndicators: 'এই বিশ্লেষণে উল্লেখযোগ্য লক্ষণ পাওয়া যায়নি',
    verdictUncertain: 'বিশ্লেষণ অনিশ্চিত',
    noIndicators: 'কোনো নির্দেশক দেখানো হয়নি। তবুও সতর্ক থাকুন।',
    noFindings: 'এই বিশ্লেষণে কোনো নির্দেশক দেখানো হয়নি।',
    notProof: 'AI-এর সতর্কতাও প্রতারণার প্রমাণ নয়। ফলাফল ভুল বা অসম্পূর্ণ হতে পারে।',
    indicatorLabel: 'লক্ষণ',
    resultTitle: 'বিশ্লেষণের ফলাফল',
    resultPrompt: 'সম্মতি দিয়ে AI বিশ্লেষণ শুরু করলে ফলাফল এখানে দেখানো হবে।',
    resultIdle: 'AI বিশ্লেষণ শুরু হলে ফলাফল এখানে দেখানো হবে।',
    resultFindings: (count: number) => `${count}টি লক্ষণ পাওয়া গেছে`,
    resultClear: 'এই বিশ্লেষণে উল্লেখযোগ্য লক্ষণ পাওয়া যায়নি। তবুও সতর্ক থাকুন।',
    resultAnnouncement: (labels: string[]) =>
      labels.length === 0
        ? 'কোনো পরিচিত সতর্ক সংকেত মেলেনি।'
        : `বিশ্লেষণে ${labels.length}টি লক্ষণ: ${labels.join('। ')}।`,
    detected: 'যা লক্ষ্য করা গেছে',
    why: 'কেন খেয়াল করবেন',
    safer: 'নিরাপদ পদক্ষেপ',
    linkSection: 'লিংক সম্পর্কে',
    linkInfo:
      'লিংক থাকা একাই প্রতারণার প্রমাণ নয়। এই পরীক্ষা লিংকটি খোলে বা নিরাপদ কি না যাচাই করে না।',
    privacyTitle: 'আপনার গোপনীয়তা',
    privacyBody:
      'আপনি সম্মতি দিলে মূল বার্তা অনুবাদ ও AI বিশ্লেষণের জন্য তৃতীয় পক্ষের সেবায় পাঠানো হবে। অ্যাপ বার্তা সংরক্ষণ করে না; তৃতীয় পক্ষের নিজস্ব তথ্য-ব্যবহার নীতি প্রযোজ্য হতে পারে।',
    guidanceTitle: 'নিশ্চিত নন? থামুন, যাচাই করুন।',
    guidanceBody:
      'OTP, PIN, পাসওয়ার্ড বা যাচাইকরণ কোড কাউকে দেবেন না—পরিচিত কেউ চাইলেও নয়। বার্তায় দেওয়া লিংক বা নম্বরের বদলে প্রতিষ্ঠানের পরিচিত অফিসিয়াল যোগাযোগপথ নিজে খুঁজে ব্যবহার করুন।',
    limitationTitle: 'মনে রাখবেন',
    limitationBody:
      'AI অনুবাদ বা বিশ্লেষণে ভুল করতে পারে। এটি প্রেরকের পরিচয় যাচাই করে না, কোনো লিংক নিরাপদ বলে নিশ্চয়তা দেয় না, এবং প্রতারণা নিশ্চিত করতে পারে না। সতর্ক সংকেত না থাকলেও বার্তা প্রতারণামূলক হতে পারে।',
    footer: 'স্বাধীন সচেতনতামূলক টুল • কোনো সরকারি সেবা বা সরকারি অনুমোদিত পণ্য নয়',
    finding: {
      secret: {
        label: 'গোপন যাচাইকরণ তথ্য চাওয়া হয়েছে',
        why: 'OTP, PIN, পাসওয়ার্ড বা যাচাইকরণ কোড অন্যকে দিলে আপনার অ্যাকাউন্ট বা অর্থের ঝুঁকি হতে পারে।',
        safer:
          'কোড বা পাসওয়ার্ড শেয়ার করবেন না। অনুরোধটি যে প্রতিষ্ঠানের নামে এসেছে, তাদের পরিচিত অফিসিয়াল মাধ্যমে যাচাই করুন।',
      },
      urgency: {
        label: 'জরুরি পদক্ষেপের চাপ',
        why: 'তাৎক্ষণিক পদক্ষেপের চাপ আপনাকে যাচাই করার সময় না-ও দিতে পারে।',
        safer:
          'তাড়াহুড়ো করবেন না। বার্তার বাইরে গিয়ে পরিচিত অফিসিয়াল যোগাযোগপথে তথ্য যাচাই করুন।',
      },
      prize: {
        label: 'পুরস্কার বা অপ্রত্যাশিত অর্থের দাবি',
        why: 'অপ্রত্যাশিত পুরস্কার, লটারি বা অর্থের দাবি যাচাই না করে বিশ্বাস করা ঠিক নয়।',
        safer:
          'কোনো ফি দেবেন না বা তথ্য দেবেন না। সংশ্লিষ্ট প্রতিষ্ঠানের অফিসিয়াল সূত্রে আলাদাভাবে যাচাই করুন।',
      },
      link: {
        label: 'বার্তায় একটি লিংক আছে',
        why: 'লিংকের ঠিকানা দেখে একা বোঝা যায় না সেটি বৈধ বা নিরাপদ কি না।',
        safer:
          'সন্দেহ হলে লিংক খুলবেন না। পরিচিত ওয়েবসাইটের ঠিকানা নিজে লিখে বা অফিসিয়াল অ্যাপ ব্যবহার করে যাচাই করুন।',
      },
      http: {
        label: 'লিংকটি HTTP ব্যবহার করে',
        why: 'HTTP সংযোগে HTTPS-এর মতো এনক্রিপশন থাকে না। তবে HTTPS থাকাও কোনো সাইট বৈধ—তার নিশ্চয়তা নয়।',
        safer:
          'সংবেদনশীল তথ্য দেবেন না। প্রতিষ্ঠানের পরিচিত অফিসিয়াল ঠিকানা নিজে খুঁজে ব্যবহার করুন।',
      },
      credentials: {
        label: 'লিংকের ঠিকানায় ব্যবহারকারীর তথ্য রয়েছে',
        why: 'URL-এর মধ্যে ইউজারনেম বা পাসওয়ার্ড থাকা অস্বাভাবিক এবং সংবেদনশীল তথ্য প্রকাশ করতে পারে।',
        safer: 'লিংকটি খুলবেন না বা ব্যবহার করবেন না। বার্তাটি আলাদাভাবে যাচাই করুন।',
      },
      ip: {
        label: 'লিংকে IP ঠিকানা হোস্টনেম হিসেবে আছে',
        why: 'ওয়েবসাইটে IP ঠিকানা থাকা একা প্রতারণার প্রমাণ নয়, তবে এটি লক্ষ্য করার মতো অস্বাভাবিক গঠন।',
        safer:
          'লিংকটি বিশ্বাস করার আগে প্রতিষ্ঠানের পরিচিত অফিসিয়াল মাধ্যমে যাচাই করুন।',
      },
      punycode: {
        label: 'লিংকের হোস্টনেমে punycode রয়েছে',
        why: 'Punycode অ-লাতিন অক্ষরের ডোমেইন প্রকাশ করে; দেখতে পরিচিত অক্ষরের মতো হলেও ডোমেইন আলাদা হতে পারে।',
        safer: 'ডোমেইনটি মনোযোগ দিয়ে যাচাই করুন এবং নিশ্চিত না হলে লিংক খুলবেন না।',
      },
    },
  },
  en: {
    languageLabel: 'Choose language',
    homeLabel: 'Go to the ShurokkhaLink BD home page',
    bengali: 'বাংলা',
    english: 'English',
    eyebrow: 'Stay aware. Stay safer.',
    title: 'Unsure about a message?',
    subtitle:
      'With your consent, your message will be sent to a third-party service for translation and AI analysis.',
    privacyShort: 'Your consent is required before sending text to third-party AI',
    analyzerTitle: 'Check a message',
    analyzerHint: 'Paste a suspicious SMS, chat, email excerpt, or other text here.',
    textareaLabel: 'Suspicious message',
    placeholder: 'Paste or type the message here…',
    characterCount: (count: number) => `${count} characters`,
    analyze: 'Analyse with AI',
    clear: 'Clear',
    examples: 'Try a sample',
    sampleOne: 'OTP request',
    sampleTwo: 'Prize message',
    sampleThree: 'Message with a link',
    emptyError: 'Add some message text before analysing.',
    consentError: 'Consent to third-party AI processing before continuing.',
    consentLabel:
      'I understand that the original message will be sent to a third-party service for translation and AI analysis.',
    consentNote:
      'The original text will be sent. The preview masks some common patterns but may miss sensitive information—review it and remove OTPs, PINs, passwords, and personal details before continuing.',
    previewTitle: 'Privacy-redacted preview before sending',
    previewEmpty: 'The preview will appear here.',
    loading: 'AI analysis in progress…',
    unavailable:
      'AI analysis is not configured yet. No result was generated or displayed.',
    serviceUnavailable:
      'The AI service is temporarily unavailable. No result was displayed; try again later.',
    rateLimited:
      'The AI service is receiving too many requests. Try again shortly; no analysis was displayed.',
    timeout: 'The analysis timed out. No result was displayed.',
    networkError:
      'Could not connect to the analysis service. Your message has not been labelled safe or dangerous.',
    malformed: 'The service returned an invalid result. No analysis is displayed.',
    serviceError:
      'AI analysis could not be completed. Try again later; do not assume the message is safe.',
    translationTitle: 'English translation',
    verdictTitle: 'AI analysis',
    verdictSuspicious: 'Some indicators deserve attention',
    verdictNoIndicators: 'No notable indicators were found in this analysis',
    verdictUncertain: 'The analysis is uncertain',
    noIndicators: 'No indicators were returned. Continue to use caution.',
    noFindings: 'No indicators were returned in this analysis.',
    notProof:
      'An AI warning is not proof of fraud. Results may be wrong or incomplete.',
    indicatorLabel: 'Indicator',
    resultTitle: 'Analysis results',
    resultPrompt: 'Give consent and start AI analysis to see a result here.',
    resultIdle: 'AI analysis results will appear here after you submit a message.',
    resultFindings: (count: number) =>
      `${count} ${count === 1 ? 'sign' : 'signs'} noticed`,
    resultClear:
      'No notable indicators were found in this analysis. Continue to use caution.',
    resultAnnouncement: (labels: string[]) =>
      labels.length === 0
        ? 'No common warning signs matched this text.'
        : `${labels.length} ${labels.length === 1 ? 'finding' : 'findings'} noticed: ${labels.join('; ')}.`,
    detected: 'What we noticed',
    why: 'Why it deserves attention',
    safer: 'A safer next step',
    linkSection: 'About the link',
    linkInfo:
      'A link alone is not evidence of fraud. This check does not open a link or verify whether it is safe.',
    privacyTitle: 'Your privacy',
    privacyBody:
      'With your consent, the original message is sent to a third-party service for translation and AI analysis. The app does not store it; the third party’s own data practices may apply.',
    guidanceTitle: 'Not sure? Pause and verify.',
    guidanceBody:
      'Never share an OTP, PIN, password, or verification code—not even if someone you know asks. Find the organisation’s known official contact details yourself instead of using a link or number in the message.',
    limitationTitle: 'Keep in mind',
    limitationBody:
      'AI translation and analysis can be wrong. This tool cannot verify a sender, certify a link as safe, or determine fraud. A message may still be fraudulent even when no warning signs are found.',
    footer:
      'Independent awareness tool • Not a government service or officially endorsed product',
    finding: {
      secret: {
        label: 'A request for private verification information',
        why: 'Sharing an OTP, PIN, password, or verification code can put your account or money at risk.',
        safer:
          'Do not share codes or passwords. Verify the request through a known official channel for the organisation.',
      },
      urgency: {
        label: 'Pressure to act urgently',
        why: 'Pressure to act immediately can leave you less time to verify the message.',
        safer:
          'Take your time. Verify the information through a known official channel outside the message.',
      },
      prize: {
        label: 'A prize or unexpected money claim',
        why: 'Unexpected prize, lottery, or money claims deserve verification before you trust them.',
        safer:
          'Do not pay a fee or share information. Check independently with the organisation through an official source.',
      },
      link: {
        label: 'The message contains a link',
        why: 'A link’s presence alone cannot show whether it is legitimate or safe.',
        safer:
          'If unsure, do not open it. Type a known website address yourself or use the official app to verify.',
      },
      http: {
        label: 'The link uses HTTP',
        why: 'HTTP does not provide the same encryption as HTTPS. HTTPS alone does not prove a site is legitimate.',
        safer:
          'Do not enter sensitive information. Find and use the organisation’s known official address.',
      },
      credentials: {
        label: 'The link contains user information',
        why: 'A URL containing a username or password is unusual and may expose sensitive information.',
        safer: 'Do not open or use this link. Verify the message separately.',
      },
      ip: {
        label: 'The link uses an IP address as its host',
        why: 'An IP address in a website link is not proof of fraud, but it is an unusual structure worth noticing.',
        safer: 'Verify through a known official channel before trusting the link.',
      },
      punycode: {
        label: 'The link host contains punycode',
        why: 'Punycode represents domains with non-Latin characters, which can sometimes resemble familiar text.',
        safer: 'Check the domain carefully and do not open the link if you are unsure.',
      },
    },
  },
} satisfies Record<Language, object>

const samples = {
  bn: [
    'আপনার অ্যাকাউন্ট বন্ধ হবে। এখনই OTP পাঠান।',
    'অভিনন্দন! আপনি ৫০,০০০ টাকা জিতেছেন। পুরস্কার পেতে এখনই ক্লিক করুন।',
    'আপনার পার্সেলের তথ্য দেখুন: https://example.com/parcel',
  ],
  en: [
    'Your account will be blocked. Share your OTP now to keep it active.',
    'Congratulations! You won a prize of ৳50,000. Claim it today.',
    'Check your parcel details at https://example.com/parcel',
  ],
} satisfies Record<Language, string[]>

function App() {
  const [language, setLanguage] = useState<Language>('bn')
  const [message, setMessage] = useState('')
  const [consented, setConsented] = useState(false)
  const [result, setResult] = useState<AiAnalysisSuccessV1 | null>(null)
  const [error, setError] = useState('')
  const [analysisError, setAnalysisError] = useState('')
  const [loading, setLoading] = useState(false)
  const text = copy[language]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    if (!message.trim()) {
      setResult(null)
      setError(text.emptyError)
      return
    }
    if (!consented) {
      setResult(null)
      setError(text.consentError)
      return
    }

    setError('')
    setAnalysisError('')
    setResult(null)
    setLoading(true)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15_000)
    try {
      const analysis = await analyzeWithAi(message, controller.signal)
      setResult(analysis)
    } catch (caught) {
      if (controller.signal.aborted) {
        setAnalysisError(copy[language].timeout)
      } else if (caught instanceof AiAnalysisError) {
        if (caught.code === 'ai_not_configured') {
          setAnalysisError(copy[language].unavailable)
        } else if (caught.code === 'provider_unavailable') {
          setAnalysisError(copy[language].serviceUnavailable)
        } else if (caught.code === 'provider_timeout') {
          setAnalysisError(copy[language].timeout)
        } else if (caught.code === 'provider_rate_limited') {
          setAnalysisError(copy[language].rateLimited)
        } else if (
          caught.code === 'invalid_response' ||
          caught.code === 'invalid_provider_response'
        ) {
          setAnalysisError(copy[language].malformed)
        } else {
          setAnalysisError(copy[language].serviceError)
        }
      } else {
        setAnalysisError(copy[language].networkError)
      }
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  function handleClear() {
    setMessage('')
    setConsented(false)
    setResult(null)
    setError('')
    setAnalysisError('')
  }

  function handleLanguageChange(nextLanguage: Language) {
    if (error === copy[language].emptyError) {
      setError(copy[nextLanguage].emptyError)
    } else if (error === copy[language].consentError) {
      setError(copy[nextLanguage].consentError)
    }
    const analysisErrorKeys = [
      'unavailable',
      'serviceUnavailable',
      'rateLimited',
      'timeout',
      'networkError',
      'malformed',
      'serviceError',
    ] as const
    const matchingError = analysisErrorKeys.find(
      (key) => analysisError === copy[language][key],
    )
    if (matchingError) {
      setAnalysisError(copy[nextLanguage][matchingError])
    }
    setLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage
  }

  function indicatorLabel(indicator: ScamIndicatorV1): string {
    const category = indicator.category
    if (category === 'secret_request') return text.finding.secret.label
    if (category === 'urgency') return text.finding.urgency.label
    if (category === 'prize_claim') return text.finding.prize.label
    if (category === 'link') return text.finding.link.label
    return category === 'impersonation'
      ? language === 'bn'
        ? 'পরিচয় বা প্রতিষ্ঠানের ছদ্মবেশের ইঙ্গিত'
        : 'Possible impersonation indicator'
      : language === 'bn'
        ? 'অন্য সতর্কতার লক্ষণ'
        : 'Other warning indicator'
  }

  function indicatorAdvice(indicator: ScamIndicatorV1): string {
    if (indicator.category === 'secret_request') return text.finding.secret.safer
    if (indicator.category === 'urgency') return text.finding.urgency.safer
    if (indicator.category === 'prize_claim') return text.finding.prize.safer
    if (indicator.category === 'link') return text.finding.link.safer
    return text.guidanceBody
  }

  const verdictText =
    result?.analysis.verdict === 'suspicious'
      ? text.verdictSuspicious
      : result?.analysis.verdict === 'no_indicators'
        ? text.verdictNoIndicators
        : result
          ? text.verdictUncertain
          : ''

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label={text.homeLabel}>
          <span className="brand-mark" aria-hidden="true">
            শু
          </span>
          <span className="brand-name">
            ShurokkhaLink <span>BD</span>
          </span>
        </a>
        <div className="language-switch" role="group" aria-label={text.languageLabel}>
          <button
            type="button"
            aria-pressed={language === 'bn'}
            onClick={() => handleLanguageChange('bn')}
          >
            {text.bengali}
          </button>
          <button
            type="button"
            aria-pressed={language === 'en'}
            onClick={() => handleLanguageChange('en')}
          >
            {text.english}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              {text.eyebrow}
            </p>
            <h1 id="hero-title">{text.title}</h1>
            <p className="hero-subtitle">{text.subtitle}</p>
          </div>
          <div className="privacy-pill">
            <span aria-hidden="true" className="lock-icon">
              ●
            </span>
            {text.privacyShort}
          </div>
        </section>

        <section className="analyzer-card" aria-labelledby="analyzer-title">
          <div className="section-heading">
            <span className="section-number" aria-hidden="true">
              01
            </span>
            <div>
              <h2 id="analyzer-title">{text.analyzerTitle}</h2>
              <p>{text.analyzerHint}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="message-input">{text.textareaLabel}</label>
            <textarea
              id="message-input"
              value={message}
              maxLength={10_000}
              disabled={loading}
              onChange={(event) => {
                setMessage(event.target.value)
                setResult(null)
                setAnalysisError('')
                if (error) setError('')
              }}
              placeholder={text.placeholder}
              rows={7}
              aria-invalid={error === text.emptyError}
              aria-describedby={
                error === text.emptyError
                  ? 'message-error message-count privacy-note'
                  : 'message-count privacy-note'
              }
            />
            <div className="input-meta">
              <div>
                {error && (
                  <p id="message-error" className="field-error" role="alert">
                    {error}
                  </p>
                )}
                <p id="message-count" className="character-count">
                  {text.characterCount(message.length)}
                </p>
              </div>
              <div className="form-actions">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                >
                  {text.clear}
                </button>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? text.loading : text.analyze}
                  {!loading && <span aria-hidden="true"> →</span>}
                </button>
              </div>
            </div>
            <p className="consent-note" id="privacy-note">
              {text.consentNote}
            </p>
            <div className="redacted-preview">
              <h3>{text.previewTitle}</h3>
              <p>{message ? createRedactedPreview(message) : text.previewEmpty}</p>
            </div>
            <label className="consent-control" htmlFor="ai-consent">
              <input
                id="ai-consent"
                type="checkbox"
                checked={consented}
                aria-invalid={error === text.consentError}
                aria-describedby={
                  error === text.consentError ? 'message-error' : undefined
                }
                disabled={loading}
                onChange={(event) => {
                  setConsented(event.target.checked)
                  if (error) setError('')
                  setAnalysisError('')
                }}
              />
              <span>{text.consentLabel}</span>
            </label>
          </form>

          <div className="examples">
            <span>{text.examples}</span>
            <div className="sample-list">
              {samples[language].map((sample, index) => (
                <button
                  type="button"
                  className="sample-button"
                  key={sample}
                  disabled={loading}
                  onClick={() => {
                    setMessage(sample)
                    setResult(null)
                    setError('')
                    setAnalysisError('')
                  }}
                >
                  {index === 0
                    ? text.sampleOne
                    : index === 1
                      ? text.sampleTwo
                      : text.sampleThree}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="results-section" aria-labelledby="results-title">
          <div className="results-heading">
            <span className="section-number" aria-hidden="true">
              02
            </span>
            <div>
              <h2 id="results-title">{text.resultTitle}</h2>
              <p>
                {result
                  ? text.resultFindings(result.analysis.indicators.length)
                  : text.resultIdle}
              </p>
            </div>
          </div>
          <p
            className="visually-hidden"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {loading
              ? text.loading
              : analysisError
                ? analysisError
                : result
                  ? `${verdictText}. ${result.analysis.summary}`
                  : ''}
          </p>
          <div className="results-content">
            {loading ? (
              <div className="results-empty" role="status">
                <p>{text.loading}</p>
              </div>
            ) : analysisError && !result ? (
              <div className="analysis-error">{analysisError}</div>
            ) : result ? (
              <div className="ai-result">
                <section
                  className="translation-panel"
                  aria-labelledby="translation-title"
                >
                  <h3 id="translation-title">{text.translationTitle}</h3>
                  <p>{result.translation.translatedText}</p>
                </section>
                <section className="analysis-panel" aria-labelledby="ai-result-title">
                  <h3 id="ai-result-title">
                    {text.verdictTitle}: {verdictText}
                  </h3>
                  <p>{result.analysis.summary}</p>
                  {result.analysis.indicators.length > 0 ? (
                    <div className="finding-list">
                      {result.analysis.indicators.map((indicator, index) => (
                        <article
                          className="finding-card"
                          key={`${indicator.category}-${index}`}
                        >
                          <div className="finding-icon" aria-hidden="true">
                            !
                          </div>
                          <div className="finding-copy">
                            <h4>{indicatorLabel(indicator)}</h4>
                            <p>
                              <span>{text.detected}:</span> {indicator.explanation}
                            </p>
                            <p>
                              <span>{text.safer}:</span> {indicatorAdvice(indicator)}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>{text.noIndicators}</p>
                  )}
                </section>
                <p className="not-proof">{text.notProof}</p>
              </div>
            ) : (
              <div className="results-empty">
                <span className="empty-mark" aria-hidden="true">
                  ✓
                </span>
                <p>{text.resultPrompt}</p>
              </div>
            )}
          </div>
        </section>

        <section
          className="guidance-grid"
          aria-label={language === 'bn' ? 'নিরাপত্তা নির্দেশনা' : 'Safety guidance'}
        >
          <article className="guidance-card">
            <span className="guidance-icon privacy-icon" aria-hidden="true">
              ◈
            </span>
            <div>
              <h2>{text.privacyTitle}</h2>
              <p>{text.privacyBody}</p>
            </div>
          </article>
          <article className="guidance-card">
            <span className="guidance-icon pause-icon" aria-hidden="true">
              Ⅱ
            </span>
            <div>
              <h2>{text.guidanceTitle}</h2>
              <p>{text.guidanceBody}</p>
            </div>
          </article>
        </section>

        <aside className="limitations">
          <span className="info-icon" aria-hidden="true">
            i
          </span>
          <div>
            <h2>{text.limitationTitle}</h2>
            <p>{text.limitationBody}</p>
          </div>
        </aside>
      </main>

      <footer>
        <a className="footer-brand" href="#top">
          ShurokkhaLink BD
        </a>
        <p>{text.footer}</p>
      </footer>
    </div>
  )
}

export default App
