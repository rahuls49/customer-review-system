// Quick script to seed sections
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sections = [
    'Men Casual',
    "Men's Formal and Party wear",
    "Men's Ethnic",
    'Bridal Section',
    'Regular and smart saree',
    'Silk saree',
    'Gown',
    'SKD',
    'Teens section',
    'Kids section'
];

async function seed() {
    // Check if sections exist
    const count = await prisma.section.count();
    console.log('Current section count:', count);

    if (count === 0) {
        for (let i = 0; i < sections.length; i++) {
            await prisma.section.create({
                data: { name: sections[i], displayOrder: i + 1 }
            });
            console.log('Created section:', sections[i]);
        }
        console.log('Done seeding sections');
    } else {
        console.log('Sections already exist, skipping seed');
    }

    // List all sections
    const allSections = await prisma.section.findMany();
    console.log('All sections:', allSections.map(s => s.name));

    // List all shops
    const shops = await prisma.shop.findMany();
    console.log('All shops:', shops.map(s => ({ id: s.id, name: s.name })));
}

seed().then(() => {
    prisma.$disconnect();
    pool.end();
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
