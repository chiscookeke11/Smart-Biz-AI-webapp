import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInterswitchAuthHeaders } from "@/lib/interswitch";

/**
 * Verify Interswitch payment status.
 * This can be called from both GET (browser redirect) and POST (callback).
 */
async function verifyPayment(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    let invoiceId = searchParams.get("invoiceId");
    let txnRef = searchParams.get("txnref") || searchParams.get("merchantreference") || searchParams.get("transactionReference");
    let amount = searchParams.get("amount");

    if (request.method === "POST") {
        try {
            const contentType = request.headers.get("content-type");
            if (contentType?.includes("application/x-www-form-urlencoded") || contentType?.includes("multipart/form-data")) {
                const formData = await request.formData();
                
                // Prioritize form data for txnRef and amount
                txnRef = (formData.get("txnref") || formData.get("merchantreference") || formData.get("transactionReference") || txnRef) as string;
                amount = (formData.get("amount") || amount) as string;
                
                // If invoiceId is not in URL, check form data
                invoiceId = (formData.get("invoiceId") || invoiceId) as string;
            } else if (contentType?.includes("application/json")) {
                const body = await request.json();
                txnRef = body.txnref || body.merchantreference || body.transactionReference || txnRef;
                amount = body.amount || amount;
                invoiceId = body.invoiceId || invoiceId;
            }
        } catch (e) {
            console.warn("[PAYMENT] Failed to parse POST body:", e);
        }
    }

    if (!invoiceId || !txnRef) {
        console.error("[PAYMENT] Missing required parameters - InvoiceId or TxnRef");
        return NextResponse.redirect(new URL("/dashboard/invoices?error=Missing+payment+details", request.url), { status: 303 });
    }

    try {
        // Fetch invoice to get original amount and SME details
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { sme: true }
        });

        if (!invoice) {
            console.error("[PAYMENT] Invoice not found during verification:", invoiceId);
            return NextResponse.redirect(new URL("/dashboard/invoices?error=Invoice+not+found", request.url), { status: 303 });
        }

        const amountInKobo = Math.round(invoice.totalAmount * 100);
        const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE;
        const mode = process.env.INTERSWITCH_MODE;

        if (!merchantCode || !mode) {
            console.error("[PAYMENT] Missing Interswitch configuration in environment variables");
            return NextResponse.redirect(new URL(`/dashboard/invoices/${invoiceId}?error=Missing+payment+configuration`, request.url), { status: 303 });
        }

        const baseUrl = mode === "TEST" 
            ? "https://qa.interswitchng.com" 
            : "https://webpay.interswitchng.com";

        // Call Interswitch transaction verification endpoint
        const verifyUrl = `${baseUrl}/collections/api/v1/gettransaction.json?merchantcode=${merchantCode}&transactionreference=${txnRef}&amount=${amountInKobo}`;
        
        const securityHeaders = getInterswitchAuthHeaders("GET", verifyUrl);

        const response = await fetch(verifyUrl, {
            headers: {
                "Content-Type": "application/json",
                ...securityHeaders
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[PAYMENT] Verification API error:", errorText);
            return NextResponse.redirect(new URL(`/dashboard/invoices/${invoiceId}?error=Verification+failed`, request.url), { status: 303 });
        }

        const data = await response.json();

        // Interswitch status "00" or "0" means success
        if (data.ResponseCode === "00" || data.ResponseCode === "0") {
            // 3. Update invoice status to PAID
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: "PAID" },
            });

            // 3b. Reduce stock/unit for purchased products
            try {
                const items = invoice.items as any[];
                if (Array.isArray(items)) {
                    for (const item of items) {
                        if (item.productId) {
                            console.log(`[PAYMENT] Reducing stock for product ${item.productId} by ${item.quantity}`);
                            await prisma.product.update({
                                where: { id: item.productId },
                                data: {
                                    stock: {
                                        decrement: Math.max(0, item.quantity) // Ensure we don't accidentally increment
                                    }
                                }
                            });
                        }
                    }
                }
            } catch (stockError) {
                console.warn("[PAYMENT] Failed to update stock, but payment was successful:", stockError);
                // We don't fail the whole request because payment WAS successful
            }

            // 4. Record the transaction in our database
            await prisma.transaction.create({
                data: {
                    smeId: invoice.smeId,
                    invoiceId: invoice.id,
                    customerName: invoice.customerName,
                    customerEmail: invoice.customerEmail,
                    customerWhatsapp: invoice.sme.whatsapp || "",
                    totalAmount: invoice.totalAmount,
                    status: "SUCCESS",
                    paymentRef: txnRef,
                },
            });

            // Redirect to public success page for customers
            return NextResponse.redirect(new URL(`/store/${invoice.sme.slug}/success?invoiceId=${invoiceId}`, request.url), { status: 303 });
        } else {
            const errorMsg = data.ResponseDescription || "Payment was not successful";
            console.warn("[PAYMENT] Transaction failed according to Interswitch:", errorMsg);
            return NextResponse.redirect(new URL(`/store/${invoice.sme.slug}?error=${encodeURIComponent(errorMsg)}`, request.url), { status: 303 });
        }
    } catch (error: any) {
        console.error("[PAYMENT] Verification internal error:", error);
        return NextResponse.redirect(new URL(`/`, request.url), { status: 303 });
    }
}

export async function GET(request: NextRequest) {
    return verifyPayment(request);
}

export async function POST(request: NextRequest) {
    return verifyPayment(request);
}
