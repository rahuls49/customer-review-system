import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users/[userId]
 * Get a single user with details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                userSections: {
                    include: {
                        section: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        assignedTasks: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive,
                shop: user.shop,
                sections: user.userSections.map(us => us.section),
                _count: user._count,
            },
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/users/[userId]
 * Update a user and their sections
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const body = await request.json();
        const { name, email, password, phone, sectionIds, shopId } = body;

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if new email conflicts with another user
        if (email !== existingUser.email) {
            const emailConflict = await prisma.user.findUnique({
                where: { email },
            });
            if (emailConflict) {
                return NextResponse.json(
                    { success: false, error: 'A user with this email already exists' },
                    { status: 400 }
                );
            }
        }

        // Update user and sections in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Build update data
            const updateData: Record<string, unknown> = {
                name,
                email,
                phone: phone || null,
            };

            if (password) {
                updateData.password = await bcrypt.hash(password, 12);
            }

            // Update user
            const user = await tx.user.update({
                where: { id: userId },
                data: updateData,
            });

            // If TL and sections provided, update user-section relationships
            if (existingUser.role === 'TL' && sectionIds !== undefined && shopId) {
                // Delete existing sections
                await tx.userSection.deleteMany({
                    where: { userId },
                });

                // Create new sections
                if (sectionIds.length > 0) {
                    await tx.userSection.createMany({
                        data: sectionIds.map((sectionId: string) => ({
                            userId,
                            sectionId,
                            shopId,
                        })),
                    });
                }
            }

            // Fetch updated user with sections
            const userWithSections = await tx.user.findUnique({
                where: { id: userId },
                include: {
                    userSections: {
                        include: {
                            section: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            return userWithSections;
        });

        return NextResponse.json({
            success: true,
            data: {
                id: result?.id,
                name: result?.name,
                email: result?.email,
                phone: result?.phone,
                role: result?.role,
                sections: result?.userSections.map(us => us.section),
            },
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[userId]
 * Deactivate a user (soft delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });

        return NextResponse.json({
            success: true,
            data: { id: user.id, isActive: user.isActive },
        });
    } catch (error) {
        console.error('Error deactivating user:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to deactivate user' },
            { status: 500 }
        );
    }
}
