"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import { GlobeIcon } from "lucide-react";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/source";
import { Loader } from "@/components/ai-elements/loader";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { ChatMessage } from "@/app/api/chat/route";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { TavilySearchResponse } from "@tavily/core";
import { useScrollAwareSticky } from "@/hooks/use-scroll-aware-sticky";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useRouter } from "next/navigation";

// Add these type definitions after your imports
interface TavilySearchResult {
  url?: string;
  title?: string;
  content?: string;
}

interface TavilySearchOutput {
  data?: TavilySearchResponse;
}

interface TavilyToolPart {
  type: "tool-tavilySearch";
  output?: TavilySearchOutput;
  input?: any;
  state?: string;
  errorText?: string;
}

// Type guard function
const isTavilySearchPart = (part: any): part is TavilyToolPart => {
  return part.type === "tool-tavilySearch" && "output" in part;
};

// More specific type guard for filtered parts
const isTavilyToolPart = (part: any): part is TavilyToolPart => {
  return part.type === "tool-tavilySearch";
};

const models: {
  name: string;
  value: string;
  provider: "google" | "groq" | "openrouter";
  tag: "best" | "recommended" | "experimental" | "limited" | "broken";
}[] = [
  {
    name: "GPT-oss",
    value: "openai/gpt-oss-120b",
    provider: "groq",
    tag: "best",
  },
  {
    name: "Gemini",
    value: "gemini-2.5-flash",
    provider: "google",
    tag: "recommended",
  },
  {
    name: "Qwen 3",
    value: "qwen/qwen3-32b",
    provider: "groq",
    tag: "recommended",
  },
  {
    name: "Kimi K2",
    value: "moonshotai/kimi-k2-instruct",
    provider: "groq",
    tag: "recommended",
  },
  {
    name: "Meta 4 Maverick",
    value: "meta-llama/llama-4-maverick-17b-128e-instruct",
    provider: "groq",
    tag: "experimental",
  },
  {
    name: "Meta 4 Scout",
    value: "meta-llama/llama-4-scout-17b-16e-instruct",
    provider: "groq",
    tag: "experimental",
  },
  {
    name: "Deepseek V3",
    value: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    tag: "limited",
  },
  {
    name: "GLM 4.5 Air",
    value: "z-ai/glm-4.5-air:free",
    provider: "openrouter",
    tag: "limited",
  },
];

const suggestions = [
  "Summary of latest delivery",
  "How many bottles are available at the plant?",
  "List of all the customers",
  "Which moderators are currently not working?",
  "What are your capabilities?",
];

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [provider, setProvider] = useState<string>(models[0].provider);
  const [webSearch, setWebSearch] = useState(false);
  const { parentRef, isSticky } = useScrollAwareSticky();
  const router = useRouter();

  const { messages, sendMessage, status, error, setMessages } =
    useChat<ChatMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model: model,
            provider: provider,
            webSearch: webSearch,
          },
        },
      );
      setInput("");

      // Smooth scroll to bottom after sending message
      setTimeout(() => {
        const conversationElement = document.querySelector('[role="log"]');
        if (conversationElement) {
          conversationElement.scrollTo({
            top: conversationElement.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(`An Error occured: ${error.message}`);
      console.error("Error in chat api: ", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          metadata: undefined,
          parts: [
            {
              type: "text",
              text: `An error occurred: ${error.message}`,
            },
          ],
        } as ChatMessage,
      ]);
    }
    router.push("/admin/chat-bot");
  }, [error, setMessages, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear conversation with Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setMessages([]);
        toast.success("Conversation cleared");

        // Focus the input after clearing
        setTimeout(() => {
          const textarea = document.querySelector(
            'textarea[name="message"]',
          ) as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
          }
        }, 100);
      }

      // Focus input with Ctrl/Cmd + /
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const textarea = document.querySelector(
          'textarea[name="message"]',
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setMessages]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div
      ref={parentRef}
      className="w-full h-full mx-auto relative flex flex-col min-h-[600px]"
    >
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 pt-6 pb-8">
        <Conversation className="flex-1 mb-6 min-h-[450px]">
          <ConversationContent className="space-y-6 animate-in fade-in duration-500 pb-4 min-h-full">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-in fade-in duration-700">
                <div className="space-y-4 max-w-md">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      GEKKO is Ready!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Start a conversation by typing your question below. I can
                      help you with database queries, analytics, and more.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 text-xs bg-secondary/50 text-secondary-foreground rounded-full">
                      SQL Queries
                    </span>
                    <span className="px-3 py-1 text-xs bg-secondary/50 text-secondary-foreground rounded-full">
                      Data Analysis
                    </span>
                    <span className="px-3 py-1 text-xs bg-secondary/50 text-secondary-foreground rounded-full">
                      Web Search
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-4">
                    <p>
                      💡{" "}
                      <kbd className="px-1 py-0.5 bg-secondary/30 rounded text-[10px]">
                        Ctrl+K
                      </kbd>{" "}
                      to clear •{" "}
                      <kbd className="px-1 py-0.5 bg-secondary/30 rounded text-[10px]">
                        Ctrl+/
                      </kbd>{" "}
                      to focus input
                    </p>
                  </div>
                </div>
              </div>
            )}
            {messages.map((message, messageIndex) => (
              <div
                key={message.id}
                className={cn(
                  "animate-in slide-in-from-bottom-4 duration-300",
                  `animation-delay-${Math.min(messageIndex * 100, 500)}`,
                )}
              >
                <Message
                  from={message.role}
                  key={message.id}
                  className="group hover:bg-muted/30 transition-colors duration-200 rounded-lg"
                >
                  <MessageContent className="space-y-3">
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                        case "reasoning":
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full transform transition-all duration-200 hover:scale-[1.01]"
                              isStreaming={status === "streaming"}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        case "tool-rawSQLQuery":
                        case "tool-getAllDeliveries":
                        case "tool-getAllModerators":
                        case "tool-getAllCustomers":
                        case "tool-getAllBottleUsage":
                        case "tool-getTotalBottles":
                        case "tool-getDeliveriesByCustomerName":
                        case "tool-getDeliveriesByModeratorName":
                        case "tool-getBottleUsageByModeratorName":
                          return (
                            <Tool
                              key={`${message.id}-${i}`}
                              defaultOpen={false}
                              className="transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                            >
                              <ToolHeader type={part.type} state={part.state} />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  output={
                                    <Response>
                                      {formatQueryResult(part.output)}
                                    </Response>
                                  }
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        case "tool-tavilySearch":
                          return (
                            <Tool
                              key={`${message.id}-${i}`}
                              defaultOpen={false}
                              className="transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                            >
                              <ToolHeader type={part.type} state={part.state} />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  output={
                                    <Response>
                                      {formatSearchResult(part?.output?.data)}
                                    </Response>
                                  }
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
                {message.role === "assistant" && (
                  <Sources>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "tool-tavilySearch":
                          console.log("Tavily search called: ", message);

                          if (!isTavilySearchPart(part)) {
                            return null;
                          }

                          const results = part.output?.data?.results || [];

                          return (
                            <>
                              <SourcesTrigger
                                count={message.parts.reduce((total, part) => {
                                  if (isTavilySearchPart(part)) {
                                    return (
                                      total +
                                      (part.output?.data?.results?.length || 0)
                                    );
                                  }
                                  return total;
                                }, 0)}
                              />
                              <SourcesContent key={`${message.id}-${i}`}>
                                {results.map(
                                  (
                                    result: TavilySearchResult,
                                    resultIndex: number,
                                  ) => (
                                    <Source
                                      key={`${message.id}-${i}-${resultIndex}`}
                                      href={result?.url || "Unknown"}
                                      title={result?.title || "Unknown"}
                                    />
                                  ),
                                )}
                              </SourcesContent>
                            </>
                          );
                        default:
                          return null;
                      }
                    })}
                  </Sources>
                )}
              </div>
            ))}
            {status === "submitted" && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <Loader />
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div
          className={cn(
            "transition-all duration-300 ease-out mb-6",
            isSticky
              ? "fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 z-50"
              : "relative w-full",
          )}
        >
          <div className={"text-sm md:text-base mb-4"}>
            {messages.length === 0 && (
              <Suggestions>
                {suggestions.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    onClick={handleSuggestionClick}
                    suggestion={suggestion}
                  />
                ))}
              </Suggestions>
            )}
          </div>
          <PromptInput
            onSubmit={handleSubmit}
            className={cn(
              "w-full mx-auto transform transition-all duration-300 ease-out",
              "hover:shadow-lg hover:-translate-y-1",
              "backdrop-blur-lg bg-background/95 border-2",
              isSticky && "shadow-2xl border-primary/20",
              "animate-in slide-in-from-bottom-4 duration-500",
              status === "streaming" && "opacity-90 pointer-events-auto",
              status === "submitted" && "animate-pulse",
            )}
          >
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder={
                status === "streaming"
                  ? "AI is thinking..."
                  : "What would you like to know?"
              }
              className={cn(
                "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                status === "streaming" && "opacity-70",
              )}
              disabled={status === "streaming"}
            />
            <PromptInputToolbar className="bg-muted/30 border-t">
              <PromptInputTools className="gap-2">
                <PromptInputButton
                  variant={webSearch ? "default" : "ghost"}
                  onClick={() => setWebSearch(!webSearch)}
                  className={cn(
                    "transform transition-all duration-200 hover:scale-105",
                    webSearch &&
                      "bg-primary/10 text-primary border-primary/20 hover:text-white/80",
                  )}
                >
                  <GlobeIcon
                    size={16}
                    className={cn(
                      "transition-transform duration-200",
                      webSearch && "rotate-180",
                    )}
                  />
                  <span>Search</span>
                </PromptInputButton>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value);
                    const selectedModel = models.find(
                      (model) => model.value === value,
                    );
                    if (selectedModel) {
                      setProvider(selectedModel.provider);
                    }
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger className="transform transition-all duration-200 hover:scale-105 hover:bg-accent">
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.value}
                        value={model.value}
                        className="hover:bg-accent transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                          <Badge
                            variant={"outline"}
                            className={cn(
                              "ml-2 text-[10px] transition-all duration-200",
                              model.tag === "best" &&
                                "border-green-200 text-green-500 bg-green-50",
                              model.tag === "recommended" &&
                                "border-blue-200 text-blue-500 bg-blue-50",
                              model.tag === "experimental" &&
                                "border-yellow-200 text-yellow-500 bg-yellow-50",
                              model.tag === "limited" &&
                                "border-gray-200 text-gray-500 bg-gray-50",
                              model.tag === "broken" &&
                                "border-rose-200 text-rose-500 bg-rose-50",
                            )}
                          >
                            {model.tag}
                          </Badge>
                        </div>
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <div className={"flex items-center gap-4"}>
                <div className="text-xs text-muted-foreground/60">
                  <p>
                    <kbd className="px-1 py-0.5 bg-secondary/30 rounded text-[10px]">
                      Ctrl+K
                    </kbd>{" "}
                    to clear chat
                  </p>
                </div>
                <PromptInputSubmit
                  disabled={!input.trim() || status === "streaming"}
                  status={status}
                  className={cn(
                    "rounded-full transform transition-all duration-200",
                    "hover:scale-110 hover:shadow-lg",
                    "disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
                    !input.trim() && "cursor-not-allowed",
                    status === "streaming" && "animate-spin",
                    status === "submitted" && "animate-bounce",
                  )}
                />
              </div>
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

function formatQueryResult(
  result?: { success?: boolean; data?: Record<string, unknown>[] },
  maxLen = 50,
): string {
  if (!result || !result.data || result.data.length === 0) {
    return "No result";
  }

  try {
    const keys = Object.keys(result.data[0]);

    // Helper: truncate long strings
    const truncate = (val: unknown): string => {
      const str = String(val ?? "");
      return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
    };

    // Helper: detect if value is numeric
    const isNumeric = (val: unknown): boolean =>
      typeof val === "number" ||
      (!isNaN(Number(val)) && val !== null && val !== "");

    // Build alignment row (--- for text, ---: for numbers)
    const sampleRow = result.data[0];
    const separator = `| ${keys
      .map((k) => (isNumeric(sampleRow[k]) ? "---:" : "---"))
      .join(" | ")} |`;

    // Header row
    const header = `| ${keys.join(" | ")} |`;

    // Data rows
    const rows = result.data
      .map(
        (row: Record<string, unknown>) =>
          `| ${keys.map((k) => truncate(row[k])).join(" | ")} |`,
      )
      .join("\n");

    return `**Query Result:**\n\n${header}\n${separator}\n${rows}`;
  } catch (error) {
    console.error("Error formatting query result:", error);
    return "Error formatting query result...";
  }
}

function formatSearchResult(res?: TavilySearchResponse): string {
  const lines: string[] = [];

  if (!res) {
    return "No Results Found!";
  }

  try {
    // Show direct answer if available
    if (res.answer) {
      lines.push(`## 📝 Answer\n${res.answer}\n`);
    }

    // List search results
    if (res.results && res.results.length > 0) {
      lines.push("## 🔎 Top Results");
      res.results.forEach((r, i) => {
        lines.push(
          `### ${i + 1}. [${r.title}](${r.url})\n${r.content ? r.content : "_No snippet available_"}`,
        );
      });
    } else {
      lines.push("No results found.");
    }

    return lines.join("\n\n");
  } catch (error) {
    console.error("Error formatting search result:", error);
    return "Error formatting search result...";
  }
}

export default ChatBotDemo;
