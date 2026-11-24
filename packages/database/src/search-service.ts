import type { PublicSpecialistDocument, SearchFilters, SearchService } from '@plugfindr/adapters';
import { asId, SPECIALIST_CATEGORIES, toPublicSpecialist } from '@plugfindr/domain';
import type {
  AvailabilityStatus,
  SpecialistCategory,
  SpecialistId,
  VerificationId,
  VerificationRecord,
  VerificationState,
  VerificationType,
} from '@plugfindr/domain';
import type { Prisma, PrismaClient } from './generated/prisma/client';

export class PrismaSearchService implements SearchService {
  constructor(
    private readonly client: PrismaClient,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async indexSpecialist(): Promise<void> {
    throw new Error('PrismaSearchService uses PostgreSQL as the source of truth');
  }

  async removeSpecialist(): Promise<void> {
    throw new Error('PrismaSearchService uses PostgreSQL as the source of truth');
  }

  async search(
    query: string,
    filters?: SearchFilters,
  ): Promise<readonly PublicSpecialistDocument[]> {
    const now = this.clock();
    const needle = query.trim();
    const conditions: Prisma.SpecialistProfileWhereInput[] = [
      {
        status: 'approved',
        deletedAt: null,
        verifications: {
          some: {
            type: 'identity',
            status: 'approved',
            verifiedAt: { not: null },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
    ];

    if (needle.length > 0) {
      conditions.push({
        OR: [
          { headline: { contains: needle, mode: 'insensitive' } },
          { user: { displayName: { contains: needle, mode: 'insensitive' } } },
          { skills: { some: { skill: { name: { contains: needle, mode: 'insensitive' } } } } },
        ],
      });
    }
    if (filters?.category !== undefined) {
      conditions.push({
        skills: { some: { skill: { category: { slug: filters.category } } } },
      });
    }
    if (filters?.availableOnly === true) {
      conditions.push({ availability: 'available_now' });
    }
    if (filters?.location !== undefined && filters.location.trim().length > 0) {
      conditions.push({ location: { contains: filters.location, mode: 'insensitive' } });
    }

    const rows = await this.client.specialistProfile.findMany({
      where: { AND: conditions },
      include: {
        user: { select: { displayName: true } },
        skills: { include: { skill: { include: { category: true } } } },
        verifications: {
          select: { id: true, type: true, status: true, verifiedAt: true, expiresAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const documents: PublicSpecialistDocument[] = [];
    for (const row of rows) {
      const specialistId = asId<SpecialistId>(row.id);
      const categorySlug = row.skills.find((item) => item.skill.category !== null)?.skill.category
        ?.slug;
      const category = SPECIALIST_CATEGORIES.find((value) => value === categorySlug) ?? null;
      const verifications: readonly VerificationRecord[] = row.verifications.map((item) => ({
        id: asId<VerificationId>(item.id),
        specialistId,
        type: item.type as VerificationType,
        status: item.status as VerificationState,
        verifiedAt: item.verifiedAt,
        expiresAt: item.expiresAt,
      }));

      const document = toPublicSpecialist(
        {
          specialistId,
          name: row.user.displayName,
          headline: row.headline,
          category: category as SpecialistCategory | null,
          skills: row.skills.map((item) => item.skill.name),
          location: row.location,
          availability: row.availability as AvailabilityStatus | null,
          yearsExperience: row.yearsExperience,
          rateFromKobo: null,
          profileStatus: row.status,
          verifications,
        },
        now,
      );
      if (document !== null) documents.push(document);
    }
    return documents;
  }
}
