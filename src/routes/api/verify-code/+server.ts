import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { invitationCodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { code } = data;

		if (!code) {
			return json({ error: 'Code is required.' }, { status: 400 });
		}

		const codeResult = await db.select().from(invitationCodes).where(eq(invitationCodes.code, code));
		
		if (codeResult.length === 0) {
			return json({ error: 'Invalid Invitation Code.' }, { status: 400 });
		}

		const inviteCode = codeResult[0];
		
		if (inviteCode.isUsed) {
			return json({ error: 'Invitation Code has already been used.' }, { status: 400 });
		}

		return json({
			success: true,
			type: inviteCode.type,
			encryptionMode: inviteCode.encryptionMode
		});
	} catch (error) {
		console.error('Error verifying code:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
