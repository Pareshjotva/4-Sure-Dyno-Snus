import { ProfileForm } from "@/components/account/profile-form";
import { ProfileProgress } from "@/components/account/profile-progress";
import { requireSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { profileCompletion, profileDetail } from "@/lib/profile-status";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const user = await getUserById(session.id);
  if (!user) redirect("/login");
  const { passwordHash: _password, ...profile } = user;
  const completion = profileCompletion(user);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Profile</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Complete your store details and upload a current tobacco retail license.
        Saving changes sends the profile for admin verification.
      </p>
      <ProfileProgress
        percent={completion.percent}
        status={completion.status}
        label={completion.label}
        detail={profileDetail(completion.status)}
      />
      <ProfileForm user={profile} />
    </div>
  );
}
