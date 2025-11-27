import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from 'res/locales/en.json';

const resources = {
  en: { translation: en },
};

const locales = getLocales();
const deviceLocale = locales[0]?.languageCode ?? 'en';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: resources[deviceLocale as keyof typeof resources] ? deviceLocale : 'en',
    fallbackLng: 'en',
    resources,
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
