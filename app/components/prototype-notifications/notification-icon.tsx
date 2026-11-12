// PROTOTYPE — maps notification types to lucide icons
import {
  GraduationCap,
  BookOpen,
  Receipt,
  CircleCheck,
  CircleX,
  UserPlus,
  MessageSquare,
  MessageSquareText,
  CheckCircle,
  Award,
  Users,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { NotificationType } from "./mock-data";

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  enrollment: GraduationCap,
  "course-published": BookOpen,
  "refund-request": Receipt,
  "refund-approved": CircleCheck,
  "refund-declined": CircleX,
  "seat-claimed": UserPlus,
  "question-posted": MessageSquare,
  "question-answered": MessageSquareText,
  "lesson-completed": CheckCircle,
  certificate: Award,
  "team-invite": Users,
  "course-updated": RefreshCw,
  welcome: Sparkles,
};

export function NotificationTypeIcon({
  type,
  className = "size-4",
}: {
  type: NotificationType;
  className?: string;
}) {
  const Icon = iconMap[type];
  return <Icon className={className} />;
}
