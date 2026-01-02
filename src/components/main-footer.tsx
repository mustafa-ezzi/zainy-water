import { cn } from "@/lib/utils";
import { Heart, Coffee } from "lucide-react";

type Props = {
  className?: string;
};

export const MainFooter = ({ className }: Props) => {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border/60 bg-background/95 backdrop-blur-sm",
        "px-4 py-4 text-xs text-muted-foreground",
        "flex flex-col gap-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">
          <sup className="text-[8px] top-[-4px]">AK</sup>Neotech™
        </span>
        <div className="flex items-center gap-2">
          <span>Made with</span>
          <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
          <span>&</span>
          <Coffee className="h-3 w-3 text-amber-600" />
        </div>
      </div>

      <div className="text-center">
        All Rights Reserved © 2025
      </div>

      <div className="text-center opacity-70">
        Version 1.0 • Zainy Water System
      </div>
    </footer>
  );
};