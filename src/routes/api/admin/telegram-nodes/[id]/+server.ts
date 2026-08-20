import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { telegramNodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminAuth } from '$lib/server/adminAuth';

export async function PATCH({ request, params }: { request: Request, params: { id: string } }) {
  requireAdminAuth(request);
  try {
    const { id } = params;
    const body = await request.json();
    const { name, botToken, chatId, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (botToken !== undefined) updateData.botToken = botToken;
    if (chatId !== undefined) updateData.chatId = chatId;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(telegramNodes).set(updateData).where(eq(telegramNodes.id, id));

    return json({
      success: true
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE({ request, params }: { request: Request, params: { id: string } }) {
  requireAdminAuth(request);
  try {
    const { id } = params;
    
    await db.delete(telegramNodes).where(eq(telegramNodes.id, id));

    return json({
      success: true
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
