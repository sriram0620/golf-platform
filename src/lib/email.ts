import { Resend } from 'resend'

// Initialize Resend with key, fallback to a dummy key to prevent crashes in dev if not set
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_12345')

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Email not sent to:', to, '| Subject:', subject)
      return { success: false, error: 'API key missing' }
    }

    const data = await resend.emails.send({
      from: 'Golf Charity <hello@golfcharity.co.uk>', // Default placeholder sender
      to,
      subject,
      text: text || '',
      html: html || '',
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export const emailTemplates = {
  welcome: (name: string, plan: string) => ({
    subject: 'Welcome to Golf Charity! 🏌️‍♂️',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for subscribing to the <strong>${plan}</strong> plan.</p>
      <p>Your subscription makes a massive impact. Don't forget to enter your recent Stableford scores to participate in the upcoming monthly draw!</p>
      <br/>
      <p>Best regards,<br/>The Golf Charity Team</p>
    `,
  }),
  
  drawPublished: (name: string, drawName: string, month: string) => ({
    subject: `Results are in for the ${drawName}! 🏆`,
    html: `
      <h2>Hi ${name},</h2>
      <p>The results for the <strong>${drawName}</strong> (${month}) have just been published.</p>
      <p>Head over to your dashboard or the public draws page to see the winning numbers and check if you've won!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings">View winnings</a>
      <br/>
      <p>Best regards,<br/>The Golf Charity Team</p>
    `,
  }),

  winnerVerified: (name: string, amount: string) => ({
    subject: 'Winner Verification Successful! 🎉',
    html: `
      <h2>Congratulations ${name}!</h2>
      <p>Your recent winning claim has been successfully verified by our team.</p>
      <p>Your prize of <strong>${amount}</strong> is now progressing to payout. You will receive the funds shortly to your registered account.</p>
      <br/>
      <p>Best regards,<br/>The Golf Charity Team</p>
    `,
  })
}
