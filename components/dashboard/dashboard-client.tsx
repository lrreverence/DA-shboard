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
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card as TremorCard, Metric, Text } from "@tremor/react";
import { useEffect, useMemo } from "react";

import { FindingsTable } from "@/components/dashboard/findings-table";
import { useDashboardStore } from "@/components/dashboard/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPayload } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

const SCAM_COLORS: Record<string, string> = {
  "Online Selling": "#8b1e3f",
  "Investment/Tasking": "#9a6700",
  Vishing: "#0f4c81",
  "Hijacked Profile/ID": "#475569",
  "Loan/Lending Scam": "#1e293b",
  "Travel Scam": "#64748b",
};

const PLATFORM_COLORS = ["#0f4c81", "#8b1e3f", "#9a6700", "#475569"];

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
      `${base} tighten marketplace verification, force escrow-style payment guidance, and target awareness campaigns at high-volume buyer and seller journeys.`,
    "Investment/Tasking":
      `${base} emphasize fake job and fake investment warning flows, especially around direct-message recruitment and fast-return promises.`,
    Vishing:
      `${base} improve call-based fraud warnings, bank callback verification, and urgent alerting around credential and OTP theft.`,
    "Hijacked Profile/ID":
      `${base} strengthen account recovery education, profile verification, and identity-protection messaging for social accounts.`,
    "Loan/Lending Scam":
      `${base} focus on predatory lending detection, fake lender verification, and debt-relief guidance for exposed users.`,
    "Travel Scam":
      `${base} reinforce booking verification, payment confirmation checks, and seller legitimacy screening before deposit transfer.`,
  };

  return (
    recommendations[scam] ??
    `${base} prioritize targeted prevention, verification prompts, and stronger payment-risk messaging.`
  );
}

export function DashboardClient({ initialData }: { initialData: DashboardPayload }) {
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
    trendMode,
    setFocusScam,
    setSelectedScams,
    setSelectedYear,
    setSelectedYears,
    setTrendMode,
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
  const runnerUp = initialData.fhiRanking[1];
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

  const compareData = initialData.master
    .filter((row) => row.year === selectedYear)
    .map((row) => ({
      ...row,
      displaySize: row.scam_type === focusScam ? 240 : 140,
      fill: SCAM_COLORS[row.scam_type] ?? "#64748b",
    }));

  const scamMixData = initialData.master
    .filter((row) => row.year === selectedYear)
    .map((row) => ({
      name: row.scam_type,
      value: row.case_count,
      fill: SCAM_COLORS[row.scam_type] ?? "#64748b",
    }));

  const byAgeLoss = useMemo(() => {
    const millennial = demographics.find((item) => item.segment === "Millennials");
    const genX = demographics.find((item) => item.segment === "Gen X");
    return [
      {
        segment: "Millennials",
        value: extractFirstNumber(millennial?.finding ?? "") ?? 0,
      },
      {
        segment: "Gen X",
        value: extractFirstNumber(genX?.finding ?? "") ?? 0,
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

  const focusHistory = initialData.master
    .filter((row) => row.scam_type === focusScam)
    .sort((a, b) => a.year - b.year);

  const estimatedLossByScam = useMemo(
    () =>
      initialData.master
        .filter((row) => row.year === selectedYear)
        .map((row) => ({
          scam_type: row.scam_type,
          total_loss_php_est: row.total_loss_php_est,
        }))
        .sort((a, b) => b.total_loss_php_est - a.total_loss_php_est),
    [initialData.master, selectedYear],
  );

  const prevalenceRadar = useMemo(
    () =>
      initialData.master
        .filter((row) => row.year === selectedYear)
        .map((row) => ({
          scam_type: row.scam_type,
          prevalence_pct: Number((row.prevalence_weight * 100).toFixed(1)),
        })),
    [initialData.master, selectedYear],
  );

  const platformShareData = useMemo(() => {
    const total = initialData.platformLosses.reduce(
      (sum, row) => sum + row.total_loss_php,
      0,
    );

    return initialData.platformLosses.map((row, index) => ({
      name: row.platform,
      value: row.total_loss_php,
      share: Number(((row.total_loss_php / total) * 100).toFixed(1)),
      fill: PLATFORM_COLORS[index] ?? "#64748b",
    }));
  }, [initialData.platformLosses]);

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
    const recovered = demographics.find((item) =>
      item.finding.includes("recovered any money"),
    );

    return [
      { metric: "Stress", value: extractFirstNumber(stress?.finding ?? "") ?? 0 },
      { metric: "Debt", value: extractFirstNumber(debt?.finding ?? "") ?? 0 },
      { metric: "Unreported", value: extractFirstNumber(notReported?.finding ?? "") ?? 0 },
      { metric: "Recovered", value: extractFirstNumber(recovered?.finding ?? "") ?? 0 },
    ];
  }, [demographics]);

  const channelRiskData = useMemo(() => {
    const wallet = demographics.find((item) =>
      item.finding.includes("digital e-wallet"),
    );
    const directMessage = demographics.find((item) =>
      item.finding.includes("direct message functionality"),
    );

    return [
      { channel: "Digital e-wallet", value: extractFirstNumber(wallet?.finding ?? "") ?? 0 },
      {
        channel: "Direct message platforms",
        value: extractFirstNumber(directMessage?.finding ?? "") ?? 0,
      },
    ];
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
        const intensity = score > 0 ? score / maxFhi : 0;
        return {
          year,
          score,
          intensity,
          cases: record?.case_count ?? 0,
        };
      }),
    }));
  }, [allScams, allYears, initialData.master]);

  const recommendation = getRecommendation(focusRecord.scam_type, selectedYear);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Highest Harm Scam"
          value={topScam.scam_type}
          note={`Average FHI ${topScam.avg_fhi.toFixed(0)}`}
          accent="from-rose-900/95 to-rose-700/90"
        />
        <KpiCard
          eyebrow="Focus Scam"
          value={focusRecord.scam_type}
          note={`Rank #${focusRecord.rank} | ${focusRecord.years_present}`}
          accent="from-teal-900/95 to-sky-700/90"
        />
        <KpiCard
          eyebrow="Top Platform Loss"
          value={formatCurrency(topPlatform.total_loss_php, true)}
          note={`${topPlatform.platform} users posted the largest 2024 loss`}
          accent="from-amber-700/95 to-orange-500/90"
        />
        <KpiCard
          eyebrow="Most Victimized Sectors"
          value="Suburban + Millennials"
          note="Highest exposure by location, highest average loss by age"
          accent="from-slate-900/95 to-slate-700/90"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <ChartCard
          title="FHI Ranking"
          subtitle="Financial Harm Index by scam type"
          controls={
            <select
              value={focusScam}
              onChange={(event) => setFocusScam(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="scam_type"
                width={170}
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2), "Average FHI"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Bar dataKey="avg_fhi" radius={[0, 12, 12, 0]}>
                {initialData.fhiRanking
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <Cell
                      key={entry.scam_type}
                      fill={entry.scam_type === focusScam ? "#8b1e3f" : "#b6c2d0"}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-6">
          <ChartCard
            title="Platform Losses 2024"
            subtitle="Losses reported by users of each payment platform"
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={initialData.platformLosses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="platform" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Loss"]}
                  contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                />
                <Bar dataKey="total_loss_php" radius={[12, 12, 0, 0]}>
                  {initialData.platformLosses.map((entry, index) => (
                    <Cell key={entry.platform} fill={PLATFORM_COLORS[index] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Victimized Sectors" subtitle="Highest exposure and vulnerability snapshots">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={victimizedSectors} layout="vertical" margin={{ left: 10, right: 18 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="segment"
                  width={120}
                  tick={{ fill: "#475569", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Share"]}
                  contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                />
                <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                  {victimizedSectors.map((item, index) => (
                    <Cell
                      key={item.segment}
                      fill={["#8b1e3f", "#9a6700", "#0f4c81"][index] ?? "#64748b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr_1fr]">
        <ChartCard
          title="Scam Cases Over Time"
          subtitle="Switch between grouped bars and line trend"
          controls={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={trendMode === "bar" ? "default" : "outline"}
                onClick={() => setTrendMode("bar")}
              >
                Bars
              </Button>
              <Button
                size="sm"
                variant={trendMode === "line" ? "default" : "outline"}
                onClick={() => setTrendMode("line")}
              >
                Line
              </Button>
            </div>
          }
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
          <ResponsiveContainer width="100%" height={340}>
            {trendMode === "bar" ? (
              <BarChart data={filteredTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatNumber(value), "Cases"]}
                  contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                />
                <Legend />
                {allScams
                  .filter((scam) => selectedScams.includes(scam))
                  .map((scam) => (
                    <Bar
                      key={scam}
                      dataKey={(row) => (row.scam_type === scam ? row.case_count : 0)}
                      name={scam}
                      fill={SCAM_COLORS[scam] ?? "#64748b"}
                      radius={[8, 8, 0, 0]}
                    />
                  ))}
              </BarChart>
            ) : (
              <LineChart data={filteredTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatNumber(value), "Cases"]}
                  contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                />
                <Legend />
                {allScams
                  .filter((scam) => selectedScams.includes(scam))
                  .map((scam) => (
                    <Line
                      key={scam}
                      type="monotone"
                      name={scam}
                      dataKey={(row) => (row.scam_type === scam ? row.case_count : null)}
                      stroke={SCAM_COLORS[scam] ?? "#64748b"}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Cases vs Harm by Year"
          subtitle="Bubble size highlights the focused scam"
          controls={
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {allYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          }
        >
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 10, right: 16, bottom: 10, left: 10 }}>
              <CartesianGrid stroke="#cbd5e1" />
              <XAxis
                type="number"
                dataKey="case_count"
                name="Cases"
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="fhi_score"
                name="FHI"
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: number, name) => [
                  name === "fhi_score" ? value.toFixed(2) : formatNumber(value),
                  name === "fhi_score" ? "FHI Score" : "Cases",
                ]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Scatter data={compareData} fill="#8b1e3f">
                {compareData.map((entry) => (
                  <Cell key={`${entry.scam_type}-${entry.year}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`${selectedYear} Scam Mix`} subtitle="Case share by scam type">
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={scamMixData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
              >
                {scamMixData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatNumber(value), "Cases"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.1fr]">
        <ChartCard title="Average Loss by Age Group" subtitle="Millennials lead on average loss per victim">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={byAgeLoss}>
              <defs>
                <linearGradient id="ageLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b1e3f" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b1e3f" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="segment" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Average loss"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b1e3f"
                fillOpacity={1}
                fill="url(#ageLoss)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`${focusScam} Year Detail`} subtitle="FHI score progression across available years">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={focusHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2), "FHI Score"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Line
                type="monotone"
                dataKey="fhi_score"
                stroke="#0f4c81"
                strokeWidth={3}
                dot={{ r: 5, fill: "#0f4c81" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Current Focus Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TremorCard decoration="top" decorationColor="rose">
              <Text>Focused Scam</Text>
              <Metric>{focusRecord.scam_type}</Metric>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge color="rose">Rank #{focusRecord.rank}</Badge>
                <Badge color="slate">{focusRecord.years_present}</Badge>
              </div>
            </TremorCard>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <SummaryRow label="Selected year" value={String(selectedYear)} />
              <SummaryRow
                label="Reported cases"
                value={focusYearRecord ? formatNumber(focusYearRecord.case_count) : "N/A"}
              />
              <SummaryRow
                label="FHI score"
                value={focusYearRecord ? focusYearRecord.fhi_score.toFixed(2) : "N/A"}
              />
              <SummaryRow
                label="Estimated loss"
                value={
                  focusYearRecord ? formatCurrency(focusYearRecord.total_loss_php_est) : "N/A"
                }
              />
              <SummaryRow
                label="Runner-up"
                value={`${runnerUp.scam_type} (#${runnerUp.rank})`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_1fr]">
        <ChartCard
          title={`${selectedYear} Estimated Loss by Scam`}
          subtitle="Projected loss using reported cases and average loss per victim"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={estimatedLossByScam} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <YAxis
                type="category"
                dataKey="scam_type"
                width={150}
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Estimated loss"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Bar dataKey="total_loss_php_est" radius={[0, 12, 12, 0]}>
                {estimatedLossByScam.map((entry) => (
                  <Cell
                    key={entry.scam_type}
                    fill={SCAM_COLORS[entry.scam_type] ?? "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`${selectedYear} Prevalence Weight`}
          subtitle="How much each scam contributes to total reported cases"
        >
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={prevalenceRadar} outerRadius={110}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="scam_type" tick={{ fill: "#475569", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Radar
                name="Prevalence %"
                dataKey="prevalence_pct"
                stroke="#0f4c81"
                fill="#0f4c81"
                fillOpacity={0.35}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Prevalence weight"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Platform Share of 2024 Losses"
          subtitle="Relative weight of each payment platform in total reported losses"
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={platformShareData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={112}
                paddingAngle={2}
              >
                {platformShareData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${formatCurrency(value)} | ${item.payload.share}%`,
                  "Platform loss",
                ]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>FHI Heatmap Matrix</CardTitle>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Darker cells indicate higher FHI by scam type and year.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `160px repeat(${allYears.length}, minmax(0, 1fr))` }}
              >
                <div />
                {allYears.map((year) => (
                  <div
                    key={year}
                    className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                  >
                    {year}
                  </div>
                ))}
                {heatmapRows.map((row) => (
                  <>
                    <div
                      key={`${row.scam}-label`}
                      className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {row.scam}
                    </div>
                    {row.years.map((item) => (
                      <div
                        key={`${row.scam}-${item.year}`}
                        className="rounded-xl border border-white/40 px-2 py-4 text-center text-xs font-semibold text-slate-900 shadow-sm dark:text-white"
                        style={{
                          backgroundColor:
                            item.score > 0
                              ? `rgba(139, 30, 63, ${0.14 + item.intensity * 0.76})`
                              : "rgba(148, 163, 184, 0.15)",
                        }}
                        title={`${row.scam} | ${item.year} | FHI ${item.score.toFixed(2)} | Cases ${formatNumber(item.cases)}`}
                      >
                        {item.score > 0 ? item.score.toFixed(0) : "—"}
                      </div>
                    ))}
                  </>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranked Summary Table</CardTitle>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Quick scan of FHI rank, total cases, and average harm.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialData.fhiRanking.map((row) => {
              const width = (row.avg_fhi / topScam.avg_fhi) * 100;
              return (
                <div
                  key={row.scam_type}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        #{row.rank} {row.scam_type}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatNumber(row.total_cases)} total cases
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {row.avg_fhi.toFixed(0)}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-rose-800 to-amber-600"
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
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Recommendation updates with the selected scam and year.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TremorCard decoration="top" decorationColor="amber">
              <Text>Current Recommendation</Text>
              <Metric>{focusRecord.scam_type}</Metric>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {recommendation}
              </p>
            </TremorCard>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChartCard
          title="Social Cost of Victimization"
          subtitle="Stress, debt, underreporting, and recovery outcomes"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={socialCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Share"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {socialCostData.map((entry, index) => (
                  <Cell
                    key={entry.metric}
                    fill={["#8b1e3f", "#9a6700", "#475569", "#0f4c81"][index] ?? "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Channel Risk Exposure"
          subtitle="Where scam money transfer and contact risk concentrate"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={channelRiskData}>
              <defs>
                <linearGradient id="channelRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0f4c81" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="channel" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Share"]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0f4c81"
                fillOpacity={1}
                fill="url(#channelRisk)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <FindingsTable data={demographics} />
    </section>
  );
}

function KpiCard({
  eyebrow,
  value,
  note,
  accent,
}: {
  eyebrow: string;
  value: string;
  note: string;
  accent: string;
}) {
  return (
    <div className={`rounded-[1.75rem] bg-gradient-to-br ${accent} p-[1px] shadow-xl shadow-slate-900/10`}>
      <div className="rounded-[1.65rem] bg-white/92 p-5 dark:bg-slate-950/92">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
        <div className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">{value}</div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{note}</p>
      </div>
    </div>
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
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {controls}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
