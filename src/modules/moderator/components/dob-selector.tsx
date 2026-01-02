import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export const DobSelector = () => {
  const { dob, setDOB } = useDOBStore();

  return (
    <div className="grid grid-cols-1 justify-center items-center">
      {/* <Badge
        variant={"outline"}
        className={cn(
          !dob && "text-muted-foreground",
          "flex justify-center items-center mt-2"
        )}
      >
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        {dob ? format(dob, "PPP") : <span>Pick a date</span>}
      </Badge> */}
    </div>
  );
};
