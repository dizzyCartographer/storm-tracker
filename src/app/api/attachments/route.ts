import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";

export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entryId = formData.get("entryId") as string | null;
    const tenantId = formData.get("tenantId") as string | null;

    if (!file || !entryId || !tenantId) {
      return NextResponse.json({ error: "Missing file, entryId, or tenantId" }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.tenantMember.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify entry exists and belongs to tenant
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { tenantId: true },
    });
    if (!entry || entry.tenantId !== tenantId) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Use PDF or images." }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`attachments/${tenantId}/${entryId}/${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    // Save to database
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: blob.url,
        entryId,
        tenantId,
      },
    });

    return NextResponse.json({ success: true, attachment });
  } catch (err) {
    console.error("Attachment upload failed:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("id");

    if (!attachmentId) {
      return NextResponse.json({ error: "Missing attachment id" }, { status: 400 });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { entry: { select: { userId: true, tenantId: true } } },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify membership
    const membership = await prisma.tenantMember.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: attachment.tenantId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete from Vercel Blob
    await del(attachment.url);

    // Delete from database
    await prisma.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Attachment delete failed:", err);
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
