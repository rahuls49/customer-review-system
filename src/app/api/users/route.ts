import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users
 * Get users with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const shopId = searchParams.get('shopId');

        const where: Record<string, unknown> = {};
        if (role) where.role = role;
        if (shopId) where.shopId = shopId;

        const users = await prisma.user.findMany({
            where,
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
            orderBy: { createdAt: 'desc' },
        });

        // Transform to flatten sections
        const transformedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            shop: user.shop,
            sections: user.userSections.map(us => us.section),
            _count: user._count,
        }));

        return NextResponse.json({ success: true, data: transformedUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/users
 * Create a new user (TL or Admin)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, phone, role, shopId, sectionIds } = body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // TL must have shopId
        if (role === 'TL' && !shopId) {
            return NextResponse.json(
                { success: false, error: 'Team Leaders must be assigned to a shop' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with sections in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    phone: phone || null,
                    role,
                    shopId: shopId || null,
                },
            });

            // If TL and sections provided, create user-section relationships
            if (role === 'TL' && sectionIds && sectionIds.length > 0 && shopId) {
                await tx.userSection.createMany({
                    data: sectionIds.map((sectionId: string) => ({
                        userId: user.id,
                        sectionId,
                        shopId,
                    })),
                });
            }

            // Fetch sections for response
            const userWithSections = await tx.user.findUnique({
                where: { id: user.id },
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
        console.error('Error creating user:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
