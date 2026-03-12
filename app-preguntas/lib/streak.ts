import AsyncStorage from "@react-native-async-storage/async-storage";

export type StreakState = {
  currentStreak: number;
  bestStreak: number;
};

const STREAK_KEY = "STREAK_V1";

export function emptyStreak(): StreakState {
  return { currentStreak: 0, bestStreak: 0 };
}

export async function loadStreak(): Promise<StreakState> {
  const raw = await AsyncStorage.getItem(STREAK_KEY);
  if (!raw) return emptyStreak();
  return JSON.parse(raw) as StreakState;
}

export async function saveStreak(s: StreakState) {
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(s));
}

export async function resetStreak() {
  await AsyncStorage.removeItem(STREAK_KEY);
}

export async function recordStreakAnswer(isCorrect: boolean) {
  const s = await loadStreak();

  if (isCorrect) {
    s.currentStreak += 1;
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
  } else {
    s.currentStreak = 0;
  }

  await saveStreak(s);
  return s;
}
