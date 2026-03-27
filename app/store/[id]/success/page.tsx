import { prisma } from "@/lib/prisma";
import { CheckCircle2, Download, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ invoiceId?: string }>;
}) {
    const { id: slug } = await params;
    const { invoiceId } = await searchParams;

    if (!invoiceId) return notFound();

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { sme: true }
    });

    if (!invoice || invoice.sme.slug !== slug) return notFound();

    const isPaid = invoice.status === "PAID";

    return (
        <div className="min-h-screen bg-[#F8F6F6] font-inter flex flex-col items-center justify-center p-6 py-12">
            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-[#E2E8F0] overflow-hidden">
                {/* Header Section */}
                <div className="bg-[#FFF7ED] p-10 text-center border-b border-[#FFEDD5]">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-in zoom-in duration-500">
                        <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black text-[#0F172A] tracking-tight mb-2">Payment Successful!</h1>
                    <p className="text-[#64748B] text-base font-medium">
                        Thank you for your business. Your order with <span className="text-[#EB5119] font-bold">{invoice.sme.businessName}</span> is confirmed.
                    </p>
                </div>

                {/* Order Summary Section */}
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mb-1.5">Invoice Number</p>
                            <p className="text-sm font-bold text-[#0F172A]">{invoice.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mb-1.5">Date Paid</p>
                            <p className="text-sm font-bold text-[#0F172A]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-[#E2E8F0] pt-8">
                        <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mb-4">Order Items</p>
                        <div className="space-y-4">
                            {(invoice.items as any[]).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#0F172A]">{item.name}</span>
                                        <span className="text-xs text-[#64748B]">Qty: {item.quantity}</span>
                                    </div>
                                    <span className="text-sm font-black text-[#0F172A]">₦{item.price.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Section */}
                    <div className="bg-[#0F172A] rounded-2xl p-6 flex justify-between items-center shadow-lg">
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Total Amount Paid</span>
                        <span className="text-2xl font-black text-white">₦{invoice.totalAmount.toLocaleString()}</span>
                    </div>

                    {/* Actions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <button className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[#EB5119] text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 group">
                            <Download size={18} className="transition-transform group-hover:-translate-y-1" />
                            Download PDF Invoice
                        </button>
                        <Link 
                            href={`/store/${slug}`}
                            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white border-2 border-[#E2E8F0] text-[#0F172A] font-black rounded-2xl transition-all hover:border-[#EB5119] hover:bg-[#FFF7ED] active:scale-95 group"
                        >
                            <MessageSquare size={18} />
                            Return to Chat
                            <ArrowRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-xs text-[#64748B] font-medium italic">
                            A copy of this invoice has been sent to <span className="font-bold">{invoice.customerEmail}</span> via Email and WhatsApp.
                        </p>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .font-inter { font-family: 'Inter', sans-serif; }
            `}} />
        </div>
    );
}
