import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  ChevronLeft, 
  Check, 
  Loader2, 
  AlertCircle,
  Edit2,
  Lock
} from 'lucide-react';
import { RobuxIcon, VerifiedBadge, SendRobuxIcon } from './Icons';
import { RobloxUser } from '../types';

// Default friends matching the user's reference screenshots (DinoWILD & Xouraxdtop1raider)
const INITIAL_FRIENDS: RobloxUser[] = [
  {
    id: 51193634,
    name: 'dinowild',
    displayName: 'DinoWILD',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-76F7D48E1533A284AAEF024C5165A1C0-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 10205448326,
    name: 'lamaria801',
    displayName: 'Xouraxdtop1raider',
    hasVerifiedBadge: false,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-17B5ADE6CAAEB318FAFA454B9A5805A1-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
  {
    id: 828415927,
    name: 'vintagetoysandmore',
    displayName: 'vintage',
    hasVerifiedBadge: true,
    avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1D2835D7E504881BFEC82C66AFC1C4AC-Png/150/150/AvatarHeadshot/Png/isCircular',
  },
];

interface SendRobuxModalProps {
  isOpen: boolean;
  currentBalance: number;
  isUnlocked: boolean;
  onRequireKey: () => void;
  onClose: () => void;
  onSendRobux: (recipient: RobloxUser, amount: number) => void;
}

type ModalStep = 'search' | 'amount' | 'sending' | 'success';

export const SendRobuxModal: React.FC<SendRobuxModalProps> = ({
  isOpen,
  currentBalance,
  isUnlocked,
  onRequireKey,
  onClose,
  onSendRobux,
}) => {
  const [step, setStep] = useState<ModalStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RobloxUser[]>(INITIAL_FRIENDS);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RobloxUser | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(200);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('200');
  const [errorMsg, setErrorMsg] = useState('');
  const [displayBalance, setDisplayBalance] = useState(currentBalance);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Sync balance
  useEffect(() => {
    setDisplayBalance(currentBalance);
  }, [currentBalance]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setSearchQuery('');
      setSearchResults(INITIAL_FRIENDS);
      setSelectedUser(null);
      setSelectedAmount(200);
      setCustomAmountInput('200');
      setIsEditingAmount(false);
      setErrorMsg('');
      setDisplayBalance(currentBalance);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, currentBalance]);

  // Auto-require key if modal opens while locked
  useEffect(() => {
    if (isOpen && !isUnlocked) {
      onRequireKey();
    }
  }, [isOpen, isUnlocked, onRequireKey]);

  // Live search debouncing
  useEffect(() => {
    if (!isOpen || step !== 'search') return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(INITIAL_FRIENDS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
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
        console.warn('Direct search fetch error, falling back:', err);
      }

      // Fallback matching
      const lower = trimmed.toLowerCase();
      const matched = INITIAL_FRIENDS.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.displayName.toLowerCase().includes(lower)
      );

      if (matched.length > 0) {
        setSearchResults(matched);
      } else {
        // Create an instant candidate for the exact typed username
        setSearchResults([
          {
            id: Math.floor(Math.random() * 100000000) + 100000,
            name: trimmed,
            displayName: trimmed,
            hasVerifiedBadge: false,
            avatarUrl: `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1D2835D7E504881BFEC82C66AFC1C4AC-Png/150/150/AvatarHeadshot/Png/isCircular`,
          },
        ]);
      }
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, step]);

  if (!isOpen) return null;

  const handleSelectUser = (user: RobloxUser) => {
    if (!isUnlocked) {
      onRequireKey();
      return;
    }
    setSelectedUser(user);
    setErrorMsg('');
    setStep('amount');
  };

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmountInput(String(amount));
    setIsEditingAmount(false);
    setErrorMsg('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmountInput(raw);
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0) {
      setSelectedAmount(val);
      setErrorMsg('');
    }
  };

  const handleProceedToSend = () => {
    setErrorMsg('');
    if (!isUnlocked) {
      onRequireKey();
      return;
    }

    if (!selectedUser) {
      setErrorMsg('Please select a player to send Robux to.');
      return;
    }

    if (selectedAmount <= 0) {
      setErrorMsg('Please enter a valid Robux amount.');
      return;
    }

    if (selectedAmount > displayBalance) {
      setErrorMsg(`Insufficient Robux. Your balance is ${displayBalance.toLocaleString()}.`);
      return;
    }

    // Advance to Sending animation step (Screenshots 4 & 5)
    setStep('sending');

    setTimeout(() => {
      // Deduct balance and update parent
      const newBal = Math.max(0, displayBalance - selectedAmount);
      setDisplayBalance(newBal);
      onSendRobux(selectedUser, selectedAmount);
      
      // Advance to Success step (Screenshot 6)
      setStep('success');
    }, 1800);
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
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full max-w-[420px] bg-[#171920] border border-white/[0.1] rounded-2xl shadow-2xl text-white z-10 overflow-hidden flex flex-col"
          style={{ minHeight: '440px' }}
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#14161d]">
            <div className="flex items-center gap-2">
              {step === 'amount' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('search');
                    setErrorMsg('');
                  }}
                  className="p-1 -ml-1 text-white/70 hover:text-white rounded-lg transition-colors mr-1"
                  title="Back to search"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <SendRobuxIcon className="w-5 h-5 text-white" />
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Send Robux
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Robux Balance Indicator */}
              <div className="flex items-center gap-1.5 bg-[#232733] border border-white/10 px-2.5 py-1 rounded-lg">
                <RobuxIcon className="w-3.5 h-3.5 text-white" />
                <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight">
                  {displayBalance.toLocaleString()}
                </span>
              </div>

              {/* Close Button */}
              {step !== 'sending' && (
                <button
                  id="close-send-modal-btn"
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Body Content by Step */}
          <div className="p-5 flex-1 flex flex-col">
            {/* STEP 1: Search by username (Reference Screenshot 2) */}
            {step === 'search' && (
              <div className="flex flex-col flex-1">
                {/* Search Input */}
                <div className="relative mb-5">
                  <div className="relative flex items-center">
                    <input
                      ref={searchInputRef}
                      id="roblox-username-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username"
                      className="w-full bg-[#111319] text-white placeholder:text-white/40 text-sm font-medium px-4 py-3 rounded-xl border border-white/15 focus:outline-none focus:border-[#0074e0] focus:ring-2 focus:ring-[#0074e0]/30 transition-all pr-10"
                    />
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 text-[#0074e0] animate-spin absolute right-3" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 p-1 text-white/40 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <Search className="w-4 h-4 text-white/30 absolute right-3 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Access Key Requirement Banner */}
                {!isUnlocked && (
                  <div
                    onClick={onRequireKey}
                    className="mb-3.5 p-3 rounded-xl bg-blue-500/15 border border-blue-500/35 flex items-center justify-between cursor-pointer hover:bg-blue-500/25 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0074e0] text-white flex items-center justify-center shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Access Key Required</span>
                        </div>
                        <p className="text-[11px] text-white/60">
                          Click to enter key to unlock Send Robux
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequireKey();
                      }}
                      className="px-2.5 py-1 bg-[#0074e0] hover:bg-[#0060c4] text-white text-[11px] font-extrabold rounded-lg shrink-0 transition-colors"
                    >
                      Enter Key
                    </button>
                  </div>
                )}

                {/* Friends / Search Results List */}
                <div className="flex-1 flex flex-col">
                  <h4 className="text-xs font-bold text-white/60 mb-2.5 uppercase tracking-wider">
                    {searchQuery.trim() ? 'Search Results' : `My friends (${INITIAL_FRIENDS.length})`}
                  </h4>

                  <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        id={`user-item-${user.id}`}
                        onClick={() => handleSelectUser(user)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d2029] hover:bg-[#252936] cursor-pointer transition-colors border border-transparent hover:border-white/10 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#2a2e3d] ring-1 ring-white/10 shrink-0">
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName}
                              className="w-full h-full object-cover select-none"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Graceful avatar fallback
                                (e.target as HTMLImageElement).src =
                                  'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-76F7D48E1533A284AAEF024C5165A1C0-Png/150/150/AvatarHeadshot/Png/isCircular';
                              }}
                            />
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                                {user.displayName}
                              </span>
                              {user.hasVerifiedBadge && (
                                <VerifiedBadge className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="text-xs text-white/50">
                              @{user.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-white/40 group-hover:text-white transition-colors pr-1">
                          Select
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Selected player & amount selector (Reference Screenshot 3) */}
            {step === 'amount' && selectedUser && (
              <div className="flex flex-col flex-1 justify-between items-center text-center">
                {/* Chosen User Header */}
                <div className="flex flex-col items-center mt-1 mb-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#242836] ring-2 ring-white/15 shadow-xl mb-2.5">
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.displayName}
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1D2835D7E504881BFEC82C66AFC1C4AC-Png/150/150/AvatarHeadshot/Png/isCircular';
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base sm:text-lg text-white">
                      {selectedUser.displayName}
                    </span>
                    {selectedUser.hasVerifiedBadge && (
                      <VerifiedBadge className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs text-white/50">
                    @{selectedUser.name}
                  </span>
                </div>

                {/* Big Amount Display */}
                <div className="my-2 flex flex-col items-center">
                  <div 
                    onClick={() => {
                      setIsEditingAmount(true);
                      setTimeout(() => customInputRef.current?.focus(), 100);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer px-4 py-2 rounded-2xl hover:bg-white/5 transition-colors group"
                    title="Tap to enter custom amount"
                  >
                    <RobuxIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    {isEditingAmount ? (
                      <input
                        ref={customInputRef}
                        type="text"
                        value={customAmountInput}
                        onChange={handleCustomAmountChange}
                        onBlur={() => setIsEditingAmount(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsEditingAmount(false);
                        }}
                        className="w-36 text-center text-4xl sm:text-5xl font-black text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                        {selectedAmount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <span 
                    onClick={() => {
                      setIsEditingAmount(true);
                      setTimeout(() => customInputRef.current?.focus(), 100);
                    }}
                    className="text-xs text-white/50 mt-1 cursor-pointer hover:text-white/80 transition-colors flex items-center gap-1"
                  >
                    <span>Tap the number to enter a custom amount</span>
                    <Edit2 className="w-3 h-3 text-white/40" />
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2 w-full my-4">
                  {[25, 50, 100, 200].map((preset) => {
                    const isActive = selectedAmount === preset && !isEditingAmount;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all ${
                          isActive
                            ? 'bg-[#0074e0]/20 border-[#0074e0] text-white shadow-sm shadow-blue-500/20'
                            : 'bg-[#222530] border-white/10 text-white/80 hover:bg-[#2c303f] hover:text-white'
                        }`}
                      >
                        <RobuxIcon className="w-3.5 h-3.5" />
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="w-full mb-3 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Action Button & Footnote */}
                <div className="w-full mt-auto">
                  <button
                    id="send-robux-next-btn"
                    type="button"
                    onClick={handleProceedToSend}
                    className="w-full bg-[#0074e0] hover:bg-[#0060c4] active:scale-[0.98] text-white font-extrabold text-base py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Next
                  </button>

                  <p className="text-[11px] text-white/45 mt-2.5">
                    Robux are sent instantly with no fees
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Sending Animation (Reference Screenshots 4 & 5) */}
            {step === 'sending' && selectedUser && (
              <div className="flex flex-col flex-1 items-center justify-center text-center py-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#242836] ring-2 ring-blue-500/40 shadow-xl mb-6">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="flex items-center gap-2.5 text-[#0074e0] mb-2 font-bold text-lg">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-white">Sending Robux...</span>
                </div>

                <p className="text-sm text-white/60">
                  to @{selectedUser.name}
                </p>
              </div>
            )}

            {/* STEP 4: Success confirmation (Reference Screenshot 6) */}
            {step === 'success' && selectedUser && (
              <div className="flex flex-col flex-1 items-center justify-between text-center py-4">
                <div className="my-auto flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-[#0074e0] flex items-center justify-center mb-5 shadow-2xl shadow-blue-500/20">
                    <Check className="w-9 h-9 sm:w-11 sm:h-11 stroke-[3.5]" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                    You sent {selectedAmount.toLocaleString()} Robux
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60">
                    to @{selectedUser.name}
                  </p>
                </div>

                <button
                  id="send-robux-ok-btn"
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#0074e0] hover:bg-[#0060c4] active:scale-[0.98] text-white font-extrabold text-base py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer mt-4"
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
