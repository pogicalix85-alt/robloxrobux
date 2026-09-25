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
import { VALID_KEYS, normalizeKey, NORMALIZED_VALID_KEYS_MAP } from '../data/validKeys';
import { getDeviceId, setDeviceUnlocked, isKeyDisabledLocally } from '../utils/device';

interface KeyVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key?: string) => void;
}

const DISCORD_INVITE_URL = 'https://discord.gg/vcg3Uaw9Z2';

const CLOUD_DB_KEY = '8xzdudn0';
const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1547178065568866364/C8IxRBvPp8WiFuc0Cj6l20AtBKp1VRgYygKUGOhZORw0bIm1mJaQwpl2eyVQfvDG-WB_';

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
    const rawKey = keyInput.trim();
    const normKey = normalizeKey(rawKey);

    if (!normKey) {
      setErrorMessage('Please enter an access key.');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const deviceId = getDeviceId();

      // 1. Instant check against valid keys list (accepts any casing, with or without dashes)
      if (!NORMALIZED_VALID_KEYS_MAP.has(normKey)) {
        setIsLoading(false);
        setErrorMessage('Invalid key. To get a key you must join the discord server: ' + DISCORD_INVITE_URL);
        return;
      }

      // Check if disabled in local cache
      if (isKeyDisabledLocally(normKey)) {
        setIsLoading(false);
        setErrorMessage('This key has been disabled by the administrator.');
        return;
      }

      const canonicalKey = NORMALIZED_VALID_KEYS_MAP.get(normKey) || normKey;

      // 2. Global Cloud Database Check (Works across ALL devices, ALL browsers, everywhere)
      let cloudAlreadyUsed = false;
      try {
        const cloudCheckRes = await fetch(
          `https://keyvalue.immanuel.co/api/KeyVal/GetValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}`,
          { cache: 'no-store' }
        );
        if (cloudCheckRes.ok) {
          const rawText = await cloudCheckRes.text();
          const cloudVal = rawText.replace(/^"|"$/g, '').trim();
          if (cloudVal && cloudVal !== '') {
            if (cloudVal === 'disabled' || cloudVal.startsWith('disabled')) {
              setIsLoading(false);
              setErrorMessage('This key has been disabled by the administrator.');
              return;
            }
            cloudAlreadyUsed = true;
          }
        }
      } catch (cloudErr) {
        console.warn('Direct cloud KV check network notice:', cloudErr);
      }

      if (cloudAlreadyUsed) {
        setIsLoading(false);
        setErrorMessage(
          'This key has already been used and is expired. Keys can only be used once. To get a new key you must join the discord server: ' +
            DISCORD_INVITE_URL
        );
        return;
      }

      // 3. Dual-Layer Verification (Backend API + Direct Cloud KV)
      let isVerified = false;
      let alreadyUsed = false;
      let isDisabledKey = false;
      let backendNotifiedDiscord = false;

      // Try Backend API first if available
      try {
        const response = await fetch('/api/keys/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: normKey, deviceId }),
        });

        const data = await response.json().catch(() => null);
        if (response.ok) {
          if (data && data.success) {
            isVerified = true;
            backendNotifiedDiscord = true;
          } else if (data && data.error === 'already_used') {
            alreadyUsed = true;
          }
        } else if (data && data.error === 'disabled_key') {
          isDisabledKey = true;
        } else if (response.status === 403) {
          alreadyUsed = true;
        }
      } catch {
        // Backend API unreachable (e.g. static host/Vercel)
      }

      if (isDisabledKey) {
        setIsLoading(false);
        setErrorMessage('This key has been disabled by the administrator.');
        return;
      }

      if (alreadyUsed) {
        setIsLoading(false);
        setErrorMessage(
          'This key has already been used and is expired. Keys can only be used once. To get a new key you must join the discord server: ' +
            DISCORD_INVITE_URL
        );
        return;
      }

      // If backend API was unavailable or did not run (e.g. static deployment / Vercel),
      // verify and burn directly via Cloud KV
      if (!isVerified) {
        try {
          const cloudBurnRes = await fetch(
            `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/used_${deviceId}`,
            { method: 'POST', headers: { 'Content-Length': '0' } }
          );
          if (cloudBurnRes.ok) {
            isVerified = true;
          }
        } catch (cloudBurnErr) {
          console.error('Cloud KV verification error:', cloudBurnErr);
        }
      }

      if (isVerified) {
        // Guarantee Cloud KV burn
        try {
          await fetch(
            `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_DB_KEY}/${encodeURIComponent(normKey)}/used_${deviceId}`,
            { method: 'POST', headers: { 'Content-Length': '0' } }
          );
        } catch {
          // Cloud KV already recorded
        }

        // Send Discord Webhook notification if not already sent by backend API
        if (!backendNotifiedDiscord) {
          try {
            await fetch(DISCORD_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `a user has used this lifetime ${canonicalKey} it can only be used once.`,
                embeds: [
                  {
                    title: '🔑 Lifetime Key Activated',
                    description: `**Key:** \`${canonicalKey}\`\n**Device ID:** \`${deviceId}\`\n**Notice:** It can only be used once.`,
                    color: 3447003,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
          } catch (webhookErr) {
            console.error('Discord webhook notice:', webhookErr);
          }
        }

        // Mark device as permanently unlocked
        setDeviceUnlocked(canonicalKey);

        setIsSuccess(true);
        setIsLoading(false);

        setTimeout(() => {
          onSuccess(canonicalKey);
        }, 1200);
      } else {
        setIsLoading(false);
        setErrorMessage(
          'Unable to verify key. Please check your internet connection and try again.'
        );
      }
    } catch (err) {
      console.error('Key verify error:', err);
      setIsLoading(false);
      setErrorMessage('Unable to verify key. Please check your connection and try again.');
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
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          className="relative w-full max-w-[440px] bg-white border border-[#e4e7ec] rounded-3xl shadow-2xl text-[#191b22] z-10 overflow-hidden flex flex-col select-none"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#fbfcfd]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#2b5ef5]">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[#191b22] tracking-tight leading-tight">
                  Access Key Required
                </h3>
                <p className="text-[11px] text-[#6e7382]">
                  Authentication needed to Send Robux
                </p>
              </div>
            </div>

            <button
              id="close-key-modal-btn"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-full text-[#6e7382] hover:text-black hover:bg-gray-100 transition-colors disabled:opacity-40"
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
                  className="w-16 h-16 rounded-full bg-[#2b5ef5] text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-8 h-8 stroke-[3]" />
                </motion.div>
                <h4 className="text-xl font-bold text-[#191b22] mb-1">
                  Key Verified!
                </h4>
                <p className="text-xs text-[#6e7382] max-w-xs">
                  Send Robux is now unlocked and bound to this device and browser. Opening Send...
                </p>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Discord Callout Card */}
                <div className="p-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex flex-col gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4752C4]">
                      Need an access key?
                    </span>
                  </div>

                  <p className="text-xs text-[#191b22] leading-relaxed font-semibold">
                    To get a key you must join the discord server
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      id="join-discord-btn"
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <DiscordIcon className="w-4 h-4" />
                      <span>Join Discord Server</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      id="copy-discord-link-btn"
                      type="button"
                      onClick={handleCopyDiscord}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-gray-50 text-[#191b22] text-xs font-semibold border border-gray-200 transition-colors shadow-2xs"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#6e7382]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-[#6e7382] break-all font-mono select-all">
                    {DISCORD_INVITE_URL}
                  </div>
                </div>

                {/* Key Input Form */}
                <form onSubmit={handleVerifyKey} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="robux-send-access-key" 
                        className="text-xs font-bold text-[#191b22] flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#2b5ef5]" />
                        <span>Enter Access Key</span>
                      </label>

                      <button
                        type="button"
                        onClick={handlePasteKey}
                        className="text-[11px] font-semibold text-[#2b5ef5] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
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
                        placeholder="Enter access key"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        disabled={isLoading}
                        className="w-full bg-[#f8f9fa] text-[#191b22] placeholder:text-[#8c92a2] text-sm font-mono tracking-wider px-4 py-3 rounded-xl border border-[#d6dae3] focus:outline-none focus:border-[#2b5ef5] focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Device Lock Rule Notice */}
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-2 text-[11px] text-[#6e7382]">
                    <ShieldCheck className="w-4 h-4 text-[#2b5ef5] shrink-0 mt-0.5" />
                    <span>
                      Keys can only be used once and will be permanently locked into this device &amp; browser upon activation.
                    </span>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                        <span className="leading-snug">{errorMessage}</span>
                      </div>
                      <a
                        href={DISCORD_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-red-800 underline hover:text-red-950 ml-6"
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
                    className="w-full bg-[#2b5ef5] hover:bg-[#204ecc] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
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
