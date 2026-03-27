"use client"

import { X, Info, Upload, Loader2 } from "lucide-react";
import { useState, useRef, useTransition, useEffect } from "react";
import { Button } from "../ui/CustomButton";
import CustomInput from "../ui/CustomInput";
import { productCategories } from "@/data/product_mock_data";
import { createProduct, updateProduct } from "@/actions/productActions";

interface Product {
    id?: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    size: string;
    category: string;
    description: string;
    image: string;
    status?: string;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    mode: "add" | "edit";
}

export default function ProductModal({ isOpen, onClose, initialData, mode }: ProductModalProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Product>(initialData || {
        name: "",
        sku: "",
        price: 1,
        stock: 1,
        size: "",
        category: productCategories[0],
        description: "",
        image: ""
    });

    // Sync formData when initialData changes (e.g. when editing a different product)
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                sku: initialData.sku || "",
                price: initialData.price || 1,
                stock: initialData.stock || 1,
                size: initialData.size || "",
                category: initialData.category || productCategories[0],
                description: initialData.description || "",
                image: initialData.image || ""
            });
        } else {
            setFormData({
                name: "",
                sku: "",
                price: 1,
                stock: 1,
                size: "",
                category: productCategories[0],
                description: "",
                image: ""
            });
        }
    }, [initialData]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = mode === "add" 
                ? await createProduct(formData as any)
                : await updateProduct(initialData.id, formData as any);

            if (result.success) {
                onClose();
            } else {
                setError(result.error || "An error occurred");
            }
        });
    };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-100 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-[600px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col my-8 h-fit max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-[#E2E8F0] relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 text-[#64748B] hover:text-[#1E293B] transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-[#0F172A]">
                        {mode === "add" ? "Add Product" : "Edit Product"}
                    </h2>
                    <p className="text-sm text-[#64748B] mt-1">
                        Add Details to help customers know more about your product
                    </p>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 thin-scrollbar">
                    <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput
                                label="Product Name"
                                placeholder="e.g. Neural Processor X2"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <CustomInput
                                label="SKU"
                                placeholder="e.g. NP-X2-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <CustomInput
                                    label="Price (NGN)"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-10"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    required
                                />
                                <span className="absolute left-4 top-[38px] text-[#94A3B8] text-sm">₦</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-xs text-[#64748B]">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-white border border-[#E2E8F0] rounded-[12px] py-2.5 px-4 text-sm focus:ring-1 focus:ring-[#EB5119] outline-none"
                                >
                                    {productCategories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput
                                label="Size"
                                placeholder="e.g. 500g"
                                value={formData.size}
                                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            />
                            <CustomInput
                                label="Stock"
                                type="number"
                                placeholder="1"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-xs text-[#64748B]">Product Description</label>
                            <textarea
                                placeholder="Describe the capabilities, tech specs and integration..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white border border-[#E2E8F0] rounded-[12px] py-4 px-4 text-sm min-h-[120px] focus:ring-1 focus:ring-[#EB5119] outline-none resize-none"
                                required
                            />
                        </div>

                        {/* Image Upload Section */}
                        <div className="flex flex-col gap-2">
                            <label className="font-bold text-xs text-[#64748B]">Product Image</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-2/1 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#F1F5F9] transition-colors overflow-hidden group relative"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                />
                                {formData.image ? (
                                    <>
                                        <img src={formData.image} alt="Product" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white text-xs font-bold">Change Image</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-2 text-[#94A3B8]">
                                            <Upload size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-[#94A3B8]">Max 5MB, PNG, JPEG</p>
                                        </div>
                                        <button 
                                            type="button"
                                            className="bg-[#EB5119] text-white px-6 py-2 rounded-lg text-xs font-bold"
                                        >
                                            Browse Files
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Info Alert */}
                        <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 flex items-start gap-2">
                            <div className="text-[#EB5119]">
                                <Info size={14} />
                            </div>
                            <p className="text-[10px] text-[#9A3412] leading-tight">
                                Prices are based on the current market rates for checkout functionality.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-[#E2E8F0] flex items-center justify-end gap-6 bg-white">
                    <button 
                        onClick={onClose}
                        className="text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
                    >
                        Cancel
                    </button>
                    <Button 
                        type="submit" 
                        form="product-form"
                        disabled={isPending}
                        className="px-8 py-3 bg-[#EB5119] hover:bg-[#D44616] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#EB511933] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isPending && <Loader2 size={16} className="animate-spin" />}
                        {mode === "add" ? "Confirm & Publish" : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
