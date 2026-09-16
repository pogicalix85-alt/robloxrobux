import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { normalizeKey, NORMALIZED_VALID_KEYS_MAP, VALID_KEYS } from '../data/validKeys';

interface RedeemedKeyItem {
  key: string;
  deviceId: string;
  redeemedAt: string;
  isDisabled: boolean;
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
  const [activeTab, setActiveTab] = useState<'disable' | 'redeemed' | 'disabled'>('disable');

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
  const [totalValidCount, setTotalValidCount] = useState<number>(VALID_KEYS.length);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch admin keys data from backend
  const fetchAdminData = async () => {
    setIsDataLoading(true);
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
    if (isOpen && isAuthenticated) {
      fetchAdminData();
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
        //
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
      //
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

    setActionLoading(true);
    setActionFeedback(null);

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
          message: data.message || `Key "${keyToDisable}" disabled successfully!`,
        });
        setTypeKeyInput('');
        if (onKeyDisabledOrRevoked) {
          onKeyDisabledOrRevoked(norm);
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
    }
  };

  // Re-enable a disabled key
  const handleEnableKey = async (keyToEnable: string) => {
    const norm = normalizeKey(keyToEnable);
    setActionLoading(true);
    setActionFeedback(null);

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
          message: data.message || `Key "${keyToEnable}" re-enabled.`,
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
    }
  };

  // Reset/clear redemption
  const handleClearRedemption = async (keyToClear: string) => {
    const norm = normalizeKey(keyToClear);
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
          message: data.message || `Redemption cleared for key "${keyToClear}".`,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (!isOpen) return null;

  // Filtered lists based on search
  const filteredRedeemed = redeemedKeys.filter(
    (item) =>
      item.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.deviceId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredDisabled = disabledKeys.filter((k) =>
    k.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      id="admin-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-[#13151b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#181a24]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
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
              <p className="text-xs text-white/50">Manage, disable, and revoke access keys</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
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
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Admin Authentication Required</h4>
            <p className="text-sm text-white/60 max-w-sm mb-6">
              Enter the administrator password to access key management and revocation controls.
            </p>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter admin password..."
                  autoFocus
                  className="w-full px-4 py-3 bg-[#0d0e13] border border-white/15 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-red-500/60 transition-colors"
                />
                {passwordError && (
                  <p className="text-xs text-red-400 text-left mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
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
            <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-[#0d0e13] border-b border-white/[0.06] text-xs">
              <div className="flex flex-col">
                <span className="text-white/40">Master Keys</span>
                <span className="text-sm font-bold text-white mt-0.5">{totalValidCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40">Redeemed Keys</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5">{redeemedKeys.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40">Disabled / Revoked</span>
                <span className="text-sm font-bold text-red-400 mt-0.5">{disabledKeys.length}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-white/[0.06] bg-[#151720]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('disable')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
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
                  onClick={() => setActiveTab('redeemed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'redeemed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Redeemed Keys ({redeemedKeys.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('disabled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'disabled'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Disabled List ({disabledKeys.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                disabled={isDataLoading}
                title="Refresh Data"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Notification Feedback Toast */}
            {actionFeedback && (
              <div
                className={`mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {actionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{actionFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedback(null)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Tab View 1: Type Key and Disable */}
            {activeTab === 'disable' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="bg-[#181a24] border border-white/[0.08] rounded-xl p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400" />
                      <span>Disable / Revoke Any Key</span>
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Type or paste any key below. Disabling a key marks it as invalid, blocks new redemptions,
                      and immediately revokes access if already redeemed by a device.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={typeKeyInput}
                          onChange={(e) => setTypeKeyInput(e.target.value)}
                          placeholder="e.g. k8x2-7qz9-m4v6"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#0d0e13] border border-white/15 rounded-xl text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/60"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDisableKey(typeKeyInput)}
                        disabled={actionLoading || !typeKeyInput.trim()}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2 shrink-0"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                        <span>Disable Key</span>
                      </button>
                    </div>

                    {typeKeyInput.trim() && (
                      <div className="text-[11px] text-white/50 flex items-center gap-1.5 pl-1">
                        {NORMALIZED_VALID_KEYS_MAP.has(normalizeKey(typeKeyInput)) ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Key is verified in the 500-key master database
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Key not found in official master list (can still be blacklisted)
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
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      View All →
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
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/70 text-[11px] font-medium transition-colors"
                              >
                                Re-enable
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDisableKey(item.key)}
                                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[11px] font-medium transition-colors flex items-center gap-1"
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

            {/* Tab View 2: Redeemed Keys Management */}
            {activeTab === 'redeemed' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search redeemed keys or devices..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0d0e13] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40"
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
                              className="p-1 rounded text-white/40 hover:text-white transition-colors"
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
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                            >
                              Re-enable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisableKey(item.key)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
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
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
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

            {/* Tab View 3: Disabled Keys Blacklist */}
            {activeTab === 'disabled' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search disabled keys..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0d0e13] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40"
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
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/70 text-xs font-semibold transition-colors"
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
