import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { appSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminAuth } from '$lib/server/adminAuth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  requireAdminAuth(request);
  try {
    const settings = await db.select().from(appSettings);
    
    // Convert array of key-value pairs to an object
    const settingsObject = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return json({
      success: true,
      data: settingsObject
    });
  } catch (error: any) {
    console.error('GET settings ERROR:', error);
    return json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  requireAdminAuth(request);
  try {
    const body = await request.json();
    
    // Body is an object of key-value pairs to update
    const keys = Object.keys(body);
    
    // We will do upsert manually by checking existence or using onConflictDoUpdate
    // SQLite upsert:
    for (const key of keys) {
      const value = String(body[key]);
      await db.insert(appSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value, updatedAt: new Date() }
        });
    }

    return json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error: any) {
    console.error('PATCH settings ERROR:', error);
    return json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
};
