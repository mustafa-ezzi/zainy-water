import { Button } from "@/components/ui/button";
import { UserPen, UserStar } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col gap-10 items-center justify-around px-10 py-8 rounded-lg border border-border">
        <div className="text-center space-y-4">
          <h1 className="font-bold font-mono text-2xl md:text-4xl">
            Welcome to Zainy Water!
          </h1>
          <p className="text-sm text-muted-foreground">
            Which role would you like to take on?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button className="bg-blue-500 text-white min-w-[120px] text-lg">
            <Link href={"/admin"} className="flex items-center gap-2">
              <UserStar className="size-5 animate-pulse" />
              Admin
            </Link>
          </Button>
          <Button className="bg-green-500 text-white min-w-[120px] text-lg">
            <Link href={"/moderator"} className="flex items-center gap-2">
              <UserPen className="size-5 animate-pulse" />
              Moderator
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
