export type UUID = string & { readonly __brand: 'uuid' };
export type Iso8601 = string & { readonly __brand: 'iso8601' };

export type Brand<T, B> = T & { readonly __brand: B };

export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });
