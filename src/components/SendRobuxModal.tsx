import React, { useState, useEffect, useRef } from 'react';
import { RobloxUser } from '../types';
import { RobuxIcon, RobloxPlusHexagonIcon, VerifiedBadge } from './Icons';
import { 
  Users, 
  Clock, 
  Check, 
  X, 
  ChevronLeft, 
  Loader2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const AMOUNT_PRESETS = [25, 50, 100, 200];

// Fallback high-fidelity popular Roblox users for instant previews
const FALLBACK_USERS: RobloxUser[] = [
  {
    id: 156,
    name: 'Builderman',
    displayName: 'builderman',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1729A629B4EAF677DBDAFE012658CE6F-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 1,
    name: 'Roblox',
    displayName: 'Roblox',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 1243143,
    name: 'Stickmasterluke',
    displayName: 'Stickmasterluke',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-5C052A37424ED1BCF0680A90089BD3A8-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 55328987,
    name: 'Denis',
    displayName: 'DenisDaily',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-4AC1C0B4F37EAC3BBDCFE246C6E48943-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RobloxUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RobloxUser>(FALLBACK_USERS[0]);
  const [amount, setAmount] = useState<number>(200);
  const [customAmountInput, setCustomAmountInput] = useState<string>('200');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [displayBalance, setDisplayBalance] = useState<number>(currentBalance);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Sync display balance with prop
  useEffect(() => {
    setDisplayBalance(currentBalance);
  }, [currentBalance]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setAmount(200);
      setCustomAmountInput('200');
      setIsEditingAmount(false);
      setErrorMsg('');
      setDisplayBalance(currentBalance);
    }
  }, [isOpen, currentBalance]);

  // Focus amount input when editing
  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [isEditingAmount]);

  // Real-time live search with Roblox avatar headshots
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      await executeSearch(searchQuery);
    }, 280);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const executeSearch = async (query: string) => {
    const trimmed = query.trim().replace(/^@/, '');
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 1. Try server search API
    try {
      const resp = await fetch(
        `/api/roblox/search-users?keyword=${encodeURIComponent(trimmed)}&limit=10`
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
          const formatted = data.users.map((u: any) => ({
            id: u.id,
            name: u.name,
            displayName: u.displayName || u.name,
            hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
            avatarUrl: u.avatarUrl || `/api/roblox/avatar-headshot/${u.id}`,
          }));
          setSearchResults(formatted);
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Server search API error:', err);
    }

    // 2. Direct client-side lookup fallback: check Roblox official API for exact username
    try {
      const directRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [trimmed], excludeBannedUsers: false }),
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        const u = directData?.data?.[0];
        if (u && u.id) {
          let avatarUrl = `/api/roblox/avatar-headshot/${u.id}`;
          try {
            const tRes = await fetch(
              `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${u.id}&size=150x150&format=Png&isCircular=true`
            );
            if (tRes.ok) {
              const tData = await tRes.json();
              const realImg = tData?.data?.[0]?.imageUrl;
              if (realImg) avatarUrl = realImg;
            }
          } catch {}

          setSearchResults([
            {
              id: u.id,
              name: u.name,
              displayName: u.displayName || u.name,
              hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
              avatarUrl,
            },
          ]);
          setIsSearching(false);
          return;
        }
      }
    } catch {}

    // 3. Fallback: match local fallback database
    const matched = FALLBACK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        u.displayName.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (matched.length > 0) {
      setSearchResults(matched);
    } else {
      setSearchResults([
        {
          id: 1,
          name: trimmed,
          displayName: trimmed,
          hasVerifiedBadge: false,
          avatarUrl: `/api/roblox/avatar-headshot/1`,
        },
      ]);
    }
    setIsSearching(false);
  };

  const handleSelectUser = (user: RobloxUser) => {
    setSelectedUser(user);
    setStep('amount');
    setErrorMsg('');
  };

  const handlePresetClick = (presetVal: number) => {
    setAmount(presetVal);
    setCustomAmountInput(presetVal.toString());
    setIsEditingAmount(false);
    setErrorMsg('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setAmount(num);
      setErrorMsg('');
    }
  };

  const handleAmountBlur = () => {
    setIsEditingAmount(false);
    const num = parseInt(customAmountInput, 10);
    if (isNaN(num) || num <= 0) {
      setAmount(25);
      setCustomAmountInput('25');
    }
  };

  const handleProceedToConfirm = () => {
    if (amount <= 0) {
      setErrorMsg('Please enter an amount greater than 0');
      return;
    }

    if (amount > displayBalance) {
      setErrorMsg(`Insufficient Robux. You currently have ${displayBalance.toLocaleString()} Robux.`);
      return;
    }

    setErrorMsg('');
    setStep('confirm');
  };

  const handleInitiateSend = () => {
    if (!isUnlocked) {
      onRequireKey();
      return;
    }

    setStep('sending');
    setErrorMsg('');

    setTimeout(() => {
      const newBal = Math.max(0, displayBalance - amount);
      setDisplayBalance(newBal);
      setStep('success');
      onSendRobux(selectedUser, amount);
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'sending' ? undefined : onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window in Clean Roblox Light Theme matching Screenshot 3 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-[420px] bg-white border border-[#e4e7ec] rounded-3xl overflow-hidden shadow-2xl z-10 select-none text-[#191b22]"
        >
          {/* Top Header matching Screenshot 3:
              [RobloxPlusHexagonIcon] Send Robux              ⬡ {balance}  ✕
          */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100/80">
            <div className="flex items-center gap-2">
              {/* Back button on amount and confirm steps */}
              {step === 'amount' && (
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="p-1 -ml-1 text-[#4b5162] hover:text-black transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
                  title="Back to search"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {step === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setStep('amount')}
                  className="p-1 -ml-1 text-[#4b5162] hover:text-black transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
                  title="Back to amount selection"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <RobloxPlusHexagonIcon className="w-5 h-5 text-[#191b22] shrink-0" />
              <h3 className="font-bold text-[17px] text-[#191b22] tracking-tight">
                Send Robux
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Balance display ⬡ {balance} matching screenshot */}
              <div 
                className="flex items-center gap-1.5 cursor-pointer select-none text-[#191b22] hover:text-black transition-colors"
                onClick={onOpenBuyRobux}
                title="Robux Balance"
              >
                <RobuxIcon className="w-4 h-4 text-[#191b22]" />
                <span className="font-bold text-sm text-[#191b22]">
                  {displayBalance.toLocaleString()}
                </span>
              </div>

              {/* Close Button ✕ matching screenshot */}
              {step !== 'sending' && (
                <button
                  id="close-send-modal-btn"
                  type="button"
                  onClick={onClose}
                  className="p-1 text-[#6e7382] hover:text-black transition-colors cursor-pointer rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4" strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="px-5 pb-5 pt-2 flex flex-col">
            {/* STEP 1: SEARCH & SELECT PLAYER (MATCHING SCREENSHOT 3) */}
            {step === 'search' && (
              <div className="flex flex-col">
                {/* Search Bar Input Pill matching Screenshot 3 */}
                <div className="relative mt-2 mb-1">
                  <div className="relative flex items-center bg-white border border-[#d2d6de] focus-within:border-[#2b5ef5] focus-within:ring-2 focus-within:ring-blue-500/20 rounded-full px-3.5 py-2 transition-all shadow-2xs">
                    <Search className="w-4 h-4 text-[#707584] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          executeSearch(searchQuery);
                        }
                      }}
                      placeholder="Search"
                      className="w-full bg-transparent text-[#191b22] font-medium placeholder:text-[#8c92a2] text-sm focus:outline-none"
                      autoFocus
                    />

                    {isSearching ? (
                      <Loader2 className="w-4 h-4 text-[#2b5ef5] animate-spin shrink-0 ml-2" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="p-0.5 text-[#8c92a2] hover:text-black shrink-0 cursor-pointer ml-2 transition-colors"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* When Search Query is EMPTY matching Screenshot 3:
                    My friends (0)
                         No friends
                */}
                {!searchQuery.trim() ? (
                  <div className="flex flex-col">
                    <div className="mt-4 mb-2">
                      <h4 className="font-bold text-sm text-[#191b22] tracking-normal">
                        My friends (0)
                      </h4>
                    </div>

                    <div className="h-44 flex items-center justify-center text-center">
                      <span className="text-[#84889a] text-sm font-normal">
                        No friends
                      </span>
                    </div>
                  </div>
                ) : (
                  /* When user searches: Displays matched players with REAL Avatar Headshots */
                  <div className="flex flex-col mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-bold text-xs text-[#6e7382] uppercase tracking-wider">
                        {isSearching ? 'Searching...' : `Search results (${searchResults.length})`}
                      </h4>
                    </div>

                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5 scrollbar-none">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="bg-[#f8f9fa] hover:bg-[#f0f2f5] border border-[#e4e7ec] hover:border-blue-500/40 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
                        >
                          {/* Circular Real Avatar Headshot + Name + Username */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-white shrink-0 border border-gray-200 shadow-2xs">
                              <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="w-full h-full object-cover select-none"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (!img.dataset.retried) {
                                    img.dataset.retried = '1';
                                    img.src = `/api/roblox/avatar-headshot/${user.id}`;
                                  } else {
                                    img.src = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                                  }
                                }}
                              />
                            </div>

                            <div className="flex flex-col text-left min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-sm text-[#191b22] truncate">
                                  {user.displayName}
                                </span>
                                {user.hasVerifiedBadge && (
                                  <VerifiedBadge className="w-4 h-4 text-[#0066FF] shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-[#6e7382] truncate">
                                @{user.name}
                              </span>
                            </div>
                          </div>

                          {/* "Select" Action Button */}
                          <span className="text-xs font-semibold text-[#191b22] group-hover:text-white bg-[#e4e7ec] group-hover:bg-[#2b5ef5] px-3.5 py-1.5 rounded-lg border border-[#d6dae3] group-hover:border-transparent transition-all shrink-0">
                            Select
                          </span>
                        </div>
                      ))}

                      {searchResults.length === 0 && !isSearching && (
                        <div className="py-6 px-4 bg-[#f8f9fa] border border-[#e4e7ec] rounded-2xl flex flex-col items-center text-center space-y-2">
                          <p className="text-sm font-medium text-[#191b22]">
                            No players found for &quot;{searchQuery}&quot;
                          </p>
                          <p className="text-xs text-[#6e7382]">
                            You can still choose to send Robux to this username.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectUser({
                                id: Math.floor(Math.random() * 80000000) + 1000000,
                                name: searchQuery.trim(),
                                displayName: searchQuery.trim(),
                                hasVerifiedBadge: false,
                                avatarUrl: `/api/roblox/avatar-headshot/1`,
                              })
                            }
                            className="mt-2 text-xs font-bold bg-[#2b5ef5] hover:bg-[#204ecc] text-white px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
                          >
                            Send to @{searchQuery.trim()}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: CHOOSE HOW MUCH TO SEND */}
            {step === 'amount' && (
              <div className="flex flex-col items-center text-center pt-2">
                {/* Circular Avatar */}
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200 mb-2 shadow-sm">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.displayName}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        img.src = `/api/roblox/avatar-headshot/${selectedUser.id}`;
                      } else {
                        img.src = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                      }
                    }}
                  />
                </div>

                {/* Display Name + Verified Badge */}
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  <span className="font-bold text-base text-[#191b22]">
                    {selectedUser.displayName}
                  </span>
                  {selectedUser.hasVerifiedBadge && (
                    <VerifiedBadge className="w-4 h-4 text-[#0066FF]" />
                  )}
                </div>

                {/* Big Robux Icon and Amount */}
                <div className="flex items-center justify-center gap-3 my-2">
                  <RobuxIcon className="w-8 h-8 sm:w-9 sm:h-9 text-[#191b22] shrink-0" />
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
                      className="bg-[#f0f2f5] border-2 border-[#2b5ef5] text-[#191b22] font-extrabold text-4xl sm:text-5xl px-2 py-0.5 rounded-xl w-40 text-center focus:outline-none shadow-inner"
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingAmount(true)}
                      className="font-extrabold text-4xl sm:text-5xl text-[#191b22] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                      title="Click to enter custom amount"
                    >
                      {amount.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Helper caption */}
                <p 
                  onClick={() => setIsEditingAmount(true)}
                  className="text-xs text-[#707584] mt-1 mb-5 cursor-pointer hover:text-black transition-colors"
                >
                  Tap the number to enter a custom amount
                </p>

                {/* Preset Chips: [ ⬡ 25 ] [ ⬡ 50 ] [ ⬡ 100 ] [ ⬡ 200 ] */}
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
                            ? 'bg-[#e8f0fe] border-2 border-[#2b5ef5] text-[#1a56db] shadow-2xs'
                            : 'bg-[#f0f2f5] border border-[#d6dae3] text-[#191b22] hover:bg-[#e4e7ec]'
                        }`}
                      >
                        <RobuxIcon className="w-3 h-3 text-[#191b22]" />
                        <span>{presetVal}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Error Banner if any */}
                {errorMsg && (
                  <div className="w-full mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Full-width Blue [ Next ] Button */}
                <button
                  id="send-robux-next-btn"
                  type="button"
                  onClick={handleProceedToConfirm}
                  className="w-full bg-[#2b5ef5] hover:bg-[#204ecc] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-base shadow-sm transition-all cursor-pointer select-none text-center"
                >
                  Next
                </button>

                {/* Footer caption */}
                <p className="text-xs text-[#84889a] mt-3">
                  Robux are sent instantly with no fees
                </p>
              </div>
            )}

            {/* STEP 3: CONFIRMATION VIEW */}
            {step === 'confirm' && (
              <div className="flex flex-col space-y-3 pt-1">
                {/* Recipient Card */}
                <div className="bg-[#f8f9fa] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center border border-[#e4e7ec] shadow-2xs">
                  {/* Circular Avatar */}
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white ring-1 ring-gray-200 mb-2.5 shadow-sm">
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.displayName}
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.retried) {
                          img.dataset.retried = 'true';
                          img.src = `/api/roblox/avatar-headshot/${selectedUser.id}`;
                        } else {
                          img.src = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                        }
                      }}
                    />
                  </div>

                  {/* Display Name + Verified Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base sm:text-lg text-[#191b22]">
                      {selectedUser.displayName}
                    </span>
                    {selectedUser.hasVerifiedBadge && (
                      <VerifiedBadge className="w-4 h-4 text-[#0066FF]" />
                    )}
                  </div>

                  {/* Username */}
                  <span className="text-xs text-[#6e7382] mb-3">
                    @{selectedUser.name}
                  </span>

                  {/* Mutual Connections & Joined date */}
                  <div className="flex items-center gap-4 text-xs text-[#4b5162] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#6e7382]" />
                      <span>0 mutual Connections</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#6e7382]" />
                      <span>Joined in 2020</span>
                    </div>
                  </div>
                </div>

                {/* Robux Amount Card */}
                <div className="bg-[#f8f9fa] rounded-xl py-4 px-4 flex items-center justify-center border border-[#e4e7ec] shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <RobuxIcon className="w-7 h-7 text-[#191b22] shrink-0" />
                    <span className="font-extrabold text-3xl sm:text-4xl text-[#191b22] tracking-tight">
                      {amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Error Banner if any */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Action Buttons: [ Send ] (Blue) and [ Edit ] (Light Grey) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    id="send-robux-confirm-btn"
                    type="button"
                    onClick={handleInitiateSend}
                    className="w-full bg-[#2b5ef5] hover:bg-[#204ecc] active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl transition-all cursor-pointer select-none text-center shadow-sm"
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
                    className="w-full bg-[#e4e7ec] hover:bg-[#d8dce4] active:scale-[0.98] text-[#191b22] font-semibold text-sm py-3.5 rounded-xl transition-all cursor-pointer select-none text-center border border-[#d6dae3]"
                  >
                    Edit
                  </button>
                </div>

                {/* Legal Note */}
                <p className="text-[11px] text-[#84889a] text-center leading-relaxed px-2 pt-0.5">
                  You need an age check or parental consent to send Robux. Once you send, you cannot cancel.
                </p>
              </div>
            )}

            {/* STEP 4: SENDING ANIMATION */}
            {step === 'sending' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white ring-1 ring-gray-200 mb-4 shadow-sm">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        img.src = `/api/roblox/avatar-headshot/${selectedUser.id}`;
                      } else {
                        img.src = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2D721B17CD854C89724F7B33EFE7E4E1-Png/150/150/AvatarHeadshot/Png/isCircular';
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 text-[#191b22] font-bold text-base mb-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2b5ef5]" />
                  <span>Sending Robux...</span>
                </div>

                <p className="text-xs text-[#6e7382]">
                  to @{selectedUser.name}
                </p>
              </div>
            )}

            {/* STEP 5: SUCCESS CONFIRMATION (NO CONFETTI) */}
            {step === 'success' && (
              <div className="flex flex-col items-center text-center py-7">
                {/* Circle Checkmark Icon */}
                <div className="w-14 h-14 rounded-full border-2 border-[#191b22] flex items-center justify-center mb-3 text-[#191b22]">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>

                {/* Recipient Headshot and Details */}
                <div className="flex items-center gap-2.5 bg-[#f8f9fa] border border-[#e4e7ec] px-3.5 py-1.5 rounded-full mb-4 shadow-2xs">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white">
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#191b22]">
                    @{selectedUser.name}
                  </span>
                </div>

                <h3 className="font-bold text-base sm:text-lg text-[#191b22] tracking-normal mb-6">
                  You sent {amount.toLocaleString()} Robux
                </h3>

                <button
                  type="button"
                  id="send-success-ok-btn"
                  onClick={onClose}
                  className="w-full bg-[#2b5ef5] hover:bg-[#204ecc] active:scale-[0.98] text-white font-bold text-base py-3.5 rounded-xl transition-all cursor-pointer select-none shadow-sm"
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
