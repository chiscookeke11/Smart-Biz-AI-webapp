"use client"

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, CreditCard, Download, Landmark, SendHorizonal, ShieldCheck, ShieldHalf, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/CustomButton";
import { getPaymentParams } from "@/actions/paymentActions";

interface InvoiceItem {
    description: string;
    details: string;
    quantity: number;
    rate: number;
}

interface InvoiceClientProps {
    invoice: {
        id: string;
        invoiceNumber: string;
        referenceNumber: string;
        customerName: string;
        customerEmail: string;
        items: any;
        subtotal: number;
        tax: number;
        taxRate: number;
        discount: number;
        discountRate: number;
        totalAmount: number;
        status: string;
        dueDate: any;
        createdAt: any;
        internalNotes?: string;
        sme: {
            businessName: string;
            email: string;
            phoneNumber?: string;
            address?: string;
            logoUrl?: string;
            whatsapp?: string;
        };
    };
}

export default function InvoiceClient({ invoice }: InvoiceClientProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    const [isPaying, setIsPaying] = useState(false);
    const [paymentParams, setPaymentParams] = useState<any>(null);
    const [actionUrl, setActionUrl] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    };

    const handlePayNow = async () => {
        setIsPaying(true);
        try {
            const result = await getPaymentParams(invoice.id);
            if (result.success && result.params && result.actionUrl) {
                setPaymentParams(result.params);
                setActionUrl(result.actionUrl);
            } else {
                alert(result.error || "Failed to initiate payment");
            }
        } catch (error: any) {
            console.error("Payment error:", error);
            alert("An unexpected error occurred during payment initiation");
        } finally {
            setIsPaying(false);
        }
    };

    // Trigger form submission once parameters are ready
    useEffect(() => {
        if (paymentParams && actionUrl && formRef.current) {
            formRef.current.submit();
        }
    }, [paymentParams, actionUrl]);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const success = query.get("success");
        const error = query.get("error");

        if (success) {
            alert(success);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (error) {
            alert(error);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const items = Array.isArray(invoice.items) ? invoice.items : [];

    return (
        <div className=" py-8 px-4 md:p-8 w-full  flex-col gap-8 flex items-center justify-center  " id="invoice_content">
            {/* Hidden form for Interswitch Payment */}
            {paymentParams && (
                <form ref={formRef} method="POST" action={actionUrl} className="hidden">
                    {Object.entries(paymentParams).map(([key, value]) => (
                        <input key={key} type="hidden" name={key} value={value as string} />
                    ))}
                </form>
            )}

            <div className="w-full max-w-240 flex-col gap-8 flex items-center  " >
                {/* the top section  */}
                <div className="w-full flex flex-col md:flex-row items-start gap-3 md:items-center justify-between">
                    <Link href={"/dashboard/invoices"} className="flex items-center gap-2">
                        <ArrowLeft size={15} color="#EB5119" />
                        <p className="font-medium text-sm text-[#64748B]">Back to Dashboard</p>
                    </Link>

                    <div className="flex items-center gap-3 ml-auto ">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                        >
                            <Download size={9} />
                            Download PDF
                        </button>
                        <Button
                            variant="primary"
                            className="flex items-center justify-center gap-2 text-sm! font-medium px-4! py-2! "
                        >
                            <SendHorizonal size={9} />
                            Send Reminder
                        </Button>
                        {invoice.status === "PENDING" && (
                            <Button
                                variant="primary"
                                onClick={handlePayNow}
                                disabled={isPaying}
                                className="flex items-center justify-center gap-2 text-sm! font-medium px-4! py-2! bg-[#16A34A] hover:bg-[#15803D] border-none "
                            >
                                <CreditCard size={12} />
                                {isPaying ? "Processing..." : "Pay Now"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* The invoice content */}
                <div ref={invoiceRef} className=" w-full flex bg-[#FFFFFF] h-fit rounded-[12px] border border-[#E2E8F0] shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1)] flex-col items-start">
                    {/* The letter head */}
                    <div className="w-full bg-[#F8FAFC80] py-6 px-4 md:px-8 flex items-center justify-between gap-10 relative overflow-hidden " >
                        {/* Status Badge Watermark/Overlay */}
                        <div className={`absolute top-4 right-0 px-8 py-1 transform rotate-45 translate-x-8 -translate-y-2 text-[10px] font-bold tracking-widest uppercase shadow-sm ${
                            invoice.status === "PAID"
                            ? "bg-[#16A34A] text-white"
                            : "bg-[#E2E8F0] text-[#64748B]"
                        }`}>
                            {invoice.status}
                        </div>

                        <Link href={"/"} >
                            <Image
                                src={invoice.sme.logoUrl || "/logos/smartBiz.png"}
                                alt="logo"
                                width={157}
                                height={36}
                                className=" w-30 md:w-33.5 h-auto object-center object-contain "
                            />
                        </Link>

                        <div className=" flex flex-col items-center gap-0 " >
                            <h2 className="text-[#0F172A] font-black text-[20px] md:text-[30px] tracking-tight leading-[109%] " >INVOICE</h2>
                            <h3 className="text-xs md:text-sm text-[#EB5119] font-bold " >#{invoice.invoiceNumber}</h3>
                        </div>
                    </div>

                    {/* The addresses */}
                    <div className="w-full bg-white py-6 px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-3 place-items-center justify-center justify-items-center "  >
                        {/* Sender address */}
                        <div className=" w-full flex flex-col items-start gap-4  " >
                            <h5 className="text-[#EB5119] text-xs font-bold flex items-center gap-2  " > < Upload size={9.3} /> SENDER</h5>
                            <div className="w-full flex items-start flex-col gap-[3.13px] "  >
                                <h4 className="text-[#0F172A] font-bold text-lg " >{invoice.sme.businessName}</h4>
                                <p className="w-full max-w-51.5 text-[#475569] text-sm font-normal whitespace-pre-line " >
                                    {invoice.sme.address || "Address not provided"}
                                    <span className="text-[#0F172A] block mt-1" > {invoice.sme.email}</span>
                                </p>
                            </div>
                        </div>

                        {/* Recipient's address  */}
                        <div className=" w-full flex flex-col items-end md:items-start gap-4  " >
                            <h5 className="text-[#94A3B8] text-xs font-bold flex items-center gap-2  " > < Download size={9.3} /> RECIPIENT</h5>
                            <div className="w-full flex items-end md:items-start flex-col gap-[3.13px] "  >
                                <h4 className="text-[#0F172A] font-bold text-lg " >{invoice.customerName}</h4>
                                <p className="w-full max-w-51.5 text-[#475569] text-sm font-normal " >
                                    <span className="text-[#0F172A] " > {invoice.customerEmail}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction timeline */}
                    <div className=" w-full grid grid-cols-2 lg:grid-cols-4 gap-6 place-items-center justify-center justify-items-center py-6 px-8 bg-[#F8FAFC] border border-[#F1F5F9] "  >
                        <div className="w-full flex flex-col gap-1 " >
                            <h5 className="text-[#94A3B8] text-[10px] font-bold  " >ISSUE DATE</h5>
                            <h4 className="text-[#0F172A] text-sm font-semibold " >{new Date(invoice.createdAt).toLocaleDateString()}</h4>
                        </div>
                        <div className="w-full flex flex-col gap-1 " >
                            <h5 className="text-[#94A3B8] text-[10px] font-bold  " >DUE DATE</h5>
                            <h4 className="text-[#0F172A] text-sm font-semibold " >{new Date(invoice.dueDate).toLocaleDateString()}</h4>
                        </div>
                        <div className="w-full flex flex-col gap-1 " >
                            <h5 className="text-[#94A3B8] text-[10px] font-bold  " >REFERENCE</h5>
                            <h4 className="text-[#0F172A] text-sm font-semibold " >{invoice.referenceNumber}</h4>
                        </div>
                        <div className="w-full flex flex-col gap-1 " >
                            <h5 className="text-[#94A3B8] text-[10px] font-bold  " >CURRENCY</h5>
                            <h4 className="text-[#0F172A] text-sm font-semibold " >Naira (₦)</h4>
                        </div>
                    </div>

                    {/* Invoice items table */}
                    <div className=" w-full py-2 md:py-6 px-8  flex items-center justify-center scale-[75%] md:scale-[100%] " >
                        <table className="w-full text-left border-collapse overflow-hidden rounded-[12px] border border-[#E2E8F0] ">
                            <thead>
                                <tr className="bg-[#0F172A] border border-[#E2E8F0]  ">
                                    <th className="px-6 py-4 text-xs font-bold text-[#FFFFFF] uppercase tracking-[1.2px]">DESCRIPTION</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#FFFFFF] uppercase tracking-[1.2px]">QTY</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#FFFFFF] uppercase tracking-[1.2px]">RATE</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#FFFFFF] uppercase tracking-[1.2px]">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {items.map((item: any, idx: number) => {
                                    const description = item.description || item.name || "Item";
                                    const rate = item.rate || item.price || 0;
                                    const quantity = item.quantity || 0;
                                    const amount = quantity * rate;

                                    return (
                                        <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors  ">
                                            <td className="px-6 py-4 text-sm font-semibold text-[#0F172A]">
                                                <div className="flex flex-col">
                                                    <span>{description}</span>
                                                    <span className="text-xs text-gray-500 font-normal">{item.details || ""}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-[#0F172A]">{quantity}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-[#0F172A]">₦{rate.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-[#0F172A]">₦{amount.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* totals and notes */}
                    <div className="w-full py-6 px-4 md:px-8 flex flex-col md:flex-row items-stretch gap-8 justify-center  " >
                        <div className="w-full md:basis-[65%] bg-[#EB51190D] border border-[#EB51191A] rounded-[12px] p-4 flex flex-col items-start gap-4 " >
                            <h4 className="text-[#EB5119] flex items-center text-xs gap-2 font-bold  " ><Landmark size={11.6} /> <span>NOTES & TERMS</span> </h4>
                            <p className="text-[#475569] text-xs font-medium whitespace-pre-line" >
                                {invoice.internalNotes || "No additional notes provided."}
                            </p>
                        </div>

                        <div className="w-full h-full md:basis-[35%] flex flex-col items-center justify-start gap-3 " >
                            <div className="w-full flex items-center justify-between gap-5 px-2  " >
                                <h5 className="text-[#64748B] font-normal text-sm "  >Subtotal</h5>
                                <h4 className="text-base text-[#0F172A] font-semibold " >₦{invoice.subtotal.toLocaleString()}</h4>
                            </div>
                            <div className="w-full flex items-center justify-between gap-5 px-2  " >
                                <h5 className="text-[#64748B] font-normal text-sm "  >Tax ({invoice.taxRate}%)</h5>
                                <h4 className="text-base text-[#0F172A] font-semibold " >₦{invoice.tax.toLocaleString()}</h4>
                            </div>
                            <div className="w-full flex items-center justify-between gap-5 px-2  " >
                                <h5 className="text-[#64748B] font-normal text-sm "  >Discount ({invoice.discountRate}%)</h5>
                                <h4 className="text-base text-[#16A34A] font-semibold " >-₦{invoice.discount.toLocaleString()}</h4>
                            </div>
                            <hr className="w-full border-t border-[#E2E8F0]  " />
                            <div className=" w-full rounded-[8px] bg-[#0F172A] text-white flex items-center justify-between py-2 px-4 "  >
                                <span className="text-xs font-medium  " >TOTAL AMOUNT</span>
                                <span className="text-lg font-semibold " >₦{invoice.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* footer */}
                    <div className="w-full bg-[#F8FAFC4D] py-6 px-8 flex flex-col items-center justify-center gap-4 border-t border-[#F1F5F9] "  >
                        <div className="w-full flex items-center justify-center gap-6  text-[#94A3B8] " >
                            <ShieldCheck size={24} />
                            <CreditCard size={24} />
                            <ShieldHalf size={24} />
                        </div>
                        <p className="text-[#64748B] font-normal max-w-141.75 text-center text-sm ">
                            Thank you for Choosing {invoice.sme.businessName} via SmartBiz AI. Please remit payment within the agreed timeframe to avoid service interruption.
                        </p>
                        <small className="w-full max-w-[583px] flex items-center justify-center   "  >
                            <ul className="w-full flex flex-wrap text-center items-center justify-center gap-3 text-[10px] text-[#94A3B8] font-normal  "  >
                                <li className="flex items-center gap-1 "  >2026 {(invoice.sme.businessName || "SMART BIZ AI").toUpperCase()}</li>
                                <li className="flex items-center gap-1 " ><span className=" block bg-[#94A3B8] size-0.5 rounded-full " /> ALL RIGHTS RESERVED</li>
                                <li className="flex items-center gap-1 " ><span className=" block bg-[#94A3B8] size-0.5 rounded-full " /> GENERATED BY SMARTBIZ AI BILLING CORE V4.2</li>
                            </ul>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}
