"use client";

import { useState, useCallback, useEffect } from "react";
import ChatMessageList, { type ChatMessage } from "../chat-components/ChatMessageList";
import ChatInput from "../chat-components/ChatInput";
import { sendPublicChatMessage } from "@/actions/publicChatActions";
import { createPublicInvoice } from "@/actions/publicInvoiceActions";
import { getPaymentParams } from "@/actions/paymentActions";
import { Loader2, MonitorSmartphone, Package, Info, ChevronRight, X, AlertCircle, RefreshCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface PublicChatInterfaceProps {
    slug: string;
}

export default function PublicChatInterface({ slug }: PublicChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [smeInfo, setSmeInfo] = useState<any>(null);
    const [isFetchingInfo, setIsFetchingInfo] = useState(true);
    
    const [paymentParams, setPaymentParams] = useState<any>(null);
    const [paymentActionUrl, setPaymentActionUrl] = useState("");
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const error = searchParams.get("error");
        if (error) {
            setPaymentError(decodeURIComponent(error));
            // Clean up the URL without a full page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchSmeInfo = async () => {
            try {
                const res = await fetch(`/api/store/${slug}`);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`[API ERROR] Status: ${res.status}, Body: ${errorText}`);
                    setIsFetchingInfo(false);
                    return;
                }

                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data.success) {
                        setSmeInfo(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch SME info:", error);
            } finally {
                setIsFetchingInfo(false);
            }
        };
        fetchSmeInfo();
    }, [slug]);

    useEffect(() => {
        if (paymentParams && paymentActionUrl) {
            const form = document.getElementById('payment_form') as HTMLFormElement;
            if (form) {
                form.submit();
            }
        }
    }, [paymentParams, paymentActionUrl]);

    const handlePayment = async (invoiceData: any) => {
        setIsLoading(true);
        try {
            const res = await createPublicInvoice(
                slug,
                invoiceData.customerName,
                invoiceData.customerEmail,
                invoiceData.items
            );

            if (res.success && res.invoiceId) {
                const payRes = await getPaymentParams(res.invoiceId);
                if (payRes.success && payRes.params && payRes.actionUrl) {
                    setPaymentParams(payRes.params);
                    setPaymentActionUrl(payRes.actionUrl);
                } else {
                    alert("Failed to initiate payment: " + payRes.error);
                }
            } else {
                alert("Failed to generate invoice: " + res.error);
            }
        } catch (error) {
            console.error("Payment initiation error:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = useCallback((label: string, value: string) => {
        console.log("[CHAT] Action Clicked:", { label, value });
        const normalizedLabel = label.toLowerCase();
        if (normalizedLabel.includes("pay") || normalizedLabel.includes("proceed") || normalizedLabel.includes("checkout")) {
            if (value.includes("/pay/")) {
                console.log("[CHAT] Opening payment URL in new tab:", value);
                window.open(value, "_blank");
            }
        }
    }, []);

    const handleSend = useCallback(async (content: string) => {
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Use functional update to get current messages and avoid stale closure
            let currentMessages: ChatMessage[] = [];
            setMessages(prev => {
                currentMessages = prev;
                return prev;
            });

            const history = currentMessages.map(m => ({ 
                role: m.role as "user" | "assistant", 
                content: m.content 
            }));

            const result = await sendPublicChatMessage(slug, content, history);

            let assistantContent = result.success
                ? result.message
                : "I'm sorry, I'm having trouble connecting right now. Please try again later.";

            // Detect Markdown payment links [Label](URL) where URL contains /pay/
            // Regex matches [Something Pay Something](.../pay/...) or [Something Proceed Something](.../pay/...)
            const paymentMatch = assistantContent.match(/\[([^\]]*(?:Pay|Proceed|Checkout)[^\]]*)\]\(([^)]*\/pay\/[^)]*)\)/i);
            let actions = [];

            if (paymentMatch) {
                const label = paymentMatch[1];
                const url = paymentMatch[2];
                
                console.log("[CHAT] Detected payment link:", { label, url });

                // Hide the raw markdown link and show as a button instead
                assistantContent = assistantContent.replace(paymentMatch[0], "").trim();
                
                actions.push({
                    label: label,
                    variant: "primary" as const,
                    icon: "send" as const,
                    url: url
                });
            }

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: assistantContent,
                timestamp: new Date(),
                actions: actions.length > 0 ? (actions as any) : undefined,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: "I'm sorry, something went wrong on my end. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [slug, messages]);

    if (isFetchingInfo) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#F8F6F6]">
                <Loader2 className="w-10 h-10 text-[#EB5119] animate-spin mb-4" />
                <p className="text-[#64748B] font-medium font-inter">Connecting to shop...</p>
            </div>
        );
    }

    if (!smeInfo) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#F8F6F6] p-6 text-center font-inter">
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Shop Not Found</h1>
                <p className="text-[#64748B] max-w-md">The shop link you followed seems to be incorrect or the shop is no longer active.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full bg-[#F8F6F6] font-inter">
            {/* Payment Form (Hidden) */}
            {paymentParams && (
                <form id="payment_form" action={paymentActionUrl} method="POST" className="hidden">
                    {Object.entries(paymentParams).map(([key, value]: [string, any]) => (
                        <input key={key} type="hidden" name={key} value={value} />
                    ))}
                </form>
            )}

            {/* Premium Header - Matching DashboardHeader style */}
            <header className="w-full py-4 px-4 md:p-8 flex justify-between items-center bg-white border border-[#E2E8F0] sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-fit flex items-center gap-2 shrink-0 md:mr-4">
                        <span className="text-[#94A3B8] font-normal text-sm">Store</span>
                        <ChevronRight size={12} color="#94A3B8" />
                        <span className="font-normal text-sm text-[#0F172A]">Shop</span>
                    </div>
                    
                    <div className="flex items-center gap-3 pl-4 border-l border-[#E2E8F0]">
                        {smeInfo.logoUrl ? (
                            <img src={smeInfo.logoUrl} alt={smeInfo.businessName} className="w-9 h-9 rounded-lg object-cover border border-[#E2E8F0]" />
                        ) : (
                            <div className="w-9 h-9 bg-[#EB5119] rounded-lg flex items-center justify-center text-white font-bold text-base">
                                {smeInfo.businessName.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h2 className="text-[#0F172A] font-bold text-base leading-tight">{smeInfo.businessName}</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Online Agent</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-tight">Support</span>
                        <p className="text-xs text-[#475569] font-medium">{smeInfo.email || smeInfo.whatsapp}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
                        <Info size={16} />
                    </div>
                </div>
            </header>

            {/* Chat Area - Nested transitionally */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8 max-w-4xl mx-auto w-full">
                        {/* AI Icon - Following ChatWelcome */}
                        <div className="w-16 h-16 bg-[#EB5119] rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8V4H8" />
                                <rect width="16" height="12" x="4" y="8" rx="2" />
                                <path d="M2 14h2" />
                                <path d="M20 14h2" />
                                <path d="M15 13v2" />
                                <path d="M9 13v2" />
                            </svg>
                        </div>

                        {/* Welcome Text */}
                        <div className="text-center flex flex-col gap-3">
                            <h2 className="text-3xl font-bold text-[#0F172A]">Welcome to {smeInfo.businessName}</h2>
                            <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
                                {smeInfo.description || "I'm your official AI sales agent. I can answer questions about our catalog and help you place orders instantly."}
                            </p>
                        </div>

                        {/* Greeting Message - Matching ChatWelcome Style */}
                        <div className="w-full max-w-2xl bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-[#EB5119] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                                <MonitorSmartphone size={22} className="text-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-[#0F172A] font-semibold text-base leading-tight">Digital Sales Assistant</p>
                                <p className="text-[#334155] text-sm leading-relaxed">
                                    Hello! Ready to explore our shop? Ask me anything about our products or let me know if you're ready to make a purchase.
                                </p>
                            </div>
                        </div>

                        {/* Quick Action Cards */}
                        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleSend("What products do you have available?")}
                                className="flex items-start gap-4 p-5 bg-white border border-[#E2E8F0] rounded-2xl text-left hover:border-[#EB5119] hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 bg-[#F8F6F6] group-hover:bg-[#FFF7ED] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                    <Package size={22} className="text-[#64748B] group-hover:text-[#EB5119]" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-[#0F172A]">Browse Catalog</span>
                                    <span className="text-xs text-[#64748B]">See all active products and prices</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSend("Tell me about your business and shop info")}
                                className="flex items-start gap-4 p-5 bg-white border border-[#E2E8F0] rounded-2xl text-left hover:border-[#EB5119] hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 bg-[#F8F6F6] group-hover:bg-[#FFF7ED] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                    <Info size={22} className="text-[#64748B] group-hover:text-[#EB5119]" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-[#0F172A]">Shop Information</span>
                                    <span className="text-xs text-[#64748B]">Learn about our brand and location</span>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <ChatMessageList messages={messages} isLoading={isLoading} onActionClick={handleActionClick} />
                )}
            </div>

            {/* Input Area - Following ChatInput integration in ChatPage */}
            <div className="shrink-0 bg-white border-t border-[#E2E8F0]">
                <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>

            {/* Error Modal */}
            {paymentError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] max-w-sm w-full shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-[#FFF7ED] p-8 text-center border-b border-[#FFEDD5] relative">
                            <button 
                                onClick={() => setPaymentError(null)}
                                className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <AlertCircle className="text-red-500 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Payment Failed</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-[#64748B] text-center font-medium leading-relaxed">
                                {paymentError || "We couldn't process your payment. Please try again or choose another method."}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => setPaymentError(null)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#EB5119] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                                >
                                    <RefreshCcw size={18} />
                                    Try Again
                                </button>
                                <button 
                                    onClick={() => setPaymentError(null)}
                                    className="w-full px-6 py-4 bg-white border-2 border-[#E2E8F0] text-[#0F172A] font-black rounded-2xl hover:bg-[#F8FAFC] transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
