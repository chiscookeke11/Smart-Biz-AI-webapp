"use client"

import { BadgeCheck, CircleAlert, LayoutList, Loader2, Plus, Search, SendHorizonal, Sparkles, StickyNote, User, X } from "lucide-react";
import { Button } from "../ui/CustomButton";
import React, { SetStateAction, useEffect, useMemo, useState } from "react";
import CreateInvoiceTable, { InvoiceItem } from "./CreateInvoiceTable";
import { createInvoice } from "@/actions/invoiceActions";
import { getProducts } from "@/actions/productActions";
import { useRouter } from "next/navigation";

interface CreateInvoiceModalProps {
    setOpenModal: React.Dispatch<SetStateAction<boolean>>
}

export default function CreateInvoiceModal({ setOpenModal }: CreateInvoiceModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [addNewCustomer, setAddNewCustomer] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [internalNotes, setInternalNotes] = useState("");
    const [taxRate, setTaxRate] = useState(15);
    const [discountRate, setDiscountRate] = useState(0);
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: "", details: "", quantity: 1, rate: 0 }
    ]);

    // Auto-generate IDs on mount
    useEffect(() => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setInvoiceNumber(`INV-2026-${timestamp}`);
        setReferenceNumber(`PO-${random}-${timestamp}`);

        // Fetch products
        const fetchProducts = async () => {
            const result = await getProducts();
            if (result.success && result.products) {
                setProducts(result.products);
            }
        };
        fetchProducts();
    }, []);

    // Calculations
    const subtotal = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    }, [items]);

    const tax = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
    const discount = useMemo(() => subtotal * (discountRate / 100), [subtotal, discountRate]);
    const totalAmount = useMemo(() => subtotal + tax - discount, [subtotal, tax, discount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !customerEmail || items.length === 0) {
            alert("Please fill in all required fields");
            return;
        }

        // Ensure all items are linked to valid products
        const hasInvalidItems = items.some(item => !item.productId);
        if (hasInvalidItems) {
            alert("All items must be selected from your valid products. Please use the product search in the table.");
            return;
        }

        setLoading(true);
        try {
            const result = await createInvoice({
                customerName,
                customerEmail,
                invoiceNumber,
                referenceNumber,
                items,
                subtotal,
                tax,
                taxRate,
                discount,
                discountRate,
                totalAmount,
                dueDate: new Date(dueDate),
                internalNotes
            });

            if (result.success) {
                setOpenModal(false);
                router.refresh();
            } else {
                alert("Failed to create invoice: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while creating the invoice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            onClick={() => setOpenModal(false)}
            className="w-full fixed inset-0 h-full bg-[#0F172A66] px-4 py-8 flex items-start justify-center z-50 overflow-y-auto"  
        >

            <form 
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit} 
                className="w-full max-w-4xl h-fit flex flex-col bg-[#FFFFFF] rounded-[12px] border border-[#E2E8F0] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden my-8" 
            >

                <div className="w-full flex items-center justify-between gap-3 py-5 px-8 border-b border-[#F1F5F9]  " >
                    <div className="flex flex-col items-start gap-1 " >
                        <h2 className="text-[#0F172A] text-xl font-bold " >Create New Invoice</h2>
                        <p className="text-[#64748B] text-sm font-normal " >Generate a professional invoice for your SME client.</p>
                    </div>

                    <button
                        onClick={() => setOpenModal(false)}
                        className=" cursor-pointer text-[#94A3B8] hover:text-[#EB5119] transition-all duration-200 ease-in-out "
                        type="button" >
                        <X size={20} />
                    </button>
                </div>

                <div className="w-full p-8 flex flex-col items-start gap-8 bg-white " >

                    {/* customer information  */}
                    <div className="w-full flex flex-col items-start gap-4"  >
                        <div className="flex items-center gap-1 " >
                            <User size={10} color="#EB5119" />
                            <h3 className="text-[#94A3B8] font-semibold text-sm tracking-wide uppercase " >Customer Information</h3>
                        </div>

                        <div className="w-full flex flex-col gap-4">
                            <div className="w-full flex items-end gap-6 justify-between "  >
                                <div className="w-full basis-1/2 flex flex-col items-start gap-[8.5px]">
                                    <h6 className="text-[#334155] text-sm font-medium">Customer Name</h6>
                                    <div className="bg-[#F8FAFC] w-full rounded-[8px] border border-[#F8FAFC] flex items-center gap-2 px-4 text-[#6B7280] text-sm ">
                                        <User size={20} />
                                        <input
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Okeke and Sons Enterprise"
                                            className="w-full py-2.5 outline-0 border-0 bg-transparent" />
                                    </div>
                                </div>

                                <div className="w-full basis-1/2 flex flex-col items-start gap-[8.5px]">
                                    <h6 className="text-[#334155] text-sm font-medium">Customer Email</h6>
                                    <div className="bg-[#F8FAFC] w-full rounded-[8px] border border-[#F8FAFC] flex items-center gap-2 px-4 text-[#6B7280] text-sm ">
                                        <Search size={20} />
                                        <input
                                            required
                                            type="email"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="customer@email.com"
                                            className="w-full py-2.5 outline-0 border-0 bg-transparent" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details  */}
                    <div className="w-full flex flex-col items-start gap-4"  >
                        <div className="flex items-center gap-1 " >
                            <StickyNote size={10} color="#EB5119" />
                            <h3 className="text-[#94A3B8] font-semibold text-sm tracking-wide uppercase " >Invoice Details</h3>
                        </div>

                        <div className="w-full flex items-center gap-6 justify-between "  >
                            {/* Invoice ID */}
                            <div className="w-full basis-1/2 flex flex-col items-start gap-[8.5px]  " >
                                <h6 className="text-[#334155] text-sm font-medium " >Invoice ID</h6>
                                <div className="bg-[#F8FAFC] w-full rounded-[8px] border border-[#F8FAFC] flex items-center gap-2  text-[#64748B] text-sm   " >
                                    <input
                                        readOnly
                                        type="text"
                                        value={invoiceNumber}
                                        className="w-full py-2.5 px-4 bg-transparent outline-none" />
                                </div>
                            </div>

                            {/* Reference Number  */}
                            <div className="w-full basis-1/2 flex flex-col items-start gap-[8.5px]  " >
                                <h6 className="text-[#334155] text-sm font-medium " >Reference Number</h6>
                                <div className="bg-[#FFFFFF] w-full rounded-[8px] border border-[#E2E8F0] flex items-center gap-2  text-[#6B7280]  text-sm  " >
                                    <input
                                        readOnly
                                        type="text"
                                        value={referenceNumber}
                                        className="w-full py-2.5 px-4 outline-none" />
                                </div>
                            </div>

                            {/* Due date  */}
                            <div className="w-full basis-1/2 flex flex-col items-start gap-[8.5px]  " >
                                <h6 className="text-[#334155] text-sm font-medium " >Due Date</h6>
                                <div className="bg-[#ffffff] w-full rounded-[8px] border border-[#E2E8F0] flex items-center gap-2 text-[#6B7280]  text-sm     " >
                                    <input
                                        required
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full py-2.5 px-4 outline-none " />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* items and services  */}
                    <div className="w-full flex flex-col items-start gap-4"  >
                        <div className="flex items-center gap-1 " >
                            <LayoutList size={10} color="#EB5119" />
                            <h3 className="text-[#94A3B8] font-semibold text-sm tracking-wide uppercase " >Items & Services</h3>
                        </div>

                        <CreateInvoiceTable items={items} setItems={setItems} products={products} />

                        {/* summary and suggestions  */}
                        <div className=" w-full grid grid-cols-3 place-items-center justify-items-center justify-center gap-4 " >
                            {/* SmartBiz AI Suggestion  */}
                            <div className="w-full  bg-[#EB51190D] border border-[#EB51191A] rounded-[12px] p-4 flex  items-start gap-3 col-span-2 " >
                                <Sparkles size={22} color="#EB5119" />
                                <div className=" w-fit gap-1 flex flex-col items-start"  >
                                    <h4 className="text-[#EB5119]  text-sm  font-bold  " > SmartBiz AI Suggestion </h4>
                                    <p className="text-[#475569] text-xs font-normal " >Based on this client's history, we recommend applying a 10% volume
                                        discount for recurring enterprise services.</p>
                                    <button type="button" className="text-[#EB5119] font-bold text-xs uppercase " >Apply Suggestion</button>
                                </div>
                            </div>

                            {/* Total amount  */}
                            <div className="w-full h-full row-span-2  flex flex-col items-center justify-start gap-3 px-1 " >
                                <div className="w-full flex items-center justify-between gap-5   " >
                                    <h5 className="text-[#64748B] font-normal text-sm "  >Subtotal</h5>
                                    <h4 className="text-[#64748B] font-normal text-sm " >₦{subtotal.toLocaleString()}</h4>
                                </div>

                                <div className="w-full flex items-center justify-between gap-2   " >
                                    <div className="flex items-center gap-1">
                                        <h5 className="text-[#64748B] font-normal text-sm whitespace-nowrap"  >Tax (%)</h5>
                                        <input
                                            type="number"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(Number(e.target.value))}
                                            className="w-12 border rounded px-1 text-xs text-[#0F172A]"
                                        />
                                    </div>
                                    <h4 className="text-[#64748B] font-normal text-sm " >₦{tax.toLocaleString()}</h4>
                                </div>

                                <div className="w-full flex items-center justify-between gap-2  " >
                                    <div className="flex items-center gap-1">
                                        <h5 className="text-[#64748B] font-normal text-sm whitespace-nowrap"  >Discount (%)</h5>
                                        <input
                                            type="number"
                                            value={discountRate}
                                            onChange={(e) => setDiscountRate(Number(e.target.value))}
                                            className="w-12 border rounded px-1 text-xs text-[#0F172A]"
                                        />
                                    </div>
                                    <h4 className="text-[#16A34A] font-normal text-sm " >-₦{discount.toLocaleString()}</h4>
                                </div>

                                <hr className="w-full border-t border-[#E2E8F0]  " />

                                <div className=" w-full rounded-[8px] flex items-center justify-between py-2 "  >
                                    <span className="text-sm font-bold text-[#0F172A]  " >TOTAL AMOUNT</span>
                                    <span className="text-lg font-semibold text-[#EB5119] " >₦{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <textarea
                                placeholder="Internal notes or terms & conditions"
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                rows={4}
                                className=" w-full col-span-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] py-3 px-4 text-sm text-[#6B7280] font-normal outline-none " />
                        </div>
                    </div>
                </div>

                <div className="bg-[#F8FAFC] py-4 px-8 flex items-center justify-between gap-4 "  >
                    <p className="text-[#94A3B8] text-xs font-normal flex items-center gap-2 " >
                        <CircleAlert size={11.67} />
                        <span>Drafts are auto-saved every 30s</span>
                    </p>

                    <div className="flex items-center gap-3 ml-auto ">
                        <button
                            disabled={loading}
                            type="button"
                            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                            Save as Draft
                        </button>
                        <Button
                            disabled={loading}
                            variant="primary"
                            type="submit"
                            className="flex items-center justify-center gap-2 text-sm! font-medium px-4! py-2! disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={9} />}
                            {loading ? "Sending..." : "Send Invoice"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}