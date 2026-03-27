"use client";

import { useState, useRef } from "react";
import { SmeSchema, SmeInput } from "@/lib/validations/sme";
import { updateSme } from "@/actions/smeActions";
import { Button } from "../ui/CustomButton";
import CustomInput from "../ui/CustomInput";
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    Camera,
    Store,
    Phone,
    Bot,
    Link2,
    Copy,
    MapPin,
} from "lucide-react";

interface ProfileTabProps {
    initialData: SmeInput;
}

export default function ProfileTab({ initialData }: ProfileTabProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<SmeInput>(initialData);
    const [errors, setErrors] = useState<Partial<Record<keyof SmeInput, string>>>({});
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof SmeInput]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof SmeInput];
                return newErrors;
            });
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: "error", text: "Logo image must be smaller than 5MB" });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setFormData((prev) => ({ ...prev, logoUrl: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const validate = () => {
        try {
            SmeSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error: any) {
            const formattedErrors: Partial<Record<keyof SmeInput, string>> = {};
            error.errors.forEach((err: any) => {
                formattedErrors[err.path[0] as keyof SmeInput] = err.message;
            });
            setErrors(formattedErrors);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!validate()) return;

        setIsLoading(true);
        try {
            const result = await updateSme(formData);
            if (result.success) {
                setMessage({ type: "success", text: result.message || "Profile updated successfully" });
            } else {
                setMessage({ type: "error", text: result.error || "Failed to update profile" });
            }
        } catch {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiscard = () => {
        setFormData(initialData);
        setErrors({});
        setMessage(null);
    };

    const handleCopyLink = () => {
        const domain = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "");
        navigator.clipboard.writeText(`${domain}/store/${formData.slug}`);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {message && (
                <div
                    className={`p-4 rounded-lg border flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                >
                    {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            {/* Business Profile Section */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <Store size={20} className="text-[#EB5119]" />
                    <h3 className="text-lg font-bold text-[#0F172A]">Business Profile</h3>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Business Identity */}
                    <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-semibold text-[#0F172A]">Business Identity</h4>
                        <p className="text-xs text-[#64748B]">
                            This logo and name will be visible to your customers across all touchpoints.
                        </p>
                    </div>

                    <div className="flex items-start gap-6 p-5 border border-[#E2E8F0] rounded-lg bg-white">
                        {/* Logo Upload Area */}
                        <div className="relative shrink-0">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="w-20 h-20 rounded-full bg-[#F1F5F9] border-2 border-dashed border-[#CBD5E1] flex items-center justify-center overflow-hidden">
                                {formData.logoUrl ? (
                                    <img
                                        src={formData.logoUrl}
                                        alt="Business logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Store size={28} className="text-[#94A3B8]" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-7 h-7 bg-[#0F172A] rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#1E293B] transition-colors"
                            >
                                <Camera size={12} className="text-white" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-[#0F172A]">Upload Brand Assets</p>
                            <p className="text-xs text-[#64748B]">Recommended size: 512x512px (PNG, SVG)</p>
                            <div className="flex items-center gap-3 mt-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-1.5 text-xs font-semibold border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="text-xs font-semibold text-[#EB5119] hover:underline cursor-pointer"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                                Business Name
                            </label>
                            <CustomInput
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="SmartBiz AI Elite"
                                error={errors.businessName}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1.5">
                                <MapPin size={12} className="text-[#EB5119]" />
                                Business Address
                            </label>
                            <textarea
                                name="address"
                                value={formData.address || ""}
                                onChange={handleChange}
                                className={`w-full min-h-[80px] p-3 rounded-lg border ${errors.address
                                        ? "border-red-500"
                                        : "border-[#E2E8F0] focus:border-[#EB5119]"
                                    } bg-[#F8FAFC] text-sm outline-none transition-colors resize-none`}
                                placeholder="123 business street, city, country"
                            />
                            {errors.address && (
                                <p className="text-xs text-red-500">{errors.address}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                                Business Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ""}
                                onChange={handleChange}
                                className={`w-full min-h-[100px] p-3 rounded-lg border ${errors.description
                                        ? "border-red-500"
                                        : "border-[#E2E8F0] focus:border-[#EB5119]"
                                    } bg-[#F8FAFC] text-sm outline-none transition-colors resize-none`}
                                placeholder="Tell us about your company..."
                            />
                            {errors.description && (
                                <p className="text-xs text-red-500">{errors.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information Section */}
            <section className="flex flex-col gap-6">
                <div className="flex items-start gap-6">
                    <div className="flex flex-col gap-1 shrink-0 max-w-[240px]">
                        <div className="flex items-center gap-2">
                            <Phone size={18} className="text-[#EB5119]" />
                            <h3 className="text-base font-bold text-[#0F172A]">Contact Information</h3>
                        </div>
                        <p className="text-xs text-[#64748B]">
                            Used for direct customer outreach and escalation of AI conversations.
                        </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                                Support Email
                            </label>
                            <CustomInput
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="support@smartbiz.ai"
                                error={errors.email}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                                WhatsApp Business
                            </label>
                            <CustomInput
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-1234"
                                error={errors.whatsapp}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Assistant Configuration Section */}
            <section className="flex flex-col gap-6">
                <div className="flex items-start gap-6">
                    <div className="flex flex-col gap-1 shrink-0 max-w-[240px]">
                        <div className="flex items-center gap-2">
                            <Bot size={18} className="text-[#EB5119]" />
                            <h3 className="text-base font-bold text-[#0F172A]">AI Assistant Configuration</h3>
                        </div>
                        <p className="text-xs text-[#64748B]">
                            Define how your AI agent represents your brand in automated interactions.
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                                Assistant Name
                            </label>
                            <CustomInput
                                name="aiTone"
                                value={formData.aiTone || ""}
                                onChange={handleChange}
                                placeholder="Aura"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                                Voice Tone and Personality
                            </label>
                            <select
                                name="language"
                                value={formData.language || "en-US"}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm outline-none transition-colors focus:border-[#EB5119] appearance-none cursor-pointer"
                            >
                                <option value="en-US">Friendly and Conversational</option>
                                <option value="professional">Professional and Formal</option>
                                <option value="casual">Casual and Approachable</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Public Storefront Section */}
            <section className="flex flex-col gap-6">
                <div className="flex items-start gap-6">
                    <div className="flex flex-col gap-1 shrink-0 max-w-[240px]">
                        <div className="flex items-center gap-2">
                            <Link2 size={18} className="text-[#EB5119]" />
                            <h3 className="text-base font-bold text-[#0F172A]">Public Storefront</h3>
                        </div>
                        <p className="text-xs text-[#64748B]">
                            Your unique URL for sharing your AI-powered storefront on social media.
                        </p>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC]">
                            <span className="px-3 text-sm text-[#94A3B8] whitespace-nowrap">{process.env.NEXT_PUBLIC_APP_URL}/store/</span>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug || ""}
                                onChange={handleChange}
                                placeholder="your-store"
                                className="flex-1 py-3 text-sm font-bold text-[#0F172A] bg-transparent outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="flex items-center gap-1.5 px-4 py-2 mr-1 text-xs font-semibold border border-[#E2E8F0] rounded-md bg-white hover:bg-[#F1F5F9] transition-colors"
                            >
                                <Copy size={14} />
                                Copy Link
                            </button>
                        </div>
                        {errors.slug && (
                            <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-[#64748B]">All systems operational</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDiscard}
                        className="px-6 py-2.5 text-sm font-semibold border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                    >
                        Discard Changes
                    </button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="px-6 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
