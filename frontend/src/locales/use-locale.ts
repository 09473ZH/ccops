import en_US from 'antd/locale/en_US';
import zh_CN from 'antd/locale/zh_CN';
import { useTranslation } from 'react-i18next';

import { LocalEnum } from '#/enum';
import type { Locale as AntdLocal } from 'antd/es/locale';

type Locale = keyof typeof LocalEnum;
type Language = {
  locale: keyof typeof LocalEnum;
  icon: string;
  label: string;
  antdLocal: AntdLocal;
};

export const LANGUAGE_MAP: Record<Locale, Language> = {
  [LocalEnum.zh_CN]: {
    locale: LocalEnum.zh_CN,
    label: 'Chinese',
    icon: 'ic-locale_zh_CN',
    antdLocal: zh_CN,
  },
  [LocalEnum.en_US]: {
    locale: LocalEnum.en_US,
    label: 'English',
    icon: 'ic-locale_en_US',
    antdLocal: en_US,
  },
};

const LOCALE_KEY = 'app_locale';

const getDefaultLanguage = (): Locale => {
  const savedLocale = localStorage.getItem(LOCALE_KEY);
  console.log('Saved locale:', savedLocale);

  if (savedLocale) {
    const isValidLocale = Object.values(LocalEnum).includes(savedLocale as LocalEnum);
    console.log('Is valid locale:', isValidLocale);
    if (isValidLocale) {
      return savedLocale as Locale;
    }
  }

  return LocalEnum.zh_CN;
};

export default function useLocale() {
  const { i18n } = useTranslation();

  const setLocale = (locale: Locale) => {
    localStorage.setItem(LOCALE_KEY, locale);
    i18n.changeLanguage(locale);
  };

  const locale = (i18n.resolvedLanguage as Locale) || getDefaultLanguage();

  const language = LANGUAGE_MAP[locale];

  return {
    locale,
    language,
    setLocale,
  };
}
