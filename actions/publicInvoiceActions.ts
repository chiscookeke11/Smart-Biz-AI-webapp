"use server";

import { prisma } from "@/lib/prisma";

export async function createPublicInvoice(
    slug: string,
    customerName: string,
    customerEmail: string,
    items: any[]
) {
    try {
        const sme = await prisma.sme.findUnique({
            where: { slug }
        });

        if (!sme) {
            return { success: false, error: "Business not found" };
        }

        // Calculate totals
        const subtotal = items.reduce((acc, item) => acc + ((item.rate || item.price || 0) * (item.quantity || 0)), 0);
        const totalAmount = subtotal; // Simplified for MVP (no tax/discount)

        // Generate unique numbers
        const timestamp = Date.now();
        const invoiceNumber = `INV-${timestamp}`;
        const referenceNumber = `REF-${timestamp}`;

        // Create Invoice
        const invoice = await prisma.invoice.create({
            data: {
                smeId: sme.id,
                customerName,
                customerEmail,
                invoiceNumber,
                referenceNumber,
                items: items as any,
                subtotal,
                totalAmount,
                tax: 0,
                discount: 0,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: "PENDING",
            }
        });

        // Create initial Transaction record
        await prisma.transaction.create({
            data: {
                smeId: sme.id,
                invoiceId: invoice.id,
                customerName,
                customerEmail,
                customerWhatsapp: "", // Collect if needed
                items: items as any,
                totalAmount,
                status: "PENDING",
                paymentRef: referenceNumber,
            }
        });

        return { success: true, invoiceId: invoice.id };
    } catch (error: any) {
        console.error("[createPublicInvoice] Error:", error);
        return { success: false, error: "Failed to create invoice" };
    }
}
