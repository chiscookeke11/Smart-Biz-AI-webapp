import { getPublicPaymentParams } from "@/actions/paymentActions";
import { Loader2, Lock } from "lucide-react";
import { redirect } from "next/navigation";

export default async function PayPage({
    params,
}: {
    params: Promise<{ invoiceId: string }>;
}) {
    const { invoiceId } = await params;
    const res = await getPublicPaymentParams(invoiceId);

    if (!res.success || !res.params || !res.actionUrl) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F6F6] p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-red-500 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Payment Failed to Start</h1>
                <p className="text-[#64748B] max-w-sm mb-6">{res.error || "We couldn't initialize your secure payment session."}</p>
                <a href="/" className="px-6 py-3 bg-[#EB5119] text-white font-bold rounded-xl transition-transform active:scale-95 shadow-lg">
                    Return Home
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F6F6] p-6 text-center font-inter">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-[#E2E8F0]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-[#FFF7ED] rounded-2xl flex items-center justify-center relative">
                        <Lock className="text-[#EB5119] w-10 h-10" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse border-2 border-white"></div>
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Secure Checkout</h1>
                        <p className="text-[#64748B] text-sm font-medium leading-relaxed">
                            Preparing your encrypted payment session for Interswitch. Please do not close this window.
                        </p>
                    </div>

                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div className="h-full bg-[#EB5119] animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Redirecting to Gateway
                    </div>
                </div>

                {/* Hidden Interswitch Form */}
                <form id="payment_form" action={res.actionUrl} method="POST">
                    {Object.entries(res.params).map(([key, value]: [string, any]) => (
                        <input key={key} type="hidden" name={key} value={value} />
                    ))}
                </form>

                {/* Client-side auto-submission */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `document.getElementById('payment_form').submit();`,
                    }}
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 40%; }
                    100% { width: 0%; transform: translateX(400%); }
                }
                .font-inter { font-family: 'Inter', sans-serif; }
            `}} />
        </div>
    );
}
