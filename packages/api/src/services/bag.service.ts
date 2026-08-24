import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { BagQueryParams } from '@bhookhmarket/shared';
import { LOW_STOCK_THRESHOLD } from '@bhookhmarket/shared';

// ---- Discovery Query (geospatial with PostgreSQL) ----
export async function discoverBags(params: BagQueryParams) {
  const {
    lat,
    lng,
    radius = 5,
    category,
    maxPrice,
    minDiscount,
    availableNow,
    sort = 'distance',
    page = 1,
    limit = 20,
    q,
  } = params;

  const offset = (page - 1) * limit;
  const now = new Date();

  // Build WHERE conditions for Prisma
  const whereConditions: any = {
    status: { in: ['ACTIVE', 'LOW_STOCK'] },
    pickupEnd: { gt: now },
    partner: {
      verificationStatus: 'APPROVED',
      isActive: true,
    },
  };

  if (category) whereConditions.category = category;
  if (maxPrice) whereConditions.sellingPrice = { lte: maxPrice };
  if (availableNow) whereConditions.pickupStart = { lte: now };

  if (q) {
    whereConditions.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { partner: { businessName: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (minDiscount) {
    // Filter by discount percentage: (originalValue - sellingPrice) / originalValue * 100 >= minDiscount
    whereConditions.AND = [
      {
        originalValue: {
          gt: prisma.bag.fields.sellingPrice,
        },
      },
    ];
  }

  const bags = await prisma.bag.findMany({
    where: whereConditions,
    include: {
      partner: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          category: true,
          address: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
          coverImage: true,
          logoImage: true,
          rating: true,
          totalRatings: true,
        },
      },
    },
    skip: offset,
    take: limit * 3, // Fetch more, then filter/sort by distance
  });

  // Compute distance and discount
  let processed = bags.map((bag) => {
    const distance =
      lat && lng
        ? calculateDistance(lat, lng, bag.partner.latitude, bag.partner.longitude)
        : null;
    const discountPercent = Math.round(
      ((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100
    );

    return { ...bag, distance, discountPercent, savingsAmount: bag.originalValue - bag.sellingPrice };
  });

  // Filter by radius if lat/lng provided
  if (lat && lng) {
    processed = processed.filter((b) => b.distance !== null && b.distance <= radius);
  }

  // Filter by discount
  if (minDiscount) {
    processed = processed.filter((b) => b.discountPercent >= minDiscount);
  }

  // Sort
  switch (sort) {
    case 'distance':
      processed.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      break;
    case 'price':
      processed.sort((a, b) => a.sellingPrice - b.sellingPrice);
      break;
    case 'discount':
      processed.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    case 'rating':
      processed.sort((a, b) => b.partner.rating - a.partner.rating);
      break;
    case 'pickup':
      processed.sort(
        (a, b) => new Date(a.pickupStart).getTime() - new Date(b.pickupStart).getTime()
      );
      break;
  }

  const paginated = processed.slice(0, limit);

  return {
    bags: paginated,
    meta: {
      total: processed.length,
      page,
      limit,
      hasMore: processed.length > limit,
    },
  };
}

// ---- Haversine distance (km) ----
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// ---- Get bag by ID ----
export async function getBagById(id: string, lat?: number, lng?: number) {
  const bag = await prisma.bag.findUnique({
    where: { id },
    include: {
      partner: {
        include: {
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { id: true, name: true, profileImage: true } },
            },
          },
        },
      },
    },
  });

  if (!bag) throw new AppError('Bag not found', 404);

  // Increment view count
  await prisma.bag.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const distance =
    lat && lng
      ? calculateDistance(lat, lng, bag.partner.latitude, bag.partner.longitude)
      : null;

  const discountPercent = Math.round(
    ((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100
  );

  return {
    ...bag,
    distance,
    discountPercent,
    savingsAmount: bag.originalValue - bag.sellingPrice,
  };
}

// ---- Create bag ----
export async function createBag(partnerId: string, data: any) {
  const commission = await prisma.commissionSettings.findFirst({
    where: { isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });
  const platformFee = commission?.platformFeeFixed ?? 15;

  const bag = await prisma.bag.create({
    data: {
      ...data,
      partnerId,
      remainingQuantity: data.quantity,
      status: 'ACTIVE',
      platformFee,
      pickupStart: new Date(data.pickupStart),
      pickupEnd: new Date(data.pickupEnd),
    },
  });

  // Notify users who favorited this partner
  const favorites = await prisma.favorite.findMany({
    where: { partnerId, notifyOnBag: true },
    select: { userId: true },
  });

  // Queue notifications for favorites
  const { notificationQueue } = await import('../jobs/queues');
  for (const fav of favorites) {
    await notificationQueue.add('favorite-bag-available', {
      userId: fav.userId,
      bagId: bag.id,
      partnerId,
    });
  }

  return bag;
}

// ---- Update bag ----
export async function updateBag(bagId: string, partnerId: string, data: any) {
  const bag = await prisma.bag.findFirst({ where: { id: bagId, partnerId } });
  if (!bag) throw new AppError('Bag not found', 404);
  if (bag.status === 'EXPIRED' || bag.status === 'CANCELLED') {
    throw new AppError('Cannot update expired or cancelled bag', 400);
  }

  return prisma.bag.update({
    where: { id: bagId },
    data: {
      ...data,
      ...(data.pickupStart && { pickupStart: new Date(data.pickupStart) }),
      ...(data.pickupEnd && { pickupEnd: new Date(data.pickupEnd) }),
    },
  });
}

// ---- Delete/cancel bag ----
export async function deleteBag(bagId: string, partnerId: string) {
  const bag = await prisma.bag.findFirst({ where: { id: bagId, partnerId } });
  if (!bag) throw new AppError('Bag not found', 404);

  const hasPendingOrders = await prisma.order.findFirst({
    where: { bagId, orderStatus: { in: ['PENDING_PAYMENT', 'PAID', 'READY_FOR_PICKUP'] } },
  });

  if (hasPendingOrders) {
    throw new AppError('Cannot delete bag with active orders', 400);
  }

  return prisma.bag.update({
    where: { id: bagId },
    data: { status: 'CANCELLED' },
  });
}
