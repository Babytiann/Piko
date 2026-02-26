const PG_UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  const hasCode = (obj: unknown): boolean =>
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    (obj as { code: unknown }).code === PG_UNIQUE_VIOLATION;

  if (hasCode(error)) return true;

  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause: unknown }).cause
      : null;

  return hasCode(cause);
}
