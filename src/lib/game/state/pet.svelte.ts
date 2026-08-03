// Own state slice, not folded into ActionState - the pet attacks
// concurrently with whatever the player is doing, so it can't share the
// player's mutex.
interface PetState {
  status: 'idle' | 'attacking' | 'recovering';
  startedAt: number | null;
}

let pet = $state<PetState>({ status: 'idle', startedAt: null });

export function getPet(): PetState {
  return pet;
}

export function setPetAttacking(now: number) {
  pet.status = 'attacking';
  pet.startedAt = now;
}

export function setPetRecovering(now: number) {
  pet.status = 'recovering';
  pet.startedAt = now;
}

export function setPetIdle() {
  pet.status = 'idle';
  pet.startedAt = null;
}
