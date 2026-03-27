import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Identification (slug or ID) is required" }, { status: 400 });
        }

        const sme = await prisma.sme.findFirst({
            where: { slug: id },
            select: {
                id: true,
                businessName: true,
                description: true,
                logoUrl: true,
                aiTone: true,
                language: true,
                email: true,
                whatsapp: true,
                address: true,
                products: {
                    where: { status: "Active" },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        category: true,
                        description: true,
                        image: true,
                        stock: true,
                    }
                }
            }
        });

        if (!sme) {
            // Fallback to searching by ID if slug not found and id is a valid UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            
            let smeById = null;
            if (isUuid) {
                smeById = await prisma.sme.findUnique({
                    where: { id: id },
                    select: {
                        id: true,
                        businessName: true,
                        description: true,
                        logoUrl: true,
                        aiTone: true,
                        language: true,
                        email: true,
                        whatsapp: true,
                        address: true,
                        products: {
                            where: { status: "Active" },
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: true,
                                description: true,
                                image: true,
                                stock: true,
                            }
                        }
                    }
                });
            }

            if (!smeById) {
                console.log(`[GET /api/store/${id}] SME not found in DB`);
                return NextResponse.json({ error: "SME not found" }, { status: 404 });
            }

            return NextResponse.json({ success: true, data: smeById });
        }

        return NextResponse.json({ success: true, data: sme });
    } catch (error: any) {
        console.error("[API_SME_GET] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
