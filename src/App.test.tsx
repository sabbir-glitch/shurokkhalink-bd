import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const completedResponse = {
  status: 'completed',
  version: 'ai-analysis-response.v1',
  translation: {
    version: 'translation-response.v1',
    sourceLanguage: 'bn',
    translatedText: 'Share your OTP immediately.',
  },
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

async function enterConsentAndSubmit(message = 'OTP: 123456. https://example.test') {
  const user = userEvent.setup()
  const input =
    screen.queryByRole('textbox', { name: 'সন্দেহজনক বার্তা' }) ??
    screen.getByRole('textbox', { name: 'Suspicious message' })
  fireEvent.change(input, { target: { value: message } })
  const consent =
    screen.queryByRole('checkbox', { name: /আমি বুঝেছি যে মূল বার্তাটি/ }) ??
    screen.getByRole('checkbox', { name: /I understand that the original message/ })
  await user.click(consent)
  const submit =
    screen.queryByRole('button', { name: /AI দিয়ে বার্তা বিশ্লেষণ করুন/ }) ??
    screen.getByRole('button', { name: /Analyse with AI/ })
  await user.click(submit)
  return user
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('AI-only App workflow', () => {
  it('starts in Bangla and explains third-party processing and consent', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'সন্দেহজনক বার্তা?' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/তৃতীয় পক্ষের সেবায় পাঠানো হবে/).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('checkbox', { name: /আমি বুঝেছি/ })).not.toBeChecked()
    expect(
      screen.getByRole('heading', { name: 'পাঠানোর আগে গোপনীয়তা-রক্ষিত পূর্বরূপ' }),
    ).toBeInTheDocument()
  })

  it('requires consent and makes no request without it', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(apiResponse(completedResponse))
    render(<App />)
    await user.type(
      screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' }),
      'নমুনা বার্তা',
    )
    await user.click(
      screen.getByRole('button', { name: /AI দিয়ে বার্তা বিশ্লেষণ করুন/ }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'চালিয়ে যেতে তৃতীয় পক্ষের AI প্রক্রিয়াকরণে সম্মতি দিন।',
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      screen.queryByText(completedResponse.analysis.summary),
    ).not.toBeInTheDocument()
  })

  it('updates a redacted preview and sends the original only after consent', async () => {
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
    await enterConsentAndSubmit()

    expect(screen.getByText('OTP: [redacted]. [link redacted]')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/analyze',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        body: expect.stringContaining('"message":"OTP: 123456. https://example.test"'),
      }),
    )
    expect(
      (
        await screen.findAllByText(
          'AI বিশ্লেষণ সেবা এখনো কনফিগার করা হয়নি। কোনো ফলাফল তৈরি বা দেখানো হয়নি।',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Share your OTP immediately/)).not.toBeInTheDocument()
  })

  it('displays the validated translation before the structured AI indicators', async () => {
    const user = userEvent.setup()
    mockFetch(apiResponse(completedResponse))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterConsentAndSubmit('আপনার OTP এখনই পাঠান')

    expect(
      await screen.findByRole('heading', { name: 'English translation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Share your OTP immediately.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /AI analysis: Some indicators deserve attention/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'A request for private verification information',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/An AI warning is not proof of fraud/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /The message asks for a one-time code/,
    )
  })

  it('does not display malformed successful responses as findings', async () => {
    const user = userEvent.setup()
    mockFetch(apiResponse({ status: 'completed', translation: {}, analysis: {} }))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterConsentAndSubmit('A suspicious example')

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
    await enterConsentAndSubmit(
      'Share your OTP now and claim your prize at https://example.test',
    )

    expect(
      (
        await screen.findAllByText(
          'The AI service is temporarily unavailable. No result was displayed; try again later.',
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
    await enterConsentAndSubmit('Please verify this message')
    expect(
      (
        await screen.findAllByText(
          'AI analysis could not be completed. Try again later; do not assume the message is safe.',
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
    await nextUser.click(
      screen.getByRole('checkbox', { name: /I understand that the original message/ }),
    )
    await nextUser.click(screen.getByRole('button', { name: /Analyse with AI/ }))
    expect(
      (await screen.findAllByText(/Could not connect to the analysis service/)).length,
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
    await enterConsentAndSubmit('Please check this message')

    expect(
      (await screen.findAllByText('The analysis timed out. No result was displayed.'))
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /AI analysis: / }),
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
      screen.getByRole('checkbox', { name: /আমি বুঝেছি যে মূল বার্তাটি/ }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /AI দিয়ে বার্তা বিশ্লেষণ করুন/ }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })

    expect(
      screen.getAllByText(
        'বিশ্লেষণে সময়সীমা অতিক্রান্ত হয়েছে। কোনো ফলাফল দেখানো হয়নি।',
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /AI বিশ্লেষণ:/ }),
    ).not.toBeInTheDocument()
  })

  it('explains rate limiting without treating it as an analysis result', async () => {
    const user = userEvent.setup()
    mockFetch(
      apiResponse(
        {
          status: 'unavailable',
          error: { code: 'provider_rate_limited', message: 'Rate limited' },
        },
        503,
      ),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))
    await enterConsentAndSubmit('Please check this message')

    expect(
      (
        await screen.findAllByText(
          'The AI service is receiving too many requests. Try again shortly; no analysis was displayed.',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('heading', { name: /AI analysis: / }),
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
    await user.click(
      screen.getByRole('checkbox', { name: /I understand that the original message/ }),
    )
    await user.click(screen.getByRole('button', { name: /Analyse with AI/ }))

    expect(screen.getAllByText('AI analysis in progress…').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
    resolveResponse(apiResponse(completedResponse))
    expect(await screen.findByText('Share your OTP immediately.')).toBeInTheDocument()
  })

  it('switches key consent and error copy to English', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(
      screen.getByRole('checkbox', { name: /I understand that the original message/ }),
    ).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'Suspicious message' }),
      'Example',
    )
    await user.click(screen.getByRole('button', { name: /Analyse with AI/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Consent to third-party AI processing before continuing.',
    )
  })
})
