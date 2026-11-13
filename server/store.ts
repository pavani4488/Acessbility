import fs from 'node:fs';
import path from 'node:path';
import type { ProjectBlueprint, ProjectSummary } from '../src/types/blueprint.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'archspec-db.json');

interface DatabaseState {
  projects: ProjectBlueprint[];
}

const SEED_PROJECTS: ProjectBlueprint[] = [
  {
    id: 'proj-finpulse',
    name: 'FinPulse',
    title: 'FinPulse — Real-Time Treasury & Double-Entry Ledger Engine',
    domain: 'FinTech & Treasury Operations',
    scaleTier: 'Enterprise Multi-Region',
    problemStatement:
      'Mid-market finance teams reconcile settlement feeds across 6–12 banking partners using manual CSV exports and brittle spreadsheets, causing 48-hour close delays and undetected ledger drift.',
    targetAudience:
      'Corporate Controllers, Treasury Analysts, Payment Operations Engineers, and External Financial Auditors.',
    proposedSolution:
      'An event-driven double-entry ledger platform that ingests webhook and ISO 20022 bank feeds in real time, enforces cryptographic idempotency, flags reconciliation discrepancies within seconds, and generates immutable audit trails.',
    techStack: [
      'React 19 + TypeScript',
      'Node.js + Express API',
      'PostgreSQL 16 (Serialisable Ledger)',
      'Kafka Event Bus',
      'Redis Idempotency Store',
      'Gemini 4 Hydrogen Anomaly Summary',
    ],
    successCriteria: [
      'Zero unrecorded balance mutations via strict append-only journal entries',
      '99.95% automated bank-to-ledger reconciliation match within 5 seconds of webhook arrival',
      'Month-end close cycle reduced from 6 business days to under 4 hours',
      'Full SOC 2 Type II audit export generated in under 10 seconds',
    ],
    createdAt: '2026-10-18T09:00:00.000Z',
    updatedAt: '2026-11-12T16:40:00.000Z',
    modules: [
      {
        id: 'mod-fp-1',
        name: 'Treasury Console UI',
        layer: 'client',
        status: 'Verified',
        technology: 'React 19 + Tailwind CSS',
        responsibility: 'Displays live cash positions, reconciliation exception queues, and journal drill-downs.',
        dependencies: ['mod-fp-2'],
        x: 60,
        y: 60,
      },
      {
        id: 'mod-fp-2',
        name: 'API Gateway & RBAC Proxy',
        layer: 'gateway',
        status: 'Verified',
        technology: 'Express + JWT + Rate Limiter',
        responsibility: 'Terminates TLS, validates tenant RBAC scopes, and enforces idempotency keys on mutations.',
        dependencies: ['mod-fp-3', 'mod-fp-4'],
        x: 310,
        y: 60,
      },
      {
        id: 'mod-fp-3',
        name: 'Double-Entry Ledger Core',
        layer: 'service',
        status: 'In Build',
        technology: 'TypeScript Ledger Engine',
        responsibility: 'Executes atomic balanced debit/credit postings with serializable isolation checks.',
        dependencies: ['mod-fp-5'],
        x: 560,
        y: 40,
      },
      {
        id: 'mod-fp-4',
        name: 'Reconciliation Matcher',
        layer: 'service',
        status: 'In Design',
        technology: 'Deterministic + AI Fuzzy Matcher',
        responsibility: 'Matches incoming bank settlement lines against expected ledger postings and routes exceptions.',
        dependencies: ['mod-fp-5', 'mod-fp-6'],
        x: 560,
        y: 200,
      },
      {
        id: 'mod-fp-5',
        name: 'Immutable Ledger Store',
        layer: 'data',
        status: 'Verified',
        technology: 'PostgreSQL 16 + Append Triggers',
        responsibility: 'Stores accounts, journal batches, posting lines, and SHA-256 chain hashes.',
        dependencies: [],
        x: 820,
        y: 60,
      },
      {
        id: 'mod-fp-6',
        name: 'ISO 20022 & Bank Webhook Adapter',
        layer: 'integration',
        status: 'In Build',
        technology: 'Signed Webhook Verifier + SFTP Poller',
        responsibility: 'Normalizes camt.053 statements and Stripe/ACH settlement webhooks into canonical events.',
        dependencies: ['mod-fp-5'],
        x: 820,
        y: 220,
      },
    ],
    requirements: [
      {
        id: 'req-fp-1',
        code: 'FR-01',
        title: 'Atomic Balanced Journal Posting',
        category: 'Functional',
        priority: 'P0',
        status: 'Verified',
        moduleId: 'mod-fp-3',
        acceptanceCriteria: 'Every journal transaction must verify SUM(debits) === SUM(credits) in the same currency before commit.',
      },
      {
        id: 'req-fp-2',
        code: 'FR-02',
        title: 'Idempotent Webhook Ingestion',
        category: 'Functional',
        priority: 'P0',
        status: 'Implemented',
        moduleId: 'mod-fp-6',
        acceptanceCriteria: 'Duplicate provider event IDs return HTTP 200 without creating duplicate journal lines.',
      },
      {
        id: 'req-fp-3',
        code: 'FR-03',
        title: 'Exception Resolution Workflow',
        category: 'Functional',
        priority: 'P1',
        status: 'Approved',
        moduleId: 'mod-fp-4',
        acceptanceCriteria: 'Analysts can assign, annotate, and resolve unmatched bank lines with dual-control approval.',
      },
      {
        id: 'req-fp-4',
        code: 'NFR-01',
        title: 'Sub-250ms Posting Latency at P95',
        category: 'Non-Functional',
        priority: 'P0',
        status: 'Implemented',
        moduleId: 'mod-fp-3',
        acceptanceCriteria: '95th percentile journal write latency remains under 250ms at 1,200 transactions/sec.',
      },
      {
        id: 'req-fp-5',
        code: 'NFR-02',
        title: 'Cryptographic Audit Immutability',
        category: 'Non-Functional',
        priority: 'P0',
        status: 'Verified',
        moduleId: 'mod-fp-5',
        acceptanceCriteria: 'Database triggers reject UPDATE/DELETE statements on posted ledger_entries rows.',
      },
    ],
    entities: [
      {
        id: 'ent-fp-1',
        name: 'ledger_accounts',
        description: 'Chart of accounts representing assets, liabilities, clearing, and revenue buckets.',
        fields: [
          { id: 'f-1', name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true, isForeignKey: false, description: 'Primary account identifier' },
          { id: 'f-2', name: 'code', type: 'VARCHAR(32)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Unique GL account code' },
          { id: 'f-3', name: 'currency', type: 'CHAR(3)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'ISO 4217 currency code' },
          { id: 'f-4', name: 'account_type', type: 'VARCHAR(24)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE' },
          { id: 'f-5', name: 'balance_minor', type: 'BIGINT', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Cached minor-unit balance' },
        ],
      },
      {
        id: 'ent-fp-2',
        name: 'journal_entries',
        description: 'Immutable financial event header grouping balanced posting lines.',
        fields: [
          { id: 'f-6', name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true, isForeignKey: false, description: 'Journal entry UUID' },
          { id: 'f-7', name: 'idempotency_key', type: 'VARCHAR(128)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Client/webhook deduplication token' },
          { id: 'f-8', name: 'posted_at', type: 'TIMESTAMPTZ', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Effective settlement timestamp' },
          { id: 'f-9', name: 'status', type: 'VARCHAR(20)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'PENDING | POSTED | REVERSED' },
        ],
      },
      {
        id: 'ent-fp-3',
        name: 'posting_lines',
        description: 'Individual debit or credit legs linked to a journal entry and ledger account.',
        fields: [
          { id: 'f-10', name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true, isForeignKey: false, description: 'Posting line identifier' },
          { id: 'f-11', name: 'journal_entry_id', type: 'UUID', nullable: false, isPrimaryKey: false, isForeignKey: true, references: 'journal_entries.id', description: 'Parent journal entry' },
          { id: 'f-12', name: 'account_id', type: 'UUID', nullable: false, isPrimaryKey: false, isForeignKey: true, references: 'ledger_accounts.id', description: 'Target GL account' },
          { id: 'f-13', name: 'direction', type: 'VARCHAR(6)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'DEBIT | CREDIT' },
          { id: 'f-14', name: 'amount_minor', type: 'BIGINT', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Positive integer minor units' },
        ],
      },
    ],
    endpoints: [
      {
        id: 'ep-fp-1',
        method: 'POST',
        path: '/api/v1/journals',
        summary: 'Create an atomic double-entry journal batch with idempotency enforcement.',
        authRequired: true,
        moduleId: 'mod-fp-3',
        requestShape: '{ idempotencyKey: string, postedAt: string, lines: Array<{ accountId: string, direction: "DEBIT"|"CREDIT", amountMinor: number }> }',
        responseShape: '{ journalId: string, status: "POSTED", hash: string }',
      },
      {
        id: 'ep-fp-2',
        method: 'GET',
        path: '/api/v1/accounts/:id/balances',
        summary: 'Retrieve real-time posted and pending balances for a ledger account.',
        authRequired: true,
        moduleId: 'mod-fp-3',
        requestShape: 'Query: ?asOf=ISO8601',
        responseShape: '{ accountId: string, currency: string, postedMinor: number, pendingMinor: number }',
      },
      {
        id: 'ep-fp-3',
        method: 'POST',
        path: '/api/v1/reconciliation/ingest',
        summary: 'Ingest normalized bank statement lines and run automated matching.',
        authRequired: true,
        moduleId: 'mod-fp-4',
        requestShape: '{ bankAccountId: string, statementDate: string, transactions: BankLine[] }',
        responseShape: '{ matchedCount: number, exceptionCount: number, batchId: string }',
      },
    ],
    tasks: [
      {
        id: 'tsk-fp-1',
        code: 'ARCH-101',
        title: 'Implement PostgreSQL append-only triggers on posting_lines',
        status: 'Done',
        priority: 'P0',
        points: 5,
        assigneeId: 'eng-1',
        moduleId: 'mod-fp-5',
        dueDate: '2026-11-05',
        notes: 'Verified with unit tests blocking UPDATE and DELETE queries.',
      },
      {
        id: 'tsk-fp-2',
        code: 'ARCH-102',
        title: 'Build serializable double-entry validator middleware',
        status: 'Done',
        priority: 'P0',
        points: 8,
        assigneeId: 'arch-1',
        moduleId: 'mod-fp-3',
        dueDate: '2026-11-09',
        notes: 'Rejects unbalanced batches and negative minor amounts at API boundary.',
      },
      {
        id: 'tsk-fp-3',
        code: 'ARCH-103',
        title: 'Implement ISO 20022 camt.053 XML stream parser',
        status: 'In Progress',
        priority: 'P0',
        points: 8,
        assigneeId: 'eng-1',
        moduleId: 'mod-fp-6',
        dueDate: '2026-11-18',
        notes: 'Streaming parser handles 50MB daily settlement batches under 400ms.',
      },
      {
        id: 'tsk-fp-4',
        code: 'ARCH-104',
        title: 'Design dual-approval exception resolution UI drawer',
        status: 'In Review',
        priority: 'P1',
        points: 5,
        assigneeId: 'pm-1',
        moduleId: 'mod-fp-1',
        dueDate: '2026-11-16',
        notes: 'Awaiting accessibility keyboard-trap audit.',
      },
      {
        id: 'tsk-fp-5',
        code: 'ARCH-105',
        title: 'Add Redis sliding-window lock for concurrent account updates',
        status: 'Backlog',
        priority: 'P1',
        points: 5,
        assigneeId: 'arch-1',
        moduleId: 'mod-fp-2',
        dueDate: '2026-11-24',
        notes: 'Reduces serialization retries on high-volume clearing accounts.',
      },
    ],
    risks: [
      {
        id: 'rsk-fp-1',
        title: 'Serializable transaction contention on omnibus clearing accounts',
        likelihood: 'High',
        impact: 'High',
        severity: 'Critical',
        mitigation: 'Shard high-throughput clearing accounts into 16 sub-buckets and roll up asynchronously.',
        mitigated: true,
      },
      {
        id: 'rsk-fp-2',
        title: 'Out-of-order bank settlement webhooks causing false exceptions',
        likelihood: 'Medium',
        impact: 'Medium',
        severity: 'Medium',
        mitigation: 'Introduce a 15-minute grace window before escalating unmatched settlement events.',
        mitigated: false,
      },
    ],
  },
  {
    id: 'proj-carebridge',
    name: 'CareBridge',
    title: 'CareBridge — Outpatient Triage & Multi-Clinic Scheduling Platform',
    domain: 'Healthcare Operations',
    scaleTier: 'Regional Clinical Network',
    problemStatement:
      'Multi-site outpatient clinics experience 22% appointment no-shows and severe front-desk phone bottlenecks because symptom intake, clinician specialty matching, and slot booking live in disconnected legacy tools.',
    targetAudience:
      'Clinic Operations Directors, Triage Nurses, Outpatient Physicians, and Patients.',
    proposedSolution:
      'A unified clinical scheduling and pre-visit intake system that routes patients to the right specialist slot based on structured acuity rules, synchronizes EHR calendars, and automates waitlist backfill.',
    techStack: [
      'React 19 + TypeScript',
      'Express + REST API',
      'PostgreSQL with Row-Level Security',
      'FHIR R4 Adapter',
      'Automated SMS Reminder Worker',
    ],
    successCriteria: [
      'Reduce outpatient no-show rate from 22% to under 9% within 90 days',
      'Cut average phone triage scheduling time from 7 minutes to 90 seconds',
      'Maintain 100% HIPAA audit logging across patient record views',
    ],
    createdAt: '2026-10-25T11:30:00.000Z',
    updatedAt: '2026-11-11T14:15:00.000Z',
    modules: [
      {
        id: 'mod-cb-1',
        name: 'Triage & Calendar Portal',
        layer: 'client',
        status: 'In Build',
        technology: 'React 19 + Accessible Grid',
        responsibility: 'Provides nurse triage scoring, multi-provider day grids, and waitlist backfill actions.',
        dependencies: ['mod-cb-2'],
        x: 70,
        y: 80,
      },
      {
        id: 'mod-cb-2',
        name: 'Clinical API & Audit Gateway',
        layer: 'gateway',
        status: 'Verified',
        technology: 'Express + Audit Middleware',
        responsibility: 'Enforces clinic tenant isolation and records every PHI access event.',
        dependencies: ['mod-cb-3'],
        x: 340,
        y: 80,
      },
      {
        id: 'mod-cb-3',
        name: 'Slot & Acuity Routing Engine',
        layer: 'service',
        status: 'In Design',
        technology: 'Constraint Scheduler',
        responsibility: 'Matches patient acuity scores, visit durations, and equipment rooms without double-booking.',
        dependencies: ['mod-cb-4', 'mod-cb-5'],
        x: 610,
        y: 80,
      },
      {
        id: 'mod-cb-4',
        name: 'Clinical Schedule Database',
        layer: 'data',
        status: 'Verified',
        technology: 'PostgreSQL + Exclusion Constraints',
        responsibility: 'Stores providers, clinics, rooms, appointments, and immutable audit logs.',
        dependencies: [],
        x: 860,
        y: 50,
      },
      {
        id: 'mod-cb-5',
        name: 'FHIR R4 EHR Connector',
        layer: 'integration',
        status: 'Planned',
        technology: 'HL7 FHIR REST Sync',
        responsibility: 'Synchronizes confirmed appointments and patient demographics with hospital EHR.',
        dependencies: ['mod-cb-4'],
        x: 860,
        y: 210,
      },
    ],
    requirements: [
      {
        id: 'req-cb-1',
        code: 'FR-01',
        title: 'Overlap-Free Provider & Room Booking',
        category: 'Functional',
        priority: 'P0',
        status: 'Verified',
        moduleId: 'mod-cb-4',
        acceptanceCriteria: 'Database exclusion constraint prevents overlapping appointments for the same provider or exam room.',
      },
      {
        id: 'req-cb-2',
        code: 'FR-02',
        title: 'Automated Waitlist Backfill',
        category: 'Functional',
        priority: 'P1',
        status: 'Approved',
        moduleId: 'mod-cb-3',
        acceptanceCriteria: 'When a visit cancels >2 hours ahead, top 3 matching waitlist patients receive instant slot offers.',
      },
      {
        id: 'req-cb-3',
        code: 'NFR-01',
        title: 'Immutable PHI Access Logging',
        category: 'Non-Functional',
        priority: 'P0',
        status: 'Implemented',
        moduleId: 'mod-cb-2',
        acceptanceCriteria: 'Every GET/POST on patient endpoints writes actor ID, timestamp, and reason code to audit_logs.',
      },
    ],
    entities: [
      {
        id: 'ent-cb-1',
        name: 'appointments',
        description: 'Scheduled patient visits tied to clinic, provider, and exam room.',
        fields: [
          { id: 'cf-1', name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true, isForeignKey: false, description: 'Appointment UUID' },
          { id: 'cf-2', name: 'provider_id', type: 'UUID', nullable: false, isPrimaryKey: false, isForeignKey: true, references: 'providers.id', description: 'Assigned clinician' },
          { id: 'cf-3', name: 'acuity_level', type: 'SMALLINT', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Triage urgency 1 (Routine) to 5 (Urgent)' },
          { id: 'cf-4', name: 'slot_range', type: 'TSTZRANGE', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'Start and end timestamps' },
          { id: 'cf-5', name: 'status', type: 'VARCHAR(20)', nullable: false, isPrimaryKey: false, isForeignKey: false, description: 'BOOKED | CHECKED_IN | CANCELLED | COMPLETED' },
        ],
      },
    ],
    endpoints: [
      {
        id: 'ep-cb-1',
        method: 'POST',
        path: '/api/v1/triage/match-slots',
        summary: 'Return ranked available clinician slots matching acuity and specialty.',
        authRequired: true,
        moduleId: 'mod-cb-3',
        requestShape: '{ clinicId: string, specialty: string, acuityLevel: number, preferredWindowDays: number }',
        responseShape: '{ slots: Array<{ providerId: string, startTime: string, roomCode: string }> }',
      },
    ],
    tasks: [
      {
        id: 'tsk-cb-1',
        code: 'CARE-201',
        title: 'Configure PostgreSQL btree_gist exclusion constraint on slot_range',
        status: 'Done',
        priority: 'P0',
        points: 3,
        assigneeId: 'eng-1',
        moduleId: 'mod-cb-4',
        dueDate: '2026-11-04',
        notes: 'Blocks race-condition double bookings at DB layer.',
      },
      {
        id: 'tsk-cb-2',
        code: 'CARE-202',
        title: 'Implement nurse triage intake keyboard navigation',
        status: 'In Progress',
        priority: 'P1',
        points: 5,
        assigneeId: 'pm-1',
        moduleId: 'mod-cb-1',
        dueDate: '2026-11-19',
        notes: 'Supports full keyboard shortcuts for rapid phone triage.',
      },
    ],
    risks: [
      {
        id: 'rsk-cb-1',
        title: 'EHR FHIR sync lag causing stale provider availability',
        likelihood: 'Medium',
        impact: 'High',
        severity: 'High',
        mitigation: 'Maintain local authoritative slot reservation lease for 120 seconds during checkout.',
        mitigated: true,
      },
    ],
  },
];

function ensureDbExists(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseState = { projects: SEED_PROJECTS };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as DatabaseState;
    if (!parsed.projects || !Array.isArray(parsed.projects)) {
      throw new Error('Invalid DB structure');
    }
    return parsed;
  } catch {
    const fallback: DatabaseState = { projects: SEED_PROJECTS };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function writeDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function listProjectSummaries(): ProjectSummary[] {
  const db = ensureDbExists();
  return db.projects.map((p) => ({
    id: p.id,
    name: p.name,
    title: p.title,
    domain: p.domain,
    scaleTier: p.scaleTier,
    updatedAt: p.updatedAt,
    moduleCount: p.modules.length,
    requirementCount: p.requirements.length,
    taskCount: p.tasks.length,
    completedTaskCount: p.tasks.filter((t) => t.status === 'Done').length,
  }));
}

export function getProjectById(id: string): ProjectBlueprint | undefined {
  const db = ensureDbExists();
  return db.projects.find((p) => p.id === id);
}

export function createProject(project: ProjectBlueprint): ProjectBlueprint {
  const db = ensureDbExists();
  db.projects.unshift(project);
  writeDb(db);
  return project;
}

export function updateProject(
  id: string,
  updater: (existing: ProjectBlueprint) => ProjectBlueprint
): ProjectBlueprint | undefined {
  const db = ensureDbExists();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated = updater(db.projects[idx]);
  updated.updatedAt = new Date().toISOString();
  db.projects[idx] = updated;
  writeDb(db);
  return updated;
}

export function deleteProject(id: string): boolean {
  const db = ensureDbExists();
  const next = db.projects.filter((p) => p.id !== id);
  if (next.length === db.projects.length) return false;
  db.projects = next;
  writeDb(db);
  return true;
}
