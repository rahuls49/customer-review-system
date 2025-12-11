import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/shops/[shopId]
 * Get a single shop with details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    try {
        const { shopId } = await params;

        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
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
        });

        if (!shop) {
            return NextResponse.json(
                { success: false, error: 'Shop not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...shop,
                admin: shop.users[0] || null,
                users: undefined,
            },
        });
    } catch (error) {
        console.error('Error fetching shop:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch shop' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/shops/[shopId]
 * Update a shop and its admin
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    try {
        const { shopId } = await params;
        const body = await request.json();
        const { name, slug, address, city, adminName, adminEmail, adminPassword } = body;

        // For partial updates (just slug), allow minimal validation
        const isPartialUpdate = !name && !adminName && !adminEmail && (slug || address || city);

        // Validate required fields (only for full updates)
        if (!isPartialUpdate && (!name || !adminName || !adminEmail)) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if shop exists
        const existingShop = await prisma.shop.findUnique({
            where: { id: shopId },
            include: {
                users: {
                    where: { role: 'ADMIN' },
                },
            },
        });

        if (!existingShop) {
            return NextResponse.json(
                { success: false, error: 'Shop not found' },
                { status: 404 }
            );
        }

        // Check if new name conflicts with another shop
        if (name && name !== existingShop.name) {
            const nameConflict = await prisma.shop.findUnique({
                where: { name },
            });
            if (nameConflict) {
                return NextResponse.json(
                    { success: false, error: 'A shop with this name already exists' },
                    { status: 400 }
                );
            }
        }

        // Check if new slug conflicts with another shop
        if (slug && slug !== existingShop.slug) {
            const slugConflict = await prisma.shop.findUnique({
                where: { slug },
            });
            if (slugConflict) {
                return NextResponse.json(
                    { success: false, error: 'A shop with this URL slug already exists' },
                    { status: 400 }
                );
            }
        }

        // Check if new email conflicts with another user
        const existingAdmin = existingShop.users[0];
        if (existingAdmin && adminEmail !== existingAdmin.email) {
            const emailConflict = await prisma.user.findUnique({
                where: { email: adminEmail },
            });
            if (emailConflict) {
                return NextResponse.json(
                    { success: false, error: 'A user with this email already exists' },
                    { status: 400 }
                );
            }
        }

        // Update shop and admin in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Build update data
            const shopUpdateData: { name?: string; slug?: string; address?: string | null; city?: string | null } = {};
            if (name) shopUpdateData.name = name;
            if (slug) shopUpdateData.slug = slug;
            if (address !== undefined) shopUpdateData.address = address || null;
            if (city !== undefined) shopUpdateData.city = city || null;

            // Update shop
            const shop = await tx.shop.update({
                where: { id: shopId },
                data: shopUpdateData,
            });

            // Update or create admin
            let admin;
            if (existingAdmin) {
                const updateData: { name: string; email: string; password?: string } = {
                    name: adminName,
                    email: adminEmail,
                };
                if (adminPassword) {
                    updateData.password = await bcrypt.hash(adminPassword, 12);
                }
                admin = await tx.user.update({
                    where: { id: existingAdmin.id },
                    data: updateData,
                });
            } else {
                if (!adminPassword) {
                    throw new Error('Password is required for new admin');
                }
                admin = await tx.user.create({
                    data: {
                        name: adminName,
                        email: adminEmail,
                        password: await bcrypt.hash(adminPassword, 12),
                        role: 'ADMIN',
                        shopId: shop.id,
                    },
                });
            }

            return { shop, admin };
        });

        return NextResponse.json({
            success: true,
            data: {
                ...result.shop,
                admin: {
                    id: result.admin.id,
                    name: result.admin.name,
                    email: result.admin.email,
                },
            },
        });
    } catch (error) {
        console.error('Error updating shop:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update shop' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/shops/[shopId]
 * Delete a shop (soft delete by setting isActive to false)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    try {
        const { shopId } = await params;

        const shop = await prisma.shop.update({
            where: { id: shopId },
            data: { isActive: false },
        });

        return NextResponse.json({
            success: true,
            data: shop,
        });
    } catch (error) {
        console.error('Error deleting shop:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete shop' },
            { status: 500 }
        );
    }
}
