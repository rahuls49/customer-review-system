import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/migrate
 * Run database migrations manually
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'add_shop_slug') {
            // Add slug column to shops table if it doesn't exist
            try {
                await prisma.$executeRawUnsafe(`
                    ALTER TABLE shops ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE
                `);

                // Update existing shops to have a slug based on their name
                const shops = await prisma.shop.findMany();
                for (const shop of shops) {
                    const generatedSlug = shop.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');

                    await prisma.$executeRawUnsafe(`
                        UPDATE shops SET slug = $1 WHERE id = $2 AND (slug IS NULL OR slug = '')
                    `, generatedSlug, shop.id);
                }

                return NextResponse.json({
                    success: true,
                    message: 'Added slug column and updated existing shops',
                });
            } catch (err) {
                console.error('Migration error:', err);
                return NextResponse.json({
                    success: false,
                    error: err instanceof Error ? err.message : 'Migration failed',
                }, { status: 500 });
            }
        }

        if (action === 'update_shop_slug') {
            const { shopId, slug } = body;
            if (!shopId || !slug) {
                return NextResponse.json(
                    { success: false, error: 'shopId and slug required' },
                    { status: 400 }
                );
            }

            await prisma.$executeRawUnsafe(`
                UPDATE shops SET slug = $1 WHERE id = $2
            `, slug, shopId);

            return NextResponse.json({
                success: true,
                message: `Updated shop ${shopId} with slug ${slug}`,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Unknown action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
