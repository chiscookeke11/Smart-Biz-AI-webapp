import { z } from "zod";

export const SmeSchema = z.object({
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    slug: z.string().min(3, "Store URL slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    description: z.string().min(10, "Description must be at least 10 characters").optional().nullable(),
    email: z.string().email("Invalid email address"),
    whatsapp: z.string().min(10, "WhatsApp number must be at least 10 digits").optional().or(z.literal("")),
    address: z.string().min(5, "Address must be at least 5 characters").optional().nullable(),
    nationalId: z.string().min(5, "National ID must be at least 5 characters").optional().nullable(),
    cacRegistration: z.string().min(5, "CAC registration number must be at least 5 characters").optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    aiTone: z.enum(["professional", "friendly", "helpful"]).default("professional"),
    language: z.string().min(2, "Language is required").default("en-US"),
    autoInvoicing: z.boolean().default(true),
});

export type SmeInput = z.infer<typeof SmeSchema>;

// Helper schemas for onboarding steps
export const BusinessProfileSchema = SmeSchema.pick({
    businessName: true,
    address: true,
    nationalId: true,
    cacRegistration: true,
    description: true,
    logoUrl: true,
});

export const PreferencesSchema = SmeSchema.pick({
    aiTone: true,
    language: true,
    autoInvoicing: true,
});
