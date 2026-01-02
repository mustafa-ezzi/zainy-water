"use client";

import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export const LoadingDotsBounce = ({
  size = "md",
  color = "bg-current",
  className,
}: LoadingDotsProps) => {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      <style jsx>{`
        @keyframes bounceEaseInOut {
          0%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-100%);
          }
        }
        .bounce-dot-1 {
          animation: bounceEaseInOut 1.4s infinite ease-in-out;
          animation-delay: 0ms;
        }
        .bounce-dot-2 {
          animation: bounceEaseInOut 1.4s infinite ease-in-out;
          animation-delay: 200ms;
        }
        .bounce-dot-3 {
          animation: bounceEaseInOut 1.4s infinite ease-in-out;
          animation-delay: 400ms;
        }
      `}</style>
      <div
        className={cn("rounded-full bounce-dot-1", sizeClasses[size], color)}
      />
      <div
        className={cn("rounded-full bounce-dot-2", sizeClasses[size], color)}
      />
      <div
        className={cn("rounded-full bounce-dot-3", sizeClasses[size], color)}
      />
    </div>
  );
};

// Alternative version with custom CSS animation for more control
export const LoadingDotsPulse = ({
  size = "md",
  color = "bg-current",
  className,
}: LoadingDotsProps) => {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      <style jsx>{`
        @keyframes bounceSequence {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        .dot-1 {
          animation: bounceSequence 1.4s infinite ease-in-out both;
          animation-delay: -0.32s;
        }
        .dot-2 {
          animation: bounceSequence 1.4s infinite ease-in-out both;
          animation-delay: -0.16s;
        }
        .dot-3 {
          animation: bounceSequence 1.4s infinite ease-in-out both;
        }
      `}</style>
      <div className={cn("rounded-full dot-1", sizeClasses[size], color)} />
      <div className={cn("rounded-full dot-2", sizeClasses[size], color)} />
      <div className={cn("rounded-full dot-3", sizeClasses[size], color)} />
    </div>
  );
};
