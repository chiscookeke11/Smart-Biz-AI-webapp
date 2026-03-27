"use client";

import { useEffect, useRef } from "react";
import { Send, Eye, Lightbulb } from "lucide-react";
import MarkdownContent from "./MarkdownContent";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    actions?: MessageAction[];
    suggestedPrompt?: string;
}

interface MessageAction {
    label: string;
    variant: "primary" | "outline";
    icon?: "send" | "view";
    url?: string;
}

interface ChatMessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onActionClick?: (label: string, value: string) => void;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "TODAY";
    if (date.toDateString() === yesterday.toDateString()) return "YESTERDAY";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}

function ActionIcon({ icon }: { icon?: "send" | "view" }) {
    if (icon === "send") return <Send size={14} />;
    if (icon === "view") return <Eye size={14} />;
    return null;
}

export default function ChatMessageList({ messages, isLoading, onActionClick }: ChatMessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    if (messages.length === 0) return null;

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
                {messages.map((msg, index) => {
                    const dateLabel = formatDateLabel(msg.timestamp);
                    const prevDateLabel = index > 0 ? formatDateLabel(messages[index - 1].timestamp) : "";
                    const showDateSeparator = dateLabel !== prevDateLabel;

                    return (
                        <div key={msg.id} className="flex flex-col gap-4">
                            {/* Date Separator */}
                            {showDateSeparator && (
                                <div className="flex items-center justify-center py-2">
                                    <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-4 py-1.5 rounded-full uppercase tracking-wider">
                                        {dateLabel}
                                    </span>
                                </div>
                            )}

                            {/* Message Bubble */}
                            {msg.role === "user" ? (
                                <UserBubble message={msg} />
                            ) : (
                                <AssistantBubble message={msg} onActionClick={onActionClick} />
                            )}
                        </div>
                    );
                })}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-[#EB5119] rounded-full flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8V4H8" />
                                <rect width="16" height="12" x="4" y="8" rx="2" />
                                <path d="M2 14h2" />
                                <path d="M20 14h2" />
                                <path d="M15 13v2" />
                                <path d="M9 13v2" />
                            </svg>
                        </div>
                        <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl px-5 py-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-[#EB5119] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-[#EB5119] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-[#EB5119] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function UserBubble({ message }: { message: ChatMessage }) {
    return (
        <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-start gap-3">
                <div className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-3 max-w-lg shadow-sm">
                    <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="w-9 h-9 bg-[#F1F5F9] rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-[#64748B]">
                    U
                </div>
            </div>
            <span className="text-xs text-[#94A3B8] mr-12">{formatTime(message.timestamp)}</span>
        </div>
    );
}

function AssistantBubble({ message, onActionClick }: { message: ChatMessage; onActionClick?: (label: string, value: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#EB5119] rounded-full flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                        <path d="M2 14h2" />
                        <path d="M20 14h2" />
                        <path d="M15 13v2" />
                        <path d="M9 13v2" />
                    </svg>
                </div>
                <div className="flex flex-col gap-3 max-w-lg">
                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl px-5 py-4">
                        <MarkdownContent content={message.content} />

                        {/* Action Buttons */}
                        {message.actions && message.actions.length > 0 && (
                            <div className="flex items-center gap-2 mt-4">
                                {message.actions.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => onActionClick?.(action.label, action.url || message.id)}
                                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                                            action.variant === "primary"
                                                ? "bg-[#EB5119] text-white hover:bg-[#D4410F]"
                                                : "bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
                                        }`}
                                    >
                                        <ActionIcon icon={action.icon} />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-[#EB5119] font-semibold uppercase tracking-wider ml-12">
                SmartBiz AI &bull; {formatTime(message.timestamp)}
            </span>

            {/* Suggested Prompt Pill */}
            {message.suggestedPrompt && (
                <div className="flex justify-center mt-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF7ED] border border-[#FFEDD5] rounded-full text-xs font-medium text-[#EB5119]">
                        <Lightbulb size={12} />
                        AI Prompt: &quot;{message.suggestedPrompt}&quot;
                    </span>
                </div>
            )}
        </div>
    );
}
