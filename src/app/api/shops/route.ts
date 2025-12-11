import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

interface ShopWithUsers {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    users: { id: string; name: string; email: string }[];
    _count: { users: number; tasks: number; reviews: number };
}

/**
 * GET /api/shops
 * Get all shops with their admin users
 */
export async function GET() {
    try {
        const shops = await prisma.shop.findMany({
            include: {
                users: {
                    where: { role: 'ADMIN' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        tasks: true,
                        reviews: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to include admin as single object
        const shopsWithAdmin = shops.map((shop: ShopWithUsers) => ({
            ...shop,
            admin: shop.users[0] || null,
            users: undefined,
        }));

        return NextResponse.json({ success: true, data: shopsWithAdmin });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch shops' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/shops
 * Create a new shop with an admin user
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, slug, address, city, adminName, adminEmail, adminPassword } = body;

        // Generate slug from name if not provided
        const shopSlug = (slug || name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Validate required fields
        if (!name || !adminName || !adminEmail || !adminPassword) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if shop name already exists
        const existingShop = await prisma.shop.findUnique({
            where: { name },
        });

        if (existingShop) {
            return NextResponse.json(
                { success: false, error: 'A shop with this name already exists' },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingSlug = await prisma.shop.findUnique({
            where: { slug: shopSlug },
        });

        if (existingSlug) {
            return NextResponse.json(
                { success: false, error: 'A shop with this URL slug already exists' },
                { status: 400 }
            );
        }

        // Check if admin email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword as string, 12);

        // Create shop first
        const shop = await prisma.shop.create({
            data: {
                name,
                slug: shopSlug,
                address: address || null,
                city: city || null,
            },
        });

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN',
                shopId: shop.id,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...shop,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                },
            },
        });
    } catch (error) {
        console.error('Error creating shop:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Failed to create shop: ${errorMessage}` },
            { status: 500 }
        );
    }
}
