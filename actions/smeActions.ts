"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SmeSchema, SmeInput } from "@/lib/validations/sme";
import { revalidatePath } from "next/cache";

/**
 * Get the current SME for the logged-in user.
 */
export async function getSme() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const sme = await prisma.sme.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        if (!sme) {
            return { success: false, error: "SME not found" };
        }

        return { success: true, sme };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch SME" };
    }
}

/**
 * Update the current SME profile.
 */
export async function updateSme(data: SmeInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validatedData = SmeSchema.parse(data);

        const existingSme = await prisma.sme.findFirst({
            where: { userId: session.user.id },
        });

        if (!existingSme) {
            return { success: false, error: "SME not found" };
        }

        // Check if slug is changing and if it is already taken
        if (validatedData.slug !== existingSme.slug) {
            const slugTaken = await prisma.sme.findUnique({
                where: { slug: validatedData.slug }
            });
            if (slugTaken) {
                return { success: false, error: "This Store URL is already taken. Please choose another one." };
            }
        }

        const updatedSme = await prisma.sme.update({
            where: { id: existingSme.id },
            data: validatedData,
        });

        revalidatePath("/dashboard/settings");
        return { success: true, message: "Profile updated successfully", sme: updatedSme };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, error: error.errors[0].message || "Invalid data submitted" };
        }
        return { success: false, error: error.message || "Failed to update profile" };
    }
}
