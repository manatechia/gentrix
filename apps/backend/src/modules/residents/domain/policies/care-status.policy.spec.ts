import { describe, expect, it } from 'vitest';

import {
  assertTransition,
  canTransition,
  isResidentCareStatus,
} from './care-status.policy';

describe('care-status.policy', () => {
  describe('isResidentCareStatus', () => {
    it('reconoce los valores soportados', () => {
      expect(isResidentCareStatus('normal')).toBe(true);
      expect(isResidentCareStatus('en_observacion')).toBe(true);
    });

    it('rechaza valores desconocidos', () => {
      expect(isResidentCareStatus('aislado')).toBe(false);
      expect(isResidentCareStatus('')).toBe(false);
      expect(isResidentCareStatus('EN_OBSERVACION')).toBe(false);
    });
  });

  describe('canTransition', () => {
    it('permite normal -> en_observacion', () => {
      expect(canTransition('normal', 'en_observacion')).toBe(true);
    });

    it('permite en_observacion -> normal', () => {
      expect(canTransition('en_observacion', 'normal')).toBe(true);
    });

    it('rechaza la transicion al mismo estado', () => {
      expect(canTransition('normal', 'normal')).toBe(false);
      expect(canTransition('en_observacion', 'en_observacion')).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('no lanza para transiciones validas', () => {
      expect(() => assertTransition('normal', 'en_observacion')).not.toThrow();
      expect(() => assertTransition('en_observacion', 'normal')).not.toThrow();
    });

    it('lanza si el origen y destino son iguales', () => {
      expect(() => assertTransition('normal', 'normal')).toThrow(
        /ya se encuentra en el estado/i,
      );
    });
  });
});
