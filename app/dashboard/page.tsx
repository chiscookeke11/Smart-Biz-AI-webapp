import AskSmartBizAI from "@/components/dashboard-components/AskSmartBizAI";
import MonthlyPayments from "@/components/dashboard-components/MonthlyPayments";
import QuickActions from "@/components/dashboard-components/QuickActions";
import RecentTransactions from "@/components/dashboard-components/RecentTransactions";
import RevenueGraph from "@/components/dashboard-components/RevenueGraph";
import StatsBar from "@/components/dashboard-components/StatsBar";
import DateFilter from "@/components/dashboard-components/DateFilter";
import { Download } from "lucide-react";
import { getDashboardStats, getRevenueGraphData, getRecentTransactions, getMonthlyPayments } from "@/actions/dashboardActions";
import { Suspense } from "react";

function StatsBarSkeleton() {
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[120px] bg-white rounded-[12px] border border-[#E2E8F0] p-5 flex flex-col gap-3">
                     <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                     <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function GraphSkeleton() {
    return (
        <div className="w-full h-[400px] bg-white rounded-[16px] border border-[#E2E8F0] p-6 flex flex-col gap-4">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="flex-1 bg-slate-50 rounded-lg animate-pulse" />
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="w-full h-[350px] bg-white rounded-[16px] border border-[#E2E8F0] p-6 flex flex-col gap-4">
             <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
             <div className="space-y-4 mt-4">
                 {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-full bg-slate-50 rounded-lg animate-pulse" />)}
             </div>
        </div>
    );
}

async function StatsContainer({ fromDate, toDate }: { fromDate?: Date, toDate?: Date }) {
    const statsRes = await getDashboardStats(fromDate, toDate);
    const stats = statsRes.success ? statsRes.stats : {
        totalRevenue: 0,
        paymentsReceived: 0,
        pendingInvoices: 0,
        revenueChange: "0%",
        revenueTrend: "up" as const,
    };
    return <StatsBar stats={stats as any} />;
}

async function RevenueGraphContainer({ fromDate, toDate }: { fromDate?: Date, toDate?: Date }) {
    const graphRes = await getRevenueGraphData(fromDate, toDate);
    const graphData = graphRes.success && graphRes.chartData ? graphRes.chartData : [];
    return <RevenueGraph data={graphData} />;
}

async function MonthlyPaymentsContainer() {
    const paymentsRes = await getMonthlyPayments();
    const monthlyPayments = paymentsRes.success && paymentsRes.monthlyPayments ? paymentsRes.monthlyPayments : [];
    return <MonthlyPayments data={monthlyPayments} />;
}

async function RecentTransactionsContainer() {
    const txRes = await getRecentTransactions(10);
    const transactions = txRes.success && txRes.transactions ? txRes.transactions : [];
    return <RecentTransactions transactions={transactions as any} />;
}

interface PageProps {
    searchParams: Promise<{
        from?: string;
        to?: string;
    }>
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const fromDate = params.from ? new Date(params.from) : undefined;
    const toDate = params.to ? new Date(params.to) : undefined;

    return (
        <div className="p-8 w-full flex flex-col gap-8">
            {/* Page Header */}
            <div className="w-full flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[#0F172A] font-bold text-2xl">Dashboard Overview</h1>
                    <p className="font-normal text-sm text-[#64748B]">Manage your AI-powered business operations.</p>
                </div>

                <div className="flex items-center gap-3">
                    <DateFilter />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            <Suspense fallback={<StatsBarSkeleton />}>
                <StatsContainer fromDate={fromDate} toDate={toDate} />
            </Suspense>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <Suspense fallback={<GraphSkeleton />}>
                        <RevenueGraphContainer fromDate={fromDate} toDate={toDate} />
                    </Suspense>
                </div>

                {/* Right Column - Sidebar Style Components */}
                <div className="flex flex-col gap-8">
                    <QuickActions />
                </div>
            </div>
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Large Components */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <Suspense fallback={<ListSkeleton />}>
                        <MonthlyPaymentsContainer />
                    </Suspense>
                </div>

                {/* Right Column - Sidebar Style Components */}
                <div className="flex flex-col gap-8">
                    <AskSmartBizAI />
                </div>
            </div>
            
            <div className="w-full">
                <Suspense fallback={<ListSkeleton />}>
                    <RecentTransactionsContainer />
                </Suspense>
            </div>
        </div>
    )
}