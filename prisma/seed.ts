// prisma/seed.ts
// Realistic seed data for Senthuron Ops.
//
// Usage:
//   npm run db:seed          (requires --reset flag built into the script call)
//   npx tsx prisma/seed.ts --reset
//
// Follow-up dates are computed relative to TODAY so the dashboard always shows
// live overdue / due-today / upcoming states regardless of when you run the seed.

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type {
  EnquiryStatus,
  EnquirySource,
  ServiceType,
} from "../src/generated/prisma";

// ─── Load .env.local so DATABASE_URL is available when running via tsx ────────
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

// ─── Safety check ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (!args.includes("--reset")) {
  console.error(
    "❌ Safety: pass --reset to confirm you want to wipe and re-seed the database."
  );
  process.exit(1);
}

// ─── Prisma client with driver adapter (required by Prisma 7) ─────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns a Date set to midnight UTC for today ± offsetDays */
function daysFromToday(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

/** Returns a Date set to N days ago (for createdAt / updatedAt) */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Extracts only digit characters from a phone string */
function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Senthuron Ops database...");

  // ── 1. Wipe existing data (activity first due to FK cascade) ─────────────
  await prisma.enquiryActivity.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.teamMember.deleteMany();
  console.log("✓ Cleared existing data");

  // ── 2. Team members ───────────────────────────────────────────────────────
  const [priya, arun, sana, ravi, meera] = await Promise.all([
    prisma.teamMember.create({
      data: { name: "Priya R.", email: "priya@senthuron.example" },
    }),
    prisma.teamMember.create({
      data: { name: "Arun K.", email: "arun@senthuron.example" },
    }),
    prisma.teamMember.create({
      data: { name: "Sana N.", email: "sana@senthuron.example" },
    }),
    prisma.teamMember.create({
      data: { name: "Ravi M.", email: "ravi@senthuron.example" },
    }),
    prisma.teamMember.create({
      data: { name: "Meera S.", email: "meera@senthuron.example" },
    }),
  ]);
  console.log("✓ Created 5 team members");

  // ── 3. Enquiry factory ────────────────────────────────────────────────────
  type EnquiryInput = {
    clientName: string;
    contactPerson: string;
    email?: string;
    phone?: string;
    source: EnquirySource;
    service: ServiceType;
    description: string;
    budget?: number;
    status: EnquiryStatus;
    assignedToId?: string;
    nextFollowUpAt?: Date;
    notes?: string;
    createdDaysAgo: number;
    updatedDaysAgo?: number;
  };

  async function createEnquiry(data: EnquiryInput) {
    const phone = data.phone ?? null;
    const createdAt = daysAgo(data.createdDaysAgo);
    const updatedAt = data.updatedDaysAgo
      ? daysAgo(data.updatedDaysAgo)
      : createdAt;

    const enquiry = await prisma.enquiry.create({
      data: {
        clientName: data.clientName,
        contactPerson: data.contactPerson,
        email: data.email ?? null,
        phone,
        phoneDigits: phone ? extractDigits(phone) : null,
        source: data.source,
        service: data.service,
        description: data.description,
        budget: data.budget ?? null,
        status: data.status,
        assignedToId: data.assignedToId ?? null,
        nextFollowUpAt: data.nextFollowUpAt ?? null,
        notes: data.notes ?? null,
        createdAt,
        updatedAt,
        activities: {
          create: {
            type: "CREATED",
            createdAt,
          },
        },
      },
    });
    return enquiry;
  }

  // ── 4. Enquiries ──────────────────────────────────────────────────────────
  // Distribution target (30 enquiries):
  //  NEW(6) CONTACTED(5) QUALIFIED(6) PROPOSAL_SENT(4) NEGOTIATION(3) WON(5) LOST(8)
  //  Overdue: 3   Due today: 2   No follow-up (open): 1   Won: 5   Lost: 8

  const enquiries: EnquiryInput[] = [
    // ── OVERDUE (3) — open with nextFollowUpAt in the past ─────────────────
    {
      clientName: "Meridian Logistics",
      contactPerson: "Priya Raman",
      email: "priya@meridian.example",
      phone: "+91 98765 43210",
      source: "WHATSAPP",
      service: "CUSTOM_SOFTWARE",
      description:
        "Web-based dispatch and tracking tool for a 40-vehicle fleet. Needs real-time GPS integration, driver app, and customer portal for shipment status.",
      budget: 650000,
      status: "QUALIFIED",
      assignedToId: priya.id,
      nextFollowUpAt: daysFromToday(-6),
      notes: "Prefers calls after 4 pm. Decision maker is their CTO.",
      createdDaysAgo: 21,
      updatedDaysAgo: 7,
    },
    {
      clientName: "Bluepeak Clinics",
      contactPerson: "Dr. Arjun Khan",
      email: "khan@bluepeak.example",
      phone: "+91 80001 22334",
      source: "EMAIL",
      service: "WEB_DEVELOPMENT",
      description:
        "Patient appointment booking website with online payments, SMS reminders, and doctor schedule management. 3 clinic locations.",
      budget: 200000,
      status: "CONTACTED",
      assignedToId: arun.id,
      nextFollowUpAt: daysFromToday(-2),
      createdDaysAgo: 14,
      updatedDaysAgo: 3,
    },
    {
      clientName: "Harvest & Co",
      contactPerson: "Leela Menon",
      email: "leela@harvestandco.example",
      phone: "+91 90123 45678",
      source: "INSTAGRAM",
      service: "UI_UX_DESIGN",
      description:
        "Redesign of their e-commerce store (already built on Shopify). Need a fresh brand-aligned UI, better mobile experience, and checkout optimisation.",
      budget: 85000,
      status: "NEW",
      nextFollowUpAt: daysFromToday(-1),
      createdDaysAgo: 5,
      updatedDaysAgo: 2,
    },

    // ── DUE TODAY (2) ───────────────────────────────────────────────────────
    {
      clientName: "Northfield Studio",
      contactPerson: "Sameer Nair",
      email: "sameer@northfield.example",
      phone: "+91 99887 66554",
      source: "REFERRAL",
      service: "WEB_DEVELOPMENT",
      description:
        "Portfolio and booking website for a photography studio. Gallery with lazy-loading, calendar booking, and client proofing section.",
      budget: 120000,
      status: "PROPOSAL_SENT",
      assignedToId: sana.id,
      nextFollowUpAt: daysFromToday(0),
      notes: "Referred by Arun's contact at Kreative Co.",
      createdDaysAgo: 18,
      updatedDaysAgo: 4,
    },
    {
      clientName: "Kestrel Energy",
      contactPerson: "Deepa Varma",
      email: "deepa@kestrel.example",
      phone: "+91 77665 44332",
      source: "WEBSITE",
      service: "CUSTOM_SOFTWARE",
      description:
        "Internal tool for tracking solar panel installations. Field team uses mobile, office team needs reporting dashboard with export to PDF.",
      budget: 380000,
      status: "QUALIFIED",
      assignedToId: priya.id,
      nextFollowUpAt: daysFromToday(0),
      createdDaysAgo: 10,
      updatedDaysAgo: 1,
    },

    // ── NO FOLLOW-UP SET (open, 1) ──────────────────────────────────────────
    {
      clientName: "Ivory Row Interiors",
      contactPerson: "Fatima Sheikh",
      email: "fatima@ivoryrow.example",
      phone: "+91 88776 55443",
      source: "WHATSAPP",
      service: "UI_UX_DESIGN",
      description:
        "Brand identity and website for a luxury interior design studio. Wants a very refined, editorial look. Portfolio-heavy with a contact inquiry form.",
      status: "NEW",
      createdDaysAgo: 2,
      updatedDaysAgo: 2,
    },

    // ── UPCOMING follow-ups ─────────────────────────────────────────────────
    {
      clientName: "StellarBridge Consulting",
      contactPerson: "Rohan Das",
      email: "rohan@stellarbridge.example",
      phone: "+91 91234 56789",
      source: "DIRECT",
      service: "CONSULTING",
      description:
        "Digital transformation roadmap for a mid-size logistics company. Needs a discovery workshop first, then implementation planning.",
      budget: 150000,
      status: "CONTACTED",
      assignedToId: ravi.id,
      nextFollowUpAt: daysFromToday(2),
      notes: "Had a 45-minute discovery call. Very interested.",
      createdDaysAgo: 8,
      updatedDaysAgo: 3,
    },
    {
      clientName: "Pinecrest Academy",
      contactPerson: "Mr. Suresh Iyer",
      email: "principal@pinecrest.example",
      phone: "+91 94455 66778",
      source: "REFERRAL",
      service: "WEB_DEVELOPMENT",
      description:
        "School website with student portal, fee payment, event calendar, and parent communication module. Needs multilingual support (English + Tamil).",
      budget: 250000,
      status: "QUALIFIED",
      assignedToId: arun.id,
      nextFollowUpAt: daysFromToday(3),
      createdDaysAgo: 16,
      updatedDaysAgo: 5,
    },
    {
      clientName: "Coastal Brew Co",
      contactPerson: "Ananya Pillai",
      email: "ananya@coastalbrew.example",
      phone: "+91 96677 88990",
      source: "INSTAGRAM",
      service: "WEB_DEVELOPMENT",
      description:
        "E-commerce store for craft beer subscription boxes. Subscription management, age-gate, delivery zone checks, and Shopify backend.",
      budget: 180000,
      status: "PROPOSAL_SENT",
      assignedToId: sana.id,
      nextFollowUpAt: daysFromToday(5),
      createdDaysAgo: 22,
      updatedDaysAgo: 6,
    },
    {
      clientName: "Verdant Gardens",
      contactPerson: "Kavya Krishnan",
      email: "kavya@verdant.example",
      source: "WHATSAPP",
      service: "MOBILE_APP",
      description:
        "React Native app for a plant nursery chain. Customers can browse catalogue, book home delivery, and get care reminders via push notifications.",
      budget: 420000,
      status: "NEGOTIATION",
      assignedToId: priya.id,
      nextFollowUpAt: daysFromToday(7),
      notes: "Scope reduced from 4 platforms to 2. Revised quote sent.",
      createdDaysAgo: 30,
      updatedDaysAgo: 2,
    },
    {
      clientName: "Arcanum Law Partners",
      contactPerson: "Vikram Nambiar",
      email: "vikram@arcanum.example",
      phone: "+91 98001 23456",
      source: "REFERRAL",
      service: "CUSTOM_SOFTWARE",
      description:
        "Client case management system with document storage, billing integration, and court date tracking. Strict confidentiality requirements.",
      budget: 900000,
      status: "NEGOTIATION",
      assignedToId: ravi.id,
      nextFollowUpAt: daysFromToday(4),
      notes: "NDA signed. Legal team reviewing our service agreement.",
      createdDaysAgo: 25,
      updatedDaysAgo: 3,
    },

    // ── MORE NEW / CONTACTED ────────────────────────────────────────────────
    {
      clientName: "Zinnia Wellness",
      contactPerson: "Preethi Gopalan",
      email: "preethi@zinnia.example",
      phone: "+91 87654 32109",
      source: "INSTAGRAM",
      service: "MOBILE_APP",
      description:
        "Wellness tracking app with mood journaling, guided meditations, and habit streaks. iOS and Android. Subscription model.",
      budget: 550000,
      status: "CONTACTED",
      assignedToId: meera.id,
      nextFollowUpAt: daysFromToday(6),
      createdDaysAgo: 7,
      updatedDaysAgo: 2,
    },
    {
      clientName: "Rubix Analytics",
      contactPerson: "Siddharth Rao",
      email: "sid@rubix.example",
      phone: "+91 99001 11223",
      source: "WEBSITE",
      service: "CUSTOM_SOFTWARE",
      description:
        "B2B SaaS dashboard for retail analytics. Multi-tenant, role-based access, configurable KPI widgets, and CSV/Excel export.",
      budget: 1200000,
      status: "QUALIFIED",
      assignedToId: priya.id,
      nextFollowUpAt: daysFromToday(10),
      notes: "Pilot with 2 clients before full rollout.",
      createdDaysAgo: 19,
      updatedDaysAgo: 4,
    },
    {
      clientName: "Terracycle Waste",
      contactPerson: "Kiran Shetty",
      email: "kiran@terracycle.example",
      phone: "+91 90000 12345",
      source: "DIRECT",
      service: "WEB_DEVELOPMENT",
      description:
        "Corporate website and community portal for a recycling startup. Blog, volunteer sign-up, waste collection request form.",
      budget: 95000,
      status: "NEW",
      createdDaysAgo: 3,
      updatedDaysAgo: 3,
    },
    {
      clientName: "Moonsong Films",
      contactPerson: "Asha Balan",
      email: "asha@moonsong.example",
      source: "WHATSAPP",
      service: "UI_UX_DESIGN",
      description:
        "UX audit and redesign of their streaming platform prototype. Currently a Figma mockup; needs usability testing and final handoff.",
      budget: 60000,
      status: "CONTACTED",
      assignedToId: meera.id,
      nextFollowUpAt: daysFromToday(8),
      createdDaysAgo: 9,
      updatedDaysAgo: 2,
    },
    {
      clientName: "GridEdge Solar",
      contactPerson: "Anand Pillai",
      email: "anand@gridedge.example",
      phone: "+91 80123 45678",
      source: "EMAIL",
      service: "CUSTOM_SOFTWARE",
      description:
        "IoT dashboard for monitoring solar installations across 200+ sites. Real-time alerts, predictive maintenance ML module in Phase 2.",
      budget: 1500000,
      status: "PROPOSAL_SENT",
      assignedToId: ravi.id,
      nextFollowUpAt: daysFromToday(12),
      notes: "Very technical team — sent detailed spec document.",
      createdDaysAgo: 28,
      updatedDaysAgo: 7,
    },
    {
      clientName: "WaveRider Sports",
      contactPerson: "Nikhil Thomas",
      email: "nikhil@waverider.example",
      phone: "+91 94321 56789",
      source: "INSTAGRAM",
      service: "MOBILE_APP",
      description:
        "E-commerce mobile app for a surfing and water-sports gear brand. AR try-on feature, loyalty points, and event booking.",
      budget: 700000,
      status: "NEGOTIATION",
      assignedToId: arun.id,
      nextFollowUpAt: daysFromToday(9),
      createdDaysAgo: 35,
      updatedDaysAgo: 5,
    },
    {
      clientName: "Lotus Learning Hub",
      contactPerson: "Mrs. Rekha Pillai",
      email: "rekha@lotus.example",
      phone: "+91 98765 00001",
      source: "REFERRAL",
      service: "WEB_DEVELOPMENT",
      description:
        "Online learning platform for competitive exam preparation. Video lectures, quizzes, mock tests, leaderboard, and payment gateway.",
      budget: 480000,
      status: "QUALIFIED",
      assignedToId: sana.id,
      nextFollowUpAt: daysFromToday(14),
      createdDaysAgo: 20,
      updatedDaysAgo: 6,
    },

    // ── WON (5) ─────────────────────────────────────────────────────────────
    {
      clientName: "TerraFarms Co",
      contactPerson: "Geetha Sundaram",
      email: "geetha@terrafarms.example",
      phone: "+91 91000 22223",
      source: "REFERRAL",
      service: "MOBILE_APP",
      description:
        "Farm management mobile app with crop health tracking, weather alerts, and marketplace to sell produce directly to buyers.",
      budget: 850000,
      status: "WON",
      assignedToId: priya.id,
      notes: "Signed contract. Kickoff scheduled next week.",
      createdDaysAgo: 60,
      updatedDaysAgo: 15,
    },
    {
      clientName: "Helios Ed Tech",
      contactPerson: "Arjun Menon",
      email: "arjun@helios.example",
      phone: "+91 99000 55556",
      source: "WEBSITE",
      service: "CUSTOM_SOFTWARE",
      description:
        "AI-powered adaptive quiz engine for K-12 students. Personalised difficulty scaling and parent progress reports.",
      budget: 2200000,
      status: "WON",
      assignedToId: priya.id,
      notes: "Largest contract to date. 6-month project.",
      createdDaysAgo: 90,
      updatedDaysAgo: 30,
    },
    {
      clientName: "UrbanNest Realty",
      contactPerson: "Pradeep Sharma",
      email: "pradeep@urbannest.example",
      phone: "+91 80000 99998",
      source: "DIRECT",
      service: "WEB_DEVELOPMENT",
      description:
        "Real estate listing website with advanced search, virtual tour embedding, mortgage calculator, and agent CRM.",
      budget: 320000,
      status: "WON",
      assignedToId: arun.id,
      createdDaysAgo: 75,
      updatedDaysAgo: 25,
    },
    {
      clientName: "Swiftpack Logistics",
      contactPerson: "Ranjit Patel",
      email: "ranjit@swiftpack.example",
      phone: "+91 97777 33334",
      source: "WHATSAPP",
      service: "CUSTOM_SOFTWARE",
      description:
        "Last-mile delivery management system. Integrates with Google Maps, automatic route optimisation for 100+ daily deliveries.",
      budget: 580000,
      status: "WON",
      assignedToId: ravi.id,
      createdDaysAgo: 55,
      updatedDaysAgo: 20,
    },
    {
      clientName: "Saavan Music App",
      contactPerson: "Divya Nair",
      email: "divya@saavan.example",
      phone: "+91 99123 45670",
      source: "INSTAGRAM",
      service: "MOBILE_APP",
      description:
        "Music discovery app with curated playlists, artist profiles, and ticket booking for live events. React Native.",
      budget: 620000,
      status: "WON",
      assignedToId: sana.id,
      createdDaysAgo: 80,
      updatedDaysAgo: 35,
    },

    // ── LOST (8) ─────────────────────────────────────────────────────────────
    {
      clientName: "Quantum Fin Services",
      contactPerson: "Nitin Bose",
      email: "nitin@quantumfin.example",
      phone: "+91 98000 12345",
      source: "EMAIL",
      service: "CUSTOM_SOFTWARE",
      description:
        "Portfolio management dashboard for HNI clients. Real-time market data feeds, P&L visualisation.",
      budget: 1800000,
      status: "LOST",
      assignedToId: priya.id,
      notes: "Went with an in-house team. Followed up 3 times.",
      createdDaysAgo: 90,
      updatedDaysAgo: 45,
    },
    {
      clientName: "Fresco Food Tech",
      contactPerson: "Aishwarya Kumar",
      email: "aishwarya@fresco.example",
      source: "WHATSAPP",
      service: "MOBILE_APP",
      description:
        "Hyperlocal grocery delivery app. Real-time inventory, dark store management, and delivery partner tracking.",
      budget: 1100000,
      status: "LOST",
      assignedToId: arun.id,
      notes: "Budget cut. Shelved for 6 months. May revisit.",
      createdDaysAgo: 70,
      updatedDaysAgo: 40,
    },
    {
      clientName: "Skyline Architecture",
      contactPerson: "Mohit Joshi",
      email: "mohit@skyline.example",
      phone: "+91 77001 22333",
      source: "REFERRAL",
      service: "UI_UX_DESIGN",
      description:
        "3D virtual walkthrough web experience for their architectural projects. Needs Three.js or Babylon.js integration.",
      budget: 200000,
      status: "LOST",
      assignedToId: sana.id,
      notes: "Chose a cheaper freelancer. Quality concern.",
      createdDaysAgo: 50,
      updatedDaysAgo: 30,
    },
    {
      clientName: "DawnBreak Retail",
      contactPerson: "Ramesh Choudhary",
      email: "ramesh@dawnbreak.example",
      phone: "+91 98888 11122",
      source: "DIRECT",
      service: "WEB_DEVELOPMENT",
      description:
        "Multi-vendor marketplace for handmade crafts. Seller onboarding, commission management, and integrated shipping.",
      budget: 400000,
      status: "LOST",
      createdDaysAgo: 65,
      updatedDaysAgo: 50,
    },
    {
      clientName: "ClearPath Insurance",
      contactPerson: "Sneha Balaji",
      email: "sneha@clearpath.example",
      phone: "+91 80900 12345",
      source: "EMAIL",
      service: "CUSTOM_SOFTWARE",
      description:
        "Claims management portal for a mid-size insurance provider. Document upload, agent assignment, and status tracking.",
      budget: 750000,
      status: "LOST",
      assignedToId: ravi.id,
      notes: "Went with an established enterprise vendor (SAP module).",
      createdDaysAgo: 100,
      updatedDaysAgo: 60,
    },
    {
      clientName: "PurplePage Publishers",
      contactPerson: "Tanvi Rao",
      email: "tanvi@purplepage.example",
      source: "INSTAGRAM",
      service: "WEB_DEVELOPMENT",
      description:
        "Digital reading platform for regional language books. Reading progress tracking, offline reading mode, subscription tiers.",
      budget: 300000,
      status: "LOST",
      assignedToId: meera.id,
      notes: "Funding fell through. Team disbanded.",
      createdDaysAgo: 80,
      updatedDaysAgo: 55,
    },
    {
      clientName: "Atlas Sports Academy",
      contactPerson: "Coach Dhruv",
      email: "dhruv@atlas.example",
      phone: "+91 99900 44455",
      source: "WHATSAPP",
      service: "MOBILE_APP",
      description:
        "Coaching management app: player profiles, training schedules, performance tracking, and parent communication.",
      budget: 150000,
      status: "LOST",
      createdDaysAgo: 45,
      updatedDaysAgo: 35,
    },
    {
      clientName: "Mango Wave Travels",
      contactPerson: "Rashida Khan",
      email: "rashida@mangowavetravel.example",
      phone: "+91 87654 11111",
      source: "WEBSITE",
      service: "WEB_DEVELOPMENT",
      description:
        "Travel booking website with dynamic package builder, visa information, and travel blog CMS.",
      budget: 190000,
      status: "LOST",
      assignedToId: arun.id,
      notes: "Used a Wix template instead. Out of budget.",
      createdDaysAgo: 55,
      updatedDaysAgo: 45,
    },
  ];

  // Create all enquiries sequentially to preserve meaningful ENQ numbers
  let count = 0;
  for (const data of enquiries) {
    await createEnquiry(data);
    count++;
  }

  console.log(`✓ Created ${count} enquiries`);

  // ── 5. Add some status-change activity for the WON enquiries ─────────────
  const wonEnquiries = await prisma.enquiry.findMany({
    where: { status: "WON" },
    select: { id: true, createdAt: true },
  });

  for (const enq of wonEnquiries) {
    const progressions: Array<{ from: EnquiryStatus; to: EnquiryStatus; daysAfterCreate: number }> = [
      { from: "NEW", to: "CONTACTED", daysAfterCreate: 1 },
      { from: "CONTACTED", to: "QUALIFIED", daysAfterCreate: 7 },
      { from: "QUALIFIED", to: "PROPOSAL_SENT", daysAfterCreate: 14 },
      { from: "PROPOSAL_SENT", to: "NEGOTIATION", daysAfterCreate: 21 },
      { from: "NEGOTIATION", to: "WON", daysAfterCreate: 28 },
    ];

    for (const p of progressions) {
      const activityDate = new Date(enq.createdAt);
      activityDate.setDate(activityDate.getDate() + p.daysAfterCreate);
      await prisma.enquiryActivity.create({
        data: {
          enquiryId: enq.id,
          type: "STATUS_CHANGED",
          fromValue: p.from,
          toValue: p.to,
          createdAt: activityDate,
        },
      });
    }
  }

  // Add a status change for the LOST enquiries  
  const lostEnquiries = await prisma.enquiry.findMany({
    where: { status: "LOST" },
    select: { id: true, createdAt: true },
  });

  for (const enq of lostEnquiries) {
    const activityDate = new Date(enq.createdAt);
    activityDate.setDate(activityDate.getDate() + 15);
    await prisma.enquiryActivity.create({
      data: {
        enquiryId: enq.id,
        type: "STATUS_CHANGED",
        fromValue: "CONTACTED",
        toValue: "LOST",
        note: "Client did not proceed.",
        createdAt: activityDate,
      },
    });
  }

  console.log("✓ Added status-change activity for WON and LOST enquiries");

  // ── 6. Summary ────────────────────────────────────────────────────────────
  const stats = await prisma.enquiry.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const totalActivities = await prisma.enquiryActivity.count();

  console.log("\n📊 Seed summary:");
  for (const s of stats) {
    console.log(`   ${s.status.padEnd(15)} ${s._count._all}`);
  }
  console.log(`   ${"ACTIVITIES".padEnd(15)} ${totalActivities}`);
  console.log(`\n✅ Seed complete. Run the dev server and visit /api/health to verify.\n`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
