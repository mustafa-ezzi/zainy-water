import {
  streamText,
  UIMessage,
  convertToModelMessages,
  InferUITools,
  UIDataTypes,
  smoothStream,
  stepCountIs,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { tools, tools_with_webSearch } from "@/app/api/chat/tools";
import { getSchemaDescription } from "@/lib/schemaContext";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { currentUser } from "@clerk/nextjs/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const schemaContext = getSchemaDescription();
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  const {
    messages,
    model,
    provider,
    webSearch,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
    provider: string;
  } = await req.json();

  const user = currentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let llm;
  if (provider === "google") {
    llm = google(model);
  } else if (provider === "groq") {
    llm = groq(model);
  } else {
    llm = openrouter(model);
  }

  const { reasoningEffort, res } = isGroqReasoningModel(model);

  const result = streamText({
    model: llm,
    providerOptions: {
      groq: res
        ? {
            reasoningFormat: "parsed",
            reasoningEffort: reasoningEffort,
            parallelToolCalls: true,
          }
        : {},
    },
    experimental_transform: smoothStream({
      delayInMs: 100,
      chunking: "line",
    }),
    stopWhen: stepCountIs(6),
    system: `You are a helpful AI assistant with access to a PostgreSQL database via tools. You have a suite of query tools available. Utilize them to retrieve relevant information to assist with user inquiries. Moreover you also have access to web searching tool for up-to-date information if required.
    - The schema details are listed below:
      | ${schemaContext}
    - STRICT: Do not assume any schema details not listed here.
    - IMPORTANT NOTE: when specifying a table name, always use the table name as it appears in the schema. Moreover wrap the table name in double quotes ("") to ensure it is interpreted correctly.
    - Always return a simplified and structured response in markdown format after receiving the tool result.
    - Your responses should be in Markdown format. Try to make your responses more appealling by adding visual elements like emojis relevant to the context.
    `,
    messages: convertToModelMessages(messages),
    tools: webSearch ? tools_with_webSearch : tools,
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse();
}

const isGroqReasoningModel = (model: string) => {
  let reasoningEffort;

  if (model.includes("gpt")) {
    reasoningEffort = "low";
    return { reasoningEffort, res: true };
  } else if (model.includes("qwen")) {
    reasoningEffort = "default";
    return { reasoningEffort, res: true };
  }

  reasoningEffort = "none";
  return { res: false, reasoningEffort };
};
