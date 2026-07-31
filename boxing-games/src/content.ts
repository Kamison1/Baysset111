export type PunchId = "1" | "2" | "3" | "4" | "5" | "6";

export interface Punch {
  id: PunchId;
  label: string;
  short: string;
  color: string;
}

export const PUNCHES: Record<PunchId, Punch> = {
  "1": { id: "1", label: "Jab", short: "JAB", color: "#2a6fd4" },
  "2": { id: "2", label: "Cross", short: "CROSS", color: "#e02d3a" },
  "3": { id: "3", label: "Lead Hook", short: "L HOOK", color: "#2a6fd4" },
  "4": { id: "4", label: "Rear Hook", short: "R HOOK", color: "#e02d3a" },
  "5": { id: "5", label: "Lead Uppercut", short: "L UP", color: "#f5b42a" },
  "6": { id: "6", label: "Rear Uppercut", short: "R UP", color: "#c9a227" },
};

export const BASIC: PunchId[] = ["1", "2", "3", "4"];
export const ALL: PunchId[] = ["1", "2", "3", "4", "5", "6"];

export interface Combo {
  name: string;
  punches: PunchId[];
  cue?: string;
}

export const COMBOS: Combo[] = [
  { name: "One-Two", punches: ["1", "2"], cue: "Straight down the pipe" },
  { name: "Double Jab Cross", punches: ["1", "1", "2"], cue: "Probe, probe, power" },
  { name: "Jab Hook Cross", punches: ["1", "3", "2"], cue: "Outside, then through" },
  { name: "One-Two Hook", punches: ["1", "2", "3"], cue: "Finish around the guard" },
  { name: "Cross Hook Cross", punches: ["2", "3", "2"], cue: "Power-power-power" },
  { name: "Hook Upper Cross", punches: ["3", "5", "2"], cue: "Body to head finish" },
  { name: "Body Snatch", punches: ["1", "2", "5", "6"], cue: "Downstairs only on 5–6" },
  { name: "Full House", punches: ["1", "2", "3", "2", "4"], cue: "Keep the feet moving" },
  { name: "Lead Ladder", punches: ["1", "3", "5"], cue: "All lead side" },
  { name: "Rear Ladder", punches: ["2", "4", "6"], cue: "Sit down on each shot" },
];

export interface Drill {
  title: string;
  detail: string;
  seconds: number;
  kind: "shadow" | "partner" | "pads" | "conditioning" | "rest";
}

export interface ClassBlock {
  id: string;
  label: string;
  /** What the class should be doing physically */
  instruction: string;
  mode: "drill" | "caller" | "rest" | "message";
  workSec?: number;
  restSec?: number;
  rounds?: number;
  drills?: Drill[];
}

export interface ClassTemplate {
  id: string;
  title: string;
  subtitle: string;
  durationHint: string;
  level: string;
  blocks: ClassBlock[];
}

export const CLASS_TEMPLATES: ClassTemplate[] = [
  {
    id: "starter-45",
    title: "Starter Class",
    subtitle: "Warm-up → shadow → pads → finisher",
    durationHint: "~45 min",
    level: "All levels",
    blocks: [
      {
        id: "wu",
        label: "Warm-up",
        instruction: "Light bounce, shoulder rolls, open the hips. Coach leads the room.",
        mode: "drill",
        rounds: 1,
        workSec: 180,
        drills: [
          {
            title: "Jump Rope / Bounce",
            detail: "Stay light. Soft knees. Breathe through the nose.",
            seconds: 90,
            kind: "conditioning",
          },
          {
            title: "Shadow Mobility",
            detail: "Slow jabs + pivots. No power — just range and balance.",
            seconds: 90,
            kind: "shadow",
          },
        ],
      },
      {
        id: "tech",
        label: "Technique",
        instruction: "Whole class shadows the call on screen. Coach walks and corrects.",
        mode: "caller",
        rounds: 4,
        workSec: 60,
        restSec: 20,
      },
      {
        id: "pads",
        label: "Pad Rounds",
        instruction: "Partners: one holds, one hits. Switch every round. Throw what's on screen.",
        mode: "caller",
        rounds: 6,
        workSec: 90,
        restSec: 30,
      },
      {
        id: "finisher",
        label: "Finisher",
        instruction: "Last push together. No talking — just work.",
        mode: "drill",
        rounds: 1,
        workSec: 180,
        drills: [
          {
            title: "Nonstop Jab",
            detail: "Continuous jab for the clock. Reset stance every 10.",
            seconds: 60,
            kind: "conditioning",
          },
          {
            title: "Burpee + 1-2",
            detail: "Burpee, stand, throw a sharp 1-2. Repeat.",
            seconds: 60,
            kind: "conditioning",
          },
          {
            title: "Guard Hold March",
            detail: "High guard, march in place, breathe. Shake it out last 10s.",
            seconds: 60,
            kind: "conditioning",
          },
        ],
      },
      {
        id: "done",
        label: "Done",
        instruction: "Great work. Water. Stretch shoulders and hips.",
        mode: "message",
      },
    ],
  },
  {
    id: "pad-focus",
    title: "Pad Focus",
    subtitle: "Short warm-up, then heavy pad calling",
    durationHint: "~30 min",
    level: "Intermediate",
    blocks: [
      {
        id: "wu2",
        label: "Warm-up",
        instruction: "Get loose fast — class stays on their feet.",
        mode: "drill",
        workSec: 120,
        drills: [
          {
            title: "Shadow 1-2 Ladder",
            detail: "10 slow, 10 medium, 10 sharp. Reset between sets.",
            seconds: 120,
            kind: "shadow",
          },
        ],
      },
      {
        id: "pads2",
        label: "Pad Caller",
        instruction: "Coach holds or partners hold. Screen calls the combo. Class fires on the count.",
        mode: "caller",
        rounds: 8,
        workSec: 60,
        restSec: 20,
      },
      {
        id: "done2",
        label: "Done",
        instruction: "Gloves off. Quick stretch. Nice session.",
        mode: "message",
      },
    ],
  },
  {
    id: "partner-battle",
    title: "Partner Battle Night",
    subtitle: "Drills + team scoring for energy",
    durationHint: "~40 min",
    level: "All levels",
    blocks: [
      {
        id: "wu3",
        label: "Warm-up",
        instruction: "Mirror partners — leader moves, follower copies.",
        mode: "drill",
        workSec: 120,
        drills: [
          {
            title: "Mirror Footwork",
            detail: "Leader changes levels and angles. Follower stays in range. Switch at halfway.",
            seconds: 120,
            kind: "partner",
          },
        ],
      },
      {
        id: "skill3",
        label: "Skill Calls",
        instruction: "Both partners throw the screen combo at the same time (air or pads).",
        mode: "caller",
        rounds: 5,
        workSec: 45,
        restSec: 15,
      },
      {
        id: "battle",
        label: "Team Battle",
        instruction: "Split the room Red vs Blue. Coach awards points for effort, form, and finishers.",
        mode: "message",
      },
      {
        id: "done3",
        label: "Done",
        instruction: "Winning team picks the cool-down song. Everyone stretches.",
        mode: "message",
      },
    ],
  },
];

export function randomCombo(pool: PunchId[] = BASIC, length = 3): Combo {
  const punches: PunchId[] = [];
  for (let i = 0; i < length; i++) {
    let next = pool[Math.floor(Math.random() * pool.length)]!;
    while (punches.length >= 2 && punches.at(-1) === next && punches.at(-2) === next) {
      next = pool[Math.floor(Math.random() * pool.length)]!;
    }
    punches.push(next);
  }
  return { name: "Coach Call", punches, cue: "Throw it clean" };
}

export function pickClassic(): Combo {
  return COMBOS[Math.floor(Math.random() * COMBOS.length)]!;
}

export function formatTime(total: number): string {
  const s = Math.max(0, Math.ceil(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
