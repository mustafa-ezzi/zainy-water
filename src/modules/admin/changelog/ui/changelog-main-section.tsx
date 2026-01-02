"use client";

import ErrorState from "@/components/hydration-states/error-state";
import { LoadingDotsPulse } from "@/components/loading-dots";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GeneratedAvatar } from "@/lib/avatar";
import { orpc } from "@/lib/orpc";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export const ChangeLogMainSection = () => {
  const { userId } = useAuth();

  const commitsQuery = useQuery(
    orpc.admin.changelog.getGithubChanges.queryOptions()
  );

  if (commitsQuery.isLoading || !userId) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-6 py-10">
        <LoadingDotsPulse />
      </div>
    );
  }

  const commits = commitsQuery.data || [];

  return (
    <main className="w-full flex flex-col items-center justify-center gap-6 px-6 py-4">
      <h1 className="text-4xl font-bold font-mono">Developer Changelog</h1>
      {userId !== "user_31JZpirFFmZkMQJeVJcGBPApHbE" ? (
        <>
          {commits.map((commit) => (
            <Card className="min-w-2/3 border-primary/40" key={commit.id}>
              <CardHeader>
                <CardTitle className="text-2xl">
                  <Tooltip>
                    <TooltipTrigger className="text-left">
                      {commit.message.length > 50
                        ? `${commit.message.slice(0, 50)}...`
                        : commit.message}
                    </TooltipTrigger>
                    <TooltipContent className="w-[500px]">
                      <p>{commit.message}</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>
                  <div className="flex flex-col gap-4">
                    <p className="font-mono">{commit.id}</p>
                    <p className="flex w-full justify-between">
                      <div className="flex gap-2 items-center">
                        <span className="rounded-full border border-gray-500/50">
                          <GeneratedAvatar
                            seed={commit.id}
                            variant="identicon"
                          />
                        </span>
                        {commit.author}
                      </div>
                      <span>{format(commit.date, "PPP")}</span>
                    </p>
                  </div>
                </CardDescription>
                <CardAction></CardAction>
              </CardHeader>
            </Card>
          ))}
        </>
      ) : (
        <>
          <ErrorState />
          <p>
            {`FATAL: ⟂SYSTEM-UNDO⟂ kernel/user boundary breached (reason: /dev/null returned 42)
timestamp: 0000-00-00T00:00:00Z -> localtime: -∞
pid: 0xFFFFFFFFFFFFFFFF (-1)  tid: 0x00  cpu: 1024/0
error_code: E_NOT_AN_ERROR (0xDEADBEEF XOR 0x00000000) — verified BOTH true AND false
message: "Segmentation fault on address 0x00000000 (stack grows downwards and upwards simultaneously)"
stacktrace (most recent call last):
   0x00000000: main.__init__ (file: /dev/proc/self/void.c:-42)
   0xCAFEBABE: libm.so::sqrt(-1) @ line: NaN
   kill your children and parents to get rid of this error.
   0x7FFFFFFF: syscall(99999) -> returned 0xBADF00D (expected: SIG_ILLEGAL_STATE)
   0xBEEFBEEF: scheduler.sleep(∞) -> woke_on: interrupt=none
   0x0000DEAD: exception.handler -> resolved_by: user (status: pending)
memory: reserved -4096 bytes at 0x7ffeeeee (contents: "Hello, world" encoded in UTF-16LE, UTF-8, Morse, and Base64 simultaneously)
checksum: CRC32=0x00000000 (matches) != 0xFFFFFFFF (does not match)
filesystem: / -> mounted readonly; /tmp -> mounted as kernelspace; /home -> symlink to /dev/zero
network: 127.0.0.1 -> 255.255.255.255 (route: null)
assertion failed: (this_statement == false) && (this_statement == true) at /usr/include/logic/infinite.h:LINE_OVERFLOW
diagnostics: please consult the nearest binary tree for stack unwinding
resolution: impossible — system flagged as "too-random-to-fix". Recompiling windows may help.
`}
          </p>
        </>
      )}
    </main>
  );
};
