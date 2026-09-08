export type Currency = 'PHP' | 'USD';

export interface RobuxPackage {
  id: string;
  robuxAmount: number;
  bonusRobux?: number;
  originalRobux?: number;
  pricePHP: number;
  priceUSD: number;
  formattedPHP: string;
  formattedUSD: string;
  isForYou?: boolean;
  tag?: string;
  highlightButton?: boolean;
}

export interface LimitedItem {
  id: string;
  name: string;
  creator: string;
  isVerified: boolean;
  daysLeft: number;
  robuxAmount: number;
  originalRobux?: number;
  pricePHP: number;
  priceUSD: number;
  formattedPHP: string;
  formattedUSD: string;
  image: string;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  pricePHP: number;
  priceUSD: number;
  perks: string[];
  robuxMonthly?: number;
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
