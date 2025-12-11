import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';

// Get database URL from environment
const connectionString = process.env.DATABASE_URL;

// Create database connection
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Fixed list of sections as per requirements
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

// Sample shops for seeding
const SHOPS = [
    { name: 'Downtown Store', address: '123 Main Street', city: 'Mumbai' },
    { name: 'Mall Branch', address: 'City Mall, Floor 2', city: 'Delhi' },
    { name: 'High Street Outlet', address: '45 High Street', city: 'Bangalore' },
];

interface Shop {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
}

interface Section {
    id: string;
    name: string;
    displayOrder: number;
}

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data (in reverse order due to foreign keys)
    console.log('🧹 Cleaning existing data...');
    await prisma.cronJobLog.deleteMany();
    await prisma.task.deleteMany();
    await prisma.review.deleteMany();
    await prisma.userSection.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.section.deleteMany();
    await prisma.shop.deleteMany();

    // Create sections
    console.log('📦 Creating sections...');
    const sections: Section[] = await Promise.all(
        SECTIONS.map((name, index) =>
            prisma.section.create({
                data: {
                    name,
                    displayOrder: index + 1,
                },
            })
        )
    );
    console.log(`✅ Created ${sections.length} sections`);

    // Create shops
    console.log('🏪 Creating shops...');
    const shops: Shop[] = await Promise.all(
        SHOPS.map((shop) =>
            prisma.shop.create({
                data: shop,
            })
        )
    );
    console.log(`✅ Created ${shops.length} shops`);

    // Create users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create Superadmin
    await prisma.user.create({
        data: {
            email: 'superadmin@example.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'SUPERADMIN',
        },
    });
    console.log('✅ Created Superadmin user');

    // Create Admins for each shop
    const admins = await Promise.all(
        shops.map((shop, index) =>
            prisma.user.create({
                data: {
                    email: `admin${index + 1}@example.com`,
                    password: hashedPassword,
                    name: `Admin - ${shop.name}`,
                    role: 'ADMIN',
                    shopId: shop.id,
                },
            })
        )
    );
    console.log(`✅ Created ${admins.length} Admin users`);

    // Create TLs for each shop (2-3 TLs per shop, each managing different sections)
    const tlConfigs = [
        // Shop 1 TLs
        { shopIndex: 0, name: 'Rahul Kumar', sections: [0, 1, 2] }, // Men's sections
        { shopIndex: 0, name: 'Priya Sharma', sections: [3, 4, 5] }, // Women's sections
        { shopIndex: 0, name: 'Amit Patel', sections: [6, 7, 8, 9] }, // Other sections
        // Shop 2 TLs
        { shopIndex: 1, name: 'Sneha Reddy', sections: [0, 1, 2, 3] },
        { shopIndex: 1, name: 'Vikram Singh', sections: [4, 5, 6, 7, 8, 9] },
        // Shop 3 TLs
        { shopIndex: 2, name: 'Ananya Gupta', sections: [0, 1, 2] },
        { shopIndex: 2, name: 'Rohit Verma', sections: [3, 4, 5, 6] },
        { shopIndex: 2, name: 'Kavya Nair', sections: [7, 8, 9] },
    ];

    for (let i = 0; i < tlConfigs.length; i++) {
        const config = tlConfigs[i];
        const shop = shops[config.shopIndex];

        const tl = await prisma.user.create({
            data: {
                email: `tl${i + 1}@example.com`,
                password: hashedPassword,
                name: config.name,
                role: 'TL',
                shopId: shop.id,
            },
        });

        // Assign sections to TL
        await prisma.userSection.createMany({
            data: config.sections.map((sectionIndex) => ({
                userId: tl.id,
                sectionId: sections[sectionIndex].id,
                shopId: shop.id,
            })),
        });

        console.log(`✅ Created TL: ${config.name} with ${config.sections.length} sections`);
    }

    // Create sample reviews (mix of positive and negative)
    console.log('📝 Creating sample reviews...');
    const reviewData = [
        // Negative reviews (will create tasks)
        { shopIndex: 0, sectionIndex: 0, rating: 2, comment: 'Poor quality fabric. The shirt started fading after first wash.' },
        { shopIndex: 0, sectionIndex: 1, rating: 1, comment: 'Terrible customer service. Staff was rude and unhelpful.' },
        { shopIndex: 0, sectionIndex: 3, rating: 3, comment: 'Bridal lehenga had some issues with stitching. Not satisfied.' },
        { shopIndex: 1, sectionIndex: 2, rating: 2, comment: 'Wrong size delivered. Had to return twice.' },
        { shopIndex: 1, sectionIndex: 5, rating: 1, comment: 'Silk saree was not genuine silk. Very disappointed.' },
        { shopIndex: 2, sectionIndex: 8, rating: 3, comment: 'Teen clothing had limited variety. Expected more options.' },
        { shopIndex: 2, sectionIndex: 9, rating: 2, comment: 'Kids clothes were uncomfortable material. Child refused to wear.' },
        // Positive reviews (won't create tasks)
        { shopIndex: 0, sectionIndex: 0, rating: 5, comment: 'Excellent quality! The shirt fits perfectly.' },
        { shopIndex: 0, sectionIndex: 4, rating: 4, comment: 'Beautiful saree collection. Very happy with purchase.' },
        { shopIndex: 1, sectionIndex: 6, rating: 5, comment: 'The gown was gorgeous. Perfect for the occasion!' },
        { shopIndex: 2, sectionIndex: 7, rating: 4, comment: 'Good quality SKD wear. Reasonable prices.' },
    ];

    for (const review of reviewData) {
        await prisma.review.create({
            data: {
                shopId: shops[review.shopIndex].id,
                sectionId: sections[review.sectionIndex].id,
                rating: review.rating,
                comment: review.comment,
                customerName: `Customer ${Math.floor(Math.random() * 1000)}`,
                customerPhone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                isProcessed: false,
            },
        });
    }
    console.log(`✅ Created ${reviewData.length} sample reviews`);

    console.log('\n🎉 Database seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Sections: ${sections.length}`);
    console.log(`   - Shops: ${shops.length}`);
    console.log(`   - Users: 1 Superadmin, ${admins.length} Admins, ${tlConfigs.length} TLs`);
    console.log(`   - Reviews: ${reviewData.length} (${reviewData.filter(r => r.rating < 4).length} negative)`);
    console.log('\n🔐 Login credentials:');
    console.log('   - Superadmin: superadmin@example.com / password123');
    console.log('   - Admins: admin1@example.com, admin2@example.com, admin3@example.com / password123');
    console.log('   - TLs: tl1@example.com through tl8@example.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
