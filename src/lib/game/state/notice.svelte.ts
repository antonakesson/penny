export interface WelcomeBackSummary {
  kills: number;
  xpGained: number;
  itemsGained: Record<string, number>;
}

let welcomeBack = $state<WelcomeBackSummary | null>(null);

export function getWelcomeBack(): WelcomeBackSummary | null {
  return welcomeBack;
}

export function setWelcomeBack(summary: WelcomeBackSummary) {
  welcomeBack = summary;
}

export function clearWelcomeBack() {
  welcomeBack = null;
}
