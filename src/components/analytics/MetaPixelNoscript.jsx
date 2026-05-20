import { getMetaPixelNoscriptUrl } from '@/constants/analytics';

export default function MetaPixelNoscript() {
  const src = getMetaPixelNoscriptUrl();
  if (!src) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={src}
        alt=""
      />
    </noscript>
  );
}
