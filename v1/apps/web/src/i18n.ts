import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import hu from './locales/hu/common.json';
import en from './locales/en/common.json';

void i18n.use(initReactI18next).init({
  resources: { hu: { common: hu }, en: { common: en } },
  lng: localStorage.getItem('fonat.locale') ?? 'hu',
  fallbackLng: 'hu',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  saveMissing: import.meta.env.DEV
});
export default i18n;
