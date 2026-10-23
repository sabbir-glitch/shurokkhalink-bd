import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('analyses a message and displays the warning and safer guidance', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'সন্দেহজনক বার্তা?' }),
    ).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' }),
      'আপনার OTP পাঠান',
    )
    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))

    expect(
      screen.getByRole('heading', { name: 'গোপন যাচাইকরণ তথ্য চাওয়া হয়েছে' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element?.classList.contains('evidence') ?? false,
      ),
    ).toHaveTextContent('OTP পাঠান')
    expect(screen.getByText(/কোড বা পাসওয়ার্ড শেয়ার করবেন না/)).toBeInTheDocument()
  })

  it('switches the full interface to English and localizes validation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'English' }))
    expect(
      screen.getByRole('heading', { name: 'Unsure about a message?' }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('group', { name: 'Choose language' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Go to the ShurokkhaLink BD home page' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Analyse message' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Add some message text before analysing.',
    )
  })

  it('provides an accessible empty-input error', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))

    const input = screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'বিশ্লেষণের আগে বার্তার লেখা যোগ করুন।',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'message-error')
  })

  it('loads an example, analyses it, and clears both the text and results', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'OTP অনুরোধ' }))
    const input = screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' })
    expect(input).toHaveValue('আপনার অ্যাকাউন্ট বন্ধ হবে। এখনই OTP পাঠান।')

    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))
    expect(
      screen.getByRole('heading', { name: 'গোপন যাচাইকরণ তথ্য চাওয়া হয়েছে' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2টি লক্ষণ পাওয়া গেছে।')

    await user.click(screen.getByRole('button', { name: 'মুছে ফেলুন' }))
    expect(input).toHaveValue('')
    expect(
      screen.queryByRole('heading', { name: 'গোপন যাচাইকরণ তথ্য চাওয়া হয়েছে' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('বিশ্লেষণ শুরু করতে উপরের বাক্সে একটি বার্তা লিখুন।'),
    ).toBeInTheDocument()
  })

  it('does not leave findings attached to text after the user edits it', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' })

    await user.type(input, 'আপনার OTP পাঠান')
    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))
    expect(
      screen.getByRole('heading', { name: 'গোপন যাচাইকরণ তথ্য চাওয়া হয়েছে' }),
    ).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'আজ বিকেলে দেখা হবে।' } })

    expect(
      screen.queryByRole('heading', { name: 'গোপন যাচাইকরণ তথ্য চাওয়া হয়েছে' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(
      screen.getByText('বিশ্লেষণ শুরু করতে উপরের বাক্সে একটি বার্তা লিখুন।'),
    ).toBeInTheDocument()
  })

  it('demonstrates prize claims and link presence without calling the link proof of fraud', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'পুরস্কারের বার্তা' }))
    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))
    expect(
      screen.getByRole('heading', { name: 'পুরস্কার বা অপ্রত্যাশিত অর্থের দাবি' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'English' }))
    await user.click(screen.getByRole('button', { name: 'Message with a link' }))
    expect(screen.getByRole('textbox', { name: 'Suspicious message' })).toHaveValue(
      'Check your parcel details at https://example.com/parcel',
    )
    await user.click(screen.getByRole('button', { name: /Analyse message/ }))

    expect(
      screen.getByRole('heading', { name: 'The message contains a link' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/A link alone is not evidence of fraud/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'The link uses HTTP' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'A prize or unexpected money claim' }),
    ).not.toBeInTheDocument()
  })

  it('shows category-matched explanations and safer actions for each finding', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'English' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Suspicious message' }), {
      target: {
        value:
          'Act now! Share your OTP to claim your prize at http://example.test/claim',
      },
    })
    await user.click(screen.getByRole('button', { name: /Analyse message/ }))

    expect(
      screen.getByRole('heading', {
        name: 'A request for private verification information',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Pressure to act urgently' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'A prize or unexpected money claim' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'The message contains a link' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Do not share codes or passwords. Verify the request through a known official channel for the organisation.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Take your time. Verify the information through a known official channel outside the message.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Do not pay a fee or share information. Check independently with the organisation through an official source.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/A link alone is not evidence of fraud/),
    ).toBeInTheDocument()
  })

  it('shows explanations specific to each observed URL structure', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'English' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Suspicious message' }), {
      target: {
        value: 'http://user:pass@192.0.2.1/login https://xn--e1afmkfd.example/',
      },
    })
    await user.click(screen.getByRole('button', { name: /Analyse message/ }))

    expect(
      screen.getByRole('heading', { name: 'The link uses HTTP' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'The link contains user information' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'The link uses an IP address as its host',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'The link host contains punycode' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/HTTP does not provide the same encryption as HTTPS/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/A URL containing a username or password is unusual/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/An IP address in a website link is not proof of fraud/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Punycode represents domains with non-Latin characters/),
    ).toBeInTheDocument()
  })

  it('keeps submitted text local without network, storage, cookie, or console writes', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const xhrSend = vi
      .spyOn(XMLHttpRequest.prototype, 'send')
      .mockImplementation(() => undefined)
    const storageWrite = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => undefined)
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const localStorageBefore = localStorage.length
    const sessionStorageBefore = sessionStorage.length
    const cookiesBefore = document.cookie
    render(<App />)

    await user.type(
      screen.getByRole('textbox', { name: 'সন্দেহজনক বার্তা' }),
      'Share your OTP at http://example.test',
    )
    await user.click(screen.getByRole('button', { name: /বার্তা বিশ্লেষণ করুন/ }))
    await user.click(screen.getByRole('button', { name: 'মুছে ফেলুন' }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(xhrSend).not.toHaveBeenCalled()
    expect(windowOpen).not.toHaveBeenCalled()
    expect(storageWrite).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(localStorageBefore)
    expect(sessionStorage.length).toBe(sessionStorageBefore)
    expect(document.cookie).toBe(cookiesBefore)
    expect(consoleLog).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })
})
