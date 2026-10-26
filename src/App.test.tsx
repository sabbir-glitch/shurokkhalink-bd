import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const completedResponse = {
  status: 'completed',
  version: 'ai-analysis-response.v3',
  englishTranslation: {
    version: 'translation-response.v2',
    sourceLanguage: 'bn',
    detectedLanguage: 'bangla',
    targetLanguage: 'en',
    translatedText: 'Share your OTP immediately.',
  },
  banglaTranslation: null,
  analysis: {
    version: 'scam-analysis-response.v1',
    verdict: 'suspicious',
    summary: 'The message asks for a one-time code and pressures the recipient.',
    indicators: [
      {
        category: 'secret_request',
        explanation: 'It asks the recipient to share an OTP.',
      },
      {
        category: 'urgency',
        explanation: 'It asks the recipient to act immediately.',
      },
    ],
  },
}
const completedBanglaResponse = {
  ...completedResponse,
  englishTranslation: null,
  banglaTranslation: {
    version: 'translation-response.v2',
    sourceLanguage: 'en',
    detectedLanguage: 'english',
    targetLanguage: 'bn',
    translatedText: 'এখনই আপনার OTP পাঠান।',
  },
}
const completedBothTranslationsResponse = {
  ...completedResponse,
  englishTranslation: {
    ...completedResponse.englishTranslation,
    detectedLanguage: 'other',
  },
  banglaTranslation: {
    ...completedBanglaResponse.banglaTranslation,
    detectedLanguage: 'other',
  },
}

function apiResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>()
  if (response instanceof Error) fetchMock.mockRejectedValue(response)
  else fetchMock.mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function enterAndSubmit(message = 'OTP: 123456. https://example.test') {
  const user = userEvent.setup()
  const input =
    screen.queryByRole('textbox', { name: 'সন্দেহজনক বার্তা' }) ??
    screen.getByRole('textbox', { name: 'Suspicious message' })
  fireEvent.change(input, { target: { value: message } })
  const submit =
    screen.queryByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }) ??
    screen.getByRole('button', { name: /Analyse message/ })
  await user.click(submit)
  return user
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('message analysis workflow', () => {
  it('shows the Bangla subtitle and external-processing disclosure without a preview or checkbox', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'সন্দেহজনক বার্তা?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'সন্দেহজনক বার্তা বুঝুন এবং নিরাপদ পরবর্তী পদক্ষেপ বেছে নিন।',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('© ২০২৬ সাব্বির আহাম্মেদ। সর্বস্বত্ব সংরক্ষিত।'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'বিশ্লেষণ বোতামে ক্লিক করলে আপনার বার্তাটি অনুবাদ ও বিশ্লেষণের জন্য একটি বহিঃস্থ পরিষেবায় পাঠানো হবে।',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/পূর্বরূপ/)).not.toBeInTheDocument()
  })

  it('does not send text while typing and sends only after the analysis action', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(apiResponse(completedResponse))
    render(<App />)
    await user.type(
      screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' }),
      'নমুনা বার্তা',
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'বিশ্লেষণ বোতামে ক্লিক করলে আপনার বার্তাটি অনুবাদ ও বিশ্লেষণের জন্য একটি বহিঃস্থ পরিষেবায় পাঠানো হবে।',
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(requestBody).toMatchObject({
      userInitiated: true,
      message: 'নমুনা বার্তা',
    })
    expect(requestBody).not.toHaveProperty('direction')
  })

  it('clears the submitted text and result without initiating a request', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(apiResponse(completedResponse))
    render(<App />)
    await user.type(
      screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' }),
      'নমুনা বার্তা',
    )
    await user.click(screen.getByRole('button', { name: 'মুছে ফেলুন' }))

    expect(screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' })).toHaveValue('')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByText('নমুনা বার্তা')).not.toBeInTheDocument()
  })

  it('sends the selected original message only after the user submits', async () => {
    const fetchMock = mockFetch(
      apiResponse(
        {
          status: 'unavailable',
          error: { code: 'ai_not_configured', message: 'Not configured.' },
        },
        503,
      ),
    )
    render(<App />)
    await enterAndSubmit()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/analyze',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
      }),
    )
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toMatchObject({
      message: 'OTP: 123456. https://example.test',
      userInitiated: true,
    })
    expect(body).not.toHaveProperty('direction')
    expect(
      (
        await screen.findAllByText(
          'বিশ্লেষণ পরিষেবা এখনো কনফিগার করা হয়নি। কোনো ফলাফল দেখানো হয়নি।',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Share your OTP immediately/)).not.toBeInTheDocument()
  })

  it('displays the validated translation before structured findings', async () => {
    const user = userEvent.setup()
    mockFetch(apiResponse(completedResponse))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('আপনার OTP এখনই পাঠান')

    expect(
      await screen.findByRole('heading', { name: 'English translation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Share your OTP immediately.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /Message analysis: Some indicators deserve attention/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'A request for private verification information',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Results may be wrong or incomplete.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /The message asks for a one-time code/,
    )
  })

  it('displays Bangla translation for English input detected automatically', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(apiResponse(completedBanglaResponse))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('Send your OTP now.')

    expect(
      await screen.findByRole('heading', { name: 'Bangla translation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('এখনই আপনার OTP পাঠান।')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'English translation' })).not.toBeInTheDocument()
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).not.toHaveProperty(
      'direction',
    )
  })

  it('shows both translations for other-language input detected automatically', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(apiResponse(completedBothTranslationsResponse))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('নমুনা বার্তা')

    expect(
      await screen.findByRole('heading', { name: 'English translation' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bangla translation' })).toBeInTheDocument()
    expect(screen.getByText('Share your OTP immediately.')).toBeInTheDocument()
    expect(screen.getByText('এখনই আপনার OTP পাঠান।')).toBeInTheDocument()
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).not.toHaveProperty(
      'direction',
    )
  })

  it('does not display malformed successful responses as findings', async () => {
    const user = userEvent.setup()
    mockFetch(
      apiResponse({
        status: 'completed',
        version: 'ai-analysis-response.v3',
        englishTranslation: {},
        banglaTranslation: null,
        analysis: {},
      }),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('A suspicious example')

    expect(
      (
        await screen.findAllByText(
          'The service returned an invalid result. No analysis is displayed.',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /Some indicators/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Share your OTP immediately/)).not.toBeInTheDocument()
  })

  it('does not fall back to local findings when the AI service is unavailable', async () => {
    const user = userEvent.setup()
    mockFetch(
      apiResponse(
        {
          status: 'unavailable',
          error: { code: 'provider_unavailable', message: 'Unavailable' },
        },
        503,
      ),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit(
      'Share your OTP now and claim your prize at https://example.test',
    )

    expect(
      (
        await screen.findAllByText(
          'The service is temporarily unavailable. No result was displayed; try again later.',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /verification information/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Pressure to act urgently/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /prize or unexpected money/ }),
    ).not.toBeInTheDocument()
  })

  it('handles provider errors and network failures without presenting a verdict', async () => {
    const user = userEvent.setup()
    mockFetch(
      apiResponse(
        {
          status: 'unavailable',
          error: { code: 'provider_failure', message: 'Failed' },
        },
        502,
      ),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('Please verify this message')
    expect(
      (
        await screen.findAllByText(
          'Analysis could not be completed. Try again later.',
        )
      ).length,
    ).toBeGreaterThan(0)

    const nextUser = userEvent.setup()
    mockFetch(new TypeError('network unavailable'))
    await nextUser.click(screen.getByRole('button', { name: 'Clear' }))
    await nextUser.type(
      screen.getByRole('textbox', { name: 'Suspicious message' }),
      'A second message',
    )
    await nextUser.click(screen.getByRole('button', { name: /Analyse message/ }))
    expect(
      (await screen.findAllByText(/Could not connect to the service/)).length,
    ).toBeGreaterThan(0)
  })

  it('distinguishes provider timeouts from a completed analysis', async () => {
    const user = userEvent.setup()
    mockFetch(
      apiResponse(
        {
          status: 'unavailable',
          error: { code: 'provider_timeout', message: 'Timed out' },
        },
        503,
      ),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('Please check this message')

    expect(
      (await screen.findAllByText('The analysis timed out. No result was displayed.'))
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /Message analysis: / }),
    ).not.toBeInTheDocument()
  })

  it('aborts a stalled browser request and displays no verdict', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>(
      (_, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    fireEvent.change(screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' }), {
      target: { value: 'A message to check' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })

    expect(
      screen.getAllByText(
        'বিশ্লেষণে সময়সীমা অতিক্রান্ত হয়েছে। কোনো ফলাফল দেখানো হয়নি।',
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /বার্তা বিশ্লেষণ:/ }),
    ).not.toBeInTheDocument()
  })

  it('explains rate limiting without treating it as an analysis result', async () => {
    const user = userEvent.setup()
    mockFetch(
      apiResponse(
        {
          status: 'unavailable',
          error: { code: 'rate_limited', message: 'Rate limited' },
        },
        503,
      ),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterAndSubmit('Please check this message')

    expect(
      (
        await screen.findAllByText(
          'Too many analysis requests came from this network. Please try again shortly; no result was displayed.',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /Message analysis: / }),
    ).not.toBeInTheDocument()
  })

  it('shows a loading state until the mocked analysis completes', async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pendingFetch)
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Suspicious message' }),
      'Test content',
    )
    expect(fetchMock).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Analyse message/ }))

    expect(screen.getAllByText('Analysis in progress…').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
    resolveResponse(apiResponse(completedResponse))
    expect(await screen.findByText('Share your OTP immediately.')).toBeInTheDocument()
  })

  it('switches disclosure to English without a translation-direction selector', async () => {
    const user = userEvent.setup()
    const metaDescription = document.createElement('meta')
    metaDescription.name = 'description'
    document.head.append(metaDescription)
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(
      screen.getByText(
        'Clicking Analyse sends your message to an external service for translation and analysis.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Understand suspicious messages and choose safer next steps.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'The original message is sent to an external service for translation and analysis. That service’s own data practices may apply.',
      ),
    ).toBeInTheDocument()
    expect(document.title).toBe('ShurokkhaLink BD — Check a suspicious message')
    expect(document.documentElement.lang).toBe('en')
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(
      'Use AI to analyse a suspicious message. The message is sent to an external service only when you choose to analyse it.',
    )
    expect(screen.queryByLabelText(/Translation direction/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/অনুবাদের দিক/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Analyse message/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Add some message text before analysing.',
    )
    await user.click(screen.getByRole('button', { name: 'বাংলা' }))
    expect(document.title).toBe('ShurokkhaLink BD — সন্দেহজনক বার্তা যাচাই')
    expect(document.documentElement.lang).toBe('bn')
    metaDescription.remove()
  })

  it('shows the exact warning and introduction credit in both interface languages', async () => {
    const user = userEvent.setup()
    mockFetch(apiResponse(completedResponse))
    render(<App />)
    await enterAndSubmit('নমুনা বার্তা')

    expect(
      screen.getByText('ফলাফল ভুল বা অসম্পূর্ণ হতে পারে।'),
    ).toBeInTheDocument()
    const banglaSubtitle = screen.getByText(
      'সন্দেহজনক বার্তা বুঝুন এবং নিরাপদ পরবর্তী পদক্ষেপ বেছে নিন।',
    )
    const banglaCredit = screen.getByText(
      '© ২০২৬ সাব্বির আহাম্মেদ। সর্বস্বত্ব সংরক্ষিত।',
    )
    expect(banglaSubtitle.nextElementSibling).toBe(banglaCredit)
    expect(screen.queryByText('© ২০২৬ সাব্বির আহাম্মেদ। সর্বস্বত্ব সংরক্ষিত।', {
      selector: '.footer-copy *',
    })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByText('Results may be wrong or incomplete.')).toBeInTheDocument()
    const englishSubtitle = screen.getByText(
      'Understand suspicious messages and choose safer next steps.',
    )
    const englishCredit = screen.getByText(
      '© 2026 Sabbir Ahammed, All Rights Reserved',
    )
    expect(englishSubtitle.nextElementSibling).toBe(englishCredit)
    expect(screen.queryByText('© 2026 Sabbir Ahammed, All Rights Reserved', {
      selector: '.footer-copy *',
    })).not.toBeInTheDocument()
    expect(screen.queryByText(/AI warning is not proof of fraud/)).not.toBeInTheDocument()
  })
})
