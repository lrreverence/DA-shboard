"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card as TremorCard, Metric, Text } from "@tremor/react";
import { useEffect, useMemo, useState } from "react";

import { FindingsTable } from "@/components/dashboard/findings-table";
import { useDashboardStore } from "@/components/dashboard/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPayload } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

const SCAM_COLORS: Record<string, string> = {
  "Online Selling": "#8b1a2b",
  "Investment/Tasking": "#c08a1b",
  Vishing: "#0f766e",
  "Hijacked Profile/ID": "#5b21b6",
  "Loan/Lending Scam": "#334155",
  "Travel Scam": "#9a3412",
};

const PLATFORM_COLORS = ["#1b3a5c", "#365f8b", "#5a7ba4", "#88a1bf"];
const TAB_ITEMS = ["Overview", "Year-by-Year", "Demographics", "Detail"] as const;

async function fetchFindings() {
  const response = await fetch("/api/findings");
  if (!response.ok) {
    throw new Error("Failed to fetch findings");
  }
  return (await response.json()) as DashboardPayload["demographics"];
}

function extractFirstNumber(text: string) {
  const match = text.replace(/₱/g, "").match(/([\d,]+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  return Number.parseFloat(match[1].replaceAll(",", ""));
}

function getRecommendation(scam: string, year: number) {
  const base = `Priority focus for ${year}:`;

  const recommendations: Record<string, string> = {
    "Online Selling":
      `${base} tighten marketplace verification, push escrow-style payment guidance, and focus public education on high-volume buying and selling flows.`,
    "Investment/Tasking":
      `${base} target fake job and fake investment recruitment patterns, especially direct-message outreach and fast-return promises.`,
    Vishing:
      `${base} strengthen bank callback verification, caller authentication, and urgent reminders against OTP and credential sharing.`,
    "Hijacked Profile/ID":
      `${base} improve account recovery guidance, profile-verification checkpoints, and identity-protection messaging.`,
    "Loan/Lending Scam":
      `${base} focus on fake lender detection, borrowing-risk alerts, and support for victims pushed into debt.`,
    "Travel Scam":
      `${base} reinforce booking verification, deposit safety checks, and seller legitimacy before payment transfer.`,
  };

  return (
    recommendations[scam] ??
    `${base} prioritize targeted prevention, verification prompts, and stronger payment-risk messaging.`
  );
}

export function DashboardClient({ initialData }: { initialData: DashboardPayload }) {
  const [activeTab, setActiveTab] = useState<(typeof TAB_ITEMS)[number]>("Overview");

  const findingsQuery = useQuery({
    queryKey: ["demographics"],
    queryFn: fetchFindings,
    initialData: initialData.demographics,
  });

  const allScams = useMemo(
    () => initialData.fhiRanking.map((row) => row.scam_type),
    [initialData.fhiRanking],
  );
  const allYears = useMemo(
    () => Array.from(new Set(initialData.master.map((row) => row.year))).sort(),
    [initialData.master],
  );

  const {
    focusScam,
    selectedScams,
    selectedYear,
    selectedYears,
    setFocusScam,
    setSelectedScams,
    setSelectedYear,
    setSelectedYears,
  } = useDashboardStore();

  useEffect(() => {
    if (!focusScam && allScams.length > 0) {
      setFocusScam(allScams[0]);
    }
    if (selectedScams.length === 0 && allScams.length > 0) {
      setSelectedScams(allScams);
    }
    if (selectedYears.length === 0 && allYears.length > 0) {
      setSelectedYears(allYears);
      setSelectedYear(allYears[allYears.length - 1]!);
    }
  }, [
    allScams,
    allYears,
    focusScam,
    selectedScams.length,
    selectedYears.length,
    setFocusScam,
    setSelectedScams,
    setSelectedYear,
    setSelectedYears,
  ]);

  const demographics = findingsQuery.data;
  const topScam = initialData.fhiRanking[0];
  const topPlatform = [...initialData.platformLosses].sort(
    (a, b) => b.total_loss_php - a.total_loss_php,
  )[0];
  const focusRecord = initialData.fhiRanking.find((row) => row.scam_type === focusScam) ?? topScam;
  const focusYearRecord =
    initialData.master.find(
      (row) => row.scam_type === focusScam && row.year === selectedYear,
    ) ?? null;

  const filteredTrend = initialData.master.filter(
    (row) => selectedScams.includes(row.scam_type) && selectedYears.includes(row.year),
  );

  const trendChartData = useMemo(() => {
    return selectedYears
      .slice()
      .sort((a, b) => a - b)
      .map((year) => {
        const yearRows = filteredTrend.filter((row) => row.year === year);
        const record: Record<string, number | string | null> = { year };

        for (const scam of selectedScams) {
          const match = yearRows.find((row) => row.scam_type === scam);
          record[scam] = match ? match.case_count : null;
        }

        return record;
      });
  }, [filteredTrend, selectedScams, selectedYears]);

  const byAgeLoss = useMemo(() => {
    const millennial = demographics.find((item) => item.segment === "Millennials");
    const genX = demographics.find((item) => item.segment === "Gen X");
    return [
      {
        segment: "Millennials",
        ageRange: "Born 1981–1996",
        value: extractFirstNumber(millennial?.finding ?? "") ?? 0,
      },
      {
        segment: "Gen X",
        ageRange: "Born 1965–1980",
        value: extractFirstNumber(genX?.finding ?? "") ?? 0,
      },
    ];
  }, [demographics]);

  const ageProfiles = useMemo(() => {
    const millennial = demographics.find((item) => item.segment === "Millennials");
    const genX = demographics.find((item) => item.segment === "Gen X");
    const genZ = demographics.find((item) => item.segment === "Gen Z");
    const silent = demographics.find((item) => item.segment === "Silent Generation");

    return [
      {
        group: "Millennials",
        ageRange: "Born 1981–1996",
        finding: millennial?.finding ?? "",
      },
      {
        group: "Gen X",
        ageRange: "Born 1965–1980",
        finding: genX?.finding ?? "",
      },
      {
        group: "Gen Z",
        ageRange: "Born 1997–2012",
        finding: genZ?.finding ?? "",
      },
      {
        group: "Silent Generation",
        ageRange: "Born 1928–1945",
        finding: silent?.finding ?? "",
      },
    ];
  }, [demographics]);

  const victimizedSectors = useMemo(() => {
    const suburban = demographics.find((item) => item.segment === "Suburban residents");
    const silent = demographics.find((item) => item.segment === "Silent Generation");
    const genZ = demographics.find((item) => item.segment === "Gen Z");

    return [
      {
        segment: "Suburban Residents",
        value: extractFirstNumber(suburban?.finding ?? "") ?? 0,
      },
      {
        segment: "Silent Generation",
        value: extractFirstNumber(silent?.finding ?? "") ?? 0,
      },
      {
        segment: "Gen Z Low Confidence",
        value: extractFirstNumber(genZ?.finding ?? "") ?? 0,
      },
    ];
  }, [demographics]);

  const socialCostData = useMemo(() => {
    const stress = demographics.find((item) =>
      item.finding.includes("felt very or somewhat stressed"),
    );
    const debt = demographics.find((item) =>
      item.finding.includes("additional debt or loans"),
    );
    const notReported = demographics.find((item) =>
      item.finding.includes("did not report"),
    );

    return [
      { metric: "Stress", value: extractFirstNumber(stress?.finding ?? "") ?? 0 },
      { metric: "Debt", value: extractFirstNumber(debt?.finding ?? "") ?? 0 },
      { metric: "Unreported", value: extractFirstNumber(notReported?.finding ?? "") ?? 0 },
    ];
  }, [demographics]);

  const channelRiskSignals = useMemo(() => {
    const wallet = demographics.find((item) =>
      item.finding.includes("digital e-wallet"),
    );
    const directMessage = demographics.find((item) =>
      item.finding.includes("direct message functionality"),
    );

    return {
      walletValue: extractFirstNumber(wallet?.finding ?? "") ?? 0,
      walletFinding: wallet?.finding ?? "",
      directMessageValue: extractFirstNumber(directMessage?.finding ?? "") ?? 0,
      directMessageFinding: directMessage?.finding ?? "",
    };
  }, [demographics]);

  const heatmapRows = useMemo(() => {
    const maxFhi = Math.max(...initialData.master.map((row) => row.fhi_score));
    return allScams.map((scam) => ({
      scam,
      years: allYears.map((year) => {
        const record = initialData.master.find(
          (row) => row.scam_type === scam && row.year === year,
        );
        const score = record?.fhi_score ?? 0;
        return {
          year,
          score,
          intensity: score > 0 ? score / maxFhi : 0,
        };
      }),
    }));
  }, [allScams, allYears, initialData.master]);

  const scamMixData = useMemo(
    () => {
      const rows = initialData.master.filter((row) => row.year === selectedYear);
      const total = rows.reduce((sum, row) => sum + row.case_count, 0);

      return rows.map((row) => ({
        name: row.scam_type,
        value: row.case_count,
        share: total > 0 ? (row.case_count / total) * 100 : 0,
        fill: SCAM_COLORS[row.scam_type] ?? "#7c8793",
      }));
    },
    [initialData.master, selectedYear],
  );

  const recommendation = getRecommendation(focusRecord.scam_type, selectedYear);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="mt-0.5 rounded-b-[2rem] border-x border-b border-stone-200 bg-[#fdfcf9] px-3 pb-4 pt-2 shadow-[0_24px_45px_-35px_rgba(15,23,42,0.35)] sm:px-5 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="grid grid-cols-2 gap-2 border-b border-stone-200 pb-2 sm:grid-cols-4 sm:gap-6 dark:border-slate-800">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "border-b-4 border-[#cc1936] px-3 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-[#102944]"
                  : "border-b-4 border-transparent px-3 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-stone-500 transition hover:text-[#102944] dark:text-slate-400 dark:hover:text-slate-200"
              }
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
          <Badge color="rose">Online Selling leads FHI</Badge>
          <Badge color="stone">Suburban exposure highest</Badge>
          <Badge color="amber">Millennials lose most on average</Badge>
          {focusYearRecord ? (
            <Badge color="blue">
              {focusScam} | {selectedYear} FHI {focusYearRecord.fhi_score.toFixed(2)}
            </Badge>
          ) : null}
        </div>
      </section>

      {activeTab === "Overview" ? (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <ChartCard
            title="FHI Ranking"
            subtitle="Which scam type causes the greatest financial harm?"
            controls={
              <select
                value={focusScam}
                onChange={(event) => setFocusScam(event.target.value)}
                className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                {allScams.map((scam) => (
                  <option key={scam} value={scam}>
                    {scam}
                  </option>
                ))}
              </select>
            }
          >
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={[...initialData.fhiRanking].reverse()} layout="vertical" margin={{ left: 10, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#57534e", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="scam_type"
                  width={170}
                  tick={{ fill: "#44403c", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [value.toFixed(2), "Average FHI"]}
                  contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                />
                <Bar dataKey="avg_fhi" radius={[0, 12, 12, 0]}>
                  {initialData.fhiRanking
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <Cell
                        key={entry.scam_type}
                        fill={
                          entry.scam_type === "Online Selling"
                            ? "#8b1a2b"
                            : entry.scam_type === "Investment/Tasking"
                              ? "#c08a1b"
                              : "#b7b4ad"
                        }
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-6">
            <ChartCard
              title="Platform Losses"
              subtitle="2024-only view: available platform-loss data is reported for 2024, not 2025."
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={initialData.platformLosses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Loss"]}
                    contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                  />
                  <Bar dataKey="total_loss_php" radius={[12, 12, 0, 0]}>
                    {initialData.platformLosses.map((entry, index) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[index] ?? "#1b3a5c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      ) : null}

      {activeTab === "Year-by-Year" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>FHI Heatmap</CardTitle>
              <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
                Darker cells indicate higher yearly FHI for each scam type. `N/R` means no reported scam-type value was available for that year.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div
                className="grid min-w-[420px] gap-3"
                style={{ gridTemplateColumns: `170px repeat(${allYears.length}, minmax(0, 1fr))` }}
              >
                <div />
                {allYears.map((year) => (
                  <div
                    key={year}
                    className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                  >
                    {year}
                  </div>
                ))}
                {heatmapRows.map((row) => (
                  <div
                    key={row.scam}
                    className="contents"
                  >
                    <div
                      className="flex items-center text-sm font-medium text-stone-700"
                    >
                      {row.scam}
                    </div>
                    {row.years.map((item) => (
                      <div
                        key={`${row.scam}-${item.year}`}
                        className="rounded-2xl px-2 py-4 text-center text-xs font-semibold text-white"
                        style={{
                          backgroundColor:
                            item.score > 0
                              ? `rgba(139, 26, 43, ${0.2 + item.intensity * 0.8})`
                              : "rgba(148, 163, 184, 0.18)",
                          color: item.score > 0 ? "#fff" : "#44403c",
                        }}
                        title={
                          item.score > 0
                            ? `${row.scam} | ${item.year} | FHI ${item.score.toFixed(2)}`
                            : `${row.scam} | ${item.year} | Not reported in available source data`
                        }
                      >
                        {item.score > 0 ? item.score.toFixed(0) : "N/R"}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <ChartCard
              title={`${selectedYear} Scam Mix`}
              subtitle="How the selected year splits across scam categories"
              controls={
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {allYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={scamMixData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={84}
                    paddingAngle={2}
                  >
                    {scamMixData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, item) => [
                      `${formatNumber(value)} cases | ${item.payload.share.toFixed(1)}%`,
                      "Share of selected year",
                    ]}
                    contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Annual Scam Cases by Type"
              subtitle="Grouped annual comparison. Available source data is yearly, not monthly."
            >
              <div className="mb-4 flex flex-wrap gap-2">
                {allYears.map((year) => (
                  <Button
                    key={year}
                    size="sm"
                    variant={selectedYears.includes(year) ? "default" : "outline"}
                    onClick={() =>
                      setSelectedYears(
                        selectedYears.includes(year)
                          ? selectedYears.filter((item) => item !== year)
                          : [...selectedYears, year].sort(),
                      )
                    }
                  >
                    {year}
                  </Button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={204}>
                <BarChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), "Cases"]}
                    contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                  />
                  <Legend />
                  {allScams
                    .filter((scam) => selectedScams.includes(scam))
                    .map((scam) => (
                      <Bar
                        key={scam}
                        dataKey={scam}
                        name={scam}
                        fill={SCAM_COLORS[scam] ?? "#7c8793"}
                        radius={[8, 8, 0, 0]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      ) : null}

      {activeTab === "Demographics" ? (
        <div className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
            <ChartCard
              title="Age Group Findings"
              subtitle="Reported average-loss values are available for Millennials and Gen X."
            >
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                  Reported Average Loss (PHP)
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={byAgeLoss}>
                    <defs>
                      <linearGradient id="ageLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b1a2b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b1a2b" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" vertical={false} />
                    <XAxis dataKey="segment" tick={{ fill: "#57534e", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Average loss"]}
                      contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b1a2b"
                      fillOpacity={1}
                      fill="url(#ageLoss)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                Source data reports average-loss values only for Millennials and Gen X. Gen Z and the Silent Generation appear elsewhere in the dashboard through separate demographic findings.
              </div>
            </ChartCard>

            <ChartCard
              title="Social Cost"
              subtitle="Stress, debt, and underreporting remain major effects"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={socialCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" vertical={false} />
                  <XAxis dataKey="metric" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Share"]}
                    contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {socialCostData.map((entry) => (
                      <Cell key={entry.metric} fill="#1b3a5c" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Victimized Sectors"
              subtitle="Which population segments show the strongest exposure signals?"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={victimizedSectors} layout="vertical" margin={{ left: 10, right: 18 }}>
                  <XAxis type="number" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="segment"
                    width={120}
                    tick={{ fill: "#44403c", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Share"]}
                    contentStyle={{ borderRadius: 16, borderColor: "#d6d3d1" }}
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                    {victimizedSectors.map((item) => (
                      <Cell key={item.segment} fill="#1b3a5c" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <EvidenceCard
              label="Digital E-Wallet Risk"
              value={`${channelRiskSignals.walletValue.toFixed(0)}%`}
              note={channelRiskSignals.walletFinding}
            />
            <EvidenceCard
              label="Direct Message Exposure"
              value={`${channelRiskSignals.directMessageValue.toFixed(0)}%`}
              note={channelRiskSignals.directMessageFinding}
            />
          </div>

          <FindingsTable data={demographics} />
        </div>
      ) : null}

      {activeTab === "Detail" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Ranked Summary Table</CardTitle>
              <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
                Quick scan of scam rank, total cases, and average FHI.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {initialData.fhiRanking.map((row) => {
                const width = (row.avg_fhi / topScam.avg_fhi) * 100;
                return (
                  <div
                    key={row.scam_type}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-white">
                          #{row.rank} {row.scam_type}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-slate-400">
                          {formatNumber(row.total_cases)} total cases
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-stone-700 dark:text-slate-200">
                        {row.avg_fhi.toFixed(0)}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#8b1a2b] to-[#c08a1b]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Recommendation Engine</CardTitle>
              <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
                Recommendation updates with the selected scam and year.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <select
                  value={focusScam}
                  onChange={(event) => setFocusScam(event.target.value)}
                  className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {allScams.map((scam) => (
                    <option key={scam} value={scam}>
                      {scam}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {allYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <TremorCard decoration="top" decorationColor="rose">
                <Text>Current Recommendation</Text>
                <Metric>{focusRecord.scam_type}</Metric>
                <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-slate-300">
                  {recommendation}
                </p>
              </TremorCard>
              <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <SummaryRow label="Selected year" value={String(selectedYear)} />
                <SummaryRow label="Scam rank" value={`#${focusRecord.rank}`} />
                <SummaryRow
                  label="Selected-year cases"
                  value={focusYearRecord ? formatNumber(focusYearRecord.case_count) : "N/A"}
                />
                <SummaryRow
                  label="Selected-year estimated loss"
                  value={
                    focusYearRecord ? formatCurrency(focusYearRecord.total_loss_php_est) : "N/A"
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

function HeroStatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#173552] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
        {label}
      </p>
      <div className="mt-3 text-2xl font-bold text-[#f7f5ef]">{value}</div>
      <p className="mt-2 text-sm text-[#d6d3d1]">{note}</p>
    </div>
  );
}

function EvidenceCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="border-stone-200/80 bg-[#fbfaf6] shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/90">
      <CardContent className="p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          {label}
        </div>
        <div className="mt-4 text-4xl font-bold text-[#8b1a2b]">{value}</div>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-slate-300">{note}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  controls,
  children,
}: {
  title: string;
  subtitle: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-stone-200/80 bg-[#fbfaf6] shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/90">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-stone-500">{title}</CardTitle>
          <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {controls}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <span className="text-sm text-stone-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-stone-900 dark:text-white">{value}</span>
    </div>
  );
}
