import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/locales/en.json';
import vi from './src/locales/vi.json';

const i18n = createInstance();

const resources = {
  vi: {
    translation: vi,
  },
  en: {
    translation: en,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
