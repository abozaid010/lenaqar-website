import SeoBlogArticle from "@/components/web/seo/SeoBlogArticle";
import { SEO_BLOG_POST_KEY_TO_SLUG, SEO_BLOG_SLUG_TO_KEY } from "@/content/seo";
import { SITE_URL } from "@/app/metadata";
import { notFound } from "next/navigation";
import { BLOG_POST_META_EN } from "@/content/seo/blog-meta";

const POST_KEYS = Object.keys(SEO_BLOG_POST_KEY_TO_SLUG);

export function generateStaticParams() {
  return POST_KEYS.map((postKey) => ({
    slug: SEO_BLOG_POST_KEY_TO_SLUG[postKey],
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const postKey = SEO_BLOG_SLUG_TO_KEY[slug];
  if (!postKey) return { title: "Blog | Lena AI" };

  const meta = BLOG_POST_META_EN[postKey];
  const path = `/blog/${slug}`;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}${path}`,
    },
    alternates: {
      canonical: `${SITE_URL}${path}`,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const postKey = SEO_BLOG_SLUG_TO_KEY[slug];
  if (!postKey) notFound();

  return <SeoBlogArticle postKey={postKey} />;
}
