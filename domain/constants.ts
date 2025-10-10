import { AssociationPreset } from './models';

export const ASSOCIATION_PRESETS: AssociationPreset[] = [
  {
    id: 'RECOMMENDED',
    title: 'Recommended',
    description: 'Balanced privacy and latency for clean flows.',
    feeModifier: 1,
    etaSeconds: 45,
  },
  {
    id: 'CUSTOM',
    title: 'Custom',
    description: 'Use saved counterparts and manual filters.',
    feeModifier: 1.2,
    etaSeconds: 60,
  },
  {
    id: 'MINIMAL',
    title: 'Minimal',
    description: 'Fastest exit, higher scrutiny possible.',
    feeModifier: 0.8,
    etaSeconds: 25,
  },
];
