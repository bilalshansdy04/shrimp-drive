import { RESEND_API_KEY, MAIL_FROM_ADDRESS, BASE_URL } from '$env/static/private';

// We reuse RESEND_API_KEY as the Brevo API Key to avoid requiring .env changes.
const BREVO_API_KEY = RESEND_API_KEY;

export async function sendVerificationEmail(email: string, otpCode: string) {
	try {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': BREVO_API_KEY
			},
			body: JSON.stringify({
				sender: { email: MAIL_FROM_ADDRESS, name: 'Shrimp Drive' },
				to: [{ email }],
				subject: 'Verify your Shrimp Drive account',
				htmlContent: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2>Welcome to Shrimp Drive!</h2>
						<p>Please verify your email address by entering the following OTP code:</p>
						<div style="background-color: #f4f4f5; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px;">
							${otpCode}
						</div>
						<p>This code will expire in 24 hours.</p>
					</div>
				`
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Brevo API Error:', errorData);
		}
	} catch (error) {
		console.error('Error sending verification email:', error);
	}
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `${BASE_URL}/reset-password/${token}`;

	try {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': BREVO_API_KEY
			},
			body: JSON.stringify({
				sender: { email: MAIL_FROM_ADDRESS, name: 'Shrimp Drive' },
				to: [{ email }],
				subject: 'Reset your Shrimp Drive password',
				htmlContent: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2>Password Reset Request</h2>
						<p>You requested to reset your password. Click the link below to set a new one:</p>
						<a href="${resetUrl}">${resetUrl}</a>
						<p>If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
					</div>
				`
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Brevo API Error:', errorData);
		}
	} catch (error) {
		console.error('Error sending reset email:', error);
	}
}
