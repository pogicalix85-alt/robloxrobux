import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { VALID_KEYS, normalizeKey, NORMALIZED_VALID_KEYS_MAP } from './data/validKeys';

// In Vercel serverless environments, root is read-only so fallback to /tmp or memory
const REDEEMED_FILE = process.env.VERCEL
  ? path.join('/tmp', 'redeemed_keys.json')
  : path.join(process.cwd(), 'data', 'redeemed_keys.json');

const DISABLED_FILE = process.env.VERCEL
  ? path.join('/tmp', 'disabled_keys.json')
  : path.join(process.cwd(), 'data', 'disabled_keys.json');

const ADMIN_PASSWORD = 'broisgoofy';

interface RedeemedRecord {
  deviceId: string;
  redeemedAt: string;
  isDisabled?: boolean;
}

let inMemoryRedeemed: Record<string, RedeemedRecord> = {};
let inMemoryDisabled: Set<string> = new Set();

function loadDisabledKeys(): Set<string> {
  try {
    if (fs.existsSync(DISABLED_FILE)) {
      const data = fs.readFileSync(DISABLED_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((k: string) => inMemoryDisabled.add(normalizeKey(k)));
      }
    }
  } catch (err) {
    console.error('Error loading disabled keys:', err);
  }
  return inMemoryDisabled;
}

function saveDisabledKeys(keysSet: Set<string>) {
  inMemoryDisabled = new Set(keysSet);
  try {
    const dir = path.dirname(DISABLED_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISABLED_FILE, JSON.stringify(Array.from(keysSet), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving disabled keys to disk (using memory cache):', err);
  }
}

function loadRedeemedKeys(): Record<string, RedeemedRecord> {
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

function saveRedeemedKeys(data: Record<string, RedeemedRecord>) {
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

const CLOUD_DB_KEY = '8xzdudn0';
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
    id: 1755732316,
    name: 'mPhase',
    displayName: 'mPhase',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 184518779,
    name: 'ProjectSupreme',
    displayName: 'ProjectSupreme',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-17B5ADE6CAAEB318FAFA454B9A5805A1-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 828415927,
    name: 'vintagetoysandmore',
    displayName: 'vintage',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1D2835D7E504881BFEC82C66AFC1C4AC-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 156,
    name: 'builderman',
    displayName: 'Builderman',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-12F266F50BFB1CD460E083B81CBEB934-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 10205448326,
    name: 'lamaria801',
    displayName: 'Xouraxdtop1raider',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-17B5ADE6CAAEB318FAFA454B9A5805A1-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 51193634,
    name: 'DinoWILD',
    displayName: 'DinoWILD',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-76F7D48E1533A284AAEF024C5165A1C0-Png/150/150/AvatarHeadshot/Png/isCircular',
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

    // Check if key has been explicitly disabled by Admin
    const disabledKeys = loadDisabledKeys();
    if (disabledKeys.has(normKey) || disabledKeys.has(normalizeKey(canonicalKey))) {
      return res.status(403).json({
        success: false,
        error: 'disabled_key',
        message: 'This key has been disabled by the administrator.',
      });
    }

    const redeemed = loadRedeemedKeys();
    const existing = redeemed[normKey] || redeemed[canonicalKey];

    if (existing) {
      if (existing.isDisabled) {
        return res.status(403).json({
          success: false,
          error: 'disabled_key',
          message: 'This key has been disabled by the administrator.',
        });
      }
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
          if (cloudVal === 'disabled' || cloudVal.startsWith('disabled')) {
            disabledKeys.add(normKey);
            saveDisabledKeys(disabledKeys);
            return res.status(403).json({
              success: false,
              error: 'disabled_key',
              message: 'This key has been disabled by the administrator.',
            });
          }

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
      isDisabled: false,
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

  // API: Check device unlock status (accounts for disabled/revoked keys)
  router.post('/keys/status', (req: Request, res: Response) => {
    const deviceId = String(req.body?.deviceId || '').trim();
    const rawActiveKey = String(req.body?.activeKey || '').trim();
    const activeKey = normalizeKey(rawActiveKey);
    const disabledKeys = loadDisabledKeys();

    // 1. If device's active key is specifically marked as disabled -> REVOKED!
    if (activeKey && (disabledKeys.has(activeKey) || disabledKeys.has(normalizeKey(activeKey)))) {
      return res.json({ isUnlocked: false, isRevoked: true, reason: 'disabled_key' });
    }

    const redeemed = loadRedeemedKeys();

    // 2. Check if active key is in redeemed records and disabled
    if (activeKey && (redeemed[activeKey] || redeemed[rawActiveKey])) {
      const rec = redeemed[activeKey] || redeemed[rawActiveKey];
      if (rec.isDisabled) {
        return res.json({ isUnlocked: false, isRevoked: true, reason: 'disabled_key' });
      }
      return res.json({ isUnlocked: true });
    }

    // 3. Check by deviceId across all redeemed records
    if (deviceId) {
      const matchingEntries = Object.entries(redeemed).filter(
        ([_, val]) => val.deviceId === deviceId
      );

      if (matchingEntries.length > 0) {
        const isAnyRevoked = matchingEntries.some(([key, val]) => {
          const norm = normalizeKey(key);
          return val.isDisabled || disabledKeys.has(norm);
        });

        if (isAnyRevoked) {
          return res.json({ isUnlocked: false, isRevoked: true, reason: 'disabled_key' });
        }

        return res.json({ isUnlocked: true });
      }
    }

    // 4. If activeKey is provided and is a valid key that has not been disabled
    if (activeKey && NORMALIZED_VALID_KEYS_MAP.has(activeKey)) {
      return res.json({ isUnlocked: true });
    }

    return res.json({ isUnlocked: false });
  });

  // ================= ADMIN API (Protected by password "broisgoofy") =================

  // Admin login check
  router.post('/admin/verify', (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password === ADMIN_PASSWORD) {
      return res.json({ success: true, message: 'Admin authenticated' });
    }
    return res.status(401).json({ success: false, message: 'Invalid password' });
  });

  // Client / Admin: Sync device active key to server records
  router.post('/admin/sync-active-device', (req: Request, res: Response) => {
    const rawKey = String(req.body?.key || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();
    const normKey = normalizeKey(rawKey);

    if (!normKey || !deviceId) {
      return res.json({ success: false });
    }

    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(normKey) || normKey;
    const disabledKeys = loadDisabledKeys();

    if (disabledKeys.has(normKey) || disabledKeys.has(normalizeKey(canonicalKey))) {
      return res.json({ success: false, isDisabled: true, isRevoked: true });
    }

    const redeemed = loadRedeemedKeys();
    if (!redeemed[normKey] && !redeemed[canonicalKey]) {
      redeemed[normKey] = {
        deviceId,
        redeemedAt: new Date().toISOString(),
        isDisabled: false,
      };
      saveRedeemedKeys(redeemed);
    }

    return res.json({ success: true, isUnlocked: true });
  });

  // Admin: Get all keys data (catalog of 500 keys, redeemed keys & disabled keys)
  router.post('/admin/keys', (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const redeemed = loadRedeemedKeys();
    const disabledKeys = Array.from(loadDisabledKeys());
    const seen = new Set<string>();
    const redeemedList: Array<{
      key: string;
      deviceId: string;
      redeemedAt: string;
      isDisabled: boolean;
    }> = [];

    for (const [key, val] of Object.entries(redeemed)) {
      const norm = normalizeKey(key);
      if (!seen.has(norm)) {
        seen.add(norm);
        const canonical = NORMALIZED_VALID_KEYS_MAP.get(norm) || key;
        const isDisabled = Boolean(
          val.isDisabled || disabledKeys.includes(norm) || disabledKeys.includes(normalizeKey(canonical))
        );
        redeemedList.push({
          key: canonical,
          deviceId: val.deviceId,
          redeemedAt: val.redeemedAt,
          isDisabled,
        });
      }
    }

    // Build master catalog of all 500 keys with real-time status
    const allKeys = VALID_KEYS.map((canonical) => {
      const norm = normalizeKey(canonical);
      const isDisabled = disabledKeys.includes(norm) || disabledKeys.includes(normalizeKey(canonical));
      const red = redeemed[norm] || redeemed[canonical];
      let status: 'available' | 'redeemed' | 'disabled' = 'available';
      if (isDisabled) {
        status = 'disabled';
      } else if (red) {
        status = 'redeemed';
      }
      return {
        key: canonical,
        status,
        deviceId: red?.deviceId || null,
        redeemedAt: red?.redeemedAt || null,
      };
    });

    return res.json({
      success: true,
      totalKeys: VALID_KEYS.length,
      redeemedKeys: redeemedList,
      disabledKeys,
      allKeys,
    });
  });

  // Admin: Disable a specific key (type key or click disable)
  router.post('/admin/disable-key', async (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rawKey = String(req.body?.key || '').trim();
    const normKey = normalizeKey(rawKey);
    if (!normKey) {
      return res.status(400).json({ success: false, message: 'Please provide a key to disable.' });
    }

    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(normKey) || normKey;
    const disabledKeys = loadDisabledKeys();
    disabledKeys.add(normKey);
    disabledKeys.add(normalizeKey(canonicalKey));
    saveDisabledKeys(disabledKeys);

    // Also update in redeemed records if present
    const redeemed = loadRedeemedKeys();
    if (redeemed[normKey]) {
      redeemed[normKey].isDisabled = true;
    }
    if (redeemed[canonicalKey]) {
      redeemed[canonicalKey].isDisabled = true;
    }
    saveRedeemedKeys(redeemed);

    // Burn as 'disabled' in cloud KV
    try {
      await fetch(
        `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/disabled`,
        { method: 'POST', headers: { 'Content-Length': '0' } }
      );
    } catch (err) {
      console.error('Error disabling key in cloud KV:', err);
    }

    return res.json({
      success: true,
      message: `Key "${canonicalKey}" is now disabled and revoked.`,
      key: canonicalKey,
    });
  });

  // Admin: Re-enable a key
  router.post('/admin/enable-key', async (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rawKey = String(req.body?.key || '').trim();
    const normKey = normalizeKey(rawKey);
    if (!normKey) {
      return res.status(400).json({ success: false, message: 'Please provide a key to re-enable.' });
    }

    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(normKey) || normKey;
    const disabledKeys = loadDisabledKeys();
    disabledKeys.delete(normKey);
    disabledKeys.delete(normalizeKey(canonicalKey));
    saveDisabledKeys(disabledKeys);

    // Unmark disabled in redeemed records if present
    const redeemed = loadRedeemedKeys();
    if (redeemed[normKey]) {
      redeemed[normKey].isDisabled = false;
    }
    if (redeemed[canonicalKey]) {
      redeemed[canonicalKey].isDisabled = false;
    }
    saveRedeemedKeys(redeemed);

    return res.json({
      success: true,
      message: `Key "${canonicalKey}" has been re-enabled.`,
      key: canonicalKey,
    });
  });

  // Admin: Clear redemption so key can be re-used
  router.post('/admin/clear-redemption', async (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rawKey = String(req.body?.key || '').trim();
    const normKey = normalizeKey(rawKey);
    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(normKey) || normKey;

    const redeemed = loadRedeemedKeys();
    delete redeemed[normKey];
    delete redeemed[canonicalKey];
    saveRedeemedKeys(redeemed);

    // Clear from Cloud KV
    try {
      await fetch(
        `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/`,
        { method: 'POST', headers: { 'Content-Length': '0' } }
      );
    } catch (err) {
      console.error('Error clearing cloud KV:', err);
    }

    return res.json({
      success: true,
      message: `Redemption for key "${canonicalKey}" cleared. Key is now available again.`,
    });
  });

  // Health check
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Mount at both `/api` prefix and root so any Vercel/Express routing works seamlessly
  app.use('/api', router);
  app.use(router);
}
