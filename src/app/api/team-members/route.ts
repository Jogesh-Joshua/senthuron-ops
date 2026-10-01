// src/app/api/team-members/route.ts
// GET /api/team-members — list all team members for selects and filters

import { withErrorHandling, ok } from "@/lib/api-response";
import { listTeamMembers } from "@/lib/services/enquiry.service";

export const GET = withErrorHandling(async () => {
  const members = await listTeamMembers();
  return ok(members);
});
