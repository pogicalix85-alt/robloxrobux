import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Check, 
  ClipboardPaste,
  Lock
} from 'lucide-react';
import { DiscordIcon } from './Icons';
import { VALID_KEYS } from '../data/validKeys';

interface KeyVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DISCORD_INVITE_URL = 'https://discord.gg/vcg3Uaw9Z2';

export const KeyVerificationModal: React.FC<KeyVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate or retrieve persistent device id
  const getDeviceId = (): string => {
    try {
      let id = localStorage.getItem('roblox_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
        localStorage.setItem('roblox_device_id', id);
      }
      return id;
    } catch {
      return 'fallback_device_browser';
    }
  };

  useEffect(() => {
    if (isOpen) {
      setKeyInput('');
      setIsLoading(false);
      setErrorMessage('');
      setIsSuccess(false);
      setCopiedLink(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_INVITE_URL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKeyInput(text.trim());
        setErrorMessage('');
      }
    } catch {
      // Clipboard permissions denied
    }
  };

  const handleVerifyKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = keyInput.trim().replace(/\s+/g, '').toLowerCase();

    if (!cleanKey) {
      setErrorMessage('Please enter an access key.');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const deviceId = getDeviceId();
      let isVerified = false;
      let apiErrorMessage = '';

      try {
        const response = await fetch('/api/keys/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: cleanKey, deviceId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            isVerified = true;
          } else {
            apiErrorMessage = data.message || 'Invalid key.';
          }
        } else if (response.status === 400 || response.status === 403) {
          const data = await response.json().catch(() => ({}));
          apiErrorMessage = data.message || 'Invalid key.';
        } else {
          // If 404, 500, or other server error, fallback to client-side verification
          throw new Error('Server endpoint unavailable');
        }
      } catch (networkErr) {
        // Fallback to client-side validation (useful for static deployments like Vercel static or GitHub Pages)
        const VALID_KEYS_SET = new Set(VALID_KEYS.map((k) => k.trim().toLowerCase()));
        if (VALID_KEYS_SET.has(cleanKey)) {
          let clientRedeemed: Record<string, string> = {};
          try {
            clientRedeemed = JSON.parse(localStorage.getItem('roblox_client_redeemed') || '{}');
          } catch {
            clientRedeemed = {};
          }

          if (clientRedeemed[cleanKey] && clientRedeemed[cleanKey] !== deviceId) {
            apiErrorMessage = 'This key has already been used and is locked to another device. Keys can only be used once. Join discord for a new key: ' + DISCORD_INVITE_URL;
          } else {
            clientRedeemed[cleanKey] = deviceId;
            try {
              localStorage.setItem('roblox_client_redeemed', JSON.stringify(clientRedeemed));
            } catch {
              // Ignore storage errors
            }
            isVerified = true;
          }
        } else {
          apiErrorMessage = 'Invalid key. To get a key you must join the discord server: ' + DISCORD_INVITE_URL;
        }
      }

      if (isVerified) {
        try {
          localStorage.setItem('roblox_send_unlocked', 'true');
          localStorage.setItem('roblox_active_key', cleanKey);
        } catch {
          // LocalStorage may be blocked
        }

        setIsSuccess(true);
        setIsLoading(false);

        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setIsLoading(false);
        setErrorMessage(apiErrorMessage || 'Invalid key. Please check your key or join Discord to get one.');
      }
    } catch (err) {
      console.error('Key verify error:', err);
      setIsLoading(false);
      setErrorMessage('Unable to verify key. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full max-w-[440px] bg-[#171920] border border-white/[0.12] rounded-2xl shadow-2xl text-white z-10 overflow-hidden flex flex-col"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#14161d]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-tight">
                  Access Key Required
                </h3>
                <p className="text-[11px] text-white/50">
                  Authentication needed to Send Robux
                </p>
              </div>
            </div>

            <button
              id="close-key-modal-btn"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            {isSuccess ? (
              /* Success State */
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-[#0074e0] text-white flex items-center justify-center mb-4 shadow-xl shadow-blue-500/30"
                >
                  <Check className="w-9 h-9 stroke-[3]" />
                </motion.div>
                <h4 className="text-xl font-black text-white mb-1">
                  Key Verified!
                </h4>
                <p className="text-xs text-white/60 max-w-xs">
                  Send Robux is now unlocked and bound to this device and browser. Opening Send...
                </p>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Discord Callout Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#5865F2]/15 via-[#5865F2]/10 to-transparent border border-[#5865F2]/30 flex flex-col gap-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#98a3f8]">
                      Need an access key?
                    </span>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    To get a key you must join the discord server
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      id="join-discord-btn"
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white text-xs font-extrabold shadow-md shadow-[#5865F2]/20 transition-all cursor-pointer"
                    >
                      <DiscordIcon className="w-4 h-4" />
                      <span>Join Discord Server</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      id="copy-discord-link-btn"
                      type="button"
                      onClick={handleCopyDiscord}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-white/45 break-all font-mono select-all">
                    {DISCORD_INVITE_URL}
                  </div>
                </div>

                {/* Key Input Form */}
                <form onSubmit={handleVerifyKey} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="robux-send-access-key" 
                        className="text-xs font-bold text-white/80 flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Enter Access Key</span>
                      </label>

                      <button
                        type="button"
                        onClick={handlePasteKey}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Paste</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        ref={inputRef}
                        id="robux-send-access-key"
                        type="text"
                        value={keyInput}
                        onChange={(e) => {
                          setKeyInput(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="XXXX-XXXX-XXXX"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        disabled={isLoading}
                        className="w-full bg-[#111319] text-white placeholder:text-white/30 text-sm font-mono tracking-wider px-4 py-3 rounded-xl border border-white/15 focus:outline-none focus:border-[#0074e0] focus:ring-2 focus:ring-[#0074e0]/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Device Lock Rule Notice */}
                  <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-start gap-2 text-[11px] text-white/60">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      Keys can only be used once and will be permanently locked into this device &amp; browser upon activation.
                    </span>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span className="leading-snug">{errorMessage}</span>
                      </div>
                      <a
                        href={DISCORD_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-red-200 underline hover:text-white ml-6"
                      >
                        Join Discord: https://discord.gg/vcg3Uaw9Z2
                      </a>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    id="submit-key-btn"
                    type="submit"
                    disabled={isLoading || !keyInput.trim()}
                    className="w-full bg-[#0074e0] hover:bg-[#0060c4] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Key...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Unlock Send Robux</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
