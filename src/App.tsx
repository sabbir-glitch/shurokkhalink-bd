import { useState, type FormEvent } from 'react'
import { analyzeMessage, type Finding } from './lib/analyzeMessage'
import './App.css'

type Language = 'bn' | 'en'

const copy = {
  bn: {
    languageLabel: 'ভাষা নির্বাচন',
    bengali: 'বাংলা',
    english: 'English',
    eyebrow: 'সচেতন থাকুন, নিরাপদে থাকুন',
    title: 'সন্দেহজনক বার্তা?',
    subtitle:
      'বার্তার কিছু পরিচিত সতর্ক সংকেত স্থানীয়ভাবে দেখে নিন—কোনো বার্তা কোথাও পাঠানো হয় না।',
    privacyShort: 'আপনার বার্তা শুধু এই ব্রাউজারেই বিশ্লেষণ করা হয়',
    analyzerTitle: 'বার্তাটি পরীক্ষা করুন',
    analyzerHint:
      'SMS, চ্যাট, ইমেইলের অংশ বা অন্য কোনো সন্দেহজনক লেখা এখানে পেস্ট করুন।',
    textareaLabel: 'সন্দেহজনক বার্তা',
    placeholder: 'বার্তার লেখা এখানে পেস্ট বা টাইপ করুন…',
    characterCount: (count: number) => `${count} অক্ষর`,
    analyze: 'বার্তা বিশ্লেষণ করুন',
    clear: 'মুছে ফেলুন',
    examples: 'নমুনা দিয়ে দেখুন',
    sampleOne: 'OTP অনুরোধ',
    sampleTwo: 'পুরস্কারের বার্তা',
    sampleThree: 'লিংকসহ বার্তা',
    emptyError: 'বিশ্লেষণের আগে বার্তার লেখা যোগ করুন।',
    resultTitle: 'বিশ্লেষণের ফলাফল',
    resultPrompt: 'বিশ্লেষণ শুরু করতে উপরের বাক্সে একটি বার্তা লিখুন।',
    resultFindings: (count: number) => `${count}টি লক্ষণ পাওয়া গেছে`,
    resultClear: 'এই লেখায় পরিচিত কোনো সতর্ক সংকেত মেলেনি। তবুও সতর্ক থাকুন।',
    detected: 'যা লক্ষ্য করা গেছে',
    why: 'কেন খেয়াল করবেন',
    safer: 'নিরাপদ পদক্ষেপ',
    linkSection: 'লিংক সম্পর্কে',
    linkInfo:
      'লিংক থাকা একাই প্রতারণার প্রমাণ নয়। এই পরীক্ষা লিংকটি খোলে বা নিরাপদ কি না যাচাই করে না।',
    privacyTitle: 'আপনার গোপনীয়তা',
    privacyBody:
      'বিশ্লেষণ আপনার ডিভাইসেই হয়। লেখা সংরক্ষণ, লগ বা কোনো সার্ভারে পাঠানো হয় না।',
    guidanceTitle: 'নিশ্চিত নন? থামুন, যাচাই করুন।',
    guidanceBody:
      'OTP, PIN, পাসওয়ার্ড বা যাচাইকরণ কোড কাউকে দেবেন না—পরিচিত কেউ চাইলেও নয়। বার্তায় দেওয়া লিংক বা নম্বরের বদলে প্রতিষ্ঠানের পরিচিত অফিসিয়াল যোগাযোগপথ নিজে খুঁজে ব্যবহার করুন।',
    limitationTitle: 'মনে রাখবেন',
    limitationBody:
      'এটি কয়েকটি পরিচিত শব্দ ও লিংকের গঠন দেখে সতর্ক সংকেত দেখায়—প্রেরকের পরিচয় যাচাই করে না, কোনো লিংক নিরাপদ বলে নিশ্চয়তা দেয় না, এবং প্রতারণা নিশ্চিত করতে পারে না। সতর্ক সংকেত না থাকলেও বার্তা প্রতারণামূলক হতে পারে।',
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
    bengali: 'বাংলা',
    english: 'English',
    eyebrow: 'Stay aware. Stay safer.',
    title: 'Unsure about a message?',
    subtitle:
      'Check for a few common warning signs locally—your message is never sent anywhere.',
    privacyShort: 'Your message is analysed only in this browser',
    analyzerTitle: 'Check a message',
    analyzerHint: 'Paste a suspicious SMS, chat, email excerpt, or other text here.',
    textareaLabel: 'Suspicious message',
    placeholder: 'Paste or type the message here…',
    characterCount: (count: number) => `${count} characters`,
    analyze: 'Analyse message',
    clear: 'Clear',
    examples: 'Try a sample',
    sampleOne: 'OTP request',
    sampleTwo: 'Prize message',
    sampleThree: 'Message with a link',
    emptyError: 'Add some message text before analysing.',
    resultTitle: 'Analysis results',
    resultPrompt: 'Write a message above to see the local analysis.',
    resultFindings: (count: number) =>
      `${count} ${count === 1 ? 'sign' : 'signs'} noticed`,
    resultClear: 'No common warning signs matched this text. Continue to use caution.',
    detected: 'What we noticed',
    why: 'Why it deserves attention',
    safer: 'A safer next step',
    linkSection: 'About the link',
    linkInfo:
      'A link alone is not evidence of fraud. This check does not open a link or verify whether it is safe.',
    privacyTitle: 'Your privacy',
    privacyBody:
      'Analysis happens on your device. Text is not stored, logged, or sent to a server.',
    guidanceTitle: 'Not sure? Pause and verify.',
    guidanceBody:
      'Never share an OTP, PIN, password, or verification code—not even if someone you know asks. Find the organisation’s known official contact details yourself instead of using a link or number in the message.',
    limitationTitle: 'Keep in mind',
    limitationBody:
      'This tool checks a few known phrases and link structures for warning signs. It cannot verify a sender, certify a link as safe, or determine fraud. A message may still be fraudulent even when no warning signs are found.',
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
    'আপনার পার্সেল আটকে আছে—বিস্তারিত দেখুন: http://example.com/parcel',
  ],
  en: [
    'Your account will be blocked. Share your OTP now to keep it active.',
    'Congratulations! You won a prize of ৳50,000. Claim it today.',
    'Your parcel is on hold. Check details at http://example.com/parcel',
  ],
} satisfies Record<Language, string[]>

function App() {
  const [language, setLanguage] = useState<Language>('bn')
  const [message, setMessage] = useState('')
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [error, setError] = useState('')
  const text = copy[language]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!message.trim()) {
      setFindings(null)
      setError(text.emptyError)
      return
    }
    setError('')
    setFindings(analyzeMessage(message))
  }

  function handleClear() {
    setMessage('')
    setFindings(null)
    setError('')
  }

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage)
    if (error) setError(copy[nextLanguage].emptyError)
    document.documentElement.lang = nextLanguage
  }

  function findingText(finding: Finding, key: 'label' | 'why' | 'safer') {
    return copy[language].finding[finding.kind][key]
  }

  const messageFindings = findings?.filter(
    (finding) =>
      finding.kind !== 'link' &&
      finding.kind !== 'http' &&
      finding.kind !== 'credentials' &&
      finding.kind !== 'ip' &&
      finding.kind !== 'punycode',
  )
  const linkFindings = findings?.filter((finding) =>
    ['link', 'http', 'credentials', 'ip', 'punycode'].includes(finding.kind),
  )

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ShurokkhaLink BD home">
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
              onChange={(event) => {
                setMessage(event.target.value)
                if (error) setError('')
              }}
              placeholder={text.placeholder}
              rows={7}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'message-error' : 'message-count'}
            />
            <div className="input-meta">
              {error ? (
                <p id="message-error" className="field-error" role="alert">
                  {error}
                </p>
              ) : (
                <p id="message-count" className="character-count">
                  {text.characterCount(message.length)}
                </p>
              )}
              <div className="form-actions">
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={handleClear}
                >
                  {text.clear}
                </button>
                <button className="button button-primary" type="submit">
                  {text.analyze}
                  <span aria-hidden="true"> →</span>
                </button>
              </div>
            </div>
          </form>

          <div className="examples">
            <span>{text.examples}</span>
            <div className="sample-list">
              {samples[language].map((sample, index) => (
                <button
                  type="button"
                  className="sample-button"
                  key={sample}
                  onClick={() => {
                    setMessage(sample)
                    setFindings(null)
                    setError('')
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
              <p>{findings ? text.resultFindings(findings.length) : text.linkInfo}</p>
            </div>
          </div>
          <div className="results-content" aria-live="polite" aria-atomic="true">
            {findings === null ? (
              <div className="results-empty">
                <span className="empty-mark" aria-hidden="true">
                  ✓
                </span>
                <p>{text.resultPrompt}</p>
              </div>
            ) : findings.length === 0 ? (
              <div className="results-clear">
                <span className="clear-mark" aria-hidden="true">
                  ✓
                </span>
                <p>{text.resultClear}</p>
              </div>
            ) : (
              <>
                <div className="finding-list">
                  {messageFindings?.map((finding) => (
                    <article className="finding-card" key={finding.id}>
                      <div className="finding-icon" aria-hidden="true">
                        !
                      </div>
                      <div className="finding-copy">
                        <h3>{findingText(finding, 'label')}</h3>
                        <p className="evidence">
                          <span>{text.detected}:</span> “{finding.evidence}”
                        </p>
                        <p>
                          <span>{text.why}:</span> {findingText(finding, 'why')}
                        </p>
                        <p>
                          <span>{text.safer}:</span> {findingText(finding, 'safer')}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
                {linkFindings && linkFindings.length > 0 && (
                  <aside className="link-panel">
                    <div className="link-panel-heading">
                      <span className="link-icon" aria-hidden="true">
                        ↗
                      </span>
                      <div>
                        <h3>{text.linkSection}</h3>
                        <p>{text.linkInfo}</p>
                      </div>
                    </div>
                    <div className="link-findings">
                      {linkFindings.map((finding) => (
                        <article className="link-finding" key={finding.id}>
                          <h4>{findingText(finding, 'label')}</h4>
                          <p className="evidence">
                            <span>{text.detected}:</span> “{finding.evidence}”
                          </p>
                          <p>
                            <span>{text.why}:</span> {findingText(finding, 'why')}
                          </p>
                          <p>
                            <span>{text.safer}:</span> {findingText(finding, 'safer')}
                          </p>
                        </article>
                      ))}
                    </div>
                  </aside>
                )}
                {findings.length > 0 && (
                  <p className="not-proof">
                    {language === 'bn'
                      ? 'সতর্ক সংকেত মানেই প্রতারণা প্রমাণিত নয়।'
                      : 'A warning sign is not proof of fraud.'}
                  </p>
                )}
              </>
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
