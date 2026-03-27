"use client"

import { useState } from 'react';
import { Copy, ArrowRight, Check } from "lucide-react";
import Link from 'next/link';

interface ConfirmationProps {
    slug: string;
    onFinish: () => void;
}

export default function Confirmation({ slug, onFinish }: ConfirmationProps) {
    const [copied, setCopied] = useState(false);
    
    const domain = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_HOME_URL;
    const chatbotLink = `${domain}/store/${slug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(chatbotLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full flex justify-center pb-10">
            <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-[16px] flex flex-col items-center p-8 md:p-10 text-center">
                
                {/* Check Icon */}
                <div className="w-16 h-16 bg-[#FFF5F2] rounded-full flex items-center justify-center mb-6">
                    <div className="w-8 h-8 rounded-full border-2 border-[#EB5119] flex items-center justify-center">
                        <Check size={16} strokeWidth={3} className="text-[#EB5119]" />
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl md:text-[28px] font-bold text-[#0F172A] mb-3">
                    Setup Complete! 🎉
                </h2>
                <p className="text-[#64748B] text-base mb-8 max-w-sm">
                    Your AI assistant is trained and ready to engage with your customers.
                </p>

                {/* Link Section */}
                <div className="w-full flex flex-col items-start gap-2 mb-8">
                    <label className="text-[#0F172A] text-sm font-bold">Your Chatbot Link</label>
                    <div className="w-full flex items-center p-1 border border-[#E2E8F0] rounded-[8px] bg-white">
                        <input 
                            type="text" 
                            readOnly 
                            value={chatbotLink}
                            className="flex-1 bg-transparent px-3 text-[#0F172A] text-sm outline-none"
                        />
                        <button 
                            onClick={handleCopy}
                            className="bg-[#EB5119] hover:bg-[#d94814] text-white px-4 py-2 rounded-[6px] flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
                        >
                            <Copy size={14} />
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                    <p className="text-[#64748B] text-xs">
                        Share this link on your social media or embed it on your website.
                    </p>
                </div>

                <div className="w-full h-px bg-[#E2E8F0] mb-8"></div>

                {/* Buttons */}
                <div className="w-full flex flex-col gap-3">
                    <button onClick={onFinish} className="w-full bg-[#EB5119] hover:bg-[#d94814] text-white font-bold text-base py-3.5 rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer">
                        Go to Dashboard
                        <ArrowRight size={18} />
                    </button>
                    <Link href="#" className="w-full text-center bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#334155] font-bold text-base py-3.5 rounded-[8px] flex items-center justify-center transition-colors">
                        View Documentation
                    </Link>
                </div>

            </div>
        </div>
    );
}
