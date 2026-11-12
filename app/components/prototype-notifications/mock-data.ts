// PROTOTYPE — throwaway mock data for notification UI exploration

export interface MockNotification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
  href: string;
  actor?: {
    name: string;
    avatarUrl: string | null;
  };
}

export type NotificationType =
  | "enrollment"
  | "course-published"
  | "refund-request"
  | "refund-approved"
  | "refund-declined"
  | "seat-claimed"
  | "question-posted"
  | "question-answered"
  | "lesson-completed"
  | "certificate"
  | "team-invite"
  | "course-updated"
  | "welcome";

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  enrollment: "GraduationCap",
  "course-published": "BookOpen",
  "refund-request": "Receipt",
  "refund-approved": "CircleCheck",
  "refund-declined": "CircleX",
  "seat-claimed": "UserPlus",
  "question-posted": "MessageSquare",
  "question-answered": "MessageSquareText",
  "lesson-completed": "CheckCircle",
  certificate: "Award",
  "team-invite": "Users",
  "course-updated": "RefreshCw",
  welcome: "Sparkles",
};

const now = new Date();
function ago(minutes: number) {
  return new Date(now.getTime() - minutes * 60_000);
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "1",
    type: "question-posted",
    message: 'Alice Chen asked "How do I set up React Router loaders?" on Advanced React Patterns',
    timestamp: ago(3),
    read: false,
    href: "/instructor/questions",
    actor: { name: "Alice Chen", avatarUrl: null },
  },
  {
    id: "2",
    type: "enrollment",
    message: "Bob Garcia enrolled in your course TypeScript Fundamentals",
    timestamp: ago(12),
    read: false,
    href: "/instructor/2",
    actor: { name: "Bob Garcia", avatarUrl: null },
  },
  {
    id: "3",
    type: "refund-request",
    message: "Carol Davis submitted a Refund Request for Advanced React Patterns",
    timestamp: ago(45),
    read: false,
    href: "/admin/refunds",
    actor: { name: "Carol Davis", avatarUrl: null },
  },
  {
    id: "4",
    type: "seat-claimed",
    message: "Dave Wilson claimed a Seat on your Team Licence for TypeScript Fundamentals",
    timestamp: ago(90),
    read: true,
    href: "/team",
    actor: { name: "Dave Wilson", avatarUrl: null },
  },
  {
    id: "5",
    type: "question-answered",
    message: 'Your question "Best practices for Drizzle ORM" was answered by the instructor',
    timestamp: ago(120),
    read: true,
    href: "/courses/advanced-react/lessons/1",
    actor: { name: "Instructor Maya", avatarUrl: null },
  },
  {
    id: "6",
    type: "course-published",
    message: "New course published: Building with Cloudflare Workers",
    timestamp: ago(180),
    read: true,
    href: "/courses/cloudflare-workers",
  },
  {
    id: "7",
    type: "refund-approved",
    message: "Your Refund Request for Node.js Masterclass was approved. A Refund is being processed.",
    timestamp: ago(300),
    read: true,
    href: "/settings",
  },
  {
    id: "8",
    type: "lesson-completed",
    message: 'You completed "Server Components Deep Dive" in Advanced React Patterns',
    timestamp: ago(420),
    read: true,
    href: "/courses/advanced-react",
  },
  {
    id: "9",
    type: "course-updated",
    message: "Advanced React Patterns was updated with 3 new lessons",
    timestamp: ago(600),
    read: true,
    href: "/courses/advanced-react",
  },
  {
    id: "10",
    type: "team-invite",
    message: "Eve Martinez invited you to join the Acme Corp Team Licence",
    timestamp: ago(1440),
    read: true,
    href: "/team",
    actor: { name: "Eve Martinez", avatarUrl: null },
  },
  // Extra items for the full notifications page
  {
    id: "11",
    type: "welcome",
    message: "Welcome to Cadence! Start by browsing our courses.",
    timestamp: ago(2880),
    read: true,
    href: "/courses",
  },
  {
    id: "12",
    type: "certificate",
    message: "You earned a certificate for TypeScript Fundamentals!",
    timestamp: ago(4320),
    read: true,
    href: "/dashboard",
  },
  {
    id: "13",
    type: "enrollment",
    message: "Frank Thompson enrolled in your course Advanced React Patterns",
    timestamp: ago(5000),
    read: true,
    href: "/instructor/1",
    actor: { name: "Frank Thompson", avatarUrl: null },
  },
  {
    id: "14",
    type: "refund-declined",
    message: "Grace Lee's Refund Request for TypeScript Fundamentals was declined",
    timestamp: ago(7200),
    read: true,
    href: "/admin/refunds",
    actor: { name: "Grace Lee", avatarUrl: null },
  },
  {
    id: "15",
    type: "question-posted",
    message: 'Hank Brown asked "Can I use Drizzle with Postgres?" on TypeScript Fundamentals',
    timestamp: ago(8640),
    read: true,
    href: "/instructor/questions",
    actor: { name: "Hank Brown", avatarUrl: null },
  },
];

export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function groupByDay(notifications: MockNotification[]) {
  const groups: { label: string; items: MockNotification[] }[] = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const n of notifications) {
    const d = new Date(n.timestamp);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(n);
    else groups.push({ label, items: [n] });
  }
  return groups;
}
