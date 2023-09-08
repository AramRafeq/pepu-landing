import { setCookie } from "cookies-next";
import setLanguage from "next-translate/setLanguage";

/**
 * Generates a date object 100 days from the current date
 * @returns {Object} - Object with a date property
 */
export const generateOneHundredDays = () => {
  const date = new Date();
  const expireMs = 100 * 24 * 60 * 60 * 1000; // 100 days
  date.setTime(date.getTime() + expireMs);

  return {
    date,
  };
};


/**
 * Handles the change of the user's language and saves it in a cookie.
 * @async
 * @param {string} lang - The new language code to use (e.g. 'en', 'kr', etc.).
 * @returns {Promise<void>} - A promise that resolves when the language change is complete.
 */
export const handleLanguageChange = async (lang) => {
    await setLanguage(lang);
    const { date } = generateOneHundredDays();
    setCookie("NEXT_LOCALE", lang, {
      expires: date,
    });
  };