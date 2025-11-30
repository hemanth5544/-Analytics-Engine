import { supabaseAdmin } from '../config/database.js';
import UAParser from 'ua-parser-js';
import { getCache, setCache, deleteCachePattern } from '../utils/cache.js';

export async function collectEvent(req, res) {
  try {
    const { event, url, referrer, device, ipAddress, timestamp, metadata, userId } = req.body;

    if (!event || !url || !device || !timestamp) {
      return res.status(400).json({
        error: 'event, url, device, and timestamp are required'
      });
    }

    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const eventData = {
      app_id: req.app_id,
      event,
      url,
      referrer: referrer || null,
      device,
      ip_address: ipAddress || req.ip,
      user_id: userId || null,
      browser: result.browser.name || metadata?.browser || null,
      os: result.os.name || metadata?.os || null,
      screen_size: metadata?.screenSize || null,
      metadata: metadata || {},
      timestamp: new Date(timestamp).toISOString()
    };

    const { error: insertError } = await supabaseAdmin
      .from('analytics_events')
      .insert([eventData]);

    if (insertError) {
      console.error('Event insert error:', insertError);
      return res.status(500).json({ error: 'Failed to collect event' });
    }

    await deleteCachePattern(`analytics:*:${req.app_id}:*`);

    return res.status(201).json({
      message: 'Event collected successfully'
    });
  } catch (error) {
    console.error('Collect event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEventSummary(req, res) {
  try {
    const userId = req.query.userId;
    const { event, startDate, endDate, app_id } = req.query;

    if (!event) {
      return res.status(400).json({ error: 'event parameter is required' });
    }

    const cacheKey = `analytics:event_summary:${app_id || 'all'}:${event}:${startDate || 'none'}:${endDate || 'none'}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*, apps!inner(user_id)');

    query = query.eq('event', event);
    query = query.eq('apps.user_id', userId);

    if (app_id) {
      query = query.eq('app_id', app_id);
    }

    if (startDate) {
      query = query.gte('timestamp', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('timestamp', new Date(endDate).toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Event summary error:', error);
      return res.status(500).json({ error: 'Failed to fetch event summary' });
    }

    const uniqueUsers = new Set();
    const deviceCounts = {};

    events.forEach((evt) => {
      if (evt.user_id) {
        uniqueUsers.add(evt.user_id);
      }
      if (evt.device) {
        deviceCounts[evt.device] = (deviceCounts[evt.device] || 0) + 1;
      }
    });

    const summary = {
      event,
      count: events.length,
      uniqueUsers: uniqueUsers.size,
      deviceData: deviceCounts
    };

    await setCache(cacheKey, summary, 300);

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Get event summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserStats(req, res) {
  try {
    // const currentUserId = req.user.id;
    const { userId, app_id } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    const cacheKey = `analytics:user_stats:${app_id || 'all'}:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*, apps!inner(user_id)')
      .eq('user_id', userId)
      .eq('apps.user_id', userId);

    if (app_id) {
      query = query.eq('app_id', app_id);
    }

    const { data: events, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      console.error('User stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch user stats' });
    }

    if (!events || events.length === 0) {
      return res.status(404).json({ error: 'No events found for this user' });
    }

    const latestEvent = events[0];
    const deviceDetails = {
      browser: latestEvent.browser,
      os: latestEvent.os
    };

    const stats = {
      userId,
      totalEvents: events.length,
      deviceDetails,
      ipAddress: latestEvent.ip_address
    };

    await setCache(cacheKey, stats, 300);

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAnalyticsDashboard(req, res) {
  try {
    const userId = req.query.userId;
    const { app_id, startDate, endDate } = req.query;

    const cacheKey = `analytics:dashboard:${app_id || 'all'}:${startDate || 'none'}:${endDate || 'none'}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*, apps!inner(user_id, name)')
      .eq('apps.user_id', userId);

    if (app_id) {
      query = query.eq('app_id', app_id);
    }

    if (startDate) {
      query = query.gte('timestamp', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('timestamp', new Date(endDate).toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Dashboard error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }

    const totalEvents = events.length;
    const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;

    const eventCounts = {};
    const deviceCounts = {};
    const appCounts = {};

    events.forEach((evt) => {
      eventCounts[evt.event] = (eventCounts[evt.event] || 0) + 1;
      deviceCounts[evt.device] = (deviceCounts[evt.device] || 0) + 1;

      const appName = evt.apps.name;
      appCounts[appName] = (appCounts[appName] || 0) + 1;
    });

    const dashboard = {
      totalEvents,
      uniqueUsers,
      topEvents: Object.entries(eventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([event, count]) => ({ event, count })),
      deviceBreakdown: deviceCounts,
      appBreakdown: appCounts
    };

    await setCache(cacheKey, dashboard, 300);

    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
