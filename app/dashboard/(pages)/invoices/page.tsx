import { Suspense } from "react";
import AllInvoices from "@/components/dashboard-components/AllInvoices";
import InvoiceStats from "@/components/dashboard-components/InvoiceStats";
import { Button } from "@/components/ui/CustomButton";
import { Download } from "lucide-react";
import CreateInvoiceButton from "@/components/dashboard-components/CreateInvoiceButton";
import { getInvoices, getInvoiceStats } from "@/actions/invoiceActions";

function InvoiceStatsSkeleton() {
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 place-items-center justify-center justify-items-center">
            {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-[104px] rounded-[12px] border border-[#E2E8F0] shadow-[0px_1px_2px_0px_#0000000D] p-5 flex items-start flex-col gap-2 bg-white">
                    <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-7 w-32 bg-slate-200 rounded mt-1 animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function AllInvoicesSkeleton() {
    return (
        <div className="w-full flex flex-col items-start gap-5 mt-2">
            <div className="w-full flex items-center gap-6 border-b border-[#E2E8F0] pb-[22px]">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                ))}
            </div>
            <div className="overflow-x-auto w-full bg-white rounded-2xl border border-[#E2E8F0]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <th key={i} className="px-6 py-4">
                                    <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                    <td key={j} className="px-6 py-6">
                                        <div className="h-4 w-full max-w-[80px] bg-slate-100 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

async function StatsContainer() {
    const statsResult = await getInvoiceStats();
    const stats = (statsResult.success && statsResult.stats) ? statsResult.stats : {
        totalInvoiced: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        count: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
    };
    return <InvoiceStats stats={stats} />;
}

// Fetch and render invoices asynchronously
async function InvoicesContainer() {
    const invoicesResult = await getInvoices();
    const invoices = invoicesResult.success ? invoicesResult.invoices : [];
    return <AllInvoices invoices={invoices as any} />;
}

export default function Page() {
    return (
        <div className="p-8 w-full flex flex-col gap-8 relative">
            {/* Page Header */}
            <div className="w-full flex items-center justify-between">

                <div className="flex flex-col gap-1">
                    <h1 className="text-[#0F172A] font-bold text-2xl">Invoices & Payments</h1>
                    <p className="font-normal text-sm text-[#64748B]">Manage your automated billing, subscription renewals, and transaction history.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold"
                    >
                        <Download size={18} />
                        Export CSV
                    </Button>

                    <CreateInvoiceButton />
                </div>
            </div>

            <Suspense fallback={<InvoiceStatsSkeleton />}>
                <StatsContainer />
            </Suspense>
            <Suspense fallback={<AllInvoicesSkeleton />}>
                <InvoicesContainer />
            </Suspense>

        </div>
    )
}