// components/LoadingSpinner.tsx
"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-600">
      <motion.div
        className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <motion.p
        className="mt-4 text-lg font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
      >
        Loading data...
      </motion.p>
    </div>
  );
}
