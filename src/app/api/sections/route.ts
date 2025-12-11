import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/sections
 * Get all sections
 */
export async function GET() {
    try {
        const sections = await prisma.section.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });

        return NextResponse.json({ success: true, data: sections });
    } catch (error) {
        console.error('Error fetching sections:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sections' },
            { status: 500 }
        );
    }
}
