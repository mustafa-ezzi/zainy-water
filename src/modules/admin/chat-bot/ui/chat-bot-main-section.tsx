import AdminChatbot from "@/modules/admin/chat-bot/ui/admin-chatbot";
import { Badge } from "@/components/ui/badge";
import { Sparkle } from "lucide-react";

function ChatBotMainSection() {
  return (
    <div className="min-h-screen w-full p-6 max-w-7xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkle className="size-6" />
            <h1 className="text-2xl font-semibold tracking-tight">
              GEKKO - AI Assistant
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Chat with your intelligent admin assistant
          </p>
          <p className="text-sm text-muted-foreground italic">
            Note: GEKKO is experimental and may not always provide accurate
            information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-muted-foreground border-muted-foreground/50 bg-muted/20 animate-pulse"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-rose-500 font-medium">Experimental</span>
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex relative min-h-[calc(100vh-200px)]">
        <div className="w-full h-full min-h-[700px] border border-border/50 rounded-xl shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>
          <div className="relative h-full min-h-[700px]">
            <AdminChatbot />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBotMainSection;
