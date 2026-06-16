import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

type Tab = "leads" | "bookings" | "config";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("leads");

  // Config form state
  const [threshold, setThreshold] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [vslVideoId, setVslVideoId] = useState("");
  const [confirmVideoId, setConfirmVideoId] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);

  const { data: leads, isLoading: leadsLoading } = trpc.leads.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: bookingsData, isLoading: bookingsLoading } = trpc.bookings.listWithLeads.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: config } = trpc.config.get.useQuery();

  // Initialize config form from fetched data (once)
  if (config && !configLoaded) {
    setThreshold(String(config.vslWatchThreshold));
    setCalendlyUrl(config.calendlyUrl);
    setVslVideoId(config.vslVideoId);
    setConfirmVideoId(config.confirmationVideoId);
    setConfigLoaded(true);
  }

  const updateConfig = trpc.config.update.useMutation({
    onSuccess: () => toast.success("Configuration saved successfully."),
    onError: (err) => toast.error(err.message),
  });

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    updateConfig.mutate({
      vslWatchThreshold: parseInt(threshold, 10) || 50,
      calendlyUrl: calendlyUrl || undefined,
      vslVideoId: vslVideoId || undefined,
      confirmationVideoId: confirmVideoId || undefined,
    });
  }

  // Auth gate
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground text-sm">Please sign in to access the dashboard.</p>
        <a
          href={getLoginUrl()}
          className="btn-gold rounded-xl px-8 py-3 text-sm font-bold"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-sm">
          Your account does not have admin privileges. Contact the funnel owner to be granted access.
        </p>
      </div>
    );
  }

  const qualifiedCount = leads?.filter((l) => l.qualified).length ?? 0;
  const bookedCount = leads?.filter((l) => l.booked).length ?? 0;
  const totalLeads = leads?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Funnel Dashboard</h1>
          <p className="text-xs text-muted-foreground">VSL Sales Funnel   Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user.name ?? user.email}</span>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {(user.name ?? "A")[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Leads", value: totalLeads, color: "text-foreground" },
            { label: "Qualified", value: qualifiedCount, color: "text-primary" },
            { label: "Booked", value: bookedCount, color: "gold-text" },
            {
              label: "Conversion Rate",
              value: totalLeads > 0 ? `${Math.round((bookedCount / totalLeads) * 100)}%` : "0%",
              color: "text-foreground",
            },
          ].map((stat) => (
            <div key={stat.label} className="card-glass rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
          {(["leads", "bookings", "config"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Leads tab */}
        {tab === "leads" && (
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">All Leads</h2>
              <p className="text-xs text-muted-foreground">{totalLeads} total opt-ins</p>
            </div>
            {leadsLoading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !leads?.length ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No leads yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">VSL %</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Qualified</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Booked</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-3 font-medium">{lead.name ?? " "}</td>
                        <td className="px-5 py-3 text-muted-foreground">{lead.email}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{lead.source ?? "organic"}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${lead.vslPercentWatched}%`,
                                  background: "linear-gradient(90deg, oklch(0.82 0.16 85) 0%, oklch(0.72 0.18 70) 100%)",
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{lead.vslPercentWatched}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.qualified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {lead.qualified ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.booked ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                          }`}>
                            {lead.booked ? "Booked" : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings tab */}
        {tab === "bookings" && (
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">All Bookings</h2>
              <p className="text-xs text-muted-foreground">{bookingsData?.length ?? 0} total bookings</p>
            </div>
            {bookingsLoading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !bookingsData?.length ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No bookings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Scheduled</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Booked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsData.map(({ booking }) => (
                      <tr key={booking.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-3 font-medium">{booking.inviteeName ?? " "}</td>
                        <td className="px-5 py-3 text-muted-foreground">{booking.inviteeEmail}</td>
                        <td className="px-5 py-3 text-sm">
                          {booking.scheduledTime
                            ? new Date(booking.scheduledTime).toLocaleString()
                            : " "}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-destructive/20 text-destructive"
                          }`}>
                            {booking.status === "active" ? "Confirmed" : "Canceled"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Config tab */}
        {tab === "config" && (
          <div className="card-glass rounded-xl p-6 max-w-lg">
            <h2 className="font-semibold mb-1">Funnel Configuration</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Adjust the VSL watch threshold, Calendly booking URL, and video IDs.
            </p>
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  VSL Watch Threshold (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CTA button appears after the visitor has watched this percentage of the VSL.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Calendly Event URL
                </label>
                <input
                  type="url"
                  placeholder="https://calendly.com/your-name/30min"
                  value={calendlyUrl}
                  onChange={(e) => setCalendlyUrl(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  VSL Wistia Video ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. abc123xyz"
                  value={vslVideoId}
                  onChange={(e) => setVslVideoId(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The alphanumeric ID from your Wistia video URL.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Confirmation Video Wistia ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. def456uvw"
                  value={confirmVideoId}
                  onChange={(e) => setConfirmVideoId(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Short expectation-setting video shown on the booking confirmation page.
                </p>
              </div>

              <button
                type="submit"
                disabled={updateConfig.isPending}
                className="btn-gold rounded-xl px-8 py-3 text-sm font-bold w-full disabled:opacity-60"
              >
                {updateConfig.isPending ? "Saving..." : "Save Configuration"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
