import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getUserSubscription, summarizeSubscription } from "../../lib/billing/subscriptions";
import { WorkspaceProfileMenu } from "./workspace-profile-menu";
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
      <header className="relative z-40 border-b border-white/10 bg-[#0c1424]/92 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-r-3xl border-l-2 border-[#2962ff]/60 bg-[linear-gradient(90deg,rgba(41,98,255,0.14),rgba(12,20,36,0))] pl-4 pr-3 py-1">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2962ff] shadow-[0_0_18px_rgba(41,98,255,0.8)]" />
                  <p className="text-base font-bold uppercase tracking-[0.34em] text-[#dbe4ff] lg:text-lg">
                    TradeEdge
                  </p>
                </div>
                <p className="mt-1 text-sm font-medium text-[#7fa2f7]">
                  Performance workspace
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[#2962ff]/18 bg-[#111a2c] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9db7f0] shadow-[0_0_22px_rgba(41,98,255,0.10)]">
                {subscriptionSummary.plan} plan
              </div>
              <WorkspaceProfileMenu
                userEmail={user.email ?? "Signed in"}
                subscriptionPlan={subscriptionSummary.plan}
              />
            </div>
          </div>

          <WorkspaceTopNav />
        </div>
      </header>

      <main className="relative z-0 mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
        {children}
      </main>
    </div>
  );
}
