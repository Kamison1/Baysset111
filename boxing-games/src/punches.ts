export type PunchId = "1" | "2" | "3" | "4" | "5" | "6";

export interface Punch {
  id: PunchId;
  label: string;
  short: string;
  color: string;
  key: string;
}

export const PUNCHES: Record<PunchId, Punch> = {
  "1": { id: "1", label: "Jab", short: "Jab", color: "var(--pad-l)", key: "1" },
  "2": { id: "2", label: "Cross", short: "Cross", color: "var(--pad-r)", key: "2" },
  "3": { id: "3", label: "Lead Hook", short: "L-Hook", color: "var(--pad-l)", key: "3" },
  "4": { id: "4", label: "Rear Hook", short: "R-Hook", color: "var(--pad-r)", key: "4" },
  "5": { id: "5", label: "Lead Upper", short: "L-Up", color: "var(--pad-body)", key: "5" },
  "6": { id: "6", label: "Rear Upper", short: "R-Up", color: "var(--pad-head)", key: "6" },
};

export const BASIC_PUNCHES: PunchId[] = ["1", "2", "3", "4"];
export const ALL_PUNCHES: PunchId[] = ["1", "2", "3", "4", "5", "6"];

export function punchByKey(key: string): Punch | undefined {
  return Object.values(PUNCHES).find((p) => p.key === key);
}

export function randomPunch(pool: PunchId[] = BASIC_PUNCHES): PunchId {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function randomCombo(length: number, pool: PunchId[] = BASIC_PUNCHES): PunchId[] {
  const combo: PunchId[] = [];
  for (let i = 0; i < length; i++) {
    let next = randomPunch(pool);
    // Avoid three identical punches in a row
    while (combo.length >= 2 && combo[combo.length - 1] === next && combo[combo.length - 2] === next) {
      next = randomPunch(pool);
    }
    combo.push(next);
  }
  return combo;
}

export const CLASSIC_COMBOS: { name: string; punches: PunchId[] }[] = [
  { name: "One-Two", punches: ["1", "2"] },
  { name: "Jab Hook Cross", punches: ["1", "3", "2"] },
  { name: "Double Jab Cross", punches: ["1", "1", "2"] },
  { name: "One-Two Hook", punches: ["1", "2", "3"] },
  { name: "Cross Hook Cross", punches: ["2", "3", "2"] },
  { name: "Body Work", punches: ["1", "2", "5", "6"] },
  { name: "Hook Upper", punches: ["3", "5", "4"] },
  { name: "Full House", punches: ["1", "2", "3", "2", "4"] },
];

export interface Drill {
  title: string;
  detail: string;
}

export const DRILLS: Drill[] = [
  { title: "Shadow Jab Ladder", detail: "10 jabs slow → 10 medium → 10 fast. Reset stance each set." },
  { title: "Pivot & Fire", detail: "Pivot off the lead foot, throw a 1-2, reset. 20 reps." },
  { title: "Defense First", detail: "Slip left, slip right, then throw a cross. Continuous for the round." },
  { title: "Pad Panic Blitz", detail: "Partner calls random numbers. React — no thinking." },
  { title: "Footwork Box", detail: "Move the square: forward, right, back, left. Jab on each corner." },
  { title: "Clinch Escape", detail: "Partner clinches lightly. Frame, pivot, separate, fire 1-2." },
  { title: "Body Snatcher", detail: "Only body shots this round. Mix 2, 5, and 6." },
  { title: "Mirror Match", detail: "Partners face off. Leader throws; follower mirrors for 30s, then switch." },
  { title: "Power Cross Only", detail: "Set up with jabs, but only the cross scores. Focus on hip rotation." },
  { title: "Corner Pressure", detail: "One fighter backs up; other presses with jab-jab-cross. Switch halfway." },
  { title: "High Guard Hold", detail: "Move continuously with a tight high guard. Coach taps openings." },
  { title: "Combo Karaoke", detail: "Coach calls a combo. Class shouts it back, then throws it together." },
  { title: "Knee Check", detail: "After every combo, check the lead knee / bounce — stay light." },
  { title: "Last 10 Finish", detail: "Whatever you're doing — last 10 seconds all-out intensity." },
  { title: "Silent Round", detail: "No talking. Read the coach's hand signals only." },
];

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
