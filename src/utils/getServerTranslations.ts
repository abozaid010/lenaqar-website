import en from '../../public/locales/en';
import ar from '../../public/locales/ar';

export function getServerTranslations(locale: string): { t: typeof en; locale: string } {
  return {
    t: locale === 'ar' ? (ar as unknown as typeof en) : en,
    locale,
  };
}
