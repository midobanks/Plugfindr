-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('business', 'specialist', 'reviewer', 'matcher', 'trust_safety', 'support', 'admin', 'finance');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('pending', 'approved', 'suspended');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('identity', 'contact', 'portfolio', 'credentials', 'reference', 'skill', 'proven', 'business');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('not_started', 'submitted', 'in_review', 'approved', 'rejected', 'needs_more_info', 'expired');

-- CreateEnum
CREATE TYPE "RequestState" AS ENUM ('submitted', 'matching', 'matches_ready', 'in_conversation', 'hired', 'closed');

-- CreateEnum
CREATE TYPE "IntroductionStatus" AS ENUM ('requested', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('introduced', 'in_discussion', 'hired', 'in_progress', 'completed', 'not_proceeding');

-- CreateEnum
CREATE TYPE "ReportState" AS ENUM ('open', 'in_review', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "googleSubject" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'pending',
    "headline" TEXT NOT NULL,
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "location" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "availability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SpecialistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactDetail" (
    "id" TEXT NOT NULL,
    "specialistProfileId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "isSharedBySpecialist" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialistSkill" (
    "specialistProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "SpecialistSkill_pkey" PRIMARY KEY ("specialistProfileId","skillId")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "specialistProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "role" TEXT,
    "outcome" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "specialistProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "specialistProfileId" TEXT,
    "businessProfileId" TEXT,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationState" NOT NULL DEFAULT 'not_started',
    "providerReference" TEXT,
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "categoryId" TEXT,
    "brief" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "budgetKobo" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "timeline" TEXT,
    "locationPreference" TEXT,
    "status" "RequestState" NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "specialistProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "reasons" JSONB NOT NULL,
    "optedIn" BOOLEAN NOT NULL DEFAULT false,
    "businessFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Introduction" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "matchId" TEXT,
    "businessProfileId" TEXT NOT NULL,
    "specialistProfileId" TEXT NOT NULL,
    "status" "IntroductionStatus" NOT NULL DEFAULT 'requested',
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Introduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "introductionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "introductionId" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "specialistProfileId" TEXT NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'introduced',
    "amountKobo" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL,
    "timeline" TEXT,
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "reliability" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "comment" TEXT,
    "privateFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportState" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialistProfile_userId_key" ON "SpecialistProfile"("userId");

-- CreateIndex
CREATE INDEX "SpecialistProfile_status_idx" ON "SpecialistProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContactDetail_specialistProfileId_key" ON "ContactDetail"("specialistProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Verification_status_expiresAt_idx" ON "Verification"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Verification_specialistProfileId_type_idx" ON "Verification"("specialistProfileId", "type");

-- CreateIndex
CREATE INDEX "Request_status_createdAt_idx" ON "Request"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Match_requestId_idx" ON "Match"("requestId");

-- CreateIndex
CREATE INDEX "Introduction_specialistProfileId_status_idx" ON "Introduction"("specialistProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_introductionId_key" ON "Conversation"("introductionId");

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_introductionId_key" ON "Engagement"("introductionId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_engagementId_key" ON "Review"("engagementId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistProfile" ADD CONSTRAINT "SpecialistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactDetail" ADD CONSTRAINT "ContactDetail_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistSkill" ADD CONSTRAINT "SpecialistSkill_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistSkill" ADD CONSTRAINT "SpecialistSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "Verification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_introductionId_fkey" FOREIGN KEY ("introductionId") REFERENCES "Introduction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_introductionId_fkey" FOREIGN KEY ("introductionId") REFERENCES "Introduction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_specialistProfileId_fkey" FOREIGN KEY ("specialistProfileId") REFERENCES "SpecialistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
