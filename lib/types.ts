export type Role = "admin" | "participant";
export type TaskType = "action" | "submission" | "watch" | "skill_build";
export type AssignmentStatus = "pending" | "in_progress" | "completed";
/** Derived at read time by comparing tasks.deadline to now — never stored. */
export type DisplayStatus = AssignmentStatus | "overdue";
export type SubmissionStatus = "submitted" | "reviewed" | "needs_revision";
export type ResourceType =
  | "sop"
  | "video_tutorial"
  | "skill"
  | "recording"
  | "document";
export type NotificationType =
  | "new_comment"
  | "submission_received"
  | "task_overdue"
  | "feedback_given";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: Role;
  onboarded_at: string | null;
  last_active_at: string | null;
  created_at: string;
}

export interface Cohort {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  user_id: string;
  joined_at: string;
}

export interface Task {
  id: string;
  cohort_id: string;
  title: string;
  description: string | null;
  week_number: number | null;
  day_number: number | null;
  deadline: string;
  task_type: TaskType;
  skill_name: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  status: AssignmentStatus;
  completed_at: string | null;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  assignment_id: string;
  body: string;
  is_admin_reply: boolean;
  is_read: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  submission_text: string | null;
  file_url: string | null;
  link_url: string | null;
  status: SubmissionStatus;
  admin_feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface Resource {
  id: string;
  cohort_id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  content_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  category: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/** An assignment joined with its task — the shape most participant views need. */
export interface AssignmentWithTask extends TaskAssignment {
  task: Task;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  action: "Action",
  submission: "Submission",
  watch: "Watch",
  skill_build: "Skill Build",
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  sop: "SOP",
  video_tutorial: "Video Tutorial",
  skill: "Skill",
  recording: "Recording",
  document: "Document",
};

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  pending: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
};
