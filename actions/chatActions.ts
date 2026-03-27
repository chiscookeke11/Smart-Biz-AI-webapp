"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getDashboardStats, getRevenueGraphData, getRecentTransactions } from "./dashboardActions";

interface HistoryEntry {
    role: "user" | "assistant";
    content: string;
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Build a system instruction for the Dashboard AI (SME Owner).
 * Focuses on business management and analytics.
 */
function buildSystemInstruction(sme: {
    businessName: string;
    description: string | null;
    email: string | null;
    whatsapp: string | null;
    address: string | null;
    aiTone: string;
}): string {
    return [
        `You are the Business Manager for "${sme.businessName}".`,
        sme.description ? `Business description: ${sme.description}` : "",
        sme.address ? `Business address: ${sme.address}` : "",
        "You help the business owner manage their store, products, and analyze business performance.",
        "Be concise, professional, and helpful. Use plain language.",
        `Respond in "${sme.aiTone}" tone. Short responses are preferred.`,
        "Use Naira (₦) as the default currency for all prices and transactions unless stated otherwise.",
        "You have tools for: ",
        "  - Managing products (create, update, delete, list)",
        "  - viewing business statistics (revenue, trends, recent transactions)",
        "Use these tools whenever the owner asks for data or wants to make changes.",
    ]
        .filter(Boolean)
        .join("\n");
}

export async function getChatHistory() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { success: false, history: [] as HistoryEntry[] };
    }

    const chatSession = await prisma.chatSession.findUnique({
        where: { customerEmail: session.user.email },
    });

    return { 
        success: true, 
        history: (chatSession?.messages as unknown as HistoryEntry[]) || [] 
    };
}

export async function sendChatMessage(
    message: string
): Promise<{ success: boolean; message: string }> {
    if (!ANTHROPIC_API_KEY) {
        return { success: false, message: "AI service is not configured" };
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { success: false, message: "Unauthorized" };
    }

    const sme = await prisma.sme.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    if (!sme) {
        return { success: false, message: "Business profile not found" };
    }

    try {
        const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
        let chatSession = await prisma.chatSession.findUnique({
            where: { customerEmail: session.user.email }
        });

        let currentHistory: HistoryEntry[] = chatSession 
            ? (chatSession.messages as unknown as HistoryEntry[]) 
            : [];

        const messages: any[] = currentHistory.map((entry) => ({
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
                description: "List all products in the store.",
                input_schema: { type: "object", properties: {} }
            },
            {
                name: "create_product",
                description: "Create a new product in the store.",
                input_schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        price: { type: "number" },
                        category: { type: "string" },
                        stock: { type: "number" },
                        description: { type: "string" },
                        status: { type: "string", enum: ["Active", "Draft", "Archived"] }
                    },
                    required: ["name", "price", "category", "stock"]
                }
            },
            {
                name: "update_product",
                description: "Update an existing product's details.",
                input_schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        price: { type: "number" },
                        stock: { type: "number" },
                        status: { type: "string" }
                    },
                    required: ["id"]
                }
            },
            {
                name: "delete_product",
                description: "Delete a product from the store.",
                input_schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" }
                    },
                    required: ["id"]
                }
            },
            {
                name: "get_business_stats",
                description: "Get core business statistics (revenue, pending invoices).",
                input_schema: { type: "object", properties: {} }
            },
            {
                name: "get_revenue_trends",
                description: "Get monthly revenue data for trends.",
                input_schema: { type: "object", properties: {} }
            },
            {
                name: "get_recent_transactions",
                description: "List the most recent business transactions.",
                input_schema: { 
                    type: "object", 
                    properties: { 
                        limit: { type: "number", default: 5 } 
                    } 
                }
            }
        ];

        let response = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 1024,
            temperature: 0.7,
            system: buildSystemInstruction(sme),
            messages: messages,
            tools: tools,
        });

        while (response.stop_reason === "tool_use") {
            const toolResults: any[] = [];
            
            for (const contentBlock of response.content) {
                if (contentBlock.type === "tool_use") {
                    let result: any = null;
                    const input = contentBlock.input as any;

                    try {
                        if (contentBlock.name === "get_products") {
                            result = await prisma.product.findMany({
                                where: { smeId: sme.id },
                                select: { id: true, name: true, price: true, category: true, stock: true, status: true }
                            });
                        } else if (contentBlock.name === "create_product") {
                            result = await prisma.product.create({
                                data: { ...input, smeId: sme.id }
                            });
                        } else if (contentBlock.name === "update_product") {
                            const { id, ...updateData } = input;
                            result = await prisma.product.update({
                                where: { id, smeId: sme.id },
                                data: updateData
                            });
                        } else if (contentBlock.name === "delete_product") {
                            result = await prisma.product.delete({
                                where: { id: input.id, smeId: sme.id }
                            });
                        } else if (contentBlock.name === "get_business_stats") {
                            result = await getDashboardStats();
                        } else if (contentBlock.name === "get_revenue_trends") {
                            result = await getRevenueGraphData();
                        } else if (contentBlock.name === "get_recent_transactions") {
                            result = await getRecentTransactions(input.limit || 5);
                        }
                    } catch (e: any) {
                        result = { error: e.message };
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
                system: buildSystemInstruction(sme),
                messages: messages,
                tools: tools,
            });
        }

        const text = response.content.find(block => block.type === "text")?.type === 'text' 
            ? (response.content.find(block => block.type === "text") as any).text 
            : "Action completed.";

        const finalHistory = [...currentHistory, { role: "user" as const, content: message }, { role: "assistant" as const, content: text }];
        const limitedHistory = finalHistory.length > 20 ? finalHistory.slice(-20) : finalHistory;

        await prisma.chatSession.upsert({
            where: { customerEmail: session.user.email },
            update: { messages: limitedHistory as any },
            create: {
                smeId: sme.id,
                customerEmail: session.user.email,
                messages: limitedHistory as any
            }
        });

        return { success: true, message: text };
    } catch (error: any) {
        console.error("API error:", error);
        return { success: false, message: error.message || "Failed to get a response." };
    }
}
