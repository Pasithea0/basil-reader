const locales = 'en';
export const percentFormat = new Intl.NumberFormat(locales, { style: 'percent' });
export const listFormat = new Intl.ListFormat(locales, { style: 'short', type: 'conjunction' });

type LanguageMap = string | { [key: string]: string };
type Contributor = string | { name?: LanguageMap; [key: string]: unknown };

export const formatLanguageMap = (x: LanguageMap | null | undefined): string => {
	if (!x) return '';
	if (typeof x === 'string') return x;
	const keys = Object.keys(x);
	return x[keys[0]];
};

export const formatOneContributor = (contributor: Contributor): string =>
	typeof contributor === 'string' ? contributor : formatLanguageMap(contributor?.name);

export const formatContributor = (contributor: Contributor | Contributor[]): string =>
	Array.isArray(contributor)
		? listFormat.format(contributor.map(formatOneContributor))
		: formatOneContributor(contributor);
