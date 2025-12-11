import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// Predefined slug mappings - can be stored in DB later
const SLUG_MAPPINGS: Record<string, string> = {
    'ssrpr': 'Chennai Store',
    'chennai-store': 'Chennai Store',
    'chennai': 'Chennai Store',
};

interface ShopResult {
    id: string;
    name: string;
    city: string | null;
    slug?: string;
}

/**
 * GET /api/shops/by-slug/[slug]
 * Get a shop by its URL slug (for public review form)
 * Uses predefined mappings or matches by name
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json(
                { success: false, error: 'Slug is required' },
                { status: 400 }
            );
        }

        const slugLower = slug.toLowerCase();
        let shop: ShopResult | null = null;

        // Check predefined mapping
        const mappedName = SLUG_MAPPINGS[slugLower];

        if (mappedName) {
            // Find shop by mapped name
            const foundShop = await prisma.shop.findFirst({
                where: {
                    name: mappedName,
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    city: true,
                },
            });
            if (foundShop) {
                shop = { ...foundShop, slug: slugLower };
            }
        }

        // If not found via mapping, try name-based matching
        if (!shop) {
            const shops = await prisma.shop.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    city: true,
                },
            });

            // Find shop whose name, when slugified, matches the input slug
            const foundShop = shops.find((s: ShopResult) => {
                const generatedSlug = s.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                return generatedSlug === slugLower ||
                    s.name.toLowerCase().includes(slugLower) ||
                    slugLower.includes(s.name.toLowerCase().replace(/\s+/g, ''));
            });

            if (foundShop) {
                shop = { ...foundShop, slug: slugLower };
            }
        }

        if (!shop) {
            return NextResponse.json(
                { success: false, error: 'Shop not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: shop,
        });
    } catch (error) {
        console.error('Error fetching shop by slug:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch shop' },
            { status: 500 }
        );
    }
}
