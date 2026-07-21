import { requireUser, getMyCohort } from "@/lib/auth";
import { Card, CardHeader, Eyebrow } from "@/components/ui/Card";
import { ProfileForm, PasswordForm } from "./ProfileForms";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Profile — AI Savvy Founders" };

export default async function ProfilePage() {
  const user = await requireUser();
  const cohort = await getMyCohort(user.id);

  return (
    <div className="space-y-9">
      <header>
        <Eyebrow>Your account</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">{user.full_name}</h1>
        <p className="mt-2 text-sm text-smoke">
          {user.email} · @{user.username}
          {cohort ? ` · ${cohort.name}` : ""}
        </p>
        <p className="mt-1 text-sm text-smoke">
          Joined {formatDate(user.created_at)}
        </p>
      </header>

      <Card>
        <CardHeader
          title="Your details"
          description="Your email and username are set by your admin."
        />
        <ProfileForm user={user} />
      </Card>

      <Card>
        <CardHeader
          title="Change password"
          description="Replace the one your admin generated for you."
        />
        <PasswordForm />
      </Card>
    </div>
  );
}
