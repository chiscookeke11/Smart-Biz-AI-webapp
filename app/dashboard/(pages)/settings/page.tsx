import { getSme } from "@/actions/smeActions";
import SettingsForm from "@/components/dashboard-components/SettingsForm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function SettingsFormSkeleton() {
    return (
        <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-6">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                        <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                ))}
            </div>
            <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse mt-6" />
        </div>
    );
}

async function SettingsContainer() {
    const result = await getSme();

    if (!result.success) {
        if (result.error === "Unauthorized") {
            redirect("/sign-in");
        }
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-bold">Error</p>
                <p>{result.error}</p>
            </div>
        );
    }

    const sme = result.sme;

    return (
        <SettingsForm 
            initialData={{
                businessName: sme?.businessName || "",
                description: sme?.description || "",
                email: sme?.email || "",
                whatsapp: sme?.whatsapp || "",
                nationalId: sme?.nationalId || "",
                cacRegistration: sme?.cacRegistration || "",
                logoUrl: sme?.logoUrl || "",
                slug: sme?.slug || "",
                aiTone: (sme?.aiTone as any) || "professional",
                language: sme?.language || "en-US",
                autoInvoicing: sme?.autoInvoicing ?? true,
            }} 
        />
    );
}

export default function Page() {
    return (
        <div className="p-8 w-full flex flex-col gap-8">
            <Suspense fallback={<SettingsFormSkeleton />}>
                <SettingsContainer />
            </Suspense>
        </div>
    );
}
