import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export const MainFooter = ({ className }: Props) => {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border/60 bg-background/95 backdrop-blur-sm",
        "px-3 py-1 text-[10px] text-muted-foreground",
        "flex items-center justify-between leading-none",
        className
      )}
    >
      <span className="font-medium whitespace-nowrap">
        <sup className="text-[6px] top-[-2px]">AK</sup>Neotech™
      </span>

      <span className="whitespace-nowrap">
        All Rights Reserved © 2025
      </span>
    </footer>
  );
};
