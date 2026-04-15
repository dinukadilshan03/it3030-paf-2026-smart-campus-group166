import { ProfilePageContent } from "@/components/profile/ProfilePageContent";
import { getProfileServer } from "@/lib/profile/server";

export default async function ProfilePage() {
  const profile = await getProfileServer();

  return <ProfilePageContent initialProfile={profile} />;
}
