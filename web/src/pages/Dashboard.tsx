import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useProject } from "../lib/project-context";
import {
  getRecentEntries,
  getEpisodes,
  getSignals,
  getSuggestions,
  type EntryRow,
  type EpisodeRow,
  type SignalRow,
  type SuggestionRow,
} from "../lib/api";

const moodColors: Record<string, { bg: string; text: string; dot: string }> = {
  MANIC: { bg: "bg-[#FDF4E8]", text: "text-[#9A5B13]", dot: "bg-[#D4913A]" },
  DEPRESSIVE: { bg: "bg-[#E0F2F1]", text: "text-[#1A5E6C]", dot: "bg-[#3B9DAD]" },
  MIXED: { bg: "bg-[#EDE5F5]", text: "text-[#5E3D8A]", dot: "bg-[#8A6BBF]" },
  NEUTRAL: { bg: "bg-[#EDF5F3]", text: "text-[#4A6B64]", dot: "bg-[#8FABA4]" },
};

function getMoodStyle(mood: string | null) {
  if (!mood) return moodColors.NEUTRAL;
  const key = mood.replace("_SUBTHRESHOLD", "");
  return moodColors[key] || moodColors.NEUTRAL;
}

export default function Dashboard() {
  const { selectedTenant, loading: projectLoading } = useProject();
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedTenant) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [e, ep, sig, sug] = await Promise.all([
          getRecentEntries(selectedTenant!.id),
          getEpisodes(selectedTenant!.id),
          getSignals(selectedTenant!.id),
          getSuggestions(selectedTenant!.id),
        ]);
        if (!cancelled) {
          setEntries(e);
          setEpisodes(ep);
          setSignals(sig);
          setSuggestions(sug);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedTenant?.id]);

  if (projectLoading || loading) {
    return <p className="text-[#475569] py-8 text-center">Loading...</p>;
  }

  if (!selectedTenant) {
    return (
      <div className="text-center py-12">
        <p className="text-[#475569]">No projects yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recent Entries */}
      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Recent Entries</h2>
        {entries.length === 0 ? (
          <p className="text-[#94A3B8] text-sm">No entries logged yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const classification =
                entry.computedMood && typeof entry.computedMood === "object"
                  ? (entry.computedMood as Record<string, string>).classification
                  : null;
              const style = getMoodStyle(classification);
              return (
                <Link
                  to={`/log/${entry.id}`}
                  key={entry.id}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow block"
                >
                  <span className={`w-3 h-3 rounded-full shrink-0 ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#0F172A]">
                        {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {classification || entry.mood}
                      </span>
                      {entry.behaviorKeys?.length === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706]">
                          quick log
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-[#94A3B8] mt-1 truncate">{entry.notes}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Episodes */}
      {episodes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Possible Episodes</h2>
          <div className="space-y-2">
            {episodes.map((ep) => {
              const style = getMoodStyle(ep.type);
              return (
                <div key={ep.id} className={`rounded-xl p-4 ${style.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <span className={`text-sm font-semibold ${style.text}`}>
                      {ep.type} — {ep.dayCount} days
                    </span>
                    <span className={`text-xs ${style.text} opacity-70`}>
                      {ep.confidence === "DSM5_MET"
                        ? "Pattern consistent with DSM-5"
                        : "Emerging pattern"}
                    </span>
                  </div>
                  <p className={`text-xs ${style.text} opacity-80`}>
                    {ep.startDate} to {ep.endDate}
                  </p>
                  {ep.criteriaNote && (
                    <p className={`text-xs mt-1 ${style.text} opacity-70`}>{ep.criteriaNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Signals</h2>
          <div className="space-y-2">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className={`rounded-xl p-4 ${
                  sig.level === "ALERT"
                    ? "bg-[#FEF2F2] border border-[#DC2626]/20"
                    : sig.level === "WARNING"
                      ? "bg-[#FFFBEB] border border-[#D97706]/20"
                      : "bg-[#F0FDFA] border border-[#0D9488]/20"
                }`}
              >
                <p className="text-sm font-medium text-[#0F172A]">{sig.title}</p>
                <p className="text-xs text-[#475569] mt-1">{sig.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Suggestions</h2>
          <div className="space-y-2">
            {suggestions.map((sug) => (
              <div key={sug.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#CCFBF1] text-[#0D9488]">
                    {sug.category}
                  </span>
                  {sug.priority === "HIGH" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626]">
                      high priority
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[#0F172A]">{sug.title}</p>
                <p className="text-xs text-[#475569] mt-1">{sug.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
