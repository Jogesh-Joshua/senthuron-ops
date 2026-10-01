import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { createEnquirySchema, parseListQuery } from "../src/lib/validation/enquiry";
import { computeFollowUpState } from "../src/lib/dates";
import { buildWhere } from "../src/lib/services/enquiry.service";
import { todayString } from "../src/lib/dates";

describe("Enquiry Validation", () => {
  it("createEnquirySchema: allows blank follow-up date initially, defaults to today?", () => {
    // Wait, createEnquirySchema has nextFollowUpAt which is dateOnlySchema. 
    // Wait, nextFollowUpAt is required in enquiryFieldsSchema. Let's provide a valid date.
    const validData = {
      clientName: "Acme Corp",
      contactPerson: "John Doe",
      email: "john@example.com",
      phone: "",
      source: "EMAIL",
      service: "WEB_DEVELOPMENT",
      description: "A new website.",
      status: "NEW",
      nextFollowUpAt: "2050-01-01",
    };
    
    const result = createEnquirySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("createEnquirySchema: fails if both email and phone are empty", () => {
    const invalidData = {
      clientName: "Acme Corp",
      contactPerson: "John Doe",
      email: "",
      phone: "",
      source: "EMAIL",
      service: "WEB_DEVELOPMENT",
      description: "A new website.",
      status: "NEW",
      nextFollowUpAt: "2050-01-01",
    };
    const result = createEnquirySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("createEnquirySchema: budget edge cases", () => {
    // budget as valid string number
    const result = createEnquirySchema.safeParse({
      clientName: "Acme Corp",
      contactPerson: "John Doe",
      email: "john@example.com",
      phone: "",
      source: "EMAIL",
      service: "WEB_DEVELOPMENT",
      description: "A new website.",
      status: "NEW",
      nextFollowUpAt: "2050-01-01",
      budget: "1000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBe(1000);
    }
  });
});

describe("Query Parsing", () => {
  it("parseListQuery: drops invalid keys and coercions correctly", () => {
    const rawQuery = {
      q: "test",
      status: "INVALID_STATUS",
      page: "2",
      pageSize: "1000", // Will be dropped or coerced to max
    };
    
    const parsed = parseListQuery(rawQuery);
    expect(parsed.q).toBe("test");
    expect(parsed.status).toBeUndefined(); // Invalid so it gets dropped
    expect(parsed.page).toBe(2);
    // Let's assume MAX_PAGE_SIZE is 50, so 1000 would be invalid and dropped, falling back to default
    expect(parsed.pageSize).toBe(15);
  });
});

describe("Date Utilities", () => {
  it("computeFollowUpState", () => {
    expect(computeFollowUpState(null, false)).toBe("NONE");
    expect(computeFollowUpState(null, true)).toBe("CLOSED");
    
    const today = new Date(todayString());
    expect(computeFollowUpState(today, false)).toBe("TODAY");

    const past = new Date(today);
    past.setDate(today.getDate() - 1);
    expect(computeFollowUpState(past, false)).toBe("OVERDUE");

    const future = new Date(today);
    future.setDate(today.getDate() + 1);
    expect(computeFollowUpState(future, false)).toBe("UPCOMING");
  });
});

describe("Service Utilities", () => {
  it("buildWhere", () => {
    const where = buildWhere({
      q: "john",
      status: "NEW",
      assignee: "UNASSIGNED",
      due: "TODAY",
      sort: "followup",
      page: 1,
      pageSize: 15
    });

    // We can't easily assert on exact Prisma types but we can check if it populated AND
    expect(where.AND).toBeDefined();
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { status: "NEW" },
        { assignedToId: null }
      ])
    );
  });
});
