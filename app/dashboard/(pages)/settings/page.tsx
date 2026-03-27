import { getSme } from "@/actions/smeActions";
import SettingsForm from "@/components/dashboard-components/SettingsForm";
import { redirect } from "next/navigation";

export default async function Page() {
    const result = await getSme();

    if (!result.success) {
        if (result.error === "Unauthorized") {
            redirect("/sign-in");
        }
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-bold">Error</p>
                    <p>{result.error}</p>
                </div>
            </div>
        );
    }

    const sme = result.sme;

    return (
        <div className="p-8 w-full flex flex-col gap-8">
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
        </div>
    );
}
