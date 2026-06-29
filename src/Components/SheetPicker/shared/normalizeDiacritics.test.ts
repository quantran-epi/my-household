import { normalizeDiacritics } from './normalizeDiacritics';

describe('normalizeDiacritics', () => {
    it('strips Vietnamese tone marks and lowercases', () => {
        expect(normalizeDiacritics('Cà chua')).toBe('ca chua');
        expect(normalizeDiacritics('Rau muống')).toBe('rau muong');
    });

    it('replaces đ/Đ which do NOT decompose under NFD', () => {
        expect(normalizeDiacritics('Đỏ')).toBe('do');
        expect(normalizeDiacritics('đậu')).toBe('dau');
    });

    it('matches a diacritic-free query against a diacritic-bearing label', () => {
        // searching "do" matches "đỏ"
        expect(normalizeDiacritics('Đỏ').includes(normalizeDiacritics('do'))).toBe(true);
        // searching "ca" matches "Cà chua"
        expect(normalizeDiacritics('Cà chua').includes(normalizeDiacritics('ca'))).toBe(true);
    });

    it('leaves plain ASCII unchanged apart from casing', () => {
        expect(normalizeDiacritics('Tomato')).toBe('tomato');
    });

    it('handles an empty string', () => {
        expect(normalizeDiacritics('')).toBe('');
    });
});
