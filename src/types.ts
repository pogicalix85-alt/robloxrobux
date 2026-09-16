export type Currency = 'PHP' | 'USD';

export interface RobuxPackage {
  id: string;
  robuxAmount: number;
  originalRobux?: number;
  bonusRobux?: number;
  bonusText?: string;
  price: number;
  formattedPrice: string;
  isPopular?: boolean;
  highlightButton?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  formattedPrice: string;
  originalPrice?: string;
  perks: {
    icon: 'tag' | 'gamepad' | 'send' | 'wand' | 'hexagon' | 'robux' | 'piggy';
    text: string;
  }[];
  robuxMonthly?: number;
  totalValue?: string;
}

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
  avatarUrl: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
