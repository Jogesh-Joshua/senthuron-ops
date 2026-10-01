-- Remove QA test data before demo
-- Run: npx prisma db execute --file ./prisma/remove-test-data.sql --schema ./prisma/schema.prisma

-- Activities are cascade-deleted via FK on enquiry
DELETE FROM "Enquiry" WHERE "clientName" ILIKE '%test%';
