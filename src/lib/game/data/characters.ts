// Default display names for dialog speakers other than the narrator. A
// dialog's `rename` line can override a character's name for the rest of
// an encounter (see DialogLine in dialog.ts) - this is just the fallback
// before any such line has fired.
export type CharacterId = 'genie' | 'occupant';

export const CHARACTERS: Record<CharacterId, string> = {
  genie: 'The Genie',
  occupant: 'A Voice',
};
