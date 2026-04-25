import { describe, expect, it } from 'vitest';

import {
  assertClosureReason,
  assertTransition,
  canTransition,
  isObservationClosure,
  isResidentCareStatus,
  isResidentCareStatusClosureReason,
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

  describe('isObservationClosure', () => {
    it('detecta solo en_observacion -> normal', () => {
      expect(isObservationClosure('en_observacion', 'normal')).toBe(true);
      expect(isObservationClosure('normal', 'en_observacion')).toBe(false);
      expect(isObservationClosure('normal', 'normal')).toBe(false);
    });
  });

  describe('isResidentCareStatusClosureReason', () => {
    it('reconoce el catalogo cerrado', () => {
      expect(isResidentCareStatusClosureReason('estable')).toBe(true);
      expect(isResidentCareStatusClosureReason('escalado_medico')).toBe(true);
      expect(isResidentCareStatusClosureReason('derivado')).toBe(true);
      expect(isResidentCareStatusClosureReason('otro')).toBe(true);
    });

    it('rechaza valores fuera del catalogo', () => {
      expect(isResidentCareStatusClosureReason('')).toBe(false);
      expect(isResidentCareStatusClosureReason('estabilizado')).toBe(false);
      expect(isResidentCareStatusClosureReason('ESTABLE')).toBe(false);
    });
  });

  describe('assertClosureReason', () => {
    it('exige motivo cuando la transicion es cierre', () => {
      expect(() => assertClosureReason('en_observacion', 'normal', undefined)).toThrow(
        /requiere un motivo/i,
      );
    });

    it('rechaza motivos fuera del catalogo en cierres', () => {
      expect(() =>
        assertClosureReason('en_observacion', 'normal', 'estabilizado'),
      ).toThrow(/no es válido/i);
    });

    it('acepta motivos del catalogo en cierres', () => {
      expect(() =>
        assertClosureReason('en_observacion', 'normal', 'estable'),
      ).not.toThrow();
    });

    it('ignora el motivo si la transicion no es cierre', () => {
      expect(() =>
        assertClosureReason('normal', 'en_observacion', undefined),
      ).not.toThrow();
      expect(() =>
        assertClosureReason('normal', 'en_observacion', 'cualquiera'),
      ).not.toThrow();
    });
  });
});
