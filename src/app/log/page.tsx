import { requireUser } from "@/lib/auth-utils";
import { getUserTenants, getDefaultTenantId } from "@/lib/actions/tenant-actions";
import { getCustomItems } from "@/lib/actions/custom-item-actions";
import { getEntryForEdit } from "@/lib/actions/entry-actions";
import { getEntryAttachments } from "@/lib/actions/attachment-actions";
import { getTenantBehaviorItems } from "@/lib/analysis/framework-loader";
import { Nav } from "@/app/_components/nav";
import { redirect } from "next/navigation";
import { DailyLogForm } from "./daily-log-form";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; entry?: string }>;
}) {
  await requireUser();
  const tenants = await getUserTenants();
  const params = await searchParams;

  if (tenants.length === 0) {
    redirect("/projects/create");
  }

  const defaultTenantId = await getDefaultTenantId();
  const activeTenantId = params.tenant ?? defaultTenantId ?? tenants[0].id;
  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const customItems = await getCustomItems(activeTenant.id);
  const { items: behaviorItems } = await getTenantBehaviorItems(activeTenant.id);

  // Load existing entry for editing
  const entryData = params.entry ? await getEntryForEdit(params.entry) : null;
  const attachments = entryData ? await getEntryAttachments(entryData.id) : [];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">
          {entryData ? "Edit Log" : "Daily Log"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {entryData
            ? `Editing entry for ${new Date(entryData.date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`
            : `Logging for ${activeTenant.name}`}
        </p>
        <DailyLogForm
          tenantId={activeTenant.id}
          customItems={customItems.map((i) => ({ id: i.id, label: i.label }))}
          initialData={entryData ?? undefined}
          behaviorItems={behaviorItems}
          initialAttachments={attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize,
            url: a.url,
          }))}
        />
      </main>
    </>
  );
}
