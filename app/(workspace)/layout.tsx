import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getUserSubscription, summarizeSubscription } from "../../lib/billing/subscriptions";
import { WorkspaceTopNav } from "./workspace-top-nav";

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
      <header className="border-b border-white/10 bg-[#0c1424]/92 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
                  TradeEdge
                </p>
                <p className="mt-1 text-sm text-[#94a3b8]">
                  Performance workspace
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-[#111a2c] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                {subscriptionSummary.plan} plan
              </div>
              <div className="rounded-full border border-white/10 bg-[#111a2c] px-4 py-2 text-sm text-[#dbe4ff]">
                {user.email ?? "Signed in"}
              </div>
            </div>
          </div>

          <WorkspaceTopNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
        {children}
      </main>
    </div>
  );
}
