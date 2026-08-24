import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BhookhMarket database...');

  // ---- Commission Settings ----
  await prisma.commissionSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      platformFeeFixed: 5,
      commissionPercent: 30,
      taxPercent: 0,
      isActive: true,
      effectiveFrom: new Date(),
    },
    update: {},
  });

  // ---- Admin User ----
  const adminUser = await prisma.user.upsert({
    where: { phone: '9000000000' },
    create: {
      name: 'BhookhMarket Admin',
      phone: '9000000000',
      email: 'admin@bhookhmarket.com',
      role: 'ADMIN',
      isVerified: true,
    },
    update: {},
  });
  console.log('Admin user created:', adminUser.phone);

  // ---- Demo Consumer ----
  const consumerUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    create: {
      name: 'Demo User',
      phone: '9876543210',
      email: 'user@demo.com',
      role: 'CONSUMER',
      isVerified: true,
    },
    update: {},
  });

  // ---- Demo Partners ----
  const partnerUser1 = await prisma.user.upsert({
    where: { phone: '9123456789' },
    create: {
      name: 'Aroha Bakery Owner',
      phone: '9123456789',
      email: 'aroha@demo.com',
      role: 'PARTNER',
      isVerified: true,
    },
    update: {},
  });

  const partner1 = await prisma.partner.upsert({
    where: { slug: 'aroha-bakery-mumbai' },
    create: {
      ownerUserId: partnerUser1.id,
      businessName: 'Aroha Bakery',
      slug: 'aroha-bakery-mumbai',
      category: 'BAKERY',
      description: 'Artisan bakery crafting sourdough, pastries, and fresh bread daily since 2015.',
      phone: '9123456789',
      email: 'aroha@demo.com',
      address: '23, Hill Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0544,
      longitude: 72.8403,
      verificationStatus: 'APPROVED',
      isActive: true,
      rating: 4.7,
      totalRatings: 123,
      openingHours: {
        mon: { open: '07:00', close: '21:00' },
        tue: { open: '07:00', close: '21:00' },
        wed: { open: '07:00', close: '21:00' },
        thu: { open: '07:00', close: '21:00' },
        fri: { open: '07:00', close: '21:00' },
        sat: { open: '08:00', close: '22:00' },
        sun: { open: '08:00', close: '20:00' },
      },
    },
    update: {},
  });

  const partnerUser2 = await prisma.user.upsert({
    where: { phone: '9234567890' },
    create: {
      name: 'Cafe Verde Owner',
      phone: '9234567890',
      email: 'verde@demo.com',
      role: 'PARTNER',
      isVerified: true,
    },
    update: {},
  });

  const partner2 = await prisma.partner.upsert({
    where: { slug: 'cafe-verde-bandra' },
    create: {
      ownerUserId: partnerUser2.id,
      businessName: 'Cafe Verde',
      slug: 'cafe-verde-bandra',
      category: 'CAFE',
      description: 'Specialty coffee cafe with fresh-baked treats and light lunches.',
      phone: '9234567890',
      email: 'verde@demo.com',
      address: '45, Linking Road, Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0595,
      longitude: 72.8358,
      verificationStatus: 'APPROVED',
      isActive: true,
      rating: 4.5,
      totalRatings: 87,
    },
    update: {},
  });

  // ---- Surprise Bags ----
  const now = new Date();
  const pickupStart1 = new Date(now);
  pickupStart1.setHours(20, 0, 0, 0);
  const pickupEnd1 = new Date(now);
  pickupEnd1.setHours(21, 0, 0, 0);

  await prisma.bag.upsert({
    where: { id: 'seed-bag-001' },
    create: {
      id: 'seed-bag-001',
      partnerId: partner1.id,
      title: 'Bakery Surprise Bag',
      category: 'BAKERY',
      description: 'A generous mix of our finest baked goods from today — sourdough, croissants, pastries and more.',
      originalValue: 350,
      sellingPrice: 99,
      quantity: 5,
      remainingQuantity: 5,
      platformFee: 5,
      pickupStart: pickupStart1,
      pickupEnd: pickupEnd1,
      isVegetarian: true,
      containsDairy: true,
      containsGluten: true,
      foodSafetyDeclared: true,
      status: 'ACTIVE',
    },
    update: {
      pickupStart: pickupStart1,
      pickupEnd: pickupEnd1,
      status: 'ACTIVE',
    },
  });

  const pickupStart2 = new Date(now);
  pickupStart2.setHours(19, 30, 0, 0);
  const pickupEnd2 = new Date(now);
  pickupEnd2.setHours(20, 30, 0, 0);

  await prisma.bag.upsert({
    where: { id: 'seed-bag-002' },
    create: {
      id: 'seed-bag-002',
      partnerId: partner2.id,
      title: 'Cafe Surprise Bag',
      category: 'CAFE',
      description: 'Coffee pastries, sandwiches, and snacks — surprise assortment from today.',
      originalValue: 250,
      sellingPrice: 79,
      quantity: 4,
      remainingQuantity: 3,
      platformFee: 5,
      pickupStart: pickupStart2,
      pickupEnd: pickupEnd2,
      isVegetarian: true,
      containsDairy: true,
      foodSafetyDeclared: true,
      status: 'LOW_STOCK',
    },
    update: {
      pickupStart: pickupStart2,
      pickupEnd: pickupEnd2,
      status: 'LOW_STOCK',
    },
  });

  // ---- User impact stats ----
  await prisma.impactStats.upsert({
    where: { userId: consumerUser.id },
    create: {
      userId: consumerUser.id,
      totalBagsRescued: 0,
      totalMoneySaved: 0,
      totalCo2Saved: 0,
      totalFoodSaved: 0,
    },
    update: {},
  });

  console.log('Seed complete!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:    +91 9000000000 / OTP: 111111');
  console.log('  Consumer: +91 9876543210 / OTP: 111111');
  console.log('  Partner 1: +91 9123456789 / OTP: 111111');
  console.log('  Partner 2: +91 9234567890 / OTP: 111111');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
