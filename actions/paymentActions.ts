"use server";

import { getInvoiceById } from "./invoiceActions";

/**
 * Parameters required for Interswitch Payment
 */
export async function getPaymentParams(invoiceId: string) {
    try {
        const result = await getInvoiceById(invoiceId);
        if (!result.success || !result.invoice) {
            return { success: false, error: result.error || "Invoice not found" };
        }

        const invoice = result.invoice;

        // Interswitch expects amount in Kobo (e.g. 10000 for 100.00 NGN)
        const amountInKobo = Math.round(invoice.totalAmount * 100);

        const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE;
        const payItemId = process.env.INTERSWITCH_PAYABLE_CODE;
        const appUrl = process.env.NEXT_PUBLIC_HOME_URL;
        const mode = process.env.INTERSWITCH_MODE;

        if (!merchantCode || !payItemId || !appUrl || !mode) {
            return { success: false, error: "Missing Interswitch configuration" };
        }
        const actionUrl = mode === "TEST"
            ? "https://newwebpay.qa.interswitchng.com/collections/w/pay"
            : "https://newwebpay.interswitchng.com/collections/w/pay";

        // Generate a unique transaction reference
        const txnRef = `SB-${invoice.id.split("-")[0]}-${Date.now()}`;

        return {
            success: true,
            params: {
                merchant_code: merchantCode,
                pay_item_id: payItemId,
                site_redirect_url: `${appUrl}/api/payment/verify?invoiceId=${invoice.id}`,
                txn_ref: txnRef,
                amount: amountInKobo.toString(),
                currency: "566", // NGN
                cust_email: invoice.customerEmail,
                cust_id: invoice.customerEmail,
            },
            actionUrl
        };
    } catch (error: any) {
        console.error("[PAYMENT] Unexpected error in getPaymentParams:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Public version that doesn't require a logged-in SME session.
 * Used for storefront customers.
 */
export async function getPublicPaymentParams(invoiceId: string) {
    try {
        const { prisma } = await import("@/lib/prisma");
        
        // Fetch invoice with SME details directly
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { sme: true }
        });

        if (!invoice) {
            return { success: false, error: "Invoice not found" };
        }

        // Interswitch expects amount in Kobo
        const amountInKobo = Math.round(invoice.totalAmount * 100);

        const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE;
        const payItemId = process.env.INTERSWITCH_PAYABLE_CODE;
        const appUrl = process.env.NEXT_PUBLIC_HOME_URL;
        const mode = process.env.INTERSWITCH_MODE;

        if (!merchantCode || !payItemId || !appUrl || !mode) {
            return { success: false, error: "Missing Interswitch configuration" };
        }

        const actionUrl = mode === "TEST"
            ? "https://newwebpay.qa.interswitchng.com/collections/w/pay"
            : "https://newwebpay.interswitchng.com/collections/w/pay";

        const txnRef = `SB-${invoice.id.split("-")[0]}-${Date.now()}`;

        return {
            success: true,
            params: {
                merchant_code: merchantCode,
                pay_item_id: payItemId,
                site_redirect_url: `${appUrl}/api/payment/verify?invoiceId=${invoice.id}`,
                txn_ref: txnRef,
                amount: amountInKobo.toString(),
                currency: "566",
                cust_email: invoice.customerEmail,
                cust_id: invoice.customerEmail,
            },
            actionUrl
        };
    } catch (error: any) {
        console.error("[PAYMENT] Unexpected error in getPublicPaymentParams:", error);
        return { success: false, error: error.message };
    }
}
