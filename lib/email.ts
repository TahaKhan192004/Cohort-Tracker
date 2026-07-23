import "server-only";

import { formatDateTime } from "./utils";

// EmailJS REST endpoint. Called server-side with the private key as
// accessToken, so no email credentials ever reach the browser.
const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

interface Recipient {
  email: string;
  full_name: string;
}

interface NewTaskEmail {
  title: string;
  deadline: string; // ISO
  description: string | null;
  cohortName: string;
}

/**
 * Emails every registrant that a new task was added. Sends one message per
 * recipient (so each is personalised and nobody sees the others' addresses).
 * Never throws — a mail failure must not break task creation; it only logs.
 */
export async function notifyNewTask(task: NewTaskEmail, recipients: Recipient[]) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  // Not configured yet — stay silent so the app works before keys are added.
  if (!serviceId || !templateId || !publicKey || !privateKey) return;
  if (recipients.length === 0) return;

  const deadline = formatDateTime(task.deadline);

  const results = await Promise.allSettled(
    recipients.map(async (r) => {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: {
            to_email: r.email,
            to_name: r.full_name,
            task_title: task.title,
            task_deadline: deadline,
            task_description: task.description ?? "",
            cohort_name: task.cohortName,
          },
        }),
      });
      if (!res.ok) {
        throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
      }
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    console.error(
      `[notifyNewTask] ${failed.length}/${recipients.length} emails failed`,
      failed.map((f) => (f as PromiseRejectedResult).reason),
    );
  }
}
