import { RobuxPackage, LimitedItem, SubscriptionPlan, FaqItem } from '../types';

export const ROBUX_PACKAGES: RobuxPackage[] = [
  {
    id: 'pkg-10000',
    robuxAmount: 10000,
    originalRobux: 10000,
    pricePHP: 6800,
    priceUSD: 99.99,
    formattedPHP: '₱6,800.00',
    formattedUSD: '$99.99',
  },
  {
    id: 'pkg-4500',
    robuxAmount: 4500,
    pricePHP: 3400,
    priceUSD: 49.99,
    formattedPHP: '₱3,400.00',
    formattedUSD: '$49.99',
  },
  {
    id: 'pkg-3150',
    robuxAmount: 3150,
    pricePHP: 1990,
    priceUSD: 29.99,
    formattedPHP: '₱1,990.00',
    formattedUSD: '$29.99',
  },
  {
    id: 'pkg-1700',
    robuxAmount: 1700,
    pricePHP: 1360,
    priceUSD: 19.99,
    formattedPHP: '₱1,360.00',
    formattedUSD: '$19.99',
  },
  {
    id: 'pkg-1200',
    robuxAmount: 1200,
    pricePHP: 799,
    priceUSD: 12.99,
    formattedPHP: '₱799.00',
    formattedUSD: '$12.99',
    isForYou: true,
    tag: '★ For you',
    highlightButton: true,
  },
  {
    id: 'pkg-800',
    robuxAmount: 800,
    pricePHP: 680,
    priceUSD: 9.99,
    formattedPHP: '₱680.00',
    formattedUSD: '$9.99',
  },
  {
    id: 'pkg-400',
    robuxAmount: 400,
    pricePHP: 350,
    priceUSD: 4.99,
    formattedPHP: '₱350.00',
    formattedUSD: '$4.99',
  },
  {
    id: 'pkg-80',
    robuxAmount: 80,
    pricePHP: 70,
    priceUSD: 0.99,
    formattedPHP: '₱70.00',
    formattedUSD: '$0.99',
  },
  {
    id: 'pkg-40',
    robuxAmount: 40,
    pricePHP: 35,
    priceUSD: 0.49,
    formattedPHP: '₱35.00',
    formattedUSD: '$0.49',
  },
];

export const LIMITED_ITEM: LimitedItem = {
  id: 'item-crown-ozymandias',
  name: 'Gold Crown of Ozymandias',
  creator: 'Roblox',
  isVerified: true,
  daysLeft: 6,
  robuxAmount: 22500,
  originalRobux: 22500,
  pricePHP: 13600,
  priceUSD: 199.99,
  formattedPHP: '₱13.6K',
  formattedUSD: '$199.99',
  image: '/gold_crown_of_ozymandias.png',
};

export const SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: 'sub-plus',
    title: 'Roblox Plus',
    pricePHP: 350,
    priceUSD: 4.99,
    perks: [
      '10% off in-game items, avatars, and more',
      'Free private servers',
      'Send Robux for free',
    ],
  },
  {
    id: 'sub-500',
    title: 'Plus 500',
    pricePHP: 550,
    priceUSD: 7.99,
    robuxMonthly: 500,
    perks: [
      '500 Robux delivered every month',
      'Exclusive member avatar cosmetics',
      'Trade items with other players',
    ],
  },
  {
    id: 'sub-1000',
    title: 'Plus 1,000',
    pricePHP: 990,
    priceUSD: 14.99,
    robuxMonthly: 1000,
    perks: [
      '1,000 Robux delivered monthly',
      'Access to premium developer games',
      'Bonus discounts on event items',
    ],
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What are Robux?',
    answer:
      'Robux is the virtual currency of Roblox that you can use to purchase in-game upgrades, avatar items, accessories, animations, and unlock special abilities in experiences.',
  },
  {
    id: 'faq-2',
    question: 'Where are my Robux?',
    answer:
      'Once purchased, Robux are instantly credited to your account balance displayed in the upper corner of your screen. You can use them right away on avatar catalog items or in games.',
  },
  {
    id: 'faq-3',
    question: 'Do Robux expire?',
    answer:
      'No, your Robux will never expire as long as your account remains in good standing. You can hold onto them or spend them whenever you like.',
  },
];
