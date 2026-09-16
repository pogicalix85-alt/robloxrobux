/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ROBUX_PACKAGES, POPULAR_PACKAGE } from './data/robuxData';
import { RobloxUser } from './types';
import { RobloxHeader } from './components/RobloxHeader';
import { PromoHeader } from './components/PromoHeader';
import { RobuxPackagesList } from './components/RobuxPackagesList';
import { RobloxPlusCards } from './components/RobloxPlusCards';
import { FaqSection } from './components/FaqSection';
import { GooglePlayModal, CheckoutItem } from './components/GooglePlayModal';
import { CustomRobuxModal } from './components/CustomRobuxModal';
import { SendRobuxModal } from './components/SendRobuxModal';
import { KeyVerificationModal } from './components/KeyVerificationModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isDeviceUnlocked, setDeviceUnlocked, verifyDeviceStatusWithServer, syncActiveKeyWithServer, getActiveKey, revokeDeviceUnlock } from './utils/device';

export default function App() {
  // Balance management with persistent local storage - defaults to 10,000 matching user screenshots
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('roblox_robux_balance');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        return isNaN(val) ? 10000 : val;
      }
      return 10000;
    } catch {
      return 10000;
    }
  });

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Key system device check:
  // - Devices that already redeemed a key: stay permanently unlocked (no key modal shown)
  // - Devices that have not redeemed a key: stay strictly locked (key modal required before sending)
  const [isSendUnlocked, setIsSendUnlocked] = useState<boolean>(() => {
    return isDeviceUnlocked();
  });

  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);

  // Background server check for device unlock registration and revocation
  useEffect(() => {
    // Sync any locally stored active key with server so it's tracked in admin panel
    syncActiveKeyWithServer();

    // Verify status with server
    verifyDeviceStatusWithServer().then((unlocked) => {
      setIsSendUnlocked(unlocked);
    });
  }, []);

  // Shortcut to open Admin Panel from anywhere (Ctrl+Shift+A or Alt+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        setIsAdminModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync balance to local storage
  useEffect(() => {
    try {
      localStorage.setItem('roblox_robux_balance', balance.toString());
    } catch {
      // Ignored
    }
  }, [balance]);

  const showToast = (title: string, subtitle: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Called when Send Robux button is clicked (verifies device has not been disabled by admin)
  const handleOpenSend = async () => {
    const unlocked = await verifyDeviceStatusWithServer();
    setIsSendUnlocked(unlocked);
    if (!unlocked) {
      setIsKeyModalOpen(true);
    } else {
      setIsSendModalOpen(true);
    }
  };

  // Open Buy Robux checkout flow
  const handleOpenBuyRobux = (item?: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
  }) => {
    if (item) {
      setCheckoutItem(item);
    } else {
      // Default to popular pick (500 Robux for $4.99)
      setCheckoutItem({
        title: `${POPULAR_PACKAGE.robuxAmount.toLocaleString()} Robux`,
        robux: POPULAR_PACKAGE.robuxAmount,
        price: POPULAR_PACKAGE.price,
        formattedPrice: POPULAR_PACKAGE.formattedPrice,
      });
    }
  };

  // Called when a key is successfully validated
  const handleKeySuccess = (canonicalKey?: string) => {
    setIsSendUnlocked(true);
    if (canonicalKey) {
      setDeviceUnlocked(canonicalKey);
      syncActiveKeyWithServer();
    }
    setIsKeyModalOpen(false);
    setIsSendModalOpen(true);
    showToast('Key Activated!', 'Send Robux is now unlocked on this device.');
  };

  // Called when Buy Robux checkout completes
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
    <div className="min-h-screen bg-[#0b0c10] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#2f64e8] selection:text-white pb-12">
      {/* Top Header matching Screenshot 1 */}
      <RobloxHeader
        balance={balance}
        onOpenSendModal={handleOpenSend}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
      />

      {/* Main Content Area matching Screenshots 1, 2, 3 */}
      <main className="flex-1 w-full max-w-[840px] mx-auto pb-8">
        {/* Banner matching Screenshot 1: "Enjoy up to 25% more Robux" */}
        <PromoHeader />

        {/* Popular Pick & Robux Packages matching Screenshots 1 & 2 */}
        <RobuxPackagesList
          popularPackage={POPULAR_PACKAGE}
          packages={ROBUX_PACKAGES}
          onSelectPackage={(pkg) => handleOpenBuyRobux(pkg)}
        />

        {/* New on Roblox: Roblox Plus Subscriptions Carousel matching Screenshot 2 */}
        <RobloxPlusCards
          onSelectSubscription={(sub) => handleOpenBuyRobux(sub)}
        />

        {/* FAQ Section matching Screenshots 2 & 3 */}
        <FaqSection />

        {/* Footer */}
        <footer className="px-4 pt-6 pb-4 border-t border-white/[0.06] text-center text-xs text-white/40 space-y-2">
          <div className="flex flex-wrap justify-center gap-4 text-white/60 font-medium">
            <span className="hover:text-white cursor-pointer">Terms of Use</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Roblox Support</span>
          </div>
          <p>© 2026 Roblox Corporation. All rights reserved.</p>

          {/* Discreet Admin Access Trigger placed at the bottom */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              id="admin-footer-trigger"
              onClick={() => setIsAdminModalOpen(true)}
              className="text-[11px] text-white/30 hover:text-white/80 transition-colors flex items-center gap-1.5 cursor-pointer select-none py-1 px-3 rounded-md hover:bg-white/[0.05] border border-transparent hover:border-white/10"
              title="Admin Access (Shortcut: Ctrl+Shift+A)"
            >
              <Lock className="w-3 h-3 text-red-400/80" />
              <span>Admin Panel</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Admin Panel Modal (Password protected: "broisgoofy") */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onKeyDisabledOrRevoked={async (disabledKey) => {
          const unlocked = await verifyDeviceStatusWithServer();
          setIsSendUnlocked(unlocked);
          if (!unlocked) {
            setIsSendModalOpen(false);
            showToast('Device Locked', `Key "${disabledKey}" is disabled.`);
          }
        }}
      />

      {/* Google Play Bottom Sheet Checkout Modal */}
      <GooglePlayModal
        isOpen={checkoutItem !== null}
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onSuccess={handlePurchaseSuccess}
      />

      {/* Custom Robux Calculator / Adjustment Modal */}
      <CustomRobuxModal
        isOpen={isCustomModalOpen}
        currentBalance={balance}
        onClose={() => setIsCustomModalOpen(false)}
        onCheckoutCustom={(item) => setCheckoutItem(item)}
        onSetBalanceDirectly={handleSetBalanceDirectly}
      />

      {/* Access Key Verification Modal */}
      <KeyVerificationModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSuccess={handleKeySuccess}
      />

      {/* Send Robux Modal (Search by username with real Roblox headshot avatars) */}
      <SendRobuxModal
        isOpen={isSendModalOpen}
        currentBalance={balance}
        isUnlocked={isSendUnlocked}
        onRequireKey={() => {
          setIsSendModalOpen(false);
          setIsKeyModalOpen(true);
        }}
        onClose={() => setIsSendModalOpen(false)}
        onSendRobux={handleSendRobux}
        onOpenBuyRobux={() => handleOpenBuyRobux()}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#181a22] border border-blue-500/30 rounded-xl p-4 shadow-2xl flex items-start gap-3 text-white"
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
