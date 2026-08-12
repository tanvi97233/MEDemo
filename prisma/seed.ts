import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const date = (value: string) => new Date(`${value}T12:00:00.000Z`);

async function main() {
  await prisma.session.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.report.deleteMany();
  await prisma.dataField.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.theoryOfChangeNode.deleteMany();
  await prisma.programmeTaxonomy.deleteMany();
  await prisma.taxonomyNode.deleteMany();
  await prisma.grant.deleteMany();
  await prisma.frameworkRequirement.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.funder.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organisation.deleteMany();

  const org = await prisma.organisation.create({
    data: {
      name: "Sankalp Community Foundation",
      country: "India",
      mission:
        "Enable women and young people to live healthier, more secure and self-determined lives.",
    },
  });
  const passwordHash = await hash("EvalCanvas!2026", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Asha Mehta",
      email: "asha@demo.evalcanvas.org",
      passwordHash,
      role: "ADMIN",
      organisationId: org.id,
    },
  });
  await prisma.user.createMany({
    data: [
      {
        name: "Rohan Das",
        email: "rohan@demo.evalcanvas.org",
        passwordHash,
        role: "ME_MANAGER",
        organisationId: org.id,
      },
      {
        name: "Meera Singh",
        email: "meera@demo.evalcanvas.org",
        passwordHash,
        role: "DATA_COLLECTOR",
        organisationId: org.id,
      },
    ],
  });

  const maternal = await prisma.programme.create({
    data: {
      organisationId: org.id,
      name: "Swasth Maa",
      code: "SM-2026",
      description:
        "Community-led maternal health programme improving access to quality antenatal and postnatal care.",
      problemStatement:
        "Women in remote blocks face delayed registration, low continuity of antenatal care, and preventable maternal risk.",
      geography: "Nandurbar, Maharashtra",
      targetPopulation: "Pregnant women and new mothers in 42 villages",
      startDate: date("2026-01-01"),
      endDate: date("2028-12-31"),
      budget: 24000000,
      objectives:
        "Increase early ANC registration; improve completion of four ANC visits; strengthen timely high-risk referrals.",
      activities:
        "Community mobilization, home visits, ANC camps, referral coordination, frontline worker coaching.",
      outputs:
        "Women counselled; ANC visits completed; high-risk pregnancies referred.",
      outcomes: "Improved service uptake and continuity of maternal care.",
      impact: "Reduced preventable maternal and neonatal morbidity.",
      partners: "District Health Society; Janani Network",
    },
  });
  const livelihoods = await prisma.programme.create({
    data: {
      organisationId: org.id,
      name: "Udaan Livelihoods",
      code: "UL-2026",
      description:
        "Skills, enterprise support and market linkage for rural women and youth.",
      problemStatement:
        "Young people and women lack market-aligned skills, affordable capital, and reliable buyer networks.",
      geography: "Dhar and Jhabua, Madhya Pradesh",
      targetPopulation: "1,500 women and youth aged 18–35",
      startDate: date("2025-07-01"),
      endDate: date("2027-06-30"),
      budget: 18000000,
      objectives:
        "Improve job readiness; increase sustainable employment and enterprise income.",
      activities:
        "Skills training, mentoring, seed grants, employer and market linkages.",
      outputs:
        "Participants trained; enterprises launched; placement interviews completed.",
      outcomes: "Increased employment and median monthly income.",
      impact: "More resilient and equitable rural livelihoods.",
      partners: "Rural Skills Collective; Women Enterprise Federation",
    },
  });

  const [azim, tata, district] = await Promise.all([
    prisma.funder.create({
      data: {
        organisationId: org.id,
        name: "Azim Premji Philanthropic Initiatives",
        type: "FOUNDATION",
        website: "https://www.azimpremjifoundation.org",
        primaryContact: "Kavita Rao",
        contactEmail: "kavita.rao@example.org",
        notes: "Maternal health systems strengthening partner.",
      },
    }),
    prisma.funder.create({
      data: {
        organisationId: org.id,
        name: "Tata Trusts",
        type: "FOUNDATION",
        website: "https://www.tatatrusts.org",
        primaryContact: "Nikhil Shah",
        contactEmail: "nikhil.shah@example.org",
        notes: "Livelihoods and enterprise development partner.",
      },
    }),
    prisma.funder.create({
      data: {
        organisationId: org.id,
        name: "District CSR Consortium",
        type: "CORPORATE_CSR",
        website: "https://example.org/district-csr",
        primaryContact: "Priya Menon",
        contactEmail: "priya.menon@example.org",
        notes: "CSR co-funder focused on measurable community outcomes.",
      },
    }),
  ]);

  const brsr = await prisma.framework.create({
    data: {
      name: "BRSR",
      description:
        "Business Responsibility and Sustainability Reporting-aligned social impact disclosures.",
    },
  });
  const csr2 = await prisma.framework.create({
    data: {
      name: "CSR-2",
      description:
        "Indian CSR annual reporting requirements for implementing agencies and companies.",
    },
  });
  const sdg = await prisma.framework.create({
    data: {
      name: "Sustainable Development Goals (SDGs)",
      description: "United Nations global goals and indicator alignment.",
    },
  });
  await prisma.framework.create({
    data: {
      name: "CSR annual action plan/reporting",
      description: "Annual action plan and board reporting structure.",
    },
  });
  await prisma.framework.create({
    data: {
      name: "Custom framework",
      description:
        "Organisation-defined monitoring and reporting requirements.",
    },
  });
  const reqHealth = await prisma.frameworkRequirement.create({
    data: {
      frameworkId: sdg.id,
      code: "SDG 3.1",
      title: "Maternal mortality",
      description:
        "Track access to and outcomes of essential maternal health services.",
    },
  });
  const reqEquity = await prisma.frameworkRequirement.create({
    data: {
      frameworkId: brsr.id,
      code: "BRSR-P8",
      title: "Inclusive growth",
      description: "Demonstrate reach to vulnerable and marginalized groups.",
    },
  });
  const reqCsr = await prisma.frameworkRequirement.create({
    data: {
      frameworkId: csr2.id,
      code: "CSR2-6",
      title: "Impact and beneficiaries",
      description: "Report project outputs, outcomes and beneficiary coverage.",
    },
  });

  const grantHealth = await prisma.grant.create({
    data: {
      name: "Maternal Health Continuum Grant",
      amount: 15000000,
      currency: "INR",
      startDate: date("2026-01-01"),
      endDate: date("2027-12-31"),
      reportingFrequency: "Quarterly",
      nextReportDate: date("2026-09-15"),
      programmeId: maternal.id,
      funderId: azim.id,
      frameworkId: sdg.id,
      requirements:
        "Quarterly reach, ANC continuity, referral completion, equity disaggregation and learning narrative.",
    },
  });
  const grantCsrHealth = await prisma.grant.create({
    data: {
      name: "Healthy Villages CSR Partnership",
      amount: 9000000,
      currency: "INR",
      startDate: date("2026-04-01"),
      endDate: date("2028-03-31"),
      reportingFrequency: "Half-yearly",
      nextReportDate: date("2026-10-10"),
      programmeId: maternal.id,
      funderId: district.id,
      frameworkId: csr2.id,
      requirements:
        "CSR-2 output and beneficiary disclosure with geography and gender disaggregation.",
    },
  });
  const grantLivelihood = await prisma.grant.create({
    data: {
      name: "Udaan Enterprise Accelerator",
      amount: 12000000,
      currency: "INR",
      startDate: date("2025-07-01"),
      endDate: date("2027-06-30"),
      reportingFrequency: "Quarterly",
      nextReportDate: date("2026-09-30"),
      programmeId: livelihoods.id,
      funderId: tata.id,
      frameworkId: brsr.id,
      requirements:
        "Training completion, placement, enterprise survival, income change and inclusion.",
    },
  });
  const grantCsrLivelihood = await prisma.grant.create({
    data: {
      name: "Youth Futures Co-funding",
      amount: 6000000,
      currency: "INR",
      startDate: date("2026-04-01"),
      endDate: date("2027-03-31"),
      reportingFrequency: "Annual",
      nextReportDate: date("2027-04-15"),
      programmeId: livelihoods.id,
      funderId: district.id,
      frameworkId: csr2.id,
      requirements: "Annual outcome reporting and beneficiary evidence.",
    },
  });

  const health = await prisma.taxonomyNode.create({
    data: { name: "Health", level: "SECTOR" },
  });
  const maternalNode = await prisma.taxonomyNode.create({
    data: { name: "Maternal Health", level: "SUB_SECTOR", parentId: health.id },
  });
  const anc = await prisma.taxonomyNode.create({
    data: {
      name: "Antenatal Care",
      level: "SUB_SUB_SECTOR",
      parentId: maternalNode.id,
    },
  });
  const economic = await prisma.taxonomyNode.create({
    data: { name: "Economic Empowerment", level: "SECTOR" },
  });
  const skills = await prisma.taxonomyNode.create({
    data: {
      name: "Skills & Employment",
      level: "SUB_SECTOR",
      parentId: economic.id,
    },
  });
  const enterprise = await prisma.taxonomyNode.create({
    data: {
      name: "Enterprise Development",
      level: "SUB_SUB_SECTOR",
      parentId: skills.id,
    },
  });
  const education = await prisma.taxonomyNode.create({
    data: { name: "Education", level: "SECTOR" },
  });
  const foundational = await prisma.taxonomyNode.create({
    data: {
      name: "Foundational Learning",
      level: "SUB_SECTOR",
      parentId: education.id,
    },
  });
  await prisma.taxonomyNode.create({
    data: {
      name: "Early Grade Literacy",
      level: "SUB_SUB_SECTOR",
      parentId: foundational.id,
    },
  });
  const wash = await prisma.taxonomyNode.create({
    data: { name: "Water, Sanitation & Hygiene", level: "SECTOR" },
  });
  const ruralWash = await prisma.taxonomyNode.create({
    data: { name: "Rural WASH", level: "SUB_SECTOR", parentId: wash.id },
  });
  await prisma.taxonomyNode.create({
    data: {
      name: "Safe Water Access",
      level: "SUB_SUB_SECTOR",
      parentId: ruralWash.id,
    },
  });
  const climate = await prisma.taxonomyNode.create({
    data: { name: "Climate & Environment", level: "SECTOR" },
  });
  const resilience = await prisma.taxonomyNode.create({
    data: {
      name: "Climate Resilience",
      level: "SUB_SECTOR",
      parentId: climate.id,
    },
  });
  await prisma.taxonomyNode.create({
    data: {
      name: "Community Adaptation",
      level: "SUB_SUB_SECTOR",
      parentId: resilience.id,
    },
  });
  await prisma.programmeTaxonomy.createMany({
    data: [
      { programmeId: maternal.id, taxonomyNodeId: health.id, confidence: 0.98 },
      {
        programmeId: maternal.id,
        taxonomyNodeId: maternalNode.id,
        confidence: 0.96,
      },
      { programmeId: maternal.id, taxonomyNodeId: anc.id, confidence: 0.93 },
      {
        programmeId: livelihoods.id,
        taxonomyNodeId: economic.id,
        confidence: 0.97,
      },
      {
        programmeId: livelihoods.id,
        taxonomyNodeId: skills.id,
        confidence: 0.94,
      },
      {
        programmeId: livelihoods.id,
        taxonomyNodeId: enterprise.id,
        confidence: 0.89,
      },
    ],
  });
  for (const [programmeId, nodes] of [
    [
      maternal.id,
      [
        [
          "INPUT",
          "Trained frontline workers",
          "Coaching, data tools and referral partnerships are available.",
        ],
        [
          "ACTIVITY",
          "Deliver community ANC outreach",
          "Home visits and camps reach remote villages.",
        ],
        [
          "OUTPUT",
          "Women complete essential ANC contacts",
          "Services are respectful and supplies remain available.",
        ],
        [
          "OUTCOME",
          "Maternal risks identified and managed early",
          "Referral facilities accept and treat clients promptly.",
        ],
        [
          "IMPACT",
          "Safer pregnancies and births",
          "Health-system quality continues to improve.",
        ],
      ],
    ],
    [
      livelihoods.id,
      [
        [
          "INPUT",
          "Trainers, mentors and market partners",
          "Training content reflects local demand.",
        ],
        [
          "ACTIVITY",
          "Deliver skills and enterprise support",
          "Participants can attend safely and consistently.",
        ],
        [
          "OUTPUT",
          "Participants complete pathways",
          "Employers and buyers remain engaged.",
        ],
        [
          "OUTCOME",
          "Employment and enterprise incomes increase",
          "Economic opportunities remain accessible.",
        ],
        [
          "IMPACT",
          "Resilient household livelihoods",
          "Income gains translate into agency and wellbeing.",
        ],
      ],
    ],
  ] as const) {
    await prisma.theoryOfChangeNode.createMany({
      data: nodes.map((n, i) => ({
        programmeId,
        level: n[0],
        title: n[1],
        description: n[1],
        assumptions: n[2],
        sortOrder: i + 1,
      })),
    });
  }

  const definitions = [
    [
      maternal.id,
      grantHealth.id,
      reqHealth.id,
      "Pregnant women registered before 12 weeks",
      "Share of registered pregnancies with ANC registration before 12 completed weeks.",
      "OUTCOME",
      "%",
      42,
      75,
      68,
      "AT_RISK",
      92,
    ],
    [
      maternal.id,
      grantHealth.id,
      reqHealth.id,
      "Women completing at least four ANC visits",
      "Women with four or more documented ANC contacts during pregnancy.",
      "OUTCOME",
      "%",
      38,
      70,
      74,
      "ON_TRACK",
      96,
    ],
    [
      maternal.id,
      grantCsrHealth.id,
      reqCsr.id,
      "Pregnant women reached",
      "Unique pregnant women receiving at least one programme-supported service.",
      "OUTPUT",
      "people",
      0,
      1200,
      876,
      "AT_RISK",
      94,
    ],
    [
      maternal.id,
      grantHealth.id,
      reqHealth.id,
      "High-risk referrals completed",
      "Identified high-risk pregnancies reaching a referral facility within 48 hours.",
      "OUTCOME",
      "%",
      51,
      85,
      57,
      "OFF_TRACK",
      88,
    ],
    [
      maternal.id,
      grantCsrHealth.id,
      reqCsr.id,
      "Frontline workers coached",
      "Workers completing one structured coaching cycle in the period.",
      "OUTPUT",
      "people",
      0,
      84,
      84,
      "ON_TRACK",
      100,
    ],
    [
      livelihoods.id,
      grantLivelihood.id,
      reqEquity.id,
      "Participants completing training",
      "Enrolled participants completing at least 80% of course hours.",
      "OUTPUT",
      "people",
      0,
      900,
      712,
      "ON_TRACK",
      97,
    ],
    [
      livelihoods.id,
      grantLivelihood.id,
      reqEquity.id,
      "Graduates employed within 90 days",
      "Training graduates in wage or self-employment within 90 days.",
      "OUTCOME",
      "%",
      22,
      65,
      59,
      "AT_RISK",
      91,
    ],
    [
      livelihoods.id,
      grantLivelihood.id,
      reqEquity.id,
      "Median monthly income increase",
      "Percentage change in median monthly income from baseline.",
      "OUTCOME",
      "%",
      0,
      30,
      34,
      "ON_TRACK",
      83,
    ],
    [
      livelihoods.id,
      grantCsrLivelihood.id,
      reqCsr.id,
      "Women-led enterprises launched",
      "New women-led enterprises receiving seed or market support.",
      "OUTPUT",
      "enterprises",
      0,
      180,
      126,
      "AT_RISK",
      90,
    ],
    [
      livelihoods.id,
      grantCsrLivelihood.id,
      reqCsr.id,
      "Enterprises operating after six months",
      "Supported enterprises still trading six months after launch.",
      "OUTCOME",
      "%",
      0,
      75,
      49,
      "OFF_TRACK",
      72,
    ],
  ] as const;
  const indicators = [];
  for (const d of definitions) {
    indicators.push(
      await prisma.indicator.create({
        data: {
          programmeId: d[0],
          grantId: d[1],
          requirementId: d[2],
          name: d[3],
          definition: d[4],
          resultLevel: d[5],
          formula:
            d[6] === "%"
              ? "(eligible numerator / eligible denominator) × 100"
              : "Count of unique valid records",
          numerator:
            d[6] === "%" ? "Records meeting indicator condition" : null,
          denominator: d[6] === "%" ? "All eligible valid records" : null,
          unit: d[6],
          baseline: d[7],
          target: d[8],
          actual: d[9],
          status: d[10],
          completeness: d[11],
          frequency: "Quarterly",
          dataSource: "UniCollector beneficiary monitoring",
          collectionMethod: "Structured digital form",
          responsiblePerson: "M&E Manager",
          disaggregation: "Gender, age group, geography, disability",
          objective:
            d[0] === maternal.id
              ? "Improve continuity and quality of maternal care"
              : "Increase sustainable employment and enterprise income",
          qualityRules:
            "Required values; valid range; unique beneficiary-period; supervisor spot-check",
          lastUpdated: date("2026-08-05"),
        },
      }),
    );
  }
  const fields = [];
  for (const data of [
    [
      maternal.id,
      indicators[2].id,
      "service_received",
      "Maternal service received",
      "Which programme-supported service did the participant receive?",
      "SELECT",
      "ANC registration|ANC visit|Referral|Postnatal visit",
    ],
    [
      maternal.id,
      indicators[1].id,
      "anc_visits",
      "Number of ANC visits",
      "How many documented ANC visits has the participant completed?",
      "NUMBER",
      null,
    ],
    [
      maternal.id,
      indicators[3].id,
      "referral_completed",
      "Referral completed",
      "If referred, was the referral completed within 48 hours?",
      "BOOLEAN",
      null,
    ],
    [
      livelihoods.id,
      indicators[5].id,
      "training_hours",
      "Training attendance",
      "How many training hours has the participant completed?",
      "NUMBER",
      null,
    ],
    [
      livelihoods.id,
      indicators[6].id,
      "employment_status",
      "Employment status",
      "What is the participant's current employment status?",
      "SELECT",
      "Employed|Self-employed|Seeking work|Not available",
    ],
    [
      livelihoods.id,
      indicators[7].id,
      "monthly_income",
      "Monthly income",
      "What was the participant's income in the last 30 days (INR)?",
      "NUMBER",
      null,
    ],
  ] as const)
    fields.push(
      await prisma.dataField.create({
        data: {
          programmeId: data[0],
          indicatorId: data[1],
          key: data[2],
          label: data[3],
          question: data[4],
          type: data[5],
          options: data[6],
          required: true,
        },
      }),
    );

  const sampleRows = [
    [
      maternal.id,
      grantHealth.id,
      "2026 Q1",
      "Akkalkuwa",
      "SM-0108",
      "Woman",
      "25–34",
      "No",
      fields[1],
      4,
      null,
      date("2026-03-28"),
    ],
    [
      maternal.id,
      grantHealth.id,
      "2026 Q2",
      "Dhadgaon",
      "SM-0342",
      "Woman",
      "18–24",
      "No",
      fields[1],
      3,
      null,
      date("2026-06-27"),
    ],
    [
      maternal.id,
      grantCsrHealth.id,
      "2026 Q2",
      "Taloda",
      "SM-0419",
      "Woman",
      "25–34",
      "Yes",
      fields[0],
      null,
      "ANC visit",
      date("2026-06-29"),
    ],
    [
      maternal.id,
      grantHealth.id,
      "2026 Q3",
      "Akkalkuwa",
      "SM-0588",
      "Woman",
      "18–24",
      "No",
      fields[2],
      1,
      null,
      date("2026-08-03"),
    ],
    [
      livelihoods.id,
      grantLivelihood.id,
      "2026 Q1",
      "Dhar",
      "UL-0201",
      "Woman",
      "18–24",
      "No",
      fields[3],
      96,
      null,
      date("2026-03-30"),
    ],
    [
      livelihoods.id,
      grantLivelihood.id,
      "2026 Q2",
      "Jhabua",
      "UL-0512",
      "Man",
      "25–34",
      "No",
      fields[4],
      null,
      "Employed",
      date("2026-06-26"),
    ],
    [
      livelihoods.id,
      grantLivelihood.id,
      "2026 Q2",
      "Dhar",
      "UL-0604",
      "Woman",
      "25–34",
      "Yes",
      fields[5],
      12400,
      null,
      date("2026-06-28"),
    ],
    [
      livelihoods.id,
      grantCsrLivelihood.id,
      "2026 Q3",
      "Jhabua",
      "UL-0798",
      "Woman",
      "18–24",
      "No",
      fields[4],
      null,
      "Self-employed",
      date("2026-08-04"),
    ],
  ] as const;
  for (const row of sampleRows) {
    const submission = await prisma.submission.create({
      data: {
        programmeId: row[0],
        grantId: row[1],
        reportingPeriod: row[2],
        location: row[3],
        beneficiaryId: row[4],
        gender: row[5],
        ageGroup: row[6],
        disability: row[7],
        consent: true,
        submittedById: admin.id,
        submittedAt: row[11],
        source: "UniCollector",
        validationStatus: "VALID",
      },
    });
    await prisma.observation.create({
      data: {
        submissionId: submission.id,
        dataFieldId: row[8].id,
        indicatorId: row[8].indicatorId,
        numericValue: row[9],
        textValue: row[10],
        date: row[11],
      },
    });
  }
  await prisma.alert.createMany({
    data: [
      {
        programmeId: maternal.id,
        grantId: grantHealth.id,
        indicatorId: indicators[3].id,
        type: "BELOW_TARGET",
        severity: "HIGH",
        reason:
          "High-risk referral completion is 28 percentage points below target.",
        owner: "Rohan Das",
        status: "OPEN",
        triggeredAt: date("2026-08-05"),
      },
      {
        programmeId: livelihoods.id,
        grantId: grantCsrLivelihood.id,
        indicatorId: indicators[9].id,
        type: "LOW_COMPLETENESS",
        severity: "HIGH",
        reason: "Enterprise follow-up completeness is 72%, below the 80% rule.",
        owner: "Rohan Das",
        status: "ACKNOWLEDGED",
        triggeredAt: date("2026-08-04"),
      },
      {
        programmeId: maternal.id,
        grantId: grantHealth.id,
        type: "REPORT_DUE",
        severity: "MEDIUM",
        reason: "Quarterly funder report is due on 15 September 2026.",
        owner: "Asha Mehta",
        status: "OPEN",
        triggeredAt: date("2026-08-09"),
      },
      {
        programmeId: maternal.id,
        grantId: grantCsrHealth.id,
        type: "MISSING_SUBMISSION",
        severity: "MEDIUM",
        reason: "Two villages have not submitted August monitoring records.",
        owner: "Meera Singh",
        status: "OPEN",
        triggeredAt: date("2026-08-07"),
      },
    ],
  });
  await prisma.report.create({
    data: {
      title: "Swasth Maa — Q2 2026 Progress Report",
      programmeId: maternal.id,
      grantId: grantHealth.id,
      period: "2026 Q2",
      type: "Funder progress report",
      status: "FINAL",
      executiveSummary:
        "Swasth Maa expanded maternal health outreach across 42 villages. ANC continuity is ahead of target, while early registration and high-risk referral completion need corrective action.",
      achievements:
        "876 women reached; four-visit ANC completion exceeded target; all 84 frontline workers completed coaching.",
      risks:
        "Referral transport gaps and delayed pregnancy identification persist in remote hamlets.",
      lessons:
        "Village-level due lists and accompaniment by trained volunteers improve continuity of care.",
    },
  });
  console.log("Seeded EvalCanvas demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
