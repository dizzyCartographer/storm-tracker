import { put, del } from "@vercel/blob";
import { getSessionUser, getJwtFromCookies, neonFetchServer } from "./_auth.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return json({ error: "Not authenticated" }, 401);

    const jwt = await getJwtFromCookies(request);
    if (!jwt) return json({ error: "Failed to get auth token" }, 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entryId = formData.get("entryId") as string | null;
    const tenantId = formData.get("tenantId") as string | null;

    if (!file || !entryId || !tenantId) {
      return json({ error: "Missing file, entryId, or tenantId" }, 400);
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return json({ error: "File too large (max 10MB)" }, 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: "File type not allowed. Use PDF or images." }, 400);
    }

    // Verify membership via Neon Data API (RLS enforces access)
    const memberRes = await neonFetchServer(
      `/tenant_members?"tenantId"=eq.${tenantId}&"userId"=eq.${user.id}&limit=1`,
      jwt
    );
    const members = await memberRes.json();
    if (!members || members.length === 0) {
      return json({ error: "Access denied" }, 403);
    }

    // Verify entry exists and belongs to tenant
    const entryRes = await neonFetchServer(
      `/entries?id=eq.${entryId}&"tenantId"=eq.${tenantId}&select=id&limit=1`,
      jwt
    );
    const entries = await entryRes.json();
    if (!entries || entries.length === 0) {
      return json({ error: "Entry not found" }, 404);
    }

    // Upload to Vercel Blob
    const blob = await put(`attachments/${tenantId}/${entryId}/${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    // Save to database via Neon Data API
    const now = new Date().toISOString();
    const attachRes = await neonFetchServer("/attachments", jwt, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: blob.url,
        entryId,
        tenantId,
        createdAt: now,
        updatedAt: now,
      }),
    });

    if (!attachRes.ok) {
      return json({ error: "Failed to save attachment record" }, 500);
    }

    const rows = await attachRes.json();
    return json({ success: true, attachment: rows[0] });
  } catch (err) {
    console.error("Attachment upload failed:", err);
    return json({ error: err instanceof Error ? err.message : "Upload failed" }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return json({ error: "Not authenticated" }, 401);

    const jwt = await getJwtFromCookies(request);
    if (!jwt) return json({ error: "Failed to get auth token" }, 401);

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("id");
    if (!attachmentId) {
      return json({ error: "Missing attachment id" }, 400);
    }

    // Fetch attachment (RLS ensures tenant membership)
    const attachRes = await neonFetchServer(
      `/attachments?id=eq.${attachmentId}&select=id,url,"tenantId"`,
      jwt
    );
    const attachments = await attachRes.json();
    if (!attachments || attachments.length === 0) {
      return json({ error: "Not found" }, 404);
    }

    const attachment = attachments[0];

    // Delete from Vercel Blob
    await del(attachment.url);

    // Delete from database
    await neonFetchServer(`/attachments?id=eq.${attachmentId}`, jwt, {
      method: "DELETE",
    });

    return json({ success: true });
  } catch (err) {
    console.error("Attachment delete failed:", err);
    return json({ error: err instanceof Error ? err.message : "Delete failed" }, 500);
  }
}
