export function GET() {
  return new Response(JSON.stringify({ status: "ok", app: "storm-tracker-web" }), {
    headers: { "Content-Type": "application/json" },
  });
}
