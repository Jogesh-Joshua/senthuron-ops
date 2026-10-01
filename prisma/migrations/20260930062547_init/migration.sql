-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "EnquirySource" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'EMAIL', 'WEBSITE', 'REFERRAL', 'DIRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('WEB_DEVELOPMENT', 'MOBILE_APP', 'UI_UX_DESIGN', 'CUSTOM_SOFTWARE', 'MAINTENANCE_SUPPORT', 'CONSULTING', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'FOLLOW_UP_CHANGED', 'ASSIGNEE_CHANGED', 'DETAILS_UPDATED');

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "clientName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "phoneDigits" TEXT,
    "source" "EnquirySource" NOT NULL,
    "service" "ServiceType" NOT NULL,
    "description" TEXT NOT NULL,
    "budget" INTEGER,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "nextFollowUpAt" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_activities" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_members_name_key" ON "team_members"("name");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_number_key" ON "enquiries"("number");

-- CreateIndex
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");

-- CreateIndex
CREATE INDEX "enquiries_source_idx" ON "enquiries"("source");

-- CreateIndex
CREATE INDEX "enquiries_assignedToId_idx" ON "enquiries"("assignedToId");

-- CreateIndex
CREATE INDEX "enquiries_nextFollowUpAt_idx" ON "enquiries"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "enquiries_updatedAt_idx" ON "enquiries"("updatedAt");

-- CreateIndex
CREATE INDEX "enquiries_status_nextFollowUpAt_idx" ON "enquiries"("status", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "enquiry_activities_enquiryId_createdAt_idx" ON "enquiry_activities"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "enquiry_activities_createdAt_idx" ON "enquiry_activities"("createdAt");

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_activities" ADD CONSTRAINT "enquiry_activities_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
