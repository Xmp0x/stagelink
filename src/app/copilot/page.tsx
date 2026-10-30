"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  ShieldAlert,
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

interface ChatMessageItem {
  id?: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ name: string; args: any; success: boolean }>;
}

export default function CopilotPage() {
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your **StageLink AI Copilot**, specialized in helping Moroccan students navigate authentic internship discovery.\n\nHere are some things I can do for you using our internal database:\n• **Find Opportunities**: *\"Find React internships in Casablanca\"* or *\"Show remote internships\"*\n• **Explainable Matches**: *\"What are my top recommended matches?\"*\n• **Application Drafting**: *\"Draft a motivation note for my saved listing\"*\n• **Application Tracking**: *\"Check the status of my applications\"*\n\nHow can I assist your internship search today?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversation list
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      const body = await res.json();
      if (body.success && body.data?.conversations) {
        setConversations(body.data.conversations);
      }
    } catch {
      // Ignore
    }
  };

  React.useEffect(() => {
    loadConversations();
  }, []);

  // Select conversation
  const selectConversation = async (id: string) => {
    try {
      setLoadingHistory(true);
      setCurrentConversationId(id);
      const res = await fetch(`/api/ai/conversations/${id}`);
      const body = await res.json();
      if (body.success && body.data?.conversation) {
        setMessages(
          body.data.conversation.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
          }))
        );
      }
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I am ready to help you discover authentic Moroccan internships and prepare tailored applications. What are you looking for?",
      },
    ]);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        startNewChat();
      }
    } catch {
      // Ignore
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Optimistically append user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: currentConversationId,
        }),
      });

      const body = await res.json();

      if (body.success && body.data) {
        if (!currentConversationId) {
          setCurrentConversationId(body.data.conversationId);
          loadConversations();
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: body.data.reply,
            toolCalls: body.data.toolCalls,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ ${body.error?.message || "Failed to process message with AI Copilot."}`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Network error while connecting to AI Copilot.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-6 max-w-7xl h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Top Banner Notice */}
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-emerald animate-pulse" />
          <span className="font-semibold text-foreground">StageLink AI Copilot (Sandboxed Internal DB)</span>
          <span className="hidden md:inline">• Zero scraping • Law 09-08 consent enforced</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Cannot auto-submit applications</span>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar: Conversation Threads */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-muted/20 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Conversations
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={startNewChat}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-48 md:max-h-full">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No previous threads.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                    currentConversationId === c.id
                      ? "bg-primary-500/15 text-primary-900 dark:text-primary-100 font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                    title="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Thread & Input Area */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversation thread...
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-sm ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 max-w-2xl space-y-2 leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-muted/50 border border-border text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-xs md:text-sm">{m.content}</div>

                    {/* Tool executions pill */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                        {m.toolCalls.map((t, tidx) => (
                          <Badge
                            key={tidx}
                            variant="outline"
                            className="text-[10px] py-0 border-primary-500/30 text-primary-700 bg-background/50 flex items-center gap-1"
                          >
                            <span>✓ Tool: {t.name}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {sending && (
              <div className="flex gap-3 text-sm justify-start">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted/50 border border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" />
                  <span>Consulting internal database and running matching models...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-6 py-2 border-t border-border/50 bg-background/80 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-muted-foreground shrink-0 font-medium">Try:</span>
            {[
              "What are my top recommended matches?",
              "Find React internships in Casablanca",
              "Check my submitted application status",
              "Show remote internships in Morocco",
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                disabled={sending}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about internships, matching scores, or motivation note drafts..."
                disabled={sending}
                className="flex-1 h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || sending}
                className="h-11 px-5 rounded-xl gap-1.5"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
