import { describe, expect, it } from 'vitest';
import { runJustFinished } from './forecast.queries';

const seen = (signature: string | null, running: boolean) => ({ signature, running });

describe('runJustFinished', () => {
  it('is false on the first read', () => {
    expect(runJustFinished(null, seen('7:completed', false))).toBe(false);
  });

  it('is true when the run seen running ends', () => {
    expect(runJustFinished(seen('8:running', true), seen('8:completed', false))).toBe(true);
    expect(runJustFinished(seen('8:running', true), seen('8:failed', false))).toBe(true);
  });

  it('is true for a run that was already over when first seen', () => {
    expect(runJustFinished(seen('7:completed', false), seen('8:completed', false))).toBe(true);
  });

  it('is false while a run is running or nothing changed', () => {
    expect(runJustFinished(seen('7:completed', false), seen('8:running', true))).toBe(false);
    expect(runJustFinished(seen('8:running', true), seen('8:running', true))).toBe(false);
    expect(runJustFinished(seen('8:completed', false), seen('8:completed', false))).toBe(false);
    expect(runJustFinished(seen(null, false), seen(null, false))).toBe(false);
  });
});
