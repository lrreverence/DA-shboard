import { ArrowRight, ShieldAlert } from "lucide-react";
import { Badge } from "@tremor/react";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const data = await getDashboardData();
  const topScam = data.fhiRanking[0];
  const topPlatform = [...data.platformLosses].sort(
    (a, b) => b.total_loss_php - a.total_loss_php,
  )[0];
  const totalPlatformLoss = data.platformLosses.reduce(
    (sum, row) => sum + row.total_loss_php,
    0,
  );
  const topPlatformShare = Math.round((topPlatform.total_loss_php / totalPlatformLoss) * 100);

  return (
    <main className="min-h-screen">
      <section className="border-b border-stone-200 bg-[#f3efe7] dark:border-[#0f2740] dark:bg-[#061a31]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#102944]/65 dark:text-white/65">
              <span>Financial Harm Index</span>
              <span>•</span>
              <span>2024–2025 Scam-Type Scope</span>
              <span>•</span>
              <span>Philippines Online Scam Analytics</span>
            </div>
            <ThemeToggle />
          </div>

          <div className="max-w-6xl space-y-4">
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-[#102944] sm:text-5xl lg:text-[4.15rem] dark:text-white">
              Which online scam type in the Philippines caused the greatest financial harm from 2024–2025, and which sector of society is most victimized?
            </h1>
            <p className="max-w-4xl text-lg text-[#22374e]/78 sm:text-xl dark:text-white/72">
              Online Selling ranks first by Financial Harm Index. Suburban Millennials carry the greatest financial burden.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#22374e]/80 dark:text-white/78">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#102944]/10 bg-white/55 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <ShieldAlert size={15} className="text-[#1b3a5c] dark:text-[#6fb2ff]" />
                <span>Method: FHI = average loss per victim × prevalence weight</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#102944]/10 bg-white/55 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <ArrowRight size={15} className="text-[#1b3a5c] dark:text-[#6fb2ff]" />
                <span>2023 is baseline context only, not part of the FHI calculation</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HeroCard
              label="Highest Harm Scam"
              value={topScam.scam_type}
              note={`Avg FHI ${Math.round(topScam.avg_fhi).toLocaleString()}`}
            />
            <HeroCard
              label="2-Year Rank"
              value="#1  2024 & 2025"
              note="Consistent across both years"
            />
            <HeroCard
              label="Top Platform Loss"
              value={formatCurrency(topPlatform.total_loss_php, true)}
              note={`${topPlatform.platform} — ${topPlatformShare}% of total losses`}
            />
            <HeroCard
              label="Most Victimized"
              value="Suburban Millennials"
              note="Highest exposure + avg loss"
            />
          </div>
        </div>
      </section>

      <DashboardClient initialData={data} />
    </main>
  );
}

function HeroCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#102944]/8 bg-white/72 px-6 py-5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/8 dark:bg-[#132f4d] dark:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.65)]">
      <div className="flex gap-4">
        <div className="w-1 rounded-full bg-[#cc1936]" />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#102944]/70 dark:text-white/72">
            {label}
          </div>
          <div className="mt-4 text-3xl font-bold leading-tight text-[#102944] dark:text-white">{value}</div>
          <div className="mt-3 text-sm text-[#22374e]/78 dark:text-white/65">{note}</div>
        </div>
      </div>
    </div>
  );
}
