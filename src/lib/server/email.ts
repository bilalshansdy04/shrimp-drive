import { Resend } from 'resend';
import { RESEND_API_KEY, MAIL_FROM_ADDRESS, BASE_URL } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
	const verificationUrl = `${BASE_URL}/verify-email/${token}`;

	try {
		await resend.emails.send({
			from: MAIL_FROM_ADDRESS,
			to: email,
			subject: 'Verify your Shrimp Drive account',
			html: `
				<h1>Welcome to Shrimp Drive!</h1>
				<p>Please verify your email address by clicking the link below:</p>
				<a href="${verificationUrl}">${verificationUrl}</a>
				<p>This link will expire in 24 hours.</p>
			`
		});
	} catch (error) {
		console.error('Error sending verification email:', error);
	}
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `${BASE_URL}/reset-password/${token}`;

	try {
		await resend.emails.send({
			from: MAIL_FROM_ADDRESS,
			to: email,
			subject: 'Reset your Shrimp Drive password',
			html: `
				<h1>Password Reset Request</h1>
				<p>You requested to reset your password. Click the link below to set a new one:</p>
				<a href="${resetUrl}">${resetUrl}</a>
				<p>If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
			`
		});
	} catch (error) {
		console.error('Error sending reset email:', error);
	}
}
