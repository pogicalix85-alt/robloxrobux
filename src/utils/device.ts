/**
 * Device identification & key unlock persistence utility
 */

const STORAGE_UNLOCKED_KEY = 'roblox_send_unlocked';
const STORAGE_ACTIVE_KEY = 'roblox_active_key';
const STORAGE_DEVICE_ID = 'roblox_device_id';

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
 * Checks whether this device has already redeemed a valid key.
 * Stays strictly locked for users who haven't used a key.
 * Stays permanently unlocked for users who have already entered a valid key.
 */
export function isDeviceUnlocked(): boolean {
  try {
    const isUnlocked = localStorage.getItem(STORAGE_UNLOCKED_KEY);
    const activeKey = localStorage.getItem(STORAGE_ACTIVE_KEY);
    return isUnlocked === 'true' || Boolean(activeKey && activeKey.trim() !== '');
  } catch {
    return false;
  }
}

/**
 * Marks this device as permanently unlocked after a key is verified
 */
export function setDeviceUnlocked(key: string): void {
  try {
    localStorage.setItem(STORAGE_UNLOCKED_KEY, 'true');
    localStorage.setItem(STORAGE_ACTIVE_KEY, key);
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
 * Optional server verification: checks if the server has registered this device ID as unlocked
 * If the key has been disabled by the admin, it will revoke unlock status.
 */
export async function verifyDeviceStatusWithServer(): Promise<boolean> {
  const deviceId = getDeviceId();
  let activeKey = '';
  try {
    activeKey = localStorage.getItem(STORAGE_ACTIVE_KEY) || '';
  } catch {
    //
  }

  try {
    const res = await fetch('/api/keys/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, activeKey }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.isRevoked) {
        revokeDeviceUnlock();
        return false;
      }
      if (data && data.isUnlocked) {
        setDeviceUnlocked(activeKey || 'server_verified_device');
        return true;
      } else if (activeKey) {
        // If server says not unlocked and key was provided
        revokeDeviceUnlock();
        return false;
      }
    }
  } catch {
    // Server unreachable, rely on local storage
  }
  return isDeviceUnlocked();
}
