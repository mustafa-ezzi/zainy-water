import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dev_emails = [
  "aliasgharm184@gmail.com",
  "taher.mustansir5253@gmail.com",
];

// Timezone offset in hours for Asia/Karachi (GMT+5)
// Only applied in production, not in development
export const TIME_OFFSET = process.env.NODE_ENV === "production" ? 5 : 0;
