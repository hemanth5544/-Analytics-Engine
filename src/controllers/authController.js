import { supabaseAdmin } from '../config/database.js';
import { generateApiKey } from '../utils/apiKeyGenerator.js';

export async function registerApp(req, res) {
  try {
    const { name, domain,userId } = req.body;
    // const userId = req.user.id;

    if (!name || !domain) {
      return res.status(400).json({ error: 'Name and domain are required' });
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .insert([{ user_id: userId, name, domain }])
      .select()
      .single();

    if (appError) {
      console.error('App creation error:', appError);
      return res.status(500).json({ error: 'Failed to register app' });
    }

    const apiKey = generateApiKey();

    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .insert([{ app_id: app.id, key: apiKey, is_active: true }])
      .select()
      .single();

    if (keyError) {
      console.error('API key creation error:', keyError);
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    return res.status(201).json({
      message: 'App registered successfully',
      app: { id: app.id, name: app.name, domain: app.domain, created_at: app.created_at },
      apiKey: apiKeyData.key
    });
  } catch (error) {
    console.error('Register app error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getApiKey(req, res) {
  try {
    const { app_id,userId} = req.query;
    // const userId = req.user.id;

    if (!app_id) {
      return res.status(400).json({ error: 'app_id is required' });
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select('*')
      .eq('id', app_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (appError || !app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const { data: apiKeys, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('app_id', app_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (keyError) {
      console.error('API key fetch error:', keyError);
      return res.status(500).json({ error: 'Failed to fetch API key' });
    }

    if (!apiKeys || apiKeys.length === 0) {
      return res.status(404).json({ error: 'No active API key found' });
    }

    return res.status(200).json({
      apiKey: apiKeys[0].key,
      app_id: app_id,
      created_at: apiKeys[0].created_at,
      expires_at: apiKeys[0].expires_at
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokeApiKey(req, res) {
  try {
    const { api_key,userId } = req.body;
    // const userId = req.user.id;

    if (!api_key) {
      return res.status(400).json({ error: 'api_key is required' });
    }

    const { data: apiKeyData, error: findError } = await supabaseAdmin
      .from('api_keys')
      .select('*, apps(*)')
      .eq('key', api_key)
      .maybeSingle();

    if (findError || !apiKeyData) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (apiKeyData.apps.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to revoke this API key' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('key', api_key);

    if (updateError) {
      console.error('API key revoke error:', updateError);
      return res.status(500).json({ error: 'Failed to revoke API key' });
    }

    return res.status(200).json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function regenerateApiKey(req, res) {
  try {
    const { app_id } = req.body;
    const userId = req.user.id;

    if (!app_id) {
      return res.status(400).json({ error: 'app_id is required' });
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select('*')
      .eq('id', app_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (appError || !app) {
      return res.status(404).json({ error: 'App not found' });
    }

    await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('app_id', app_id)
      .eq('is_active', true);

    const newApiKey = generateApiKey();

    const { data: newKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .insert([{ app_id: app_id, key: newApiKey, is_active: true }])
      .select()
      .single();

    if (keyError) {
      console.error('New API key creation error:', keyError);
      return res.status(500).json({ error: 'Failed to regenerate API key' });
    }

    return res.status(200).json({
      message: 'API key regenerated successfully',
      apiKey: newKeyData.key,
      created_at: newKeyData.created_at
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserApps(req, res) {
  try {
    const userId = req.query.userId;//TODO: fix

    const { data: apps, error } = await supabaseAdmin
      .from('apps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch apps error:', error);
      return res.status(500).json({ error: 'Failed to fetch apps' });
    }

    return res.status(200).json({ apps });
  } catch (error) {
    console.error('Get user apps error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.status(200).json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name }
  });
}

export function logout(req, res) {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destroy failed' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
}
