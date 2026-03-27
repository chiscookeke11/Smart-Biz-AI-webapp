"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns";
import { cache } from "react";

/**
 * Get the current SME for the logged-in user.
 */
export const getSme = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const sme = await prisma.sme.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    if (!sme) {
        throw new Error("SME not found. Please complete onboarding.");
    }

    return sme;
});

/**
 * Fetch dashboard statistics.
 */
export async function getDashboardStats(startDate?: Date, endDate?: Date) {
    try {
        const sme = await getSme();

        // Total Revenue (all time successful transactions)
        const totalRevenueResult = await prisma.transaction.aggregate({
            where: {
                smeId: sme.id,
                status: { in: ["PAID", "SUCCESS"] },
            },
            _sum: {
                totalAmount: true,
            },
        });

        const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

        // Payments Received (within the range, or this month if no range)
        const rangeStart = startDate || startOfMonth(new Date());
        const rangeEnd = endDate || endOfMonth(new Date());

        const paymentsReceivedResult = await prisma.transaction.aggregate({
            where: {
                smeId: sme.id,
                status: { in: ["PAID", "SUCCESS"] },
                ...(startDate || endDate ? {
                    createdAt: {
                        ...(startDate ? { gte: startDate } : {}),
                        ...(endDate ? { lte: endDate } : {}),
                    }
                } : {}),
            },
            _sum: {
                totalAmount: true,
            },
        });

        const paymentsReceived = paymentsReceivedResult._sum.totalAmount || 0;

        // Pending Invoices count
        const pendingInvoicesCount = await prisma.invoice.count({
            where: {
                smeId: sme.id,
                status: "PENDING",
            },
        });


        const prevRangeStart = subMonths(rangeStart, 1);
        const prevRangeEnd = subMonths(rangeEnd, 1);

        const prevPaymentsResult = await prisma.transaction.aggregate({
            where: {
                smeId: sme.id,
                status: { in: ["PAID", "SUCCESS"] },
                createdAt: {
                    gte: prevRangeStart,
                    lte: prevRangeEnd,
                },
            },
            _sum: {
                totalAmount: true,
            },
        });

        const prevPayments = prevPaymentsResult._sum.totalAmount || 0;
        const change = prevPayments === 0 ? 100 : ((paymentsReceived - prevPayments) / prevPayments) * 100;

        return {
            success: true,
            stats: {
                totalRevenue,
                paymentsReceived,
                pendingInvoices: pendingInvoicesCount,
                revenueChange: change.toFixed(1) + "%",
                revenueTrend: change >= 0 ? "up" : "down",
            },
        };
    } catch (error: any) {
        console.error("[getDashboardStats] Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch revenue over time for the graph.
 */
export async function getRevenueGraphData(startDate?: Date, endDate?: Date) {
    try {
        const sme = await getSme();

        // Default to last 6 months if no range provided
        const rangeStart = startDate || startOfMonth(subMonths(new Date(), 5));
        const rangeEnd = endDate || endOfMonth(new Date());

        // Fetch all transactions in the range at once
        const transactions = await prisma.transaction.findMany({
            where: {
                smeId: sme.id,
                status: { in: ["PAID", "SUCCESS"] },
                createdAt: {
                    gte: rangeStart,
                    lte: rangeEnd,
                },
            },
            select: {
                totalAmount: true,
                createdAt: true,
            },
        });

        const chartData: { month: string; revenue: number }[] = [];
        let iter = new Date(rangeStart);

        // Initialize the skeleton of all months
        while (iter <= rangeEnd) {
            chartData.push({
                month: format(iter, "MMM"),
                revenue: 0,
            });
            iter = new Date(iter.getFullYear(), iter.getMonth() + 1, 1);
        }

        // Group into the initialized skeleton
        transactions.forEach((tx) => {
            const monthStr = format(tx.createdAt, "MMM");
            const existing = chartData.find((d) => d.month === monthStr);
            if (existing) {
                existing.revenue += tx.totalAmount;
            }
        });

        return { success: true, chartData };
    } catch (error: any) {
        console.error("[getRevenueGraphData] Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch recent transactions.
 */
export async function getRecentTransactions(limit = 10) {
    try {
        const sme = await getSme();

        const transactions = await prisma.transaction.findMany({
            where: { smeId: sme.id },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return { success: true, transactions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch monthly payments for the bar chart.
 */
export async function getMonthlyPayments() {
    try {
        const sme = await getSme();
        const now = new Date();
        const months = [subMonths(now, 2), subMonths(now, 1), now];

        const start = startOfMonth(months[0]);
        const end = endOfMonth(now);

        const transactions = await prisma.transaction.findMany({
            where: {
                smeId: sme.id,
                status: { in: ["PAID", "SUCCESS"] },
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                totalAmount: true,
                createdAt: true,
            },
        });

        const monthlyPayments = months.map((date) => ({
            month: format(date, "MMM"),
            amount: 0,
            color: "#EB5119",
        }));

        transactions.forEach((tx) => {
            const monthStr = format(tx.createdAt, "MMM");
            const existing = monthlyPayments.find((m) => m.month === monthStr);
            if (existing) {
                existing.amount += tx.totalAmount;
            }
        });

        return { success: true, monthlyPayments };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
