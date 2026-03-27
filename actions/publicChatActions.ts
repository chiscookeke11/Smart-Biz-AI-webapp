"use server";

import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { createPublicInvoice } from "./publicInvoiceActions";

interface HistoryEntry {
    role: "user" | "assistant";
    content: string;
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Build a system instruction for the Storefront AI (Sales Assistant).
 * Focuses on product discovery and sales.
 */
function buildPublicSystemInstruction(sme: any): string {
    return [
        `You are the AI Sales Assistant for "${sme.businessName}".`,
        sme.description ? `Business description: ${sme.description}` : "",
        "Your goal is to help customers find products they love and help them place orders. Short responses are preferred.",
        "Be polite, professional, and persuasive but not pushy. Use plain language.",
        `Respond in "${sme.aiTone}" tone.`,
        "Use Naira (₦) as the default currency for all prices and transactions unless stated otherwise.",
        "You have tools for:",
        "  - Listing all available products (`get_products`)",
        "  - Searching for specific items based on keywords (`search_products`)",
        "  - Generating a real payment invoice for customers (`create_invoice_request`)",
        "\n--- SALES PROCESS ---",
        "1. Help the customer find what they are looking for using the search or list tools.",
        "2. Once they decide on items, YOU MUST ask for their Full Name and Email Address if you don't have them yet.",
        "3. After collecting their details, use the `create_invoice_request` tool. This will generate a real invoice in our system.",
        "4. CRITICAL: After the tool returns a `paymentUrl`, you MUST provide this URL to the customer as a clear 'Pay Now' link or button. You should also provide a summary of the order.",
        "5. Format your final response with the order summary and the payment link. Use a format like: [Pay ₦X.XX Now](URL)",
    ]
    .filter(Boolean)
    .join("\n");
}

export async function sendPublicChatMessage(
    slug: string,
    message: string,
    history: HistoryEntry[]
): Promise<{ success: boolean; message: string }> {
    if (!ANTHROPIC_API_KEY) {
        return { success: false, message: "AI service is not configured" };
    }

    try {
        const sme = await prisma.sme.findUnique({
            where: { slug }
        });

        if (!sme) {
            return { success: false, message: "Business not found" };
        }

        const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
        
        const messages: any[] = history.map((entry) => ({
            role: entry.role,
            content: entry.content,
        }));

        messages.push({
            role: "user",
            content: message,
        });

        const tools: Anthropic.Tool[] = [
            {
                name: "get_products",
                description: "List all active products in the store.",
                input_schema: { type: "object", properties: {} }
            },
            {
                name: "search_products",
                description: "Search for products by name or description.",
                input_schema: {
                    type: "object",
                    properties: {
                        query: { type: "string" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "create_invoice_request",
                description: "Record a customer's intent to purchase specific items. Requires name, email, and items.",
                input_schema: {
                    type: "object",
                    properties: {
                        customerName: { type: "string" },
                        customerEmail: { type: "string" },
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    description: { type: "string", description: "The name or brief description of the product" },
                                    details: { type: "string", description: "Additional details like size, color, or category" },
                                    quantity: { type: "number" },
                                    rate: { type: "number", description: "The unit price of the product" }
                                },
                                required: ["description", "quantity", "rate"]
                            }
                        }
                    },
                    required: ["customerName", "customerEmail", "items"]
                }
            }
        ];

        let response = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 1024,
            temperature: 0.7,
            system: buildPublicSystemInstruction(sme),
            messages: messages,
            tools: tools,
        });

        while (response.stop_reason === "tool_use") {
            const toolResults: any[] = [];
            
            for (const contentBlock of response.content) {
                if (contentBlock.type === "tool_use") {
                    let result: any = null;
                    const input = contentBlock.input as any;

                    if (contentBlock.name === "get_products") {
                        result = await prisma.product.findMany({
                            where: { smeId: sme.id, status: "Active" },
                            select: { name: true, price: true, category: true, description: true }
                        });
                    } else if (contentBlock.name === "search_products") {
                        result = await prisma.product.findMany({
                            where: {
                                smeId: sme.id,
                                status: "Active",
                                OR: [
                                    { name: { contains: input.query, mode: "insensitive" } },
                                    { description: { contains: input.query, mode: "insensitive" } }
                                ]
                            },
                            select: { name: true, price: true, category: true, description: true }
                        });
                    } else if (contentBlock.name === "create_invoice_request") {
                        const invoiceResult = await createPublicInvoice(
                            slug,
                            input.customerName,
                            input.customerEmail,
                            input.items
                        );
                        
                        if (invoiceResult.success) {
                            const appUrl = process.env.NEXT_PUBLIC_HOME_URL;
                            result = { 
                                success: true, 
                                invoiceId: invoiceResult.invoiceId,
                                paymentUrl: `${appUrl}/pay/${invoiceResult.invoiceId}`,
                                message: "Invoice generated successfully. Please share the payment link with the user." 
                            };
                        } else {
                            result = { success: false, message: invoiceResult.error || "Failed to generate invoice" };
                        }
                    }

                    toolResults.push({
                        type: "tool_result",
                        tool_use_id: contentBlock.id,
                        content: JSON.stringify(result)
                    });
                }
            }

            messages.push({ role: "assistant", content: response.content });
            messages.push({ role: "user", content: toolResults });

            response = await anthropic.messages.create({
                model: "claude-haiku-4-5",
                max_tokens: 1024,
                temperature: 0.7,
                system: buildPublicSystemInstruction(sme),
                messages: messages,
                tools: tools,
            });
        }

        const text = response.content.find(block => block.type === "text")?.type === 'text' 
            ? (response.content.find(block => block.type === "text") as any).text 
            : "";

        return { success: true, message: text };
    } catch (error: any) {
        console.error("[sendPublicChatMessage] Error:", error);
        return { success: false, message: "Service temporarily unavailable" };
    }
}
