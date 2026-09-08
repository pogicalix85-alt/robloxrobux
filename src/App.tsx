/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ROBUX_PACKAGES, LIMITED_ITEM } from './data/robuxData';
import { RobloxUser } from './types';
import { RobloxHeader } from './components/RobloxHeader';
import { PromoHeader } from './components/PromoHeader';
import { LimitedItemCard } from './components/LimitedItemCard';
import { RobuxPackagesList } from './components/RobuxPackagesList';
import { RobloxPlusCards } from './components/RobloxPlusCards';
import { MoreWaysSection } from './components/MoreWaysSection';
import { FaqSection } from './components/FaqSection';
import { PayPalModal, CheckoutItem } from './components/PayPalModal';
import { CustomRobuxModal } from './components/CustomRobuxModal';
import { SendRobuxModal } from './components/SendRobuxModal';
import { KeyVerificationModal } from './components/KeyVerificationModal';
import { RobuxIcon } from './components/Icons';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Balance management with persistent local storage
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('roblox_robux_balance') || localStorage.getItem('roblox_visual_robux_balance');
      return saved !== null ? parseInt(saved, 10) : 58000;
    } catch {
      return 58000;
    }
  });

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isSendUnlocked, setIsSendUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('roblox_send_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);

  // Sync balance to local storage
  useEffect(() => {
    try {
      localStorage.setItem('roblox_robux_balance', balance.toString());
    } catch {
      // Ignored
    }
  }, [balance]);

  // Check device unlock status from backend
  useEffect(() => {
    try {
      const deviceId = localStorage.getItem('roblox_device_id');
      if (deviceId) {
        fetch('/api/keys/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.isUnlocked) {
              setIsSendUnlocked(true);
              localStorage.setItem('roblox_send_unlocked', 'true');
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignored
    }
  }, []);

  const showToast = (title: string, subtitle: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Called when Send Robux button is clicked
  const handleOpenSend = () => {
    if (isSendUnlocked) {
      setIsSendModalOpen(true);
    } else {
      setIsKeyModalOpen(true);
    }
  };

  // Called when a key is successfully validated
  const handleKeySuccess = () => {
    setIsSendUnlocked(true);
    setIsKeyModalOpen(false);
    setIsSendModalOpen(true);
    showToast('Key Activated!', 'Send Robux is now unlocked for this device & browser.');
  };

  // Called when PayPal checkout completes
  const handlePurchaseSuccess = (robuxAdded: number) => {
    setBalance((prev) => prev + robuxAdded);
    setCheckoutItem(null);
    showToast(
      'Purchase Completed!',
      `+${robuxAdded.toLocaleString()} Robux added to your balance!`
    );
  };

  const handleSendRobux = (recipient: RobloxUser, amount: number) => {
    setBalance((prev) => Math.max(0, prev - amount));
    showToast('Robux Transferred', `Sent ${amount.toLocaleString()} Robux to @${recipient.name}`);
  };

  const handleSetBalanceDirectly = (newBalance: number) => {
    setBalance(newBalance);
    showToast('Balance Updated', `Balance set to ${newBalance.toLocaleString()} Robux`);
  };

  return (
    <div className="min-h-screen bg-[#111216] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#0074e0] selection:text-white pb-12">
      {/* Top Navigation */}
      <RobloxHeader
        balance={balance}
        onOpenSendModal={handleOpenSend}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto pt-2">
        {/* Title Header */}
        <PromoHeader promo25Percent={false} />

        {/* Limited Time Avatar Items (Gold Crown of Ozymandias) */}
        <LimitedItemCard
          item={LIMITED_ITEM}
          onSelectItem={(item) => setCheckoutItem(item)}
        />

        {/* Robux Packages List (Prices in USD only) */}
        <RobuxPackagesList
          packages={ROBUX_PACKAGES}
          onSelectPackage={(pkg) => setCheckoutItem(pkg)}
          onOpenCustomModal={() => setIsCustomModalOpen(true)}
        />

        {/* New on Roblox (Roblox Plus subscriptions) */}
        <RobloxPlusCards
          onSelectSubscription={(sub) => setCheckoutItem(sub)}
        />

        {/* More ways to get Robux (Gift Card) */}
        <MoreWaysSection
          onSelectGiftCard={(gc) => setCheckoutItem(gc)}
        />

        {/* FAQ Section */}
        <FaqSection />

        {/* Footer */}
        <footer className="px-4 pt-6 border-t border-white/[0.08] text-center text-xs text-white/40 space-y-2">
          <div className="flex flex-wrap justify-center gap-4 text-white/60 font-medium">
            <span className="hover:text-white cursor-pointer">Terms of Use</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Roblox Support</span>
          </div>
          <p>© 2026 Roblox Corporation. All rights reserved.</p>
        </footer>
      </main>

      {/* Floating Action Quick Access (Mobile) */}
      <div className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#181a20]/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-2xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <RobuxIcon className="w-3.5 h-3.5" />
          <span>{balance.toLocaleString()}</span>
        </div>
        <div className="w-px h-3.5 bg-white/20" />
        <button
          type="button"
          onClick={handleOpenSend}
          className="text-xs text-blue-400 font-bold hover:underline cursor-pointer"
        >
          Send Robux
        </button>
      </div>

      {/* Modals */}
      <PayPalModal
        isOpen={checkoutItem !== null}
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={handlePurchaseSuccess}
      />

      <CustomRobuxModal
        isOpen={isCustomModalOpen}
        currentBalance={balance}
        onClose={() => setIsCustomModalOpen(false)}
        onCheckoutCustom={(item) => setCheckoutItem(item)}
        onSetBalanceDirectly={handleSetBalanceDirectly}
      />

      <KeyVerificationModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSuccess={handleKeySuccess}
      />

      <SendRobuxModal
        isOpen={isSendModalOpen}
        currentBalance={balance}
        onClose={() => setIsSendModalOpen(false)}
        onSendRobux={handleSendRobux}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#1c202a] border border-blue-500/30 rounded-xl p-4 shadow-2xl flex items-start gap-3 text-white"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">{toastMessage.title}</h5>
              <p className="text-xs text-white/70 mt-0.5">{toastMessage.subtitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
