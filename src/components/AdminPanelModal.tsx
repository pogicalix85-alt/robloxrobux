import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  Search,
  X,
  RefreshCw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  LogOut,
  RotateCcw,
  Smartphone,
  ListFilter,
  ArrowRight,
} from 'lucide-react';
import { normalizeKey, NORMALIZED_VALID_KEYS_MAP, VALID_KEYS } from '../data/validKeys';
import {
  getDeviceId,
  getActiveKey,
  isDeviceUnlocked,
  setDeviceUnlocked,
  revokeDeviceUnlock,
  addDisabledKeyLocally,
  removeDisabledKeyLocally,
} from '../utils/device';

interface RedeemedKeyItem {
  key: string;
  deviceId: string;
  redeemedAt: string;
  isDisabled: boolean;
}

interface KeyCatalogItem {
  key: string;
  status: 'available' | 'redeemed' | 'disabled';
  deviceId?: string | null;
  redeemedAt?: string | null;
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyDisabledOrRevoked?: (key: string) => void;
}

const ADMIN_PASSWORD = 'broisgoofy';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onKeyDisabledOrRevoked,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('roblox_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState<'disable' | 'all' | 'redeemed' | 'disabled'>('disable');

  // Input for typing keys to disable
  const [typeKeyInput, setTypeKeyInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Loaded data from backend
  const [redeemedKeys, setRedeemedKeys] = useState<RedeemedKeyItem[]>([]);
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]);
  const [catalogKeys, setCatalogKeys] = useState<KeyCatalogItem[]>([]);
  const [totalValidCount, setTotalValidCount] = useState<number>(VALID_KEYS.length);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Search & Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'redeemed' | 'disabled'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Local device state tracker for testing
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const [currentActiveKey, setCurrentActiveKey] = useState('');
  const [currentIsUnlocked, setCurrentIsUnlocked] = useState(false);

  const refreshLocalDeviceState = () => {
    setCurrentDeviceId(getDeviceId());
    setCurrentActiveKey(getActiveKey());
    setCurrentIsUnlocked(isDeviceUnlocked());
  };

  // Fetch admin keys data from backend
  const fetchAdminData = async () => {
    setIsDataLoading(true);
    refreshLocalDeviceState();
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRedeemedKeys(data.redeemedKeys || []);
          setDisabledKeys(data.disabledKeys || []);
          if (data.allKeys && Array.isArray(data.allKeys)) {
            setCatalogKeys(data.allKeys);
          }
          if (data.totalKeys) setTotalValidCount(data.totalKeys);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLocalDeviceState();
      if (isAuthenticated) {
        fetchAdminData();
      }
    }
  }, [isOpen, isAuthenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
      try {
        sessionStorage.setItem('roblox_admin_auth', 'true');
      } catch {
        // Ignored
      }
      fetchAdminData();
    } else {
      setPasswordError('Incorrect password. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('roblox_admin_auth');
    } catch {
      // Ignored
    }
  };

  // Disable a key (typed or selected)
  const handleDisableKey = async (keyToDisable: string) => {
    const norm = normalizeKey(keyToDisable);
    if (!norm) {
      setActionFeedback({
        type: 'error',
        message: 'Please enter a key.',
      });
      return;
    }

    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(norm) || keyToDisable;
    setActionLoading(true);
    setActionFeedback(null);

    // 1. Immediately cache disabled status locally
    addDisabledKeyLocally(norm);
    addDisabledKeyLocally(canonicalKey);

    // 2. Check if current device is unlocked with this key
    const activeNorm = normalizeKey(getActiveKey());
    if (activeNorm === norm || activeNorm === normalizeKey(canonicalKey)) {
      revokeDeviceUnlock();
    }

    try {
      const res = await fetch('/api/admin/disable-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, key: norm }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setActionFeedback({
          type: 'success',
          message: data.message || `Key "${canonicalKey}" has been disabled and revoked!`,
        });
        setTypeKeyInput('');

        // Notify parent App component
        if (onKeyDisabledOrRevoked) {
          onKeyDisabledOrRevoked(canonicalKey);
        }

        await fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          message: data?.message || 'Failed to disable key.',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Server communication error while disabling key.',
      });
    } finally {
      setActionLoading(false);
      refreshLocalDeviceState();
    }
  };

  // Re-enable a disabled key
  const handleEnableKey = async (keyToEnable: string) => {
    const norm = normalizeKey(keyToEnable);
    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(norm) || keyToEnable;
    setActionLoading(true);
    setActionFeedback(null);

    removeDisabledKeyLocally(norm);
    removeDisabledKeyLocally(canonicalKey);

    try {
      const res = await fetch('/api/admin/enable-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, key: norm }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setActionFeedback({
          type: 'success',
          message: data.message || `Key "${canonicalKey}" re-enabled successfully.`,
        });
        await fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          message: data?.message || 'Failed to re-enable key.',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Error communicating with server.',
      });
    } finally {
      setActionLoading(false);
      refreshLocalDeviceState();
    }
  };

  // Reset/clear redemption
  const handleClearRedemption = async (keyToClear: string) => {
    const norm = normalizeKey(keyToClear);
    const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(norm) || keyToClear;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch('/api/admin/clear-redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, key: norm }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setActionFeedback({
          type: 'success',
          message: data.message || `Redemption record cleared for key "${canonicalKey}".`,
        });
        await fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          message: data?.message || 'Failed to clear redemption.',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Error communicating with server.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick test: Unlock current device with a valid key
  const handleQuickUnlockThisDevice = (keyToUse?: string) => {
    const key = keyToUse || VALID_KEYS[0];
    setDeviceUnlocked(key);
    refreshLocalDeviceState();
    setActionFeedback({
      type: 'success',
      message: `Device unlocked with key "${key}". You can now test Send Robux!`,
    });
  };

  // Quick test: Lock this device
  const handleLockThisDevice = () => {
    revokeDeviceUnlock();
    refreshLocalDeviceState();
    setActionFeedback({
      type: 'success',
      message: 'This device has been locked. Key verification will now be prompted.',
    });
    if (onKeyDisabledOrRevoked) {
      onKeyDisabledOrRevoked('device_locked_by_admin');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Filtered lists based on search
  const filteredRedeemed = redeemedKeys.filter(
    (item) =>
      item.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.deviceId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredDisabled = disabledKeys.filter((k) =>
    k.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Filtered Catalog (500 Keys)
  const catalogList = useMemo(() => {
    let list = catalogKeys;
    // Fallback if catalogKeys not populated from server yet
    if (list.length === 0) {
      list = VALID_KEYS.map((k) => {
        const norm = normalizeKey(k);
        const isDisabled = disabledKeys.some((d) => normalizeKey(d) === norm);
        const red = redeemedKeys.find((r) => normalizeKey(r.key) === norm);
        let status: 'available' | 'redeemed' | 'disabled' = 'available';
        if (isDisabled) status = 'disabled';
        else if (red) status = 'redeemed';
        return {
          key: k,
          status,
          deviceId: red?.deviceId,
          redeemedAt: red?.redeemedAt,
        };
      });
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const qNorm = normalizeKey(q);
      list = list.filter(
        (item) =>
          item.key.toLowerCase().includes(q) ||
          normalizeKey(item.key).includes(qNorm) ||
          (item.deviceId && item.deviceId.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((item) => item.status === statusFilter);
    }

    return list;
  }, [catalogKeys, disabledKeys, redeemedKeys, searchFilter, statusFilter]);

  const totalCatalogPages = Math.ceil(catalogList.length / PAGE_SIZE) || 1;
  const paginatedCatalog = catalogList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (!isOpen) return null;

  return (
    <div
      id="admin-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl bg-[#13151b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#181a24]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Admin Key Panel</h3>
                {isAuthenticated && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Authorized
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50">Manage key validation, revocation, and device lockouts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                id="admin-logout-button"
                onClick={handleLogout}
                title="Lock Admin Panel"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-xs flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              type="button"
              id="admin-close-button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          /* Password Authentication Gate */
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/5">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Admin Authentication Required</h4>
            <p className="text-xs sm:text-sm text-white/60 max-w-sm mb-6">
              Enter the administrator password to access key management, revocation controls, and device statuses.
            </p>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  id="admin-password-input"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter admin password..."
                  autoFocus
                  className="w-full px-4 py-3 bg-[#0d0e13] border border-white/15 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-red-500/60 transition-colors font-mono"
                />
                {passwordError && (
                  <p className="text-xs text-red-400 text-left mt-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                id="admin-login-submit"
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Admin Panel</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats Summary Bar */}
            <div className="grid grid-cols-3 gap-2 px-5 sm:px-6 py-2.5 bg-[#0d0e13] border-b border-white/[0.06] text-xs">
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px]">Total Master Keys</span>
                <span className="text-sm font-bold text-white mt-0.5">{totalValidCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px]">Redeemed Keys</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5">{redeemedKeys.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px]">Disabled / Blocked</span>
                <span className="text-sm font-bold text-red-400 mt-0.5">{disabledKeys.length}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-2.5 pb-2 border-b border-white/[0.06] bg-[#151720] overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                <button
                  type="button"
                  id="tab-type-disable"
                  onClick={() => {
                    setActiveTab('disable');
                    setSearchFilter('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'disable'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Type & Disable</span>
                </button>

                <button
                  type="button"
                  id="tab-all-keys"
                  onClick={() => {
                    setActiveTab('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>All 500 Keys</span>
                </button>

                <button
                  type="button"
                  id="tab-redeemed-keys"
                  onClick={() => {
                    setActiveTab('redeemed');
                    setSearchFilter('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'redeemed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Redeemed ({redeemedKeys.length})</span>
                </button>

                <button
                  type="button"
                  id="tab-disabled-keys"
                  onClick={() => {
                    setActiveTab('disabled');
                    setSearchFilter('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'disabled'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Disabled ({disabledKeys.length})</span>
                </button>
              </div>

              <button
                type="button"
                id="admin-refresh-button"
                onClick={fetchAdminData}
                disabled={isDataLoading}
                title="Refresh Data from Server"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer ml-2 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Notification Feedback Banner */}
            {actionFeedback && (
              <div
                className={`mx-5 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {actionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span className="font-medium">{actionFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedback(null)}
                  className="hover:opacity-70 p-0.5 text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* TAB 1: TYPE KEY AND DISABLE */}
            {activeTab === 'disable' && (
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                {/* Active Device Quick Status & Lockout Test Tool */}
                <div className="bg-[#151722] border border-white/[0.08] rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-white/5 text-white/70">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">This Device:</span>
                          {currentIsUnlocked ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Unlocked (Send Robux Accessible)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                              Locked (Key Required)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 mt-0.5 font-mono">
                          ID: {currentDeviceId} {currentActiveKey ? `• Key: ${currentActiveKey}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {currentIsUnlocked ? (
                        <>
                          {currentActiveKey && (
                            <button
                              type="button"
                              onClick={() => handleDisableKey(currentActiveKey)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                              title="Disables this key on server and locks this device immediately"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Disable Active Key</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleLockThisDevice}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                            title="Reset local unlock state to test key prompt"
                          >
                            Lock Device
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickUnlockThisDevice()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Instantly unlocks this device with a valid key for testing"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Quick Unlock</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Form: Disable any key by typing it */}
                <div className="bg-[#181a24] border border-white/[0.08] rounded-xl p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400" />
                      <span>Disable / Revoke Any Key</span>
                    </h4>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Type or paste any key below to disable it. Disabling marks the key as revoked, blocks anyone from redeeming it, and immediately locks any device currently using it.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          id="admin-type-key-input"
                          value={typeKeyInput}
                          onChange={(e) => setTypeKeyInput(e.target.value)}
                          placeholder="e.g. k8x2-7qz9-m4v6"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#0d0e13] border border-white/15 rounded-xl text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/60"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id="admin-disable-submit-button"
                          onClick={() => handleDisableKey(typeKeyInput)}
                          disabled={actionLoading || !typeKeyInput.trim()}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {actionLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                          <span>Disable Key</span>
                        </button>

                        <button
                          type="button"
                          id="admin-enable-submit-button"
                          onClick={() => handleEnableKey(typeKeyInput)}
                          disabled={actionLoading || !typeKeyInput.trim()}
                          className="px-3.5 py-2.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/70 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          title="Re-enable this key if disabled"
                        >
                          Re-enable
                        </button>
                      </div>
                    </div>

                    {typeKeyInput.trim() && (
                      <div className="text-[11px] text-white/60 flex items-center gap-1.5 pl-1">
                        {NORMALIZED_VALID_KEYS_MAP.has(normalizeKey(typeKeyInput)) ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Key is found in the 500-key master database ({NORMALIZED_VALID_KEYS_MAP.get(normalizeKey(typeKeyInput))})
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Key not found in official list, but can still be blacklisted
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions for already redeemed keys */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white/50">
                      Recently Redeemed Keys ({redeemedKeys.length})
                    </h5>
                    <button
                      type="button"
                      onClick={() => setActiveTab('redeemed')}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      View All Redeemed →
                    </button>
                  </div>

                  {redeemedKeys.length === 0 ? (
                    <div className="bg-[#181a24]/50 border border-white/[0.04] rounded-xl p-6 text-center text-xs text-white/40">
                      No keys have been redeemed yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {redeemedKeys.slice(0, 5).map((item) => (
                        <div
                          key={item.key}
                          className="bg-[#181a24] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-white/90 truncate">
                              {item.key}
                            </span>
                            {item.isDisabled ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                                Disabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.isDisabled ? (
                              <button
                                type="button"
                                onClick={() => handleEnableKey(item.key)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/70 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Re-enable
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDisableKey(item.key)}
                                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Disable</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MASTER 500 KEYS BROWSER */}
            {activeTab === 'all' && (
              <div className="flex-1 flex flex-col p-5 sm:p-6 overflow-hidden">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      id="admin-master-search-input"
                      value={searchFilter}
                      onChange={(e) => {
                        setSearchFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search any of 500 keys or devices..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0d0e13] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {(['all', 'available', 'redeemed', 'disabled'] as const).map((filterType) => (
                      <button
                        key={filterType}
                        type="button"
                        onClick={() => {
                          setStatusFilter(filterType);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors capitalize cursor-pointer ${
                          statusFilter === filterType
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        {filterType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Listing */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {paginatedCatalog.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#181a24]/30 rounded-xl border border-white/[0.04]">
                      <Key className="w-8 h-8 text-white/20 mb-2" />
                      <p className="text-xs text-white/50">No keys match your filters.</p>
                    </div>
                  ) : (
                    paginatedCatalog.map((item) => (
                      <div
                        key={item.key}
                        className={`bg-[#181a24] border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
                          item.status === 'disabled'
                            ? 'border-red-500/30 bg-red-950/10'
                            : item.status === 'redeemed'
                            ? 'border-amber-500/20'
                            : 'border-white/[0.06]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white text-sm">
                              {item.key}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.key)}
                              className="p-1 rounded text-white/40 hover:text-white transition-colors cursor-pointer"
                              title="Copy Key"
                            >
                              {copiedKey === item.key ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {item.status === 'disabled' && (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Ban className="w-2.5 h-2.5" /> Disabled / Revoked
                              </span>
                            )}
                            {item.status === 'redeemed' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Key className="w-2.5 h-2.5" /> Redeemed
                              </span>
                            )}
                            {item.status === 'available' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Available
                              </span>
                            )}
                          </div>

                          {item.deviceId && (
                            <div className="text-[11px] text-white/40 flex items-center gap-2">
                              <span>Used by device: <code className="text-white/60">{item.deviceId}</code></span>
                              {item.redeemedAt && (
                                <span>({new Date(item.redeemedAt).toLocaleDateString()})</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {item.status === 'disabled' ? (
                            <button
                              type="button"
                              onClick={() => handleEnableKey(item.key)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Re-enable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisableKey(item.key)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Disable</span>
                            </button>
                          )}

                          {item.status === 'redeemed' && (
                            <button
                              type="button"
                              onClick={() => handleClearRedemption(item.key)}
                              disabled={actionLoading}
                              title="Reset redemption so key can be re-used"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleQuickUnlockThisDevice(item.key)}
                            title="Activate this key on your current device"
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Test</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-white/50">
                  <span>
                    Showing {catalogList.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                    {Math.min(currentPage * PAGE_SIZE, catalogList.length)} of {catalogList.length} keys
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="px-2 py-1 font-mono text-white/80">
                      {currentPage} / {totalCatalogPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalCatalogPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalCatalogPages))}
                      className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REDEEMED KEYS */}
            {activeTab === 'redeemed' && (
              <div className="flex-1 flex flex-col p-5 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      id="admin-search-redeemed"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search redeemed keys or device IDs..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0d0e13] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 font-mono"
                    />
                  </div>
                </div>

                {filteredRedeemed.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#181a24]/30 rounded-xl border border-white/[0.04]">
                    <Key className="w-8 h-8 text-white/20 mb-2" />
                    <p className="text-xs text-white/50">
                      {searchFilter ? 'No redeemed keys match your search.' : 'No keys have been redeemed yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filteredRedeemed.map((item) => (
                      <div
                        key={item.key}
                        className="bg-[#181a24] border border-white/[0.06] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white text-sm">
                              {item.key}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.key)}
                              className="p-1 rounded text-white/40 hover:text-white transition-colors cursor-pointer"
                              title="Copy Key"
                            >
                              {copiedKey === item.key ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {item.isDisabled ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Ban className="w-2.5 h-2.5" /> Disabled / Revoked
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Redeemed & Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/40 flex items-center gap-3">
                            <span>Device: <code className="text-white/60">{item.deviceId}</code></span>
                            {item.redeemedAt && (
                              <span>Redeemed: {new Date(item.redeemedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {item.isDisabled ? (
                            <button
                              type="button"
                              onClick={() => handleEnableKey(item.key)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Re-enable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisableKey(item.key)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Disable Key</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleClearRedemption(item.key)}
                            disabled={actionLoading}
                            title="Clear this redemption record so the key can be re-used"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DISABLED KEYS BLACKLIST */}
            {activeTab === 'disabled' && (
              <div className="flex-1 flex flex-col p-5 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      id="admin-search-disabled"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search disabled keys..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0d0e13] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>
                </div>

                {filteredDisabled.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#181a24]/30 rounded-xl border border-white/[0.04]">
                    <Shield className="w-8 h-8 text-emerald-400/40 mb-2" />
                    <p className="text-xs text-white/60 font-medium">No keys are currently disabled.</p>
                    <p className="text-[11px] text-white/40 mt-1">
                      Disabled keys will appear here and cannot be redeemed by anyone.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filteredDisabled.map((keyStr) => (
                      <div
                        key={keyStr}
                        className="bg-[#181a24] border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="font-mono font-bold text-white">{keyStr}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEnableKey(keyStr)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/70 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Re-enable
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
