"use client";

import { create } from "zustand";

type DashboardState = {
  focusScam: string;
  selectedYear: number;
  selectedScams: string[];
  selectedYears: number[];
  setFocusScam: (value: string) => void;
  setSelectedYear: (value: number) => void;
  setSelectedScams: (value: string[]) => void;
  setSelectedYears: (value: number[]) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  focusScam: "",
  selectedYear: 2025,
  selectedScams: [],
  selectedYears: [],
  setFocusScam: (value) => set({ focusScam: value }),
  setSelectedYear: (value) => set({ selectedYear: value }),
  setSelectedScams: (value) => set({ selectedScams: value }),
  setSelectedYears: (value) => set({ selectedYears: value }),
}));
