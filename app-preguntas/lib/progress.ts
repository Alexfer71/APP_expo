import AsyncStorage from "@react-native-async-storage/async-storage";

export type Progress = {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  wrongIds: string[]; // ids únicos fallados alguna vez
};

const PROGRESS_KEY = "PROGRESS_V1";

export function emptyProgress(): Progress {
  return { totalAnswered: 0, totalCorrect: 0, totalWrong: 0, wrongIds: [] };
}

export async function loadProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!raw) return emptyProgress();
  return JSON.parse(raw) as Progress;
}

export async function saveProgress(p: Progress) {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export async function resetProgress() {
  await AsyncStorage.removeItem(PROGRESS_KEY);
}

export async function recordAnswer(questionId: string, isCorrect: boolean) {
  const p = await loadProgress();

  p.totalAnswered += 1;
  if (isCorrect) p.totalCorrect += 1;
  else {
    p.totalWrong += 1;
    if (!p.wrongIds.includes(questionId)) p.wrongIds.push(questionId);
  }

  await saveProgress(p);
  return p;
}
