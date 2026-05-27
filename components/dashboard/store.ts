"use client";

import { create } from "zustand";

type DashboardState = {
  focusScam: string;
  selectedYear: number;
  trendMode: "bar" | "line";
  selectedScams: string[];
  selectedYears: number[];
  setFocusScam: (value: string) => void;
  setSelectedYear: (value: number) => void;
  setTrendMode: (value: "bar" | "line") => void;
  setSelectedScams: (value: string[]) => void;
  setSelectedYears: (value: number[]) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  focusScam: "",
  selectedYear: 2025,
  trendMode: "bar",
  selectedScams: [],
  selectedYears: [],
  setFocusScam: (value) => set({ focusScam: value }),
  setSelectedYear: (value) => set({ selectedYear: value }),
  setTrendMode: (value) => set({ trendMode: value }),
  setSelectedScams: (value) => set({ selectedScams: value }),
  setSelectedYears: (value) => set({ selectedYears: value }),
}));
