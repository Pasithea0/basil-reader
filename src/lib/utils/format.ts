const locales = 'en';
export const percentFormat = new Intl.NumberFormat(locales, { style: 'percent' });
export const listFormat = new Intl.ListFormat(locales, { style: 'short', type: 'conjunction' });

export const formatLanguageMap = (x: any): string => {
	if (!x) return '';
	if (typeof x === 'string') return x;
	const keys = Object.keys(x);
	return x[keys[0]];
};

export const formatOneContributor = (contributor: any): string =>
	typeof contributor === 'string' ? contributor : formatLanguageMap(contributor?.name);

export const formatContributor = (contributor: any): string =>
	Array.isArray(contributor)
		? listFormat.format(contributor.map(formatOneContributor))
		: formatOneContributor(contributor);
