"use client"

import { X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    isPending?: boolean;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Delete",
    isPending = false
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-110 flex items-start justify-center p-4 overflow-y-auto">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity cursor-default"
                onClick={() => !isPending && onClose()}
            />
            <div className="relative bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl p-8 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in duration-200 my-auto">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-[#EF4444]">
                    <AlertTriangle size={32} />
                </div>
                
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-[#0F172A]">{title}</h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full">
                    <button 
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex-1 py-3 bg-[#EF4444] text-white rounded-xl text-sm font-bold hover:bg-[#BE123C] transition-all shadow-lg shadow-[#EF444433] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    disabled={isPending}
                    className="absolute top-6 right-6 text-[#94A3B8] hover:text-[#1E293B] transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
