import { RobuxPackage, SubscriptionPlan, FaqItem } from '../types';

export const POPULAR_PACKAGE: RobuxPackage = {
  id: 'pkg-popular-500',
  robuxAmount: 500,
  originalRobux: 400,
  price: 4.99,
  formattedPrice: '$4.99',
  isPopular: true,
  highlightButton: true,
};

export const ROBUX_PACKAGES: RobuxPackage[] = [
  {
    id: 'pkg-24000',
    robuxAmount: 24000,
    originalRobux: 22500,
    bonusText: '+ 1,500 more',
    price: 199.99,
    formattedPrice: '$199.99',
  },
  {
    id: 'pkg-11000',
    robuxAmount: 11000,
    originalRobux: 10000,
    bonusText: '+ 1,000 more',
    price: 99.99,
    formattedPrice: '$99.99',
  },
  {
    id: 'pkg-5250',
    robuxAmount: 5250,
    originalRobux: 4500,
    bonusText: '+ 750 more',
    price: 49.99,
    formattedPrice: '$49.99',
  },
  {
    id: 'pkg-3625',
    robuxAmount: 3625,
    originalRobux: 3150,
    bonusText: '+ 475 more',
    price: 34.99,
    formattedPrice: '$34.99',
  },
  {
    id: 'pkg-2000',
    robuxAmount: 2000,
    originalRobux: 1700,
    bonusText: '+ 300 more',
    price: 19.99,
    formattedPrice: '$19.99',
  },
  {
    id: 'pkg-1500',
    robuxAmount: 1500,
    originalRobux: 1200,
    bonusText: '+ 300 more',
    price: 14.99,
    formattedPrice: '$14.99',
  },
  {
    id: 'pkg-1000',
    robuxAmount: 1000,
    originalRobux: 800,
    bonusText: '+ 200 more',
    price: 9.99,
    formattedPrice: '$9.99',
  },
];

export const SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: 'sub-plus',
    title: 'Roblox Plus',
    price: 4.99,
    formattedPrice: '$4.99',
    perks: [
      { icon: 'tag', text: 'Up to 20% off on items and avatars' },
      { icon: 'gamepad', text: 'Free private servers' },
      { icon: 'send', text: 'Send Robux for free' },
      { icon: 'wand', text: 'Customize profile and app theme' },
    ],
  },
  {
    id: 'sub-500',
    title: 'Plus 500',
    price: 8.99,
    formattedPrice: '$8.99',
    originalPrice: '$9.99',
    robuxMonthly: 500,
    totalValue: '$9.99 total value',
    perks: [
      { icon: 'hexagon', text: 'Everything in Plus' },
      { icon: 'robux', text: '+500 Robux every month' },
      { icon: 'piggy', text: '$9.99 total value' },
    ],
  },
  {
    id: 'sub-1000',
    title: 'Plus 1000',
    price: 12.99,
    formattedPrice: '$12.99',
    originalPrice: '$14.99',
    robuxMonthly: 1000,
    totalValue: '$14.99 total value',
    perks: [
      { icon: 'hexagon', text: 'Everything in Plus' },
      { icon: 'robux', text: '+1,000 Robux every month' },
      { icon: 'piggy', text: '$14.99 total value' },
    ],
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What are Robux?',
    answer:
      'Robux is the virtual currency of Roblox that you can use to purchase in-game upgrades, avatar accessories, animations, and unlock special abilities in experiences.',
  },
  {
    id: 'faq-2',
    question: 'Where are my Robux?',
    answer:
      'Once purchased, Robux are instantly credited to your account balance displayed in the upper right corner of your screen. You can spend them right away or send them to friends.',
  },
  {
    id: 'faq-3',
    question: 'Do Robux expire?',
    answer:
      'No, your Robux will never expire as long as your account remains active. You can hold onto them or spend them whenever you choose.',
  },
  {
    id: 'faq-4',
    question: 'How to redeem your gift card?',
    answer:
      'To redeem a Roblox Gift Card, go to the Gift Card redemption page or select Redeem Gift Card during checkout, enter your 10-digit PIN code, and your credit will convert directly to Robux.',
  },
];
