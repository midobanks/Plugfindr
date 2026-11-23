import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env['DATABASE_URL'];
if (connectionString === undefined || connectionString.length === 0) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    throw new Error('Seed data must never run against production');
  }

  const design = await prisma.category.upsert({
    where: { slug: 'product-design' },
    update: {},
    create: { name: 'Product design', slug: 'product-design' },
  });

  const marketing = await prisma.category.upsert({
    where: { slug: 'marketing' },
    update: {},
    create: { name: 'Marketing', slug: 'marketing' },
  });

  await prisma.skill.upsert({
    where: { name: 'UI/UX design' },
    update: {},
    create: { name: 'UI/UX design', categoryId: design.id },
  });

  await prisma.skill.upsert({
    where: { name: 'Growth marketing' },
    update: {},
    create: { name: 'Growth marketing', categoryId: marketing.id },
  });

  const businessUser = await prisma.user.upsert({
    where: { email: 'tola@example.test' },
    update: {},
    create: {
      role: 'business',
      displayName: 'Tola Adeyemi',
      email: 'tola@example.test',
    },
  });

  const business = await prisma.businessProfile.upsert({
    where: { userId: businessUser.id },
    update: {},
    create: {
      userId: businessUser.id,
      name: 'Lagos Example Ventures',
      industry: 'Financial technology',
      size: '1 to 10',
      location: 'Lagos',
    },
  });

  const specialistUser = await prisma.user.upsert({
    where: { email: 'chidi@example.test' },
    update: {},
    create: {
      role: 'specialist',
      displayName: 'Chidi Ọkòyè',
      email: 'chidi@example.test',
    },
  });

  const specialist = await prisma.specialistProfile.upsert({
    where: { userId: specialistUser.id },
    update: {},
    create: {
      userId: specialistUser.id,
      status: 'pending',
      headline: 'Product designer for fintech and marketplaces',
      bio: 'I design clear, useful products for teams in Lagos and beyond.',
      yearsExperience: 6,
      location: 'Port Harcourt',
      timeZone: 'Africa/Lagos',
      availability: 'available_now',
    },
  });

  await prisma.contactDetail.upsert({
    where: { specialistProfileId: specialist.id },
    update: {},
    create: {
      specialistProfileId: specialist.id,
      phone: '+234 000 000 0000',
      whatsapp: '+234 000 000 0001',
      isSharedBySpecialist: false,
    },
  });

  await prisma.verification.create({
    data: {
      specialistProfileId: specialist.id,
      type: 'identity',
      status: 'in_review',
    },
  });

  await prisma.request.create({
    data: {
      businessProfileId: business.id,
      categoryId: design.id,
      brief: 'Need a product designer for a fintech onboarding flow.',
      scopeType: 'one_off_project',
      budgetKobo: 25000000,
      currency: 'NGN',
      timeline: 'Four weeks',
      locationPreference: 'Remote',
      status: 'submitted',
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
