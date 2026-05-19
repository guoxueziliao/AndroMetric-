/**
 * Backward-compatible re-export shim. The real implementations now live in
 * shared/lib/* (pure utilities, presentation helpers) and domain/rules/*
 * (domain logic). New code should import from those locations directly.
 */
export * from '../shared/lib/dates';
export * from '../shared/lib/labels';
export * from '../shared/lib/logPresentation';
export * from '../domain/rules/historyEventType';
export * from '../domain/rules/dataQuality';
