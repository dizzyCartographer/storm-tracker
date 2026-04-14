import { Link } from "react-router";

export function DisclaimerFooter() {
  return (
    <footer className="border-t border-[#E2F0ED] bg-white mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-3">
        <p className="text-center text-xs text-[#94A3B8]">
          Storm Tracker is an observation tool, not a diagnostic instrument.{" "}
          Always consult a qualified clinician for diagnosis and treatment decisions.{" "}
          <Link to="/reference" className="underline hover:text-[#475569]">
            How it works
          </Link>
        </p>
      </div>
    </footer>
  );
}
