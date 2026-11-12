// PROTOTYPE — mock notification preference data

export interface NotificationWorkflow {
  id: string;
  label: string;
  description: string;
  category: PreferenceCategory;
}

export type PreferenceCategory = "learning" | "teaching" | "purchases" | "account";

export type ChannelType = "in_app" | "email";

export const CHANNELS: { id: ChannelType; label: string }[] = [
  { id: "in_app", label: "In-app" },
  { id: "email", label: "Email" },
];

export const WORKFLOWS: NotificationWorkflow[] = [
  // Learning
  {
    id: "question-answered",
    label: "Question answered",
    description: "When an instructor answers your question",
    category: "learning",
  },
  {
    id: "course-updated",
    label: "Course updated",
    description: "When a course you're enrolled in adds new lessons",
    category: "learning",
  },
  {
    id: "certificate-earned",
    label: "Certificate earned",
    description: "When you complete a course and earn a certificate",
    category: "learning",
  },
  // Teaching
  {
    id: "new-enrollment",
    label: "New enrollment",
    description: "When a student enrolls in your course",
    category: "teaching",
  },
  {
    id: "question-posted",
    label: "Question posted",
    description: "When a student asks a question on your course",
    category: "teaching",
  },
  {
    id: "refund-requested",
    label: "Refund requested",
    description: "When a student requests a refund for your course",
    category: "teaching",
  },
  // Purchases
  {
    id: "refund-approved",
    label: "Refund approved",
    description: "When your Refund Request is approved",
    category: "purchases",
  },
  {
    id: "refund-declined",
    label: "Refund declined",
    description: "When your Refund Request is declined",
    category: "purchases",
  },
  {
    id: "seat-claimed",
    label: "Seat claimed",
    description: "When someone claims a Seat on your Team Licence",
    category: "purchases",
  },
  // Account
  {
    id: "team-invite",
    label: "Team invite",
    description: "When you're invited to join a Team Licence",
    category: "account",
  },
  {
    id: "course-published",
    label: "New course available",
    description: "When a new course is published on Cadence",
    category: "account",
  },
];

export const CATEGORY_LABELS: Record<PreferenceCategory, string> = {
  learning: "Learning",
  teaching: "Teaching",
  purchases: "Purchases",
  account: "Account",
};

export type PreferenceMap = Record<string, Record<ChannelType, boolean>>;

export function getDefaultPreferences(): PreferenceMap {
  const prefs: PreferenceMap = {};
  for (const w of WORKFLOWS) {
    prefs[w.id] = { in_app: true, email: true };
  }
  return prefs;
}
