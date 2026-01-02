// components/ErrorState.tsx
"use client";

import { motion } from "framer-motion";

export default function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-red-500">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-5xl"
      >
        ⚠️
      </motion.div>
      <p className="mt-3 font-medium">{message || "Something went wrong."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}
