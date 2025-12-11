import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const SECTIONS = [
    'Men Casual',
    "Men's Formal and Party wear",
    "Men's Ethnic",
    'Bridal Section',
    'Regular and smart saree',
    'Silk saree',
    'Gown',
    'SKD',
    'Teens section',
    'Kids section',
];

/**
 * POST /api/seed
 * Seed the database with initial sections
 */
export async function POST() {
    try {
        // Check if sections already exist
        const existingCount = await prisma.section.count();

        if (existingCount > 0) {
            return NextResponse.json({
                success: true,
                message: 'Sections already exist',
                count: existingCount,
            });
        }

        // Create sections
        for (let i = 0; i < SECTIONS.length; i++) {
            await prisma.section.create({
                data: {
                    name: SECTIONS[i],
                    displayOrder: i + 1,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Sections seeded successfully',
            count: SECTIONS.length,
        });
    } catch (error) {
        console.error('Error seeding:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Failed to seed: ${errorMessage}` },
            { status: 500 }
        );
    }
}

/**
 * GET /api/seed
 * Check seed status
 */
export async function GET() {
    try {
        const sectionCount = await prisma.section.count();
        const shopCount = await prisma.shop.count();
        const userCount = await prisma.user.count();

        const sections = await prisma.section.findMany({
            orderBy: { displayOrder: 'asc' },
        });

        const shops = await prisma.shop.findMany({
            include: {
                users: {
                    where: { role: 'ADMIN' },
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                counts: {
                    sections: sectionCount,
                    shops: shopCount,
                    users: userCount,
                },
                sections: sections.map(s => ({ id: s.id, name: s.name })),
                shops: shops.map(s => ({
                    id: s.id,
                    name: s.name,
                    admin: s.users[0] || null,
                })),
            },
        });
    } catch (error) {
        console.error('Error getting seed status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Failed to get status: ${errorMessage}` },
            { status: 500 }
        );
    }
}
