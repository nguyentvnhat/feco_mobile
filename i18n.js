import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/locales/en.json';
import vi from './src/locales/vi.json';

const resources = {
  vi: {
    translation: vi,
  },
  en: {
    translation: en,
  },
};

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: 'vi',
    fallbackLng: 'vi',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });
} else {
  // Fast Refresh can keep the old i18n instance alive, so refresh bundles manually.
  i18next.addResourceBundle('vi', 'translation', vi, true, true);
  i18next.addResourceBundle('en', 'translation', en, true, true);
  void i18next.reloadResources(['vi', 'en']);
}

export default i18next;
