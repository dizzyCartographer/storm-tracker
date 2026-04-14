"use client";

import { useState, useEffect, useCallback } from "react";
import { getTenantAttachments } from "@/lib/actions/attachment-actions";
import Link from "next/link";

type Attachment = Awaited<ReturnType<typeof getTenantAttachments>>[number];

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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocumentLibrary({ tenantId }: { tenantId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const data = await getTenantAttachments(tenantId, {
      fileType: typeFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    setAttachments(data);
    setLoading(false);
  }, [tenantId, typeFilter, fromDate, toDate]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="image/">Images</option>
            <option value="application/pdf">PDFs</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        {(typeFilter || fromDate || toDate) && (
          <button
            onClick={() => { setTypeFilter(""); setFromDate(""); setToDate(""); }}
            className="text-xs text-gray-500 hover:text-gray-900 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      ) : attachments.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No documents found. Attach files from the log entry editor.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-400">{attachments.length} document{attachments.length !== 1 ? "s" : ""}</p>
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 min-w-0 hover:underline"
              >
                <span className="flex-shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {fileIcon(a.fileType)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(a.fileSize)} &middot; {formatDate(a.createdAt)}
                  </p>
                </div>
              </a>
              <Link
                href={`/log/${a.entry.id}`}
                className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-900 underline"
              >
                View entry
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
