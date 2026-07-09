import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, Tag, User, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedImage from '@/components/OptimizedImage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function getPost(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/blog/${slug}/public`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || json || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data?.post) return { title: 'Post Not Found | Cashtro Blog' };
  const { post } = data;
  return {
    title: post.seoTitle || `${post.title} | Cashtro Blog`,
    description: post.seoDescription || post.excerpt,
    keywords: post.focusKeywords,
    robots: post.metaRobots || 'index,follow',
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.ogImage || post.coverImage ? [{ url: post.ogImage || post.coverImage }] : [],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    ...(post.canonicalUrl && { alternates: { canonical: post.canonicalUrl } }),
  };
}

// Render editor blocks to HTML
function renderBlock(block: any, index: number) {
  switch (block.type) {
    case 'heading1': return <h1 key={index} className="text-4xl font-black text-gray-900 mt-8 mb-4">{block.text}</h1>;
    case 'heading2': return <h2 key={index} className="text-3xl font-bold text-gray-800 mt-8 mb-4" id={block.text?.toLowerCase().replace(/\s+/g, '-')}>{block.text}</h2>;
    case 'heading3': return <h3 key={index} className="text-2xl font-bold text-gray-800 mt-6 mb-3" id={block.text?.toLowerCase().replace(/\s+/g, '-')}>{block.text}</h3>;
    case 'heading4': return <h4 key={index} className="text-xl font-semibold text-gray-800 mt-5 mb-2">{block.text}</h4>;
    case 'paragraph': return <div key={index} className="text-gray-700 leading-relaxed mb-5 text-lg prose-p:my-2 prose-headings:font-bold prose-a:text-blue-600 prose-a:underline" dangerouslySetInnerHTML={{ __html: block.text || '' }} />;
    case 'quote': return <blockquote key={index} className="border-l-4 border-blue-500 pl-6 py-2 my-6 bg-blue-50 rounded-r-xl text-blue-900 text-lg font-medium italic">{block.text}</blockquote>;
    case 'code': return (
      <div key={index} className="my-6 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gray-800 text-gray-400 text-xs px-4 py-2 flex justify-between items-center">
          <span>{block.language || 'code'}</span>
        </div>
        <pre className="bg-gray-900 text-green-400 p-5 overflow-auto"><code className="text-sm font-mono">{block.text}</code></pre>
      </div>
    );
    case 'bullet_list': return <ul key={index} className="list-disc pl-6 my-4 space-y-1">{(block.items || []).map((item: string, i: number) => <li key={i} className="text-gray-600">{item}</li>)}</ul>;
    case 'numbered_list': return <ol key={index} className="list-decimal pl-6 my-4 space-y-1">{(block.items || []).map((item: string, i: number) => <li key={i} className="text-gray-600">{item}</li>)}</ol>;
    case 'checklist': return (
      <ul key={index} className="my-4 space-y-2">
        {(block.items || []).map((item: string, i: number) => (
          <li key={i} className="flex items-center gap-2 text-gray-600">
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${block.checked?.[i] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
              {block.checked?.[i] ? '✓' : ''}
            </span>
            <span className={block.checked?.[i] ? 'line-through text-gray-400' : ''}>{item}</span>
          </li>
        ))}
      </ul>
    );
    case 'divider': return <hr key={index} className="my-8 border-gray-200" />;
    case 'image': return block.src ? (
      <figure key={index} className="my-8">
        <OptimizedImage src={block.src} alt={block.alt || ''} className="w-full rounded-xl shadow-md" />
        {block.caption && <figcaption className="text-center text-sm text-gray-400 mt-2">{block.caption}</figcaption>}
      </figure>
    ) : null;
    case 'document': return block.src ? (
      <a
        key={index}
        href={block.src}
        download={block.fileName || 'document'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 my-6 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 hover:border-blue-400 rounded-xl transition-all group no-underline"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            📄
          </div>
          <div>
            <p className="font-semibold text-gray-900 m-0 text-base group-hover:text-blue-600 transition-colors">
              {block.fileName || 'Attached Document'}
            </p>
            {block.fileSize && <p className="text-xs text-gray-500 m-0 mt-0.5">{block.fileSize}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white text-blue-600 font-semibold text-xs px-3.5 py-2 rounded-lg border border-blue-200 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
          <span>Download</span>
          <span>⬇️</span>
        </div>
      </a>
    ) : null;
    case 'table': return (block.rows && block.rows.length > 0) ? (
      <div key={index} className="my-6 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <tbody>
            {block.rows.map((row: string[], rIdx: number) => (
              <tr key={rIdx} className={rIdx === 0 ? 'bg-gray-100 font-bold border-b border-gray-200' : 'border-b border-gray-100 hover:bg-gray-50/50'}>
                {row.map((cell: string, cIdx: number) => (
                  <td key={cIdx} className="p-3.5 border-r border-gray-100 last:border-r-0">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null;
    case 'callout_info': return <div key={index} className="my-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4 text-blue-900">💡 {block.calloutText}</div>;
    case 'callout_warning': return <div key={index} className="my-6 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 text-amber-900">⚠️ {block.calloutText}</div>;
    case 'callout_success': return <div key={index} className="my-6 bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 text-green-900">✅ {block.calloutText}</div>;
    default: return null;
  }
}

// Extract headings for Table of Contents
function extractHeadings(blocks: any[]) {
  return blocks.filter(b => b.type === 'heading2' || b.type === 'heading3').map(b => ({
    text: b.text,
    id: b.text?.toLowerCase().replace(/\s+/g, '-'),
    level: b.type === 'heading2' ? 2 : 3,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data?.post) notFound();

  const { post, related } = data;
  const content: any[] = Array.isArray(post.content) ? post.content : [];
  const headings = extractHeadings(content);

  return (
    <>
      <Header />
      <main>
        {/* Article Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-20 pb-10">
          <div className="max-w-4xl mx-auto px-5 md:px-10">
            <Link href="/blog" className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold mb-6 hover:gap-3 transition-all">
              <ArrowLeft size={14} /> Back to Blog
            </Link>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {post.category && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full text-white flex items-center gap-1" style={{ backgroundColor: post.category.color || '#2563EB' }}>
                  <Tag size={10} /> {post.category.name}
                </span>
              )}
              {post.tags?.map((tag: any) => (
                <span key={tag.id} className="text-xs border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full">{tag.name}</span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">{post.title}</h1>
            {post.excerpt && <p className="text-xl text-gray-500 mb-6">{post.excerpt}</p>}

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
              {post.author && (
                <span className="flex items-center gap-1.5">
                  <User size={14} /> {post.author.fullName}
                </span>
              )}
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {post.readingTime && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {post.readingTime} min read
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="max-w-4xl mx-auto px-5 md:px-10 mb-8">
            <OptimizedImage src={post.coverImage} alt={post.title} className="w-full rounded-2xl shadow-lg object-cover max-h-96" priority sizes="(max-width: 1024px) 100vw, 1024px" />
          </div>
        )}

        {/* Article Layout */}
        <div className="max-w-4xl mx-auto px-5 md:px-10 pb-20">
          <article className="w-full">
            {/* Table of Contents */}
            {headings.length > 2 && (
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-6 mb-10">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Table of Contents</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {headings.map((h, i) => (
                    <li key={i}>
                      <a
                        href={`#${h.id}`}
                        className={`text-sm hover:text-blue-600 transition-colors block leading-snug ${h.level === 3 ? 'pl-4 text-gray-500' : 'text-gray-800 font-medium'}`}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="prose prose-lg max-w-none">
              {content.map((block, i) => renderBlock(block, i))}
            </div>
          </article>
        </div>

        {/* Related Posts */}
        {related && related.length > 0 && (
          <section className="bg-gray-50 py-16">
            <div className="max-w-6xl mx-auto px-5 md:px-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rp: any) => (
                  <Link key={rp.id} href={`/blog/${rp.slug}`} className="block group">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">{rp.title}</h3>
                      <p className="text-sm text-gray-400">{rp.author?.fullName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
