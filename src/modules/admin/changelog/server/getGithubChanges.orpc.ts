import { adminProcedure } from "@/middlewares/admin-clerk";
import { ORPCError } from "@orpc/client";
import z from "zod";

const Commit = z.object({
  id: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.date(),
  url: z.url(),
});

export const getGithubChanges = adminProcedure
  .input(z.void())
  .output(z.array(Commit))
  .handler(async () => {
    const username = "TaherMustansir1929";
    const repo = "zainy-water-v2";

    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/commits`
    );

    if (!res.ok) {
      throw new ORPCError("Failed to fetch commits from GitHub");
    }

    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commits = data.map((c: any) => ({
      id: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: new Date(c.commit.author.date),
      url: c.html_url,
    }));

    return commits;
  });
