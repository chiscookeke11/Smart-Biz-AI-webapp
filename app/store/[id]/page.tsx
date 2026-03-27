import PublicChatInterface from "@/components/chat/PublicChatInterface";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-screen bg-[#F8F6F6]">
                    <Loader2 className="w-10 h-10 text-[#EB5119] animate-spin mb-4" />
                    <p className="text-[#64748B] font-medium">Loading chat...</p>
                </div>
            }>
                <PublicChatInterface slug={id} />
            </Suspense>
        </div>
    );
}
