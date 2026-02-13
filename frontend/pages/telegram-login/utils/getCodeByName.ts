import type { CountryItem } from '@/common/typings/telegram-login';

/** Resolve a country name to its dial code from the given list. */
export function getCodeByName(countries: CountryItem[], name: string): string {
  return countries.find((c) => c.name === name)?.code ?? '+86';
}
