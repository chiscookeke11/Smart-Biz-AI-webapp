import { getProducts } from "@/actions/productActions";
import ProductInventory from "@/components/product-components/ProductInventory";
import { redirect } from "next/navigation";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

function ProductInventorySkeleton() {
    return (
        <div className="w-full flex flex-col gap-6 p-8">
            {/* Header skeleton */}
            <div className="flex justify-between items-center w-full">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
            </div>
            {/* Table/Grid skeleton */}
            <div className="w-full bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="h-12 w-full bg-slate-50 border-b border-[#E2E8F0] mb-4 animate-pulse rounded-t-lg" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 items-center w-full">
                            <div className="h-12 w-12 bg-slate-200 rounded-lg animate-pulse shrink-0" />
                            <div className="h-6 w-1/3 bg-slate-100 rounded animate-pulse" />
                            <div className="h-6 w-1/4 bg-slate-100 rounded animate-pulse" />
                            <div className="h-6 w-1/4 bg-slate-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

async function ProductsContainer() {
    const result = await getProducts();

    if (!result.success) {
        if (result.error === "Unauthorized") {
            redirect("/login");
        }
        console.error("Failed to fetch products:", result.error);
    }

    const products = result.products || [];

    return <ProductInventory initialProducts={products} />;
}

export default function Page() {
    return (
        <Suspense fallback={<ProductInventorySkeleton />}>
            <ProductsContainer />
        </Suspense>
    );
}
