import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
      // Successful login, return the master key as the bearer token
      return json({
        success: true,
        token: env.ADMIN_MASTER_KEY
      });
    }

    return json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
