let pets = $state<string[]>([]);

export function getPets(): string[] {
  return pets;
}

export function hasPet(id: string): boolean {
  return pets.includes(id);
}

export function addPet(id: string) {
  if (!pets.includes(id)) pets.push(id);
}

export function serializePets(): string[] {
  return pets;
}

export function hydratePets(snapshot: string[]) {
  pets = snapshot;
}
