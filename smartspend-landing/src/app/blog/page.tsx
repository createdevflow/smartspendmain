import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Tag, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedImage from '@/components/OptimizedImage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const metadata: Metadata = {
  title: 'Blog | Cashtro — Finance Insights',
  description: 'Tips, guides and product updates from the Cashtro team. Learn personal finance, budgeting, investing and more.',
  openGraph: {
    title: 'Cashtro Blog — Finance Insights',
    description: 'Practical finance tips and Cashtro product updates.',
    type: 'website',
  },
};

async function getPosts(page = 1, category?: string) {
  try {
    const url = `${API_BASE}/blog/published?limit=12&page=${page}${category ? `&category=${category}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { posts: [], meta: { total: 0, page: 1, totalPages: 1 } };
    const json = await res.json();
    return json?.data || json || { posts: [], meta: { total: 0, page: 1, totalPages: 1 } };
  } catch {
    return { posts: [], meta: { total: 0, page: 1, totalPages: 1 } };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/blog/categories/public`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || json || [];
  } catch {
    return [];
  }
}

export default async function BlogListPage({ searchParams }: { searchParams: Promise<{ page?: string; category?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const category = params.category;

  const [{ posts, meta }, categories] = await Promise.all([getPosts(page, category), getCategories()]);

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 to-white pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-5 md:px-10 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
              ✍️ Cashtro Blog
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-4">
              Finance insights,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                simplified.
              </span>
            </h1>
            <p className="text-gray-500 text-xl max-w-xl mx-auto">
              Tips, product updates and money guides from the Cashtro team.
            </p>
          </div>
        </section>

        {/* Filters */}
        {categories.length > 0 && (
          <section className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto px-5 md:px-10 py-3 flex gap-2 overflow-x-auto">
              <Link href="/blog">
                <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors ${!category ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  All
                </span>
              </Link>
              {categories.map((cat: any) => (
                <Link key={cat.id} href={`/blog?category=${cat.slug}`}>
                  <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors ${category === cat.slug ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    style={{ backgroundColor: category === cat.slug ? (cat.color || '#2563EB') : 'transparent' }}>
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="py-16 max-w-6xl mx-auto px-5 md:px-10">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 h-full">
                    {/* Cover */}
                    <div className="overflow-hidden h-48">
                      {post.coverImage ? (
                        <OptimizedImage src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">📝</div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.category && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white flex items-center gap-1" style={{ backgroundColor: post.category.color || '#2563EB' }}>
                            <Tag size={9} /> {post.category.name}
                          </span>
                        )}
                      </div>
                      <h2 className="text-gray-900 font-bold text-base leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{post.title}</h2>
                      {post.excerpt && <p className="text-gray-500 text-sm line-clamp-2 flex-1 mb-4">{post.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                        {post.readingTime && <span className="flex items-center gap-1"><Clock size={11} /> {post.readingTime} min</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                <Link key={p} href={`/blog?page=${p}${category ? `&category=${category}` : ''}`}>
                  <span className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold border cursor-pointer transition-colors ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>
                    {p}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
