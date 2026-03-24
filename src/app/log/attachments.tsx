"use client";

import { useState, useRef } from "react";

interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.startsWith("image/")) return "IMG";
  if (type === "application/pdf") return "PDF";
  return "FILE";
}

export function AttachmentManager({
  entryId,
  tenantId,
  initialAttachments,
}: {
  entryId: string | null;
  tenantId: string;
  initialAttachments: AttachmentData[];
}) {
  const [attachments, setAttachments] = useState<AttachmentData[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entryId) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entryId", entryId);
    formData.append("tenantId", tenantId);

    const res = await fetch("/api/attachments", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setAttachments((prev) => [data.attachment, ...prev]);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div>
      {/* Upload */}
      {entryId && (
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
            {uploading ? "Uploading..." : "Attach file"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <span className="ml-2 text-xs text-gray-400">PDF or images, max 10MB</span>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}

      {!entryId && (
        <p className="text-xs text-gray-400">Save the entry first, then attach files.</p>
      )}

      {/* List */}
      {attachments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline min-w-0"
              >
                <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                  {fileIcon(a.fileType)}
                </span>
                <span className="truncate">{a.fileName}</span>
                <span className="flex-shrink-0 text-xs text-gray-400">{formatFileSize(a.fileSize)}</span>
              </a>
              {entryId && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="ml-2 flex-shrink-0 text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttachmentList({ attachments }: { attachments: AttachmentData[] }) {
  if (attachments.length === 0) return null;

  return (
    <ul className="space-y-2">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center gap-2">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:underline min-w-0"
          >
            <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
              {fileIcon(a.fileType)}
            </span>
            <span className="truncate">{a.fileName}</span>
            <span className="flex-shrink-0 text-xs text-gray-400">{formatFileSize(a.fileSize)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
