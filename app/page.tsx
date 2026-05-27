import { ArrowRight, ShieldAlert } from "lucide-react";
import { Badge } from "@tremor/react";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/data";

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen">
      <section className="grid-surface border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-slate-900/85 p-6 text-white shadow-2xl shadow-slate-900/20 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge color="teal">Financial Harm Index</Badge>
                  <Badge color="amber">2024–2025 Scam-Type Scope</Badge>
                  <Badge color="rose">Philippines Online Scam Analytics</Badge>
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Which online scam type in the Philippines caused the greatest financial harm from 2023–2025, and which sector of society is most victimized?
                </h1>
                <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
                  First-view answer: Online Selling ranks first by Financial Harm Index, while suburban residents show the highest exposure and millennials show the highest average loss. The dashboard below keeps that answer above the fold and lets you drill into year, scam type, platform, and victim profile.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start">
                <ThemeToggle />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <ShieldAlert size={15} />
                Method: FHI = average loss per victim × prevalence weight
              </span>
              <span className="inline-flex items-center gap-2">
                <ArrowRight size={15} />
                2023 is baseline context only and is not part of the scam-type FHI calculation
              </span>
            </div>
          </div>
        </div>
      </section>

      <DashboardClient initialData={data} />
    </main>
  );
}
