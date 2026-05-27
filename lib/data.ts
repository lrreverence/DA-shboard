import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import Papa from "papaparse";

import type {
  DashboardPayload,
  DemographicFindingRow,
  FhiRow,
  MasterRow,
  PlatformLossRow,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readCsv<T>(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  const file = await fs.readFile(filePath, "utf8");
  const parsed = Papa.parse<T>(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Failed to parse ${filename}: ${parsed.errors[0]?.message}`);
  }

  return parsed.data;
}

export async function getDashboardData(): Promise<DashboardPayload> {
  const [fhiRanking, master, platformLosses, demographics] = await Promise.all([
    readCsv<FhiRow>("fhi_ranking.csv"),
    readCsv<MasterRow>("master_dataset.csv"),
    readCsv<PlatformLossRow>("platform_losses.csv"),
    readCsv<DemographicFindingRow>("demographic_findings.csv"),
  ]);

  return {
    fhiRanking: fhiRanking.sort((a, b) => a.rank - b.rank),
    master,
    platformLosses,
    demographics,
  };
}
