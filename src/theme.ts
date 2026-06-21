/** Central dark palette — the phone is meant to feel real and nocturnal. */
export const theme = {
  colors: {
    bg: '#0B0E13',
    surface: '#141923',
    surfaceAlt: '#1C2230',
    surfaceHigh: '#252C3B',
    border: '#2A3242',
    text: '#E7ECF3',
    textDim: '#94A0B3',
    textFaint: '#5C6678',
    accent: '#5BD6C0',
    accentDim: '#2E6B62',
    bubbleIn: '#1F2632',
    bubbleOut: '#2E6B62',
    danger: '#E5687A',
    warning: '#E5B567',
    unread: '#5BD6C0',
    overlay: 'rgba(0,0,0,0.6)',
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 999,
  },
  spacing: (n: number) => n * 4,
  /** Deterministic avatar tints (no image assets shipped). */
  avatarPalette: [
    '#6C8AE4',
    '#E48A6C',
    '#7CC48A',
    '#C46CB8',
    '#E4C56C',
    '#6CC4C4',
    '#A06CE4',
    '#E46C8A',
  ],
} as const;

export type Theme = typeof theme;
