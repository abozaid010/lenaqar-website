import ar from "../../../public/locales/ar.js";

/**
 * One list of FAQ entries, shared by the visible section and the FAQPage schema.
 *
 * Google requires FAQPage markup to match content a visitor can actually see on
 * the page. Keeping both readers on this single id list is what guarantees that:
 * an entry cannot exist in the markup without also rendering, and vice versa.
 *
 * The strings themselves live in the locale (`lenaqar.faq.q1` / `.a1`, ...).
 */
export const FAQ_IDS = [1, 2, 3, 4, 5];

export const faqQuestionKey = (id) => `lenaqar.faq.q${id}`;
export const faqAnswerKey = (id) => `lenaqar.faq.a${id}`;

/**
 * Arabic Q&A pairs for the server-rendered schema. The public site is Arabic,
 * so this reads the Arabic dictionary directly rather than going through the
 * client-side `translate()`. Entries missing either half are dropped.
 */
export function faqItemsAr() {
  const faq = ar?.lenaqar?.faq ?? {};
  return FAQ_IDS.map((id) => ({
    question: faq[`q${id}`],
    answer: faq[`a${id}`],
  })).filter((item) => item.question && item.answer);
}
