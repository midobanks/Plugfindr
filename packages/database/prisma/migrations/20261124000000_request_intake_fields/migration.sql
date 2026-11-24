-- AlterTable
ALTER TABLE "Request" ADD COLUMN "budgetMaxKobo" INTEGER,
ADD COLUMN "budgetIsFlexible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "mustHaveSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "niceToHaveSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "attachmentLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
