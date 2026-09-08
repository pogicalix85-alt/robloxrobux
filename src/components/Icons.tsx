import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Official Roblox Robux Icon (2019+ vector)
 * A tilted rounded hexagon with concentric outline and central square cutout
 */
export function RobuxIcon({ className = 'w-5 h-5', size }: IconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 24 26.1"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-label="Robux"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.4,4.62A5.2,5.2,0,0,1,24,9.12V17a5.19,5.19,0,0,1-2.6,4.5l-6.8,3.93a5.19,5.19,0,0,1-5.2,0L2.6,21.48A5.19,5.19,0,0,1,0,17V9.12a5.2,5.2,0,0,1,2.6-4.5L9.4.7a5.19,5.19,0,0,1,5.2,0ZM10.31,2.48,3.69,6.31A3.35,3.35,0,0,0,2,9.23v7.65A3.36,3.36,0,0,0,3.69,19.8l6.62,3.83a3.4,3.4,0,0,0,3.38,0l6.62-3.83A3.36,3.36,0,0,0,22,16.88V9.23a3.35,3.35,0,0,0-1.69-2.92L13.69,2.48a3.4,3.4,0,0,0-3.38,0Zm3.08,2.14,5.22,3A2.78,2.78,0,0,1,20,10v6a2.76,2.76,0,0,1-1.39,2.4l-5.22,3a2.76,2.76,0,0,1-2.78,0l-5.22-3A2.76,2.76,0,0,1,4,16.07V10A2.78,2.78,0,0,1,5.39,7.63l5.22-3a2.76,2.76,0,0,1,2.78,0ZM9,16.05h6v-6H9Z"
      />
    </svg>
  );
}

/**
 * Official Roblox Brand Icon
 * Tilted square with center hollow square
 */
export function RobloxLogo({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Roblox"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 17.88L17.88 22L22 6.12L6.12 2zm8.86-7.81l3.07.79l-.79 3.07l-3.07-.79z"
      />
    </svg>
  );
}

export function PayPalIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
    >
      <path
        d="M25.7 10.4C25.4 7.2 23.2 5 19.3 5H10.6C9.9 5 9.4 5.5 9.3 6.2L6 27.2C5.9 27.8 6.4 28.3 7 28.3H11.5L12.7 20.6C12.8 19.9 13.3 19.4 14 19.4H16.8C21.7 19.4 24.8 17 25.5 12.1C25.6 11.4 25.7 10.9 25.7 10.4Z"
        fill="#003087"
      />
      <path
        d="M23.3 13.3C22.6 17.6 19.8 19.8 15.4 19.8H12.6C12 19.8 11.5 20.3 11.4 20.9L10 29.8C9.9 30.3 10.3 30.8 10.9 30.8H15.1C15.7 30.8 16.2 30.3 16.3 29.7L17.3 23.3C17.4 22.7 17.9 22.2 18.5 22.2H19.5C23.6 22.2 26.2 20.2 26.8 16C27.1 14.2 26.7 12.8 25.9 11.9C25.2 12.5 24.3 13 23.3 13.3Z"
        fill="#0079C1"
      />
      <path
        d="M22 10.7C21.7 10.6 21.3 10.5 20.9 10.5H13.6C13 10.5 12.5 11 12.4 11.6L11 20.5C10.9 21.1 11.3 21.6 11.9 21.6H14.7C15.3 21.6 15.8 21.1 15.9 20.5L16.9 14.1C17 13.5 17.5 13 18.1 13H19.1C21.8 13 23.5 11.9 24.1 9.5C23.5 10 22.8 10.4 22 10.7Z"
        fill="#00457C"
      />
    </svg>
  );
}

/**
 * Official Roblox Verified Badge
 */
export function VerifiedBadge({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Verified"
    >
      <rect
        x="5.888"
        width="22.89"
        height="22.89"
        rx="2"
        transform="rotate(15 5.888 0)"
        fill="#0066FF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.543 8.7508L20.549 8.7568C21.15 9.3578 21.15 10.3318 20.549 10.9328L11.817 19.6648L7.45 15.2968C6.85 14.6958 6.85 13.7218 7.45 13.1218L7.457 13.1148C8.058 12.5138 9.031 12.5138 9.633 13.1148L11.817 15.2998L18.367 8.7508C18.968 8.1498 19.942 8.1498 20.543 8.7508Z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Send Robux Hexagon Icon (from Send Robux header)
 */
export function SendRobuxIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Send Robux"
    >
      <path
        d="M17.5 4.5L6.5 10.5L11.5 13.5L14.5 18.5L17.5 4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M11.5 13.5L17 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Discord Brand Icon
 */
export function DiscordIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Discord"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

