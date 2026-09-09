import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { VALID_KEYS, normalizeKey, NORMALIZED_VALID_KEYS_MAP } from './data/validKeys';

// In Vercel serverless environments, root is read-only so fallback to /tmp or memory
const REDEEMED_FILE = process.env.VERCEL
  ? path.join('/tmp', 'redeemed_keys.json')
  : path.join(process.cwd(), 'data', 'redeemed_keys.json');

let inMemoryRedeemed: Record<string, { deviceId: string; redeemedAt: string }> = {};

function loadRedeemedKeys(): Record<string, { deviceId: string; redeemedAt: string }> {
  try {
    if (fs.existsSync(REDEEMED_FILE)) {
      const data = fs.readFileSync(REDEEMED_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...inMemoryRedeemed, ...parsed };
    }
  } catch (err) {
    console.error('Error loading redeemed keys:', err);
  }
  return inMemoryRedeemed;
}

function saveRedeemedKeys(data: Record<string, { deviceId: string; redeemedAt: string }>) {
  inMemoryRedeemed = { ...data };
  try {
    const dir = path.dirname(REDEEMED_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REDEEMED_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving redeemed keys to disk (using memory cache):', err);
  }
}

const CLOUD_DB_KEY = '964o72tf';
const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1547178065568866364/C8IxRBvPp8WiFuc0Cj6l20AtBKp1VRgYygKUGOhZORw0bIm1mJaQwpl2eyVQfvDG-WB_';

async function sendDiscordWebhook(key: string, deviceId: string) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `a user has used this lifetime ${key} it can only be used once.`,
        embeds: [
          {
            title: '🔑 Lifetime Key Activated',
            description: `**Key:** \`${key}\`\n**Device ID:** \`${deviceId}\`\n**Notice:** It can only be used once.`,
            color: 3447003,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (webhookErr) {
    console.error('Error sending Discord webhook:', webhookErr);
  }
}

// Cached friend profiles with official Roblox CDN headshots
export const DEFAULT_FRIENDS = [
  {
    id: 51193634,
    name: 'DinoWILD',
    displayName: 'DinoWILD',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-76F7D48E1533A284AAEF024C5165A1C0-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 10205448326,
    name: 'lamaria801',
    displayName: 'Xouraxdtop1raider',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-17B5ADE6CAAEB318FAFA454B9A5805A1-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 828415927,
    name: 'vintagetoysandmore',
    displayName: 'vintage',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1D2835D7E504881BFEC82C66AFC1C4AC-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
];

export function setupApiRoutes(app: express.Express) {
  const router = express.Router();

  // API: Get default friends
  router.get('/roblox/friends', (_req: Request, res: Response) => {
    res.json({ friends: DEFAULT_FRIENDS });
  });

  // API: Search Roblox users by username or display name
  router.get('/roblox/search', async (req: Request, res: Response) => {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ users: DEFAULT_FRIENDS });
    }

    try {
      // 1. Direct username lookup
      let exactUsers: any[] = [];
      try {
        const exactRes = await fetch('https://users.roblox.com/v1/usernames/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [query], excludeBannedUsers: true }),
        });
        if (exactRes.ok) {
          const exactData = await exactRes.json();
          exactUsers = exactData.data || [];
        }
      } catch (err) {
        console.error('Exact lookup error:', err);
      }

      // 2. Keyword search
      let searchUsers: any[] = [];
      try {
        const searchRes = await fetch(
          `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(query)}&limit=10`
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          searchUsers = searchData.data || [];
        }
      } catch (err) {
        console.error('Keyword search error:', err);
      }

      // Combine and deduplicate
      const combined = [...exactUsers, ...searchUsers];
      const seen = new Set<number>();
      const uniqueUsers: any[] = [];
      for (const u of combined) {
        if (u && u.id && !seen.has(u.id)) {
          seen.add(u.id);
          uniqueUsers.push(u);
        }
      }

      // If no users found from API, check fallback list
      if (uniqueUsers.length === 0) {
        const queryLower = query.toLowerCase();
        const matchedFallbacks = DEFAULT_FRIENDS.filter(
          (f) =>
            f.name.toLowerCase().includes(queryLower) ||
            f.displayName.toLowerCase().includes(queryLower)
        );
        return res.json({ users: matchedFallbacks });
      }

      // Fetch avatar headshots for top 10 unique users
      const targetIds = uniqueUsers.slice(0, 10).map((u) => u.id);
      let avatarMap: Record<number, string> = {};

      try {
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${targetIds.join(',')}&size=150x150&format=Png&isCircular=true`
        );
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          if (Array.isArray(thumbData.data)) {
            for (const item of thumbData.data) {
              if (item.targetId && item.imageUrl) {
                avatarMap[item.targetId] = item.imageUrl;
              }
            }
          }
        }
      } catch (err) {
        console.error('Thumbnails fetch error:', err);
      }

      const results = uniqueUsers.slice(0, 10).map((u) => ({
        id: u.id,
        name: u.name,
        displayName: u.displayName || u.name,
        hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
        avatarUrl:
          avatarMap[u.id] ||
          `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-76F7D48E1533A284AAEF024C5165A1C0-Png/150/150/AvatarHeadshot/Png/isCircular`,
      }));

      return res.json({ users: results });
    } catch (error) {
      console.error('Roblox search route failed:', error);
      const queryLower = query.toLowerCase();
      const matched = DEFAULT_FRIENDS.filter(
        (f) =>
          f.name.toLowerCase().includes(queryLower) ||
          f.displayName.toLowerCase().includes(queryLower)
      );
      return res.json({ users: matched });
    }
  });

  // API: Verify and redeem a key (One-time use, locked to device & browser)
  router.post('/keys/verify', async (req: Request, res: Response) => {
    const rawKey = String(req.body?.key || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();
    const normKey = normalizeKey(rawKey);

    if (!normKey) {
      return res.status(400).json({
        success: false,
        error: 'missing_key',
        message: 'Please enter a key to continue.',
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'missing_device',
        message: 'Device identifier is missing.',
      });
    }

    if (!NORMALIZED_VALID_KEYS_MAP.has(normKey)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_key',
        message: 'Invalid key. To get a key you must join the discord server: https://discord.gg/vcg3Uaw9Z2',
        discordUrl: 'https://discord.gg/vcg3Uaw9Z2',
      });
    }

    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(normKey) || normKey;
    const redeemed = loadRedeemedKeys();
    const existing = redeemed[normKey] || redeemed[canonicalKey];

    if (existing) {
      return res.status(403).json({
        success: false,
        error: 'already_used',
        message: 'This key has already been used and is expired. Keys can only be used once. To get a key you must join the discord server: https://discord.gg/vcg3Uaw9Z2',
        discordUrl: 'https://discord.gg/vcg3Uaw9Z2',
      });
    }

    // Check online global cloud KV database
    try {
      const cloudRes = await fetch(
        `https://keyvalue.immanuel.co/api/KeyVal/GetValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}`,
        { cache: 'no-store' }
      );
      if (cloudRes.ok) {
        const cloudVal = (await cloudRes.text()).replace(/^"|"$/g, '').trim();
        if (cloudVal && cloudVal !== '') {
          // Key was already redeemed in cloud DB on another device or browser!
          redeemed[normKey] = {
            deviceId: cloudVal,
            redeemedAt: new Date().toISOString(),
          };
          saveRedeemedKeys(redeemed);

          return res.status(403).json({
            success: false,
            error: 'already_used',
            message: 'This key has already been used and is expired. Keys can only be used once. To get a key you must join the discord server: https://discord.gg/vcg3Uaw9Z2',
            discordUrl: 'https://discord.gg/vcg3Uaw9Z2',
          });
        }
      }
    } catch (err) {
      console.error('Cloud KV check error in apiServer:', err);
    }

    // Burn key in local file
    redeemed[normKey] = {
      deviceId,
      redeemedAt: new Date().toISOString(),
    };
    redeemed[canonicalKey] = redeemed[normKey];
    saveRedeemedKeys(redeemed);

    // Burn key in cloud database
    try {
      await fetch(
        `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/used_${deviceId}`,
        { method: 'POST', headers: { 'Content-Length': '0' } }
      );
    } catch (err) {
      console.error('Cloud KV save error in apiServer:', err);
    }

    // Send Discord webhook notification
    await sendDiscordWebhook(canonicalKey, deviceId);

    return res.json({
      success: true,
      message: 'Key successfully activated! Send Robux is now unlocked on this device.',
    });
  });

  // API: Check device unlock status
  router.post('/keys/status', (req: Request, res: Response) => {
    const deviceId = String(req.body?.deviceId || '').trim();
    if (!deviceId) {
      return res.json({ isUnlocked: false });
    }

    const redeemed = loadRedeemedKeys();
    const isUnlocked = Object.values(redeemed).some((r) => r.deviceId === deviceId);

    return res.json({ isUnlocked });
  });

  // Health check
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Mount at both `/api` prefix and root so any Vercel/Express routing works seamlessly
  app.use('/api', router);
  app.use(router);
}
