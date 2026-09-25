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

const REDEEMED_HISTORY_FILE = process.env.VERCEL
  ? path.join('/tmp', 'redeemed_history.json')
  : path.join(process.cwd(), 'data', 'redeemed_history.json');

const ADMIN_PASSWORD = 'broisgoofy';

interface RedeemedRecord {
  deviceId: string;
  redeemedAt: string;
  isDisabled?: boolean;
}

export interface RedemptionHistoryEntry {
  key: string;
  normalizedKey: string;
  deviceId: string;
  redeemedAt: string;
  firstRedeemedAt?: string;
  redemptionCount?: number;
  status: 'active' | 'disabled' | 'cleared';
}

let inMemoryRedeemed: Record<string, RedeemedRecord> = {};
let inMemoryHistory: Record<string, RedemptionHistoryEntry> = {};
let inMemoryDisabled: Set<string> = new Set();
let keysStateVersion = Date.now();
const avatarCache = new Map<number, { url: string; time: number }>();
const avatarImageBufferCache = new Map<number, { buffer: Buffer; time: number }>();
const usernameToIdMap = new Map<string, number>([
  ['pogicalix85', 11576033953],
  ['pogicalix', 177263224],
  ['builderman', 156],
  ['roblox', 1],
  ['mphase', 1755732316],
  ['projectsupreme', 184518779],
  ['vintagetoysandmore', 828415927],
  ['vintage', 828415927],
  ['stickmasterluke', 1243143],
  ['denis', 55328987],
  ['denisdaily', 55328987],
  ['dinowild', 51193634],
  ['lamaria801', 10205448326],
  ['kreekcraft', 140258990],
  ['flamingo', 25016],
]);

// Seed known headshot CDN URLs for instant resolution
avatarCache.set(11576033953, {
  url: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-D517857E5CC51E2FF93E63E20241169E-Png/150/150/AvatarHeadshot/Png/isCircular',
  time: Date.now(),
});
avatarCache.set(156, {
  url: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-635A2AA0A87D473B6136800B5B86F761-Png/150/150/AvatarHeadshot/Png/isCircular',
  time: Date.now(),
});
avatarCache.set(1, {
  url: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular',
  time: Date.now(),
});
avatarCache.set(1755732316, {
  url: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular',
  time: Date.now(),
});
avatarCache.set(184518779, {
  url: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-17B5ADE6CAAEB318FAFA454B9A5805A1-Png/150/150/AvatarHeadshot/Png/isCircular',
  time: Date.now(),
});
avatarCache.set(828415927, {
  url: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1D2835D7E504881BFEC82C66AFC1C4AC-Png/150/150/AvatarHeadshot/Png/isCircular',
  time: Date.now(),
});

const DEFAULT_AVATAR_CDN_URL = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
let defaultFallbackBuffer: Buffer | null = null;

// Helper: Fetch with timeout & browser-like headers
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, image/png, */*',
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Helper: Fetch and cache avatar image buffer
async function getOrFetchAvatarBuffer(userId: number): Promise<Buffer | null> {
  const cached = avatarImageBufferCache.get(userId);
  if (cached && Date.now() - cached.time < 3600000 * 24) {
    return cached.buffer;
  }

  let imageUrl = avatarCache.get(userId)?.url;
  if (!imageUrl) {
    const candidateEndpoints = [
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`,
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
      `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=150x150&format=Png`,
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=150x150&format=Png`,
    ];

    for (const ep of candidateEndpoints) {
      try {
        const thumbRes = await fetchWithTimeout(ep, {}, 2500);
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          const item = thumbData?.data?.[0];
          if (item?.imageUrl) {
            imageUrl = item.imageUrl;
            avatarCache.set(userId, { url: item.imageUrl, time: Date.now() });
            break;
          }
        }
      } catch {}
    }
  }

  if (imageUrl) {
    try {
      const imgRes = await fetchWithTimeout(imageUrl, {}, 3500);
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        if (buffer.length > 200) {
          avatarImageBufferCache.set(userId, { buffer, time: Date.now() });
          return buffer;
        }
      }
    } catch (streamErr) {
      console.warn(`Streaming avatar image for user ${userId} failed:`, streamErr);
    }
  }

  return null;
}

// Background pre-buffer known primary avatars so they load with zero latency
setTimeout(async () => {
  try {
    const pogBuf = await getOrFetchAvatarBuffer(11576033953);
    if (pogBuf) defaultFallbackBuffer = pogBuf;
    await getOrFetchAvatarBuffer(156);
    await getOrFetchAvatarBuffer(1);
  } catch {}
}, 200);

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
      inMemoryRedeemed = { ...inMemoryRedeemed, ...parsed };
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

// Permanent History of all keys redeemed before (persists even if cleared or across restarts)
function loadRedeemedHistory(): Record<string, RedemptionHistoryEntry> {
  try {
    if (fs.existsSync(REDEEMED_HISTORY_FILE)) {
      const data = fs.readFileSync(REDEEMED_HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        inMemoryHistory = { ...inMemoryHistory, ...parsed };
      }
    }
  } catch (err) {
    console.error('Error loading redeemed history:', err);
  }

  // Also import any entries in active redeemed keys
  const active = loadRedeemedKeys();
  const disabled = loadDisabledKeys();
  for (const [key, val] of Object.entries(active)) {
    const norm = normalizeKey(key);
    const canonical = NORMALIZED_VALID_KEYS_MAP.get(norm) || key;
    if (!inMemoryHistory[norm]) {
      inMemoryHistory[norm] = {
        key: canonical,
        normalizedKey: norm,
        deviceId: val.deviceId || 'device_initial',
        redeemedAt: val.redeemedAt || new Date().toISOString(),
        firstRedeemedAt: val.redeemedAt || new Date().toISOString(),
        redemptionCount: 1,
        status: val.isDisabled || disabled.has(norm) ? 'disabled' : 'active',
      };
    }
  }

  // Ensure known key "k8x2-7qz9-m4v6" is tracked
  const initialKeyNorm = normalizeKey('k8x2-7qz9-m4v6');
  if (!inMemoryHistory[initialKeyNorm]) {
    inMemoryHistory[initialKeyNorm] = {
      key: 'k8x2-7qz9-m4v6',
      normalizedKey: initialKeyNorm,
      deviceId: 'dev_n57y7eau6g_mtsl7zvp',
      redeemedAt: '2026-09-17T08:12:47.745Z',
      firstRedeemedAt: '2026-09-17T08:12:47.745Z',
      redemptionCount: 1,
      status: disabled.has(initialKeyNorm) ? 'disabled' : 'active',
    };
  }

  return inMemoryHistory;
}

function saveRedeemedHistory(data: Record<string, RedemptionHistoryEntry>) {
  inMemoryHistory = { ...data };
  try {
    const dir = path.dirname(REDEEMED_HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REDEEMED_HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving redeemed history to disk:', err);
  }

  // Asynchronously sync to Cloud KV so history survives deployments
  syncHistoryToCloudKV(data);
}

const CLOUD_DB_KEY = '8xzdudn0';
const HISTORY_CLOUD_KEY = 'roblox_all_redeemed_history_registry';

async function syncHistoryToCloudKV(history: Record<string, RedemptionHistoryEntry>) {
  try {
    const arr = Object.values(history);
    const jsonStr = JSON.stringify(arr);
    await fetch(
      `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${HISTORY_CLOUD_KEY}/${encodeURIComponent(jsonStr)}`,
      { method: 'POST', headers: { 'Content-Length': '0' } }
    );
  } catch {
    // Cloud KV fallback
  }
}

async function pullHistoryFromCloudKV() {
  try {
    const cloudRes = await fetch(
      `https://keyvalue.immanuel.co/api/KeyVal/GetValue/${CLOUD_DB_KEY}/${HISTORY_CLOUD_KEY}`,
      { cache: 'no-store' }
    );
    if (cloudRes.ok) {
      const raw = await cloudRes.text();
      const cleaned = raw.replace(/^"|"$/g, '').trim();
      if (cleaned) {
        const decoded = decodeURIComponent(cleaned);
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) {
          const current = loadRedeemedHistory();
          parsed.forEach((item: RedemptionHistoryEntry) => {
            if (item && item.normalizedKey) {
              if (!current[item.normalizedKey]) {
                current[item.normalizedKey] = item;
              }
            }
          });
          inMemoryHistory = { ...current };
          try {
            fs.writeFileSync(REDEEMED_HISTORY_FILE, JSON.stringify(inMemoryHistory, null, 2), 'utf-8');
          } catch {}
        }
      }
    }
  } catch {
    //
  }
}

// Background pull on startup
pullHistoryFromCloudKV();
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

  // API: Direct Avatar Headshot Image Proxy (Serves PNG image directly to bypass CORS/referrer/blocking issues)
  // Supports numeric userId (e.g. 11576033953) OR username (e.g. pogicalix85)
  const handleAvatarHeadshot = async (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const rawTarget = String(req.params.userId || req.params.target || '').trim();
    let userId = /^\d+$/.test(rawTarget) ? parseInt(rawTarget, 10) : 0;

    // If username was passed instead of numeric ID, resolve to numeric ID
    if (userId <= 0 && rawTarget) {
      const cleanName = rawTarget.replace(/^[@"']+|["']+$/g, '').toLowerCase();
      if (usernameToIdMap.has(cleanName)) {
        userId = usernameToIdMap.get(cleanName)!;
      } else {
        try {
          const exactRes = await fetchWithTimeout(
            'https://users.roblox.com/v1/usernames/users',
            {
              method: 'POST',
              body: JSON.stringify({ usernames: [rawTarget.replace(/^@/, '')], excludeBannedUsers: false }),
            },
            2500
          );
          if (exactRes.ok) {
            const exactData = await exactRes.json();
            const found = exactData?.data?.[0];
            if (found && found.id) {
              userId = found.id;
              usernameToIdMap.set(cleanName, userId);
              usernameToIdMap.set(found.name.toLowerCase(), userId);
            }
          }
        } catch {}
      }
    }

    if (userId > 0) {
      const buffer = await getOrFetchAvatarBuffer(userId);
      if (buffer) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length.toString());
        return res.send(buffer);
      }
    }

    // Direct redirect to cached URL if buffer fetch failed
    if (userId > 0 && avatarCache.has(userId)) {
      return res.redirect(avatarCache.get(userId)!.url);
    }

    if (defaultFallbackBuffer) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', defaultFallbackBuffer.length.toString());
      return res.send(defaultFallbackBuffer);
    }

    return res.redirect(DEFAULT_AVATAR_CDN_URL);
  };

  router.get('/roblox/avatar-headshot/:userId', handleAvatarHeadshot);
  router.get('/roblox/avatar-headshot', handleAvatarHeadshot);
  router.get('/roblox/avatar/:userId', handleAvatarHeadshot);

  // API: Search Roblox users by username, display name, user ID, or profile link
  // Supports both `/roblox/search` and `/roblox/search-users` with params `q`, `keyword`, `username`
  const handleRobloxUserSearch = async (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const rawQuery = String(
      req.query.q ||
      req.query.keyword ||
      req.query.username ||
      req.query.search ||
      ''
    ).trim();

    if (!rawQuery) {
      return res.json({
        users: DEFAULT_FRIENDS.map((f) => ({
          ...f,
          avatarUrl: `/api/roblox/avatar-headshot/${f.id}`,
        })),
      });
    }

    // Sanitize query: strip '@', strip quotes, extract user ID from URL if present
    const cleanQuery = rawQuery.replace(/^[@"']+|["']+$/g, '').trim();
    const urlMatch = cleanQuery.match(/roblox\.com\/users\/(\d+)/i);
    const targetUserId = urlMatch ? parseInt(urlMatch[1], 10) : /^\d+$/.test(cleanQuery) ? parseInt(cleanQuery, 10) : null;

    try {
      const uniqueUsers: Array<{ id: number; name: string; displayName: string; hasVerifiedBadge: boolean }> = [];
      const seenIds = new Set<number>();

      // 1. Direct User ID or profile link lookup
      if (targetUserId) {
        try {
          const directUserRes = await fetchWithTimeout(`https://users.roblox.com/v1/users/${targetUserId}`, {}, 2500);
          if (directUserRes.ok) {
            const userData = await directUserRes.json();
            if (userData && userData.id && !seenIds.has(userData.id)) {
              seenIds.add(userData.id);
              uniqueUsers.push({
                id: userData.id,
                name: userData.name,
                displayName: userData.displayName || userData.name,
                hasVerifiedBadge: Boolean(userData.hasVerifiedBadge),
              });
            }
          }
        } catch (idErr) {
          console.warn('Direct user ID lookup failed:', idErr);
        }
      }

      // 2. Direct exact username lookup (Prioritized for typed usernames, e.g. pogicalix85)
      if (cleanQuery && !targetUserId) {
        const queryLower = cleanQuery.toLowerCase();
        
        // Fast-path for locally mapped usernames
        if (usernameToIdMap.has(queryLower)) {
          const knownId = usernameToIdMap.get(queryLower)!;
          if (!seenIds.has(knownId)) {
            seenIds.add(knownId);
            uniqueUsers.push({
              id: knownId,
              name: cleanQuery,
              displayName: cleanQuery,
              hasVerifiedBadge: knownId === 156 || knownId === 1,
            });
          }
        }

        try {
          const nameVariants = Array.from(new Set([
            cleanQuery,
            cleanQuery.toLowerCase(),
          ]));

          const exactRes = await fetchWithTimeout(
            'https://users.roblox.com/v1/usernames/users',
            {
              method: 'POST',
              body: JSON.stringify({ usernames: nameVariants, excludeBannedUsers: false }),
            },
            2500
          );

          if (exactRes.ok) {
            const exactData = await exactRes.json();
            if (Array.isArray(exactData.data)) {
              for (const u of exactData.data) {
                if (u && u.id && !seenIds.has(u.id)) {
                  seenIds.add(u.id);
                  usernameToIdMap.set(u.name.toLowerCase(), u.id);
                  uniqueUsers.push({
                    id: u.id,
                    name: u.name,
                    displayName: u.displayName || u.name,
                    hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error('Exact lookup error:', err);
        }
      }

      // 3. Keyword search (only runs if exact lookup found fewer than 3 users, with strict 2.5s timeout)
      if (uniqueUsers.length < 3 && cleanQuery.length >= 3 && !targetUserId) {
        try {
          const searchRes = await fetchWithTimeout(
            `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(cleanQuery)}&limit=10`,
            {},
            2500
          );
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (Array.isArray(searchData.data)) {
              for (const u of searchData.data) {
                if (u && u.id && !seenIds.has(u.id)) {
                  seenIds.add(u.id);
                  usernameToIdMap.set(u.name.toLowerCase(), u.id);
                  uniqueUsers.push({
                    id: u.id,
                    name: u.name,
                    displayName: u.displayName || u.name,
                    hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
                  });
                }
              }
            }
          }
        } catch {
          // Throttled or timeout, safely fall through
        }
      }

      // Check fallback list for partial matches if search returned empty
      if (uniqueUsers.length === 0) {
        const queryLower = cleanQuery.toLowerCase();
        const matchedFallbacks = DEFAULT_FRIENDS.filter(
          (f) =>
            f.name.toLowerCase().includes(queryLower) ||
            f.displayName.toLowerCase().includes(queryLower)
        );
        if (matchedFallbacks.length > 0) {
          return res.json({
            users: matchedFallbacks.map((f) => ({
              ...f,
              avatarUrl: `/api/roblox/avatar-headshot/${f.id}`,
            })),
          });
        }
      }

      if (uniqueUsers.length === 0) {
        return res.json({ users: [] });
      }

      // 4. Batch query official avatar headshots from Roblox Thumbnails API
      const targetIds = uniqueUsers.slice(0, 12).map((u) => u.id);
      try {
        const thumbRes = await fetchWithTimeout(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${targetIds.join(',')}&size=150x150&format=Png&isCircular=true`,
          {},
          2500
        );
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          if (Array.isArray(thumbData.data)) {
            for (const item of thumbData.data) {
              if (item.targetId && item.imageUrl) {
                avatarCache.set(item.targetId, { url: item.imageUrl, time: Date.now() });
              }
            }
          }
        }
      } catch (err) {
        console.error('Thumbnails fetch error:', err);
      }

      // Asynchronously pre-buffer the top found avatars into memory buffer
      uniqueUsers.slice(0, 4).forEach((u) => {
        getOrFetchAvatarBuffer(u.id).catch(() => {});
      });

      const results = uniqueUsers.slice(0, 12).map((u) => ({
        id: u.id,
        name: u.name,
        displayName: u.displayName || u.name,
        hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
        avatarUrl: `/api/roblox/avatar-headshot/${u.id}`,
        thumbnailUrl: avatarCache.get(u.id)?.url || null,
      }));

      return res.json({ users: results });
    } catch (error) {
      console.error('Roblox search route failed:', error);
      const queryLower = cleanQuery.toLowerCase();
      const matched = DEFAULT_FRIENDS.filter(
        (f) =>
          f.name.toLowerCase().includes(queryLower) ||
          f.displayName.toLowerCase().includes(queryLower)
      );
      return res.json({
        users: matched.map((f) => ({
          ...f,
          avatarUrl: `/api/roblox/avatar-headshot/${f.id}`,
        })),
      });
    }
  };

  router.get('/roblox/search', handleRobloxUserSearch);
  router.get('/roblox/search-users', handleRobloxUserSearch);
  router.get('/roblox/users/search', handleRobloxUserSearch);

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

    // Save into permanent history of all keys redeemed before
    const history = loadRedeemedHistory();
    const prevHistory = history[normKey] || history[normalizeKey(canonicalKey)];
    history[normKey] = {
      key: canonicalKey,
      normalizedKey: normKey,
      deviceId,
      redeemedAt: new Date().toISOString(),
      firstRedeemedAt: prevHistory?.firstRedeemedAt || new Date().toISOString(),
      redemptionCount: (prevHistory?.redemptionCount || 0) + 1,
      status: 'active',
    };
    saveRedeemedHistory(history);

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

    keysStateVersion = Date.now();

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

    // Also update permanent history
    const history = loadRedeemedHistory();
    if (!history[normKey]) {
      history[normKey] = {
        key: canonicalKey,
        normalizedKey: normKey,
        deviceId,
        redeemedAt: new Date().toISOString(),
        firstRedeemedAt: new Date().toISOString(),
        redemptionCount: 1,
        status: 'active',
      };
      saveRedeemedHistory(history);
    }

    return res.json({ success: true, isUnlocked: true });
  });

  // Admin: Get all keys data (catalog of 500 keys, active redeemed keys, and permanent redemption history)
  router.post('/admin/keys', (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const redeemed = loadRedeemedKeys();
    const history = loadRedeemedHistory();
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

    // Consolidated list of ALL keys redeemed before (with status: active, disabled, or cleared)
    const allRedeemedBeforeList: RedemptionHistoryEntry[] = Object.values(history).map((entry) => {
      const norm = normalizeKey(entry.key);
      const isDis = Boolean(
        entry.status === 'disabled' ||
        disabledKeys.includes(norm) ||
        disabledKeys.includes(normalizeKey(entry.normalizedKey))
      );
      const isActive = Boolean(redeemed[norm] || redeemed[entry.key]);
      return {
        ...entry,
        status: isDis ? 'disabled' : isActive ? 'active' : (entry.status || 'cleared'),
      };
    }).sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

    // Build master catalog of all 500 keys with real-time status and wasRedeemedBefore flag
    const allKeys = VALID_KEYS.map((canonical) => {
      const norm = normalizeKey(canonical);
      const isDisabled = disabledKeys.includes(norm) || disabledKeys.includes(normalizeKey(canonical));
      const red = redeemed[norm] || redeemed[canonical];
      const hist = history[norm] || history[normalizeKey(canonical)];
      let status: 'available' | 'redeemed' | 'disabled' = 'available';
      if (isDisabled) {
        status = 'disabled';
      } else if (red) {
        status = 'redeemed';
      }
      return {
        key: canonical,
        status,
        deviceId: red?.deviceId || hist?.deviceId || null,
        redeemedAt: red?.redeemedAt || hist?.redeemedAt || null,
        wasRedeemedBefore: Boolean(hist || red),
        redemptionCount: hist?.redemptionCount || (red ? 1 : 0),
      };
    });

    return res.json({
      success: true,
      totalKeys: VALID_KEYS.length,
      redeemedKeys: redeemedList,
      allRedeemedHistory: allRedeemedBeforeList,
      totalRedeemedBefore: allRedeemedBeforeList.length,
      disabledKeys,
      allKeys,
    });
  });

  // Admin: Sync client browser history of redeemed keys with server permanent history
  router.post('/admin/sync-history', (req: Request, res: Response) => {
    const password = String(req.body?.password || '');
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const clientHistory = req.body?.clientHistory;
    const history = loadRedeemedHistory();
    const disabledKeys = loadDisabledKeys();

    if (Array.isArray(clientHistory)) {
      clientHistory.forEach((item: { key: string; deviceId?: string; redeemedAt?: string }) => {
        if (!item || !item.key) return;
        const norm = normalizeKey(item.key);
        const canonical = NORMALIZED_VALID_KEYS_MAP.get(norm) || item.key;
        if (!history[norm]) {
          history[norm] = {
            key: canonical,
            normalizedKey: norm,
            deviceId: item.deviceId || 'browser_client',
            redeemedAt: item.redeemedAt || new Date().toISOString(),
            firstRedeemedAt: item.redeemedAt || new Date().toISOString(),
            redemptionCount: 1,
            status: disabledKeys.has(norm) ? 'disabled' : 'active',
          };
        }
      });
      saveRedeemedHistory(history);
    }

    const allHistory = Object.values(history).sort(
      (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
    );

    return res.json({
      success: true,
      allRedeemedHistory: allHistory,
      totalRedeemedBefore: allHistory.length,
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

    // Update permanent history
    const history = loadRedeemedHistory();
    if (history[normKey]) {
      history[normKey].status = 'disabled';
      saveRedeemedHistory(history);
    }

    // Burn as 'disabled' in cloud KV
    try {
      await fetch(
        `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/disabled`,
        { method: 'POST', headers: { 'Content-Length': '0' } }
      );
    } catch (err) {
      console.error('Error disabling key in cloud KV:', err);
    }

    keysStateVersion = Date.now();

    return res.json({
      success: true,
      message: `Key "${canonicalKey}" is now disabled and revoked.`,
      key: canonicalKey,
      version: keysStateVersion,
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

    // Update in history
    const history = loadRedeemedHistory();
    if (history[normKey]) {
      history[normKey].status = 'active';
      saveRedeemedHistory(history);
    }

    keysStateVersion = Date.now();

    return res.json({
      success: true,
      message: `Key "${canonicalKey}" has been re-enabled.`,
      key: canonicalKey,
      version: keysStateVersion,
    });
  });

  // Admin: Clear redemption so key can be re-used, while permanently retaining it in the redemption history
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

    // Permanently remember this key was redeemed before in the history!
    const history = loadRedeemedHistory();
    if (history[normKey]) {
      history[normKey].status = 'cleared';
      saveRedeemedHistory(history);
    }

    // Clear active status from Cloud KV
    try {
      await fetch(
        `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/`,
        { method: 'POST', headers: { 'Content-Length': '0' } }
      );
    } catch (err) {
      console.error('Error clearing cloud KV:', err);
    }

    keysStateVersion = Date.now();

    return res.json({
      success: true,
      message: `Redemption for key "${canonicalKey}" cleared. Key is now available again (saved in history of redeemed keys).`,
      version: keysStateVersion,
    });
  });

  // Live status endpoint for real-time synchronization between Admin Panel and user devices
  router.get('/keys/live-status', (_req: Request, res: Response) => {
    const disabledKeys = Array.from(loadDisabledKeys());
    const redeemed = loadRedeemedKeys();
    return res.json({
      version: keysStateVersion,
      totalDisabled: disabledKeys.length,
      totalRedeemed: Object.keys(redeemed).length,
      disabledKeys,
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
