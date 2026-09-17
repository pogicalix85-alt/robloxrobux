/**
 * Device identification & key unlock persistence utility
 */

const STORAGE_UNLOCKED_KEY = 'roblox_send_unlocked';
const STORAGE_ACTIVE_KEY = 'roblox_active_key';
const STORAGE_DEVICE_ID = 'roblox_device_id';
const STORAGE_DISABLED_KEYS = 'roblox_disabled_keys_cache';

/**
 * Normalizes any key string
 */
function norm(k: string): string {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns or creates a persistent unique ID for this device/browser
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(STORAGE_DEVICE_ID);
    if (!id || id.trim() === '') {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_DEVICE_ID, id);
    }
    return id;
  } catch {
    return 'fallback_device_' + Date.now();
  }
}

/**
 * Gets current active key stored on this device
 */
export function getActiveKey(): string {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Checks if a key is in the locally known disabled blacklist
 */
export function isKeyDisabledLocally(key: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_DISABLED_KEYS);
    if (!raw) return false;
    const arr: string[] = JSON.parse(raw);
    const n = norm(key);
    return arr.some((k) => norm(k) === n);
  } catch {
    return false;
  }
}

/**
 * Adds a key to the locally cached disabled keys
 */
export function addDisabledKeyLocally(key: string): void {
  try {
    const n = norm(key);
    const raw = localStorage.getItem(STORAGE_DISABLED_KEYS);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.some((k) => norm(k) === n)) {
      arr.push(key);
      localStorage.setItem(STORAGE_DISABLED_KEYS, JSON.stringify(arr));
    }
  } catch {
    //
  }
}

/**
 * Removes a key from the locally cached disabled keys
 */
export function removeDisabledKeyLocally(key: string): void {
  try {
    const n = norm(key);
    const raw = localStorage.getItem(STORAGE_DISABLED_KEYS);
    if (!raw) return;
    const arr: string[] = JSON.parse(raw);
    const filtered = arr.filter((k) => norm(k) !== n);
    localStorage.setItem(STORAGE_DISABLED_KEYS, JSON.stringify(filtered));
  } catch {
    //
  }
}

/**
 * Checks whether this device has already redeemed a valid key.
 * Stays strictly locked for users who haven't used a key.
 * Stays permanently unlocked for users who have already entered a valid key.
 */
export function isDeviceUnlocked(): boolean {
  try {
    const activeKey = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (activeKey && isKeyDisabledLocally(activeKey)) {
      revokeDeviceUnlock();
      return false;
    }
    const isUnlocked = localStorage.getItem(STORAGE_UNLOCKED_KEY);
    return isUnlocked === 'true' || Boolean(activeKey && activeKey.trim() !== '');
  } catch {
    return false;
  }
}

const STORAGE_REDEEMED_HISTORY = 'roblox_redeemed_keys_history';

export interface LocalRedeemedKeyRecord {
  key: string;
  deviceId: string;
  redeemedAt: string;
}

/**
 * Record a key in permanent local storage so it is remembered as redeemed before
 */
export function recordRedeemedKeyLocally(key: string, deviceId?: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_REDEEMED_HISTORY);
    const list: LocalRedeemedKeyRecord[] = raw ? JSON.parse(raw) : [];
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanKey = norm(key);
    if (!list.some((item) => norm(item.key) === cleanKey)) {
      list.push({
        key,
        deviceId: deviceId || getDeviceId(),
        redeemedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_REDEEMED_HISTORY, JSON.stringify(list));
    }
  } catch {
    //
  }
}

/**
 * Get all keys recorded locally as redeemed before
 */
export function getLocallyRedeemedKeys(): LocalRedeemedKeyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_REDEEMED_HISTORY);
    const list: LocalRedeemedKeyRecord[] = raw ? JSON.parse(raw) : [];
    const active = getActiveKey();
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (active && !list.some((i) => norm(i.key) === norm(active))) {
      list.push({
        key: active,
        deviceId: getDeviceId(),
        redeemedAt: new Date().toISOString(),
      });
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Marks this device as permanently unlocked after a key is verified
 */
export function setDeviceUnlocked(key: string): void {
  try {
    localStorage.setItem(STORAGE_UNLOCKED_KEY, 'true');
    localStorage.setItem(STORAGE_ACTIVE_KEY, key);
    recordRedeemedKeyLocally(key);
  } catch {
    // LocalStorage blocked
  }
}

/**
 * Revokes unlock status if admin disabled the key
 */
export function revokeDeviceUnlock(): void {
  try {
    localStorage.removeItem(STORAGE_UNLOCKED_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_KEY);
  } catch {
    // LocalStorage blocked
  }
}

/**
 * Sync active key with server so it shows up in redeemed keys on admin panel
 */
export async function syncActiveKeyWithServer(): Promise<void> {
  const activeKey = getActiveKey();
  const deviceId = getDeviceId();
  if (!activeKey) return;

  try {
    const res = await fetch('/api/admin/sync-active-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: activeKey, deviceId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.isDisabled || data.isRevoked)) {
        addDisabledKeyLocally(activeKey);
        revokeDeviceUnlock();
      }
    }
  } catch {
    //
  }
}

/**
 * Server verification: checks if the key or device has been disabled by the admin
 * If disabled, immediately revokes access.
 */
export async function verifyDeviceStatusWithServer(): Promise<boolean> {
  const deviceId = getDeviceId();
  const activeKey = getActiveKey();

  if (activeKey && isKeyDisabledLocally(activeKey)) {
    revokeDeviceUnlock();
    return false;
  }

  try {
    const res = await fetch('/api/keys/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, activeKey }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.isRevoked || data.reason === 'disabled_key')) {
        if (activeKey) addDisabledKeyLocally(activeKey);
        revokeDeviceUnlock();
        return false;
      }
      if (data && data.isUnlocked) {
        if (activeKey) {
          setDeviceUnlocked(activeKey);
        }
        return true;
      }
    }
  } catch {
    // Server unreachable, rely on local checks
  }
  return isDeviceUnlocked();
}
