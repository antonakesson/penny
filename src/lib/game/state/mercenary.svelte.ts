let mercenaries = $state<string[]>([]);

export function getMercenaries(): string[] {
  return mercenaries;
}

export function hasMercenary(id: string): boolean {
  return mercenaries.includes(id);
}

export function addMercenary(id: string) {
  if (!mercenaries.includes(id)) mercenaries.push(id);
}

export function serializeMercenaries(): string[] {
  return mercenaries;
}

export function hydrateMercenaries(snapshot: string[]) {
  mercenaries = snapshot;
}
