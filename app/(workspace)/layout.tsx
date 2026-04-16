import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getUserSubscription, summarizeSubscription } from "../../lib/billing/subscriptions";
import { WorkspaceSidebarNav } from "./workspace-sidebar-nav";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(supabase, user.id);
  const subscriptionSummary = summarizeSubscription(subscription);

  return (
    <div className="min-h-screen bg-[#08111f] text-[#e5e7eb]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="rounded-[28px] border border-white/10 bg-[#0f1728] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
              Trade Journal
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
              Professional journaling, review, and analytics for active traders.
            </p>
          </div>

          <WorkspaceSidebarNav plan={subscriptionSummary.plan} />

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
              Account
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {user.email ?? "Signed in"}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
              {subscriptionSummary.plan} plan
            </p>
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
