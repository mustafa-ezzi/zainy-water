import { IconTrendingUp } from "@tabler/icons-react";

import { SlidingNumber } from "@/components/animate-ui/text/sliding-number";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TotalBottles } from "@/db/schema";
import { orpc } from "@/lib/orpc";
import { TotalBottlesDataSchema } from "@/modules/admin/bottle-inventory/server/updateTotalBottles.orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChartLine,
  Check,
  Loader2,
  Pencil,
  ShieldX,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type Props = {
  total_bottles?: typeof TotalBottles.$inferSelect;
};

export function BottleInventorySectionCards({ total_bottles }: Props) {
  const card_content = [
    {
      id: "total_bottles",
      title: "Total Bottles",
      value: total_bottles ? (
        total_bottles.total_bottles
      ) : (
        <Loader2 className="animate-spin" />
      ),
      footer: "Total bottles owned",
      icon: <Wallet className="size-4" />,
    },
    {
      id: "available_bottles",
      title: "Available Bottles",
      value: total_bottles ? (
        total_bottles.available_bottles
      ) : (
        <Loader2 className="animate-spin" />
      ),
      footer: "Bottles at main plant",
      icon: <ChartLine className="size-4" />,
    },
    {
      id: "used_bottles",
      title: "Used Bottles",
      value: total_bottles ? (
        total_bottles.used_bottles
      ) : (
        <Loader2 className="animate-spin" />
      ),
      footer: "Bottles in circulation",
      icon: <IconTrendingUp className="size-4" />,
    },
    {
      id: "damaged_bottles",
      title: "Damaged Bottles",
      value: total_bottles ? (
        total_bottles.damaged_bottles
      ) : (
        <Loader2 className="animate-spin" />
      ),
      footer: "Damaged/Unavailable bottles",
      icon: <ShieldX className="size-4" />,
    },
  ];

  const [totalBottlesData, setTotalBottlesData] = useState<
    z.infer<typeof TotalBottlesDataSchema>
  >({
    total_bottles: total_bottles?.total_bottles || 0,
    available_bottles: total_bottles?.available_bottles || 0,
    used_bottles: total_bottles?.used_bottles || 0,
    damaged_bottles: total_bottles?.damaged_bottles || 0,
  });
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});

  // Update state when total_bottles prop changes
  useEffect(() => {
    if (total_bottles) {
      setTotalBottlesData({
        total_bottles: total_bottles.total_bottles,
        available_bottles: total_bottles.available_bottles,
        used_bottles: total_bottles.used_bottles,
        damaged_bottles: total_bottles.damaged_bottles,
      });
    }
  }, [total_bottles]);

  const queryClient = useQueryClient();
  const editMutation = useMutation(
    orpc.admin.bottleInventory.updateTotalBottles.mutationOptions({
      onSuccess: async (response) => {
        if (response.success) {
          toast.success(response.message);
          await queryClient.invalidateQueries({
            queryKey: orpc.util.getTotalBottles.queryKey(),
          });
        } else {
          toast.error(response.message);
          console.error({ response });
        }
      },
    })
  );
  const submitting = editMutation.isPending;

  const handleEdit = async (card_id: string) => {
    if (
      totalBottlesData[
      card_id as keyof z.infer<typeof TotalBottlesDataSchema>
      ]! < 0
    ) {
      setTotalBottlesData({ [card_id]: 0 });
    }

    console.log(totalBottlesData);

    await editMutation.mutateAsync({
      ...totalBottlesData,
    });

    setEditMode({ ...editMode, [card_id]: false });
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {card_content.map((card) => (
        <Card className="@container/card" key={card.id}>
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {editMode[card.id] ? (
                <Input
                  type="number"
                  min={0}
                  value={
                    totalBottlesData[
                    card.id as keyof z.infer<typeof TotalBottlesDataSchema>
                    ] || ""
                  }
                  onChange={(e) =>
                    setTotalBottlesData({
                      [card.id]: parseInt(e.target.value) || 0,
                    })
                  }
                  className="outline-none active:outline-none active:ring-0 focus-visible:ring-0 text-3xl p-0"
                />
              ) : (
                <>
                  <SlidingNumber
                    number={typeof card.value === "number" ? card.value : 0}
                  />
                </>
              )}
            </CardTitle>
            <CardAction>
              {editMode[card.id] ? (
                submitting ? (
                  <Badge variant={"outline"} className="bg-gray-300">
                    <Loader2 className="animate-spin" />
                  </Badge>
                ) : (
                  <span className="space-x-2">
                    <Badge
                      variant="outline"
                      onClick={() => handleEdit(card.id)}
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <Check className="text-emerald-500" />
                    </Badge>
                    <Badge
                      variant="outline"
                      onClick={() =>
                        setEditMode({ ...editMode, [card.id]: false })
                      }
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <X className="text-rose-500" />
                    </Badge>
                  </span>
                )
              ) : (
                <Badge
                  variant="outline"
                  onClick={() => setEditMode({ ...editMode, [card.id]: true })}
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Pencil />
                  Edit
                </Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footer} {card.icon}
            </div>
            <div className="text-muted-foreground">Account for this month</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
