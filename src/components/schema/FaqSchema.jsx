const FAQ_ITEMS = [
  {
    question: "إزاي أبيع وحدتي على لينا عقار؟",
    answer:
      "ابعت عقدك وإيصالات الدفع على واتساب، وبنعرض وحدتك على مشترين جاهزين.",
  },
  {
    question: "إزاي أشتري فرصة معروضة؟",
    answer:
      "اتفرّج على الفرص في صفحة الفرص العقارية، احسب خروجك من الحاسبة، وكلمنا على واتساب لو الصفقة مناسبة.",
  },
  {
    question: "إيه الفرق بين طلب الشراء والفرص الجاهزة؟",
    answer:
      "الفرص الجاهزة وحدات معروضة دلوقتي. طلب الشراء: انت بتوصف اللي عايزه واحنا بنرشّح لك اللي يناسب ونرجع نكلمك.",
  },
  {
    question: "هل في رسوم قبل ما نتفق؟",
    answer:
      "مفيش رسوم تسجيل. أي سعر أو التزام بيتكتب في اتفاق معاك قبل ما نبدأ أي خطوة.",
  },
  {
    question: "هل كل وحدة عليها ضمان 45 يوم؟",
    answer:
      "الضمان مش على كل وحدة معروضة. بيتوضّح ليك قبل ما نمشي في أي خطوة.",
  },
];

export default function FaqSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
