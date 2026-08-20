import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { telegramNodes } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdminAuth } from '$lib/server/adminAuth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  requireAdminAuth(request);
  try {
    const nodes = await db
      .select()
      .from(telegramNodes)
      .orderBy(desc(telegramNodes.createdAt));

    return json({
      success: true,
      data: nodes
    });
  } catch (error: any) {
    console.error("GET telegram-nodes ERROR:", error);
    return json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  requireAdminAuth(request);
  try {
    const body = await request.json();
    const { name, botToken, chatId } = body;

    if (!name || !botToken || !chatId) {
      return json({ success: false, error: 'Name, Bot Token, and Chat ID are required' }, { status: 400 });
    }

    const newNode = {
      id: crypto.randomUUID(),
      name,
      botToken,
      chatId,
      isActive: true,
      createdAt: new Date()
    };

    await db.insert(telegramNodes).values(newNode);

    return json({
      success: true,
      data: newNode
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
