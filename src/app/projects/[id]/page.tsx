import { requireUser } from "@/lib/auth-utils";
import { getTenantDetail, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { getCustomItems } from "@/lib/actions/custom-item-actions";
import { getInvites } from "@/lib/actions/invite-actions";
import { Nav } from "@/app/_components/nav";
import { CustomItemsManager } from "@/app/settings/custom-items";
import { InviteManager } from "@/app/settings/invite-manager";
import { ProjectProfileForm } from "./project-profile-form";
import { ProjectActions } from "./project-actions";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const tenant = await getTenantDetail(id);

  if (!tenant) notFound();

  const [customItems, invites, defaultTenantId] = await Promise.all([
    getCustomItems(id),
    tenant.role === "OWNER" ? getInvites(id) : Promise.resolve([]),
    getDefaultTenantId(),
  ]);

  const isOwner = tenant.role === "OWNER";
  const isDefault = defaultTenantId === id;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-900">
            &larr; All projects
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {tenant.entryCount} {tenant.entryCount === 1 ? "entry" : "entries"} logged
              {tenant.members.length > 1 && ` by ${tenant.members.length} members`}
            </p>
          </div>
          {isDefault && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Default project
            </span>
          )}
        </div>

        {/* Project profile form — owners only */}
        {isOwner ? (
          <ProjectProfileForm
            tenantId={id}
            initial={{
              name: tenant.name,
              description: tenant.description,
              purpose: tenant.purpose,
              teenFullName: tenant.teenFullName,
              teenNickname: tenant.teenNickname,
              teenBirthday: tenant.teenBirthday,
              teenFavoriteColor: tenant.teenFavoriteColor,
              teenInterests: tenant.teenInterests,
              teenSchool: tenant.teenSchool,
              teenFavoriteSubject: tenant.teenFavoriteSubject,
              teenHasIep: tenant.teenHasIep,
              teenDiagnosis: tenant.teenDiagnosis,
              teenOtherHealth: tenant.teenOtherHealth,
              teenPhotoUrl: tenant.teenPhotoUrl,
              onsetDate: tenant.onsetDate,
              familyHistory: tenant.familyHistory,
            }}
          />
        ) : (
          <div className="mt-6 rounded-md border border-gray-200 p-4">
            {tenant.description && (
              <p className="text-sm text-gray-700">{tenant.description}</p>
            )}
            {tenant.teenFullName && (
              <p className="mt-2 text-sm text-gray-500">Teen: {tenant.teenFullName}</p>
            )}
          </div>
        )}

        {/* Custom behavior items */}
        <div className="mt-8">
          <CustomItemsManager
            tenantId={id}
            tenantName={tenant.name}
            items={customItems.map((i) => ({ id: i.id, label: i.label }))}
          />
        </div>

        {/* Invite management — owners only */}
        {isOwner && (
          <div className="mt-8">
            <InviteManager
              tenantId={id}
              tenantName={tenant.name}
              invites={invites.map((inv: { id: string; token: string; role: string; expiresAt: Date }) => ({
                id: inv.id,
                token: inv.token,
                role: inv.role as "OWNER" | "CAREGIVER" | "TEEN_SELF",
                expiresAt: inv.expiresAt,
              }))}
              isOwner
            />
          </div>
        )}

        {/* Members */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Members</h2>
          <ul className="mt-3 space-y-2">
            {tenant.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>{m.user.name ?? m.user.email}</span>
                <span className="text-gray-400">{m.role.toLowerCase().replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Project actions: set default, delete */}
        <ProjectActions tenantId={id} isOwner={isOwner} isDefault={isDefault} />
      </main>
    </>
  );
}
