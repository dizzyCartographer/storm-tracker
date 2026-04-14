import { requireUser } from "@/lib/auth-utils";
import { Nav } from "@/app/_components/nav";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md p-4 md:p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">{user.email}</p>
        <ProfileForm initialName={user.name} />
      </main>
    </>
  );
}
