import React, { useState, useEffect, useRef } from 'react';
import { RobloxUser } from '../types';
import { RobuxIcon, RobloxPlusHexagonIcon, VerifiedBadge } from './Icons';
import { 
  Users, 
  Clock, 
  Check, 
  X, 
  ChevronLeft, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface SendRobuxModalProps {
  isOpen: boolean;
  currentBalance: number;
  isUnlocked: boolean;
  onClose: () => void;
  onSendRobux: (recipient: RobloxUser, amount: number) => void;
  onRequireKey: () => void;
  onOpenBuyRobux?: () => void;
}

type SendModalStep = 'search' | 'amount' | 'confirm' | 'sending' | 'success';

// Authentic fallback players matching screenshots (mPhase, ProjectSupreme, etc.)
const FALLBACK_USERS: RobloxUser[] = [
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
    id: 87162541,
    name: 'DinoWILD',
    displayName: 'DinoWILD',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-76F7D48E1533A284AAEF024C5165A1C0-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
];

const AMOUNT_PRESETS = [25, 50, 100, 200];

export const SendRobuxModal: React.FC<SendRobuxModalProps> = ({
  isOpen,
  currentBalance,
  isUnlocked,
  onClose,
  onSendRobux,
  onRequireKey,
  onOpenBuyRobux,
}) => {
  const [step, setStep] = useState<SendModalStep>('search');
  const [selectedUser, setSelectedUser] = useState<RobloxUser>(FALLBACK_USERS[0]);
  const [amount, setAmount] = useState<number>(200);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('200');
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Search state - blank by default per user instruction and screenshots
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RobloxUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [displayBalance, setDisplayBalance] = useState(currentBalance);

  // Sync balance
  useEffect(() => {
    setDisplayBalance(currentBalance);
  }, [currentBalance]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setErrorMsg('');
      setIsEditingAmount(false);
      setAmount(200);
      setCustomAmountInput('200');
      setDisplayBalance(currentBalance);
    }
  }, [isOpen, currentBalance]);

  // Focus custom input when editing
  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [isEditingAmount]);

  // Live Roblox API search whenever search query changes
  useEffect(() => {
    if (step !== 'search') return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/roblox/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.users) && data.users.length > 0) {
            setSearchResults(data.users);
            setIsSearching(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Search fetch error:', err);
      }

      // Check fallback list
      const queryLower = trimmed.toLowerCase();
      const matched = FALLBACK_USERS.filter(
        (u) =>
          u.name.toLowerCase().includes(queryLower) ||
          u.displayName.toLowerCase().includes(queryLower)
      );

      if (matched.length > 0) {
        setSearchResults(matched);
      } else {
        // Create user with Roblox CDN circular headshot fallback
        setSearchResults([
          {
            id: Math.floor(Math.random() * 100000000) + 100000,
            name: trimmed,
            displayName: trimmed,
            hasVerifiedBadge: false,
            avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular',
          },
        ]);
      }
      setIsSearching(false);
    }, 180);

    return () => clearTimeout(timeout);
  }, [searchQuery, step]);

  if (!isOpen) return null;

  // Step 1: User selects a player from search -> Go to Choose Amount Screen
  const handleSelectUser = (u: RobloxUser) => {
    setSelectedUser(u);
    setAmount(200);
    setCustomAmountInput('200');
    setIsEditingAmount(false);
    setErrorMsg('');
    setStep('amount');
  };

  // Step 2: User chooses amount -> Go to Confirm Screen
  const handleProceedToConfirm = () => {
    if (amount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    if (displayBalance < amount) {
      setErrorMsg(`You do not have enough Robux. You need ${amount.toLocaleString()} Robux.`);
      return;
    }
    setErrorMsg('');
    setStep('confirm');
  };

  // Step 3: User confirms sending -> Send Robux
  const handleInitiateSend = () => {
    if (!isUnlocked) {
      onRequireKey();
      return;
    }

    if (displayBalance < amount) {
      setErrorMsg(`You do not have enough Robux. You need ${amount.toLocaleString()} Robux.`);
      return;
    }

    setStep('sending');

    setTimeout(() => {
      const newBal = Math.max(0, displayBalance - amount);
      setDisplayBalance(newBal);
      setStep('success');

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#2f64e8', '#ffffff', '#ffd700'],
        });
      } catch {
        // Fallback
      }

      onSendRobux(selectedUser, amount);
    }, 1500);
  };

  const handlePresetClick = (presetVal: number) => {
    setAmount(presetVal);
    setCustomAmountInput(String(presetVal));
    setIsEditingAmount(false);
    setErrorMsg('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmountInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setAmount(num);
      setErrorMsg('');
    }
  };

  const handleAmountBlur = () => {
    const num = parseInt(customAmountInput, 10);
    if (isNaN(num) || num <= 0) {
      setAmount(200);
      setCustomAmountInput('200');
    } else {
      setAmount(num);
      setCustomAmountInput(String(num));
    }
    setIsEditingAmount(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'sending' ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-[420px] bg-[#111319] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl z-10 select-none text-white"
        >
          {/* Top Header matching all screenshots:
              [BackArrow] [RobloxPlusHexagonIcon] Send Robux              ⬡ {balance}  ✕
          */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Back button on amount and confirm steps */}
              {step === 'amount' && (
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="p-1 -ml-1 text-white/70 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                  title="Back to search"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {step === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setStep('amount')}
                  className="p-1 -ml-1 text-white/70 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                  title="Back to amount selection"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <RobloxPlusHexagonIcon className="w-5 h-5 text-white shrink-0" />
              <h3 className="font-bold text-base text-white tracking-tight">
                Send Robux
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Balance display ⬡ {balance} matching screenshots */}
              <div 
                className="flex items-center gap-1.5 cursor-pointer select-none text-white/90 hover:text-white transition-colors"
                onClick={onOpenBuyRobux}
                title="Robux Balance"
              >
                <RobuxIcon className="w-4 h-4 text-white" />
                <span className="font-bold text-sm text-white">
                  {displayBalance.toLocaleString()}
                </span>
              </div>

              {/* Close Button ✕ matching screenshots */}
              {step !== 'sending' && (
                <button
                  id="close-send-modal-btn"
                  type="button"
                  onClick={onClose}
                  className="p-1 -mr-1 text-white/80 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="px-5 pb-5 pt-1 flex flex-col">
            {/* STEP 1: SEARCH & SELECT PLAYER */}
            {step === 'search' && (
              <div className="flex flex-col">
                {/* Search Bar Input with Blue Outline */}
                <div className="relative">
                  <div className="relative flex items-center bg-[#0d0e14] border-2 border-[#1f5eff] rounded-xl px-3.5 py-2.5 shadow-sm transition-all">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username"
                      className="w-full bg-transparent text-white font-medium placeholder:text-white/40 text-sm focus:outline-none"
                      autoFocus
                    />

                    {isSearching ? (
                      <Loader2 className="w-4 h-4 text-[#1f5eff] animate-spin shrink-0 ml-2" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-white/40 hover:text-white shrink-0 cursor-pointer ml-2 transition-colors"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* When Search Query is EMPTY:
                    My friends (0)
                         No friends
                */}
                {!searchQuery.trim() ? (
                  <div className="flex flex-col">
                    <div className="mt-4 mb-2">
                      <h4 className="font-bold text-sm text-white tracking-tight">
                        My friends (0)
                      </h4>
                    </div>

                    <div className="py-16 flex items-center justify-center text-center">
                      <span className="text-white/40 text-sm font-medium">
                        No friends
                      </span>
                    </div>
                  </div>
                ) : (
                  /* When user searches: Displays matched players */
                  <div className="flex flex-col mt-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white tracking-tight">
                        Search results ({searchResults.length})
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5 scrollbar-none">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="bg-[#151720] hover:bg-[#1a1d28] border border-white/[0.05] hover:border-white/[0.12] rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                        >
                          {/* Circular Avatar + Name + Username */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#242838] shrink-0 border border-white/10 shadow-sm">
                              <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="w-full h-full object-cover select-none"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                                }}
                              />
                            </div>

                            <div className="flex flex-col text-left min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-sm text-white truncate">
                                  {user.displayName}
                                </span>
                                {user.hasVerifiedBadge && (
                                  <VerifiedBadge className="w-4 h-4 text-[#0066FF] shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-white/50 truncate">
                                @{user.name}
                              </span>
                            </div>
                          </div>

                          {/* "Select" Action Button */}
                          <span className="text-white/60 group-hover:text-white font-semibold text-sm px-2 py-1 transition-colors shrink-0">
                            Select
                          </span>
                        </div>
                      ))}

                      {searchResults.length === 0 && !isSearching && (
                        <div className="py-10 text-center text-xs text-white/40">
                          No players found for &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: CHOOSE HOW MUCH TO SEND (MATCHING SCREENSHOT image.png / Image 1) */}
            {step === 'amount' && (
              <div className="flex flex-col items-center text-center pt-2">
                {/* Circular Avatar */}
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#222530] ring-1 ring-white/10 mb-2 shadow-md">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.displayName}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                    }}
                  />
                </div>

                {/* Display Name + Verified Badge */}
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  <span className="font-bold text-base text-white">
                    {selectedUser.displayName}
                  </span>
                  {selectedUser.hasVerifiedBadge && (
                    <VerifiedBadge className="w-4 h-4 text-[#0066FF]" />
                  )}
                </div>

                {/* Big Robux Icon and Amount matching Screenshot 1 */}
                <div className="flex items-center justify-center gap-3 my-2">
                  <RobuxIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white shrink-0" />
                  {isEditingAmount ? (
                    <input
                      ref={amountInputRef}
                      type="text"
                      value={customAmountInput}
                      onChange={handleCustomAmountChange}
                      onBlur={handleAmountBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAmountBlur();
                      }}
                      className="bg-[#1b1e2a] border border-[#1f5eff] text-white font-extrabold text-4xl sm:text-5xl px-2 py-0.5 rounded-xl w-40 text-center focus:outline-none shadow-inner"
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingAmount(true)}
                      className="font-extrabold text-4xl sm:text-5xl text-white tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
                      title="Click to enter custom amount"
                    >
                      {amount.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Helper caption: Tap the number to enter a custom amount */}
                <p 
                  onClick={() => setIsEditingAmount(true)}
                  className="text-xs text-white/50 mt-1 mb-5 cursor-pointer hover:text-white/70 transition-colors"
                >
                  Tap the number to enter a custom amount
                </p>

                {/* Preset Chips matching Screenshot 1: [ ⬡ 25 ] [ ⬡ 50 ] [ ⬡ 100 ] [ ⬡ 200 ] */}
                <div className="flex items-center justify-center gap-2 mb-6 w-full">
                  {AMOUNT_PRESETS.map((presetVal) => {
                    const isSelected = amount === presetVal && !isEditingAmount;
                    return (
                      <button
                        key={presetVal}
                        type="button"
                        onClick={() => handlePresetClick(presetVal)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#122752] border-2 border-[#1f5eff] text-white shadow-sm'
                            : 'bg-[#171922] border border-white/[0.08] text-white/80 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <RobuxIcon className="w-3 h-3 text-white" />
                        <span>{presetVal}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Error Banner if any */}
                {errorMsg && (
                  <div className="w-full mb-3 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Full-width Blue [ Next ] Button matching Screenshot 1 */}
                <button
                  id="send-robux-next-btn"
                  type="button"
                  onClick={handleProceedToConfirm}
                  className="w-full bg-[#1f5eff] hover:bg-[#1853e6] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-base shadow-md shadow-blue-600/25 transition-all cursor-pointer select-none text-center"
                >
                  Next
                </button>

                {/* Footer caption matching Screenshot 1 */}
                <p className="text-xs text-white/40 mt-3">
                  Robux are sent instantly with no fees
                </p>
              </div>
            )}

            {/* STEP 3: CONFIRMATION VIEW (MATCHING SCREENSHOT 2 / 2.png) */}
            {step === 'confirm' && (
              <div className="flex flex-col space-y-3 pt-1">
                {/* Recipient Card matching Screenshot 2 */}
                <div className="bg-[#16171e] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center border border-white/[0.04]">
                  {/* Circular Avatar */}
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#222530] ring-1 ring-white/10 mb-2.5 shadow-md">
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.displayName}
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                      }}
                    />
                  </div>

                  {/* Display Name + Verified Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base sm:text-lg text-white">
                      {selectedUser.displayName}
                    </span>
                    {selectedUser.hasVerifiedBadge && (
                      <VerifiedBadge className="w-4 h-4 text-[#0066FF]" />
                    )}
                  </div>

                  {/* Username */}
                  <span className="text-xs text-white/50 mb-3">
                    @{selectedUser.name}
                  </span>

                  {/* Mutual Connections & Joined date matching Screenshot 2 */}
                  <div className="flex items-center gap-4 text-xs text-white/60 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-white/60" />
                      <span>0 mutual Connections</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/60" />
                      <span>Joined in 2020</span>
                    </div>
                  </div>
                </div>

                {/* Robux Amount Card matching Screenshot 2: [RobuxIcon] 200 */}
                <div className="bg-[#16171e] rounded-xl py-4 px-4 flex items-center justify-center border border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <RobuxIcon className="w-7 h-7 text-white shrink-0" />
                    <span className="font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                      {amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Error Banner if any */}
                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Action Buttons: [ Send ] (Blue) and [ Edit ] (Dark) matching Screenshot 2 */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    id="send-robux-confirm-btn"
                    type="button"
                    onClick={handleInitiateSend}
                    className="w-full bg-[#1f5eff] hover:bg-[#1853e6] active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl transition-all cursor-pointer select-none text-center shadow-md shadow-blue-600/20"
                  >
                    Send
                  </button>

                  <button
                    id="send-robux-edit-btn"
                    type="button"
                    onClick={() => {
                      setStep('amount');
                      setErrorMsg('');
                    }}
                    className="w-full bg-[#242630] hover:bg-[#2c2f3b] active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl transition-all cursor-pointer select-none text-center border border-white/[0.05]"
                  >
                    Edit
                  </button>
                </div>

                {/* Legal Note matching Screenshot 2 */}
                <p className="text-[11px] text-white/40 text-center leading-relaxed px-2 pt-0.5">
                  You need an age check or parental consent to send Robux. Once you send, you cannot cancel.
                </p>
              </div>
            )}

            {/* STEP 4: SENDING ANIMATION (MATCHING SCREENSHOT 3 / 3.png) */}
            {step === 'sending' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#222530] ring-1 ring-white/10 mb-4 shadow-lg">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center gap-2 text-white font-medium text-base mb-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span>Sending Robux...</span>
                </div>

                <p className="text-xs text-white/50">
                  to @{selectedUser.name}
                </p>
              </div>
            )}

            {/* STEP 5: SUCCESS CONFIRMATION (MATCHING SCREENSHOT 4 / 4.png) */}
            {step === 'success' && (
              <div className="flex flex-col items-center text-center py-8">
                {/* Circle Checkmark Icon matching Screenshot 4 */}
                <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center mb-4 text-white">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>

                <h3 className="font-bold text-base sm:text-lg text-white tracking-normal mb-6">
                  You sent {amount.toLocaleString()} Robux
                </h3>

                <button
                  type="button"
                  id="send-success-ok-btn"
                  onClick={onClose}
                  className="w-full bg-[#1f5eff] hover:bg-[#1853e6] active:scale-[0.98] text-white font-bold text-base py-3.5 rounded-xl transition-all cursor-pointer select-none shadow-md"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
