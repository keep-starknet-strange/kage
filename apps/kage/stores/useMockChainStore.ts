import { create } from 'zustand';

import { AssocSet } from '../domain/models';

export type ProofStage = 'PREPARE' | 'PROVE' | 'POST';

interface ProofState {
  id?: string;
  stage: ProofStage;
  progress: number;
  error?: string;
}

interface MockChainState {
  proof?: ProofState;
  isBuildingProof: boolean;
}

interface MockChainActions {
  startProof: (assocSet: AssocSet) => void;
  updateProof: (progress: number, stage: ProofStage) => void;
  failProof: (message: string) => void;
  completeProof: () => void;
  resetProof: () => void;
}

const initialState: MockChainState = {
  proof: undefined,
  isBuildingProof: false,
};

export const useMockChainStore = create<MockChainState & MockChainActions>((set) => ({
  ...initialState,
  startProof: (assocSet) =>
    set({
      proof: {
        id: `${assocSet}-${Date.now()}`,
        stage: 'PREPARE',
        progress: 0,
      },
      isBuildingProof: true,
    }),
  updateProof: (progress, stage) =>
    set((state) =>
      state.proof
        ? {
            proof: {
              ...state.proof,
              progress,
              stage,
            },
          }
        : state
    ),
  failProof: (message) =>
    set((state) =>
      state.proof
        ? {
            proof: {
              ...state.proof,
              error: message,
            },
            isBuildingProof: false,
          }
        : state
    ),
  completeProof: () =>
    set((state) =>
      state.proof
        ? {
            proof: {
              ...state.proof,
              progress: 100,
              stage: 'POST',
            },
            isBuildingProof: false,
          }
        : state
    ),
  resetProof: () => set(initialState),
}));
