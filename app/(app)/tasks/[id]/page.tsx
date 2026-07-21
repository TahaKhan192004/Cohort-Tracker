import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireOnboardedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Eyebrow } from "@/components/ui/Card";
import { StatusBadge, TaskTypeBadge } from "@/components/ui/Badge";
import { StatusToggle } from "@/components/tasks/StatusToggle";
import {
  CommentThread,
  type ThreadComment,
} from "@/components/tasks/CommentThread";
import { SubmissionForm } from "@/components/tasks/SubmissionForm";
import { displayStatus, formatDateTime, relativeTime, urgency } from "@/lib/utils";
import type { Submission, Task, TaskAssignment, TaskComment } from "@/lib/types";

const DEADLINE_TONE = {
  ok: "text-[#3F5738]",
  soon: "text-[#8A5D1E]",
  late: "text-terracotta",
} as const;

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireOnboardedUser();
  const supabase = await createClient();

  const [{ data: taskRow }, { data: assignmentRow }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("task_assignments")
      .select("*")
      .eq("task_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const task = taskRow as Task | null;
  const assignment = assignmentRow as TaskAssignment | null;

  // RLS already hides other cohorts' tasks; a missing assignment means this
  // task was never assigned to them.
  if (!task || !assignment) notFound();

  const [{ data: commentRows }, { data: submissionRow }] = await Promise.all([
    supabase
      .from("task_comments")
      .select("*")
      .eq("assignment_id", assignment.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("submissions")
      .select("*")
      .eq("task_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const comments: ThreadComment[] = ((commentRows ?? []) as TaskComment[]).map(
    (c) => ({
      ...c,
      authorName: c.is_admin_reply ? "Umaima" : user.full_name,
    }),
  );

  const status = displayStatus(assignment.status, task.deadline);
  const tone = DEADLINE_TONE[urgency(task.deadline)];

  return (
    <div className="space-y-9">
      <div>
        <Link href="/tasks" className="text-sm text-smoke hover:text-terracotta">
          ← All tasks
        </Link>
      </div>

      <header>
        <Eyebrow>
          {task.week_number ? `Week ${task.week_number}` : "Task"}
          {task.day_number ? ` · Day ${task.day_number}` : ""}
        </Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">{task.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <TaskTypeBadge type={task.task_type} />
          <StatusBadge status={status} />
          {task.skill_name ? (
            <span className="text-xs text-smoke">Skill: {task.skill_name}</span>
          ) : null}
        </div>

        <p className={`mt-4 text-sm ${tone}`}>
          Due {formatDateTime(task.deadline)} · {relativeTime(task.deadline)}
        </p>
      </header>

      {task.description ? (
        <Card>
          <div className="prose-brand text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {task.description}
            </ReactMarkdown>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Your status"
          description="Update this as you go — your admin sees it live."
        />
        <StatusToggle assignmentId={assignment.id} status={assignment.status} />
      </Card>

      {task.task_type === "submission" ? (
        <Card>
          <CardHeader
            title={
              <>
                Submit your <span className="italic-verb">work</span>
              </>
            }
            description="Notes, a link, a file — whatever fits the task."
          />
          <SubmissionForm
            taskId={task.id}
            submission={(submissionRow as Submission) ?? null}
          />
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Questions"
          description="Private between you and your admin."
        />
        <CommentThread
          comments={comments}
          taskId={task.id}
          assignmentId={assignment.id}
        />
      </Card>
    </div>
  );
}
