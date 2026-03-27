"use client"

import { useState } from "react";
import { Search, BellDot, Plus, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/CustomButton";
import ProductModal from "../product-components/ProductModal";
import Sidebar from "../ui/Sidebar";
import UserProfile from "./UserProfile";

interface DashboardHeaderProps {
    // userName removed to avoid dynamic server usage in layout
}

export default function DashboardHeader({ }: DashboardHeaderProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
        <header className="w-full py-4 px-4 md:p-8 flex justify-between items-center gap-4 md:gap-6 bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
            <div className="w-fit flex items-center gap-2 shrink-0">
                <button className="lg:hidden p-1 mr-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-lg cursor-pointer" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu size={24} />
                </button>
                <Link className="hidden md:block text-[#94A3B8] font-normal text-sm hover:text-[#0F172A]" href={"/dashboard"}>Dashboard</Link>
                <ChevronRight className="hidden md:block" size={12} color="#94A3B8" />
                <span className="font-normal text-sm hidden md:block">Overview</span>
                <span className="font-bold text-lg md:hidden text-[#0F172A]">SmartBiz</span>
            </div>


            <label htmlFor="search" className="hidden md:flex flex-1 min-w-0 max-w-98.250 bg-[#F8FAFC] items-center rounded-[8px] gap-3  pr-4  pl-9 shrink  "  >
                <Search size={20} color="#94A3B8" />

                <input type="text"
                    className="w-full h-full pt-2.25 pb-2.5 border-0 outline-0 text-sm text-[#94A3B8] font-normal bg-transparent"
                    id="search"
                    name="search"
                    placeholder="Search operations..."
                />
            </label>

            <div className="w-fit flex items-center gap-3 md:gap-4 shrink-0"  >

                <button className="p-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-lg relative">
                    <BellDot size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EB5119] rounded-full border-2 border-white"></span>
                </button>

                <Button 
                    variant="secondary" 
                    className="hidden md:flex items-center justify-center gap-2"
                    onClick={() => setIsAddModalOpen(true)}
                > 
                    <Plus size={14} color="#0F172A" />  Add a product
                </Button>
                
                <button 
                    className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-800"
                    onClick={() => setIsAddModalOpen(true)}
                > 
                    <Plus size={16} />
                </button>
            </div>

            <ProductModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                mode="add"
            />
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
                
                {/* Drawer */}
                <aside className="relative w-[280px] max-w-[80%] h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                    <div className="p-5 flex justify-between items-center border-b border-[#E2E8F0]">
                        <img src="/logos/smartBiz.png" width={140} alt="Logo" className="w-auto h-7" />
                        <button className="p-2 text-[#64748B] hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-5 py-6">
                        <div onClick={() => setIsMobileMenuOpen(false)}>
                            <Sidebar />
                        </div>
                    </div>
                    
                    <div className="px-5 py-4 border-t border-[#E2E8F0]" onClick={() => setIsMobileMenuOpen(false)}>
                        <UserProfile />
                    </div>
                </aside>
            </div>
        )}
        </>
    );
}
