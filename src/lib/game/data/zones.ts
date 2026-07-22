export const ZONES = {
  zone1: {
    name: 'Whispering Woods',
    description:
      'The trees speak in low, continuous tones about the weather, mostly. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose, and then hunger.',
    monsterIds: ['boar'] as const,
  },
} as const;

export type ZoneId = keyof typeof ZONES;
