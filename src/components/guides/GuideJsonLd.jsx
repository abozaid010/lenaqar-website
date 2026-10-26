export default function GuideJsonLd({ blocks = [] }) {
  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
