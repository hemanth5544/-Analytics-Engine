import { supabaseAdmin } from '../config/database.js';

export async function verifyApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required in x-api-key header' });
    }

    const { data: apiKeyData, error } = await supabaseAdmin
      .from('api_keys')
      .select('*, apps(*)')
      .eq('key', apiKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !apiKeyData) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    req.app_id = apiKeyData.app_id;
    req.apiKeyData = apiKeyData;
    next();
  } catch (error) {
    console.error('API Key verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
