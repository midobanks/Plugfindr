import type { RequestReceipt, RequestStore } from '@plugfindr/adapters';
import { ValidationError } from '@plugfindr/domain';
import type { UserId, ValidatedRequestBrief } from '@plugfindr/domain';
import { prisma } from './client';

export class PrismaRequestStore implements RequestStore {
  async create(input: {
    actorId: UserId;
    brief: ValidatedRequestBrief;
    submittedAt: Date;
  }): Promise<RequestReceipt> {
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: input.actorId },
      select: { id: true },
    });
    if (businessProfile === null) {
      throw new ValidationError('A business profile is required before submitting a request');
    }

    const category = await prisma.category.findUnique({
      where: { slug: input.brief.category },
      select: { id: true },
    });
    if (category === null) {
      throw new ValidationError('Choose a valid category');
    }

    const request = await prisma.request.create({
      data: {
        businessProfileId: businessProfile.id,
        categoryId: category.id,
        brief: input.brief.brief,
        scopeType: input.brief.scopeType,
        budgetKobo: input.brief.budgetMinKobo,
        budgetMaxKobo: input.brief.budgetMaxKobo,
        budgetIsFlexible: input.brief.budgetIsFlexible,
        currency: 'NGN',
        timeline: input.brief.timeline,
        locationPreference: input.brief.locationPreference,
        mustHaveSkills: [...input.brief.mustHaveSkills],
        niceToHaveSkills: [...input.brief.niceToHaveSkills],
        attachmentLinks: [...input.brief.attachmentLinks],
        status: 'submitted',
      },
      select: { id: true, createdAt: true },
    });

    return { id: request.id, status: 'submitted', submittedAt: request.createdAt };
  }
}
