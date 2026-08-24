// ─── BhookhMarket Design System ─────────────────────────────────────────────
// Matches the reference UI: deep forest-green, clean white cards, warm accents

export const Colors = {
  // ── Brand greens (matches reference deep green)
  primary:        '#1B5E20',   // deep forest green
  primaryMid:     '#2E7D32',
  primaryLight:   '#388E3C',
  primarySurface: '#E8F5E9',
  primaryBorder:  '#C8E6C9',

  // ── Accent / CTA green (button colour)
  cta:            '#2D6A4F',
  ctaLight:       '#4CAF50',

  // ── Orange accent (discounts, badges)
  orange:         '#E65100',
  orangeLight:    '#FF6D00',
  orangeSurface:  '#FFF3E0',

  // ── Categories
  bakery:         '#FF9800',
  cafe:           '#795548',
  restaurant:     '#E53935',
  hotel:          '#1E88E5',
  supermarket:    '#43A047',
  caterer:        '#8E24AA',
  cloudKitchen:   '#00ACC1',

  // ── Neutrals
  dark:           '#1C1C1E',
  charcoal:       '#2C2C2E',
  gray700:        '#3A3A3C',
  gray600:        '#48484A',
  gray500:        '#636366',
  gray400:        '#8E8E93',
  gray300:        '#C7C7CC',
  gray200:        '#E5E5EA',
  gray100:        '#F2F2F7',
  gray50:         '#F8F9FA',
  white:          '#FFFFFF',

  // ── Semantic
  success:        '#2E7D32',
  successSurface: '#E8F5E9',
  warning:        '#F59E0B',
  warningSurface: '#FFFBEB',
  error:          '#C62828',
  errorLight:     '#EF5350',
  errorSurface:   '#FFEBEE',

  // ── Backgrounds
  background:     '#F5F5F5',
  surface:        '#FFFFFF',
  card:           '#FFFFFF',

  // ── Text
  textPrimary:    '#1C1C1E',
  textSecondary:  '#636366',
  textTertiary:   '#8E8E93',
  textDisabled:   '#C7C7CC',
  textInverse:    '#FFFFFF',

  // ── Border
  border:         '#E5E5EA',
  borderLight:    '#F2F2F7',

  // ── Rating
  star:           '#FFC107',

  // ── Overlay
  overlay:        'rgba(0,0,0,0.55)',
  overlayLight:   'rgba(0,0,0,0.3)',
};

export const Font = {
  regular:   'Manrope_400Regular',
  medium:    'Manrope_500Medium',
  semiBold:  'Manrope_600SemiBold',
  bold:      'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};

export const Sz = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

export const Sp = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const R = {          // border-radius
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
};

export const Elevation = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Aliases for compatibility across components
export const Typography = {
  fontFamily: Font,
  fontSize: Sz,
};
export const Spacing = Sp;
export const BorderRadius = R;
export const Shadow = {
  ...Elevation,
  card: Elevation.sm,
};
