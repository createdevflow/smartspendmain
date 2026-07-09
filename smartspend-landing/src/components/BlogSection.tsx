'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  publishedAt?: string;
  readingTime?: number;
  category?: { name: string; color: string };
  author?: { fullName: string };
}

interface Props {
  posts: BlogPost[];
}

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/blog/${post.slug}`} className="block group">
        <div
          ref={cardRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseMove={handleMouseMove}
          className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
          style={{ position: 'relative' }}
        >
          {/* Liquid spotlight effect */}
          {hovered && (
            <div
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                left: mousePos.x - 100,
                top: mousePos.y - 100,
                pointerEvents: 'none',
                zIndex: 2,
                transition: 'left 0.05s, top 0.05s',
              }}
            />
          )}

          {/* Cover Image */}
          <div style={{ position: 'relative', overflow: 'hidden', height: 200 }}>
            {post.coverImage ? (
              <OptimizedImage
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div style={{ fontSize: '3rem' }}>📝</div>
              </div>
            )}
            {/* Category badge */}
            {post.category && (
              <div
                className="absolute top-3 left-3 flex items-center gap-1 text-white text-xs font-semibold px-3 py-1 rounded-full shadow"
                style={{ backgroundColor: post.category.color || '#2563EB' }}
              >
                <Tag size={10} /> {post.category.name}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {post.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {post.readingTime} min read
                </span>
              )}
            </div>

            <h3 className="text-gray-900 font-bold text-lg leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between">
              {post.author && <span className="text-xs text-gray-400">By {post.author.fullName}</span>}
              <span className="text-blue-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Read More <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 'fb-1',
    title: '5 Habits of High-Net-Worth Freelancers in India',
    slug: '5-habits-high-net-worth-freelancers',
    excerpt: 'Discover how top earners manage GST, separate personal expenses, and automate investments using Cashtro.',
    readingTime: 4,
    category: { name: 'Wealth & Growth', color: '#2563EB' },
    author: { fullName: 'Aarav Sharma' },
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'fb-2',
    title: 'Shared Cashbooks: The End of Roommate Rent Drama',
    slug: 'shared-cashbooks-roommate-rent',
    excerpt: 'How real-time split ledgers keep flatmates, couples, and project teams in complete harmony without awkward reminders.',
    readingTime: 3,
    category: { name: 'Collaboration', color: '#10B981' },
    author: { fullName: 'Priya Patel' },
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'fb-3',
    title: 'Mastering GST Calculations: Inclusive vs Exclusive',
    slug: 'mastering-gst-calculations-inclusive-exclusive',
    excerpt: 'A complete primer for Indian business owners on generating compliant invoices and adjusting billing bases instantly.',
    readingTime: 5,
    category: { name: 'Tax & Compliance', color: '#7C3AED' },
    author: { fullName: 'Rohan Mehta' },
    publishedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'fb-4',
    title: 'AI Financial Insights: How Cashtro Predicts Your Cash Flow',
    slug: 'ai-financial-insights-predict-cash-flow',
    excerpt: 'Behind the scenes of our machine learning models that detect spending anomalies and optimize your savings rate.',
    readingTime: 6,
    category: { name: 'Product Engineering', color: '#F59E0B' },
    author: { fullName: 'Neelam Verma' },
    publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export default function BlogSection({ posts }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const displayPosts = (posts && posts.length > 0)
    ? posts.slice(0, 4)
    : FALLBACK_POSTS;

  const gridCols =
    displayPosts.length >= 4
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      : displayPosts.length === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : displayPosts.length === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
      : 'grid-cols-1 max-w-md mx-auto';

  return (
    <section ref={ref} className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            ✍️ From the Blog
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Finance insights,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              simplified.
            </span>
          </h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">
            Tips, guides and product updates from the Cashtro team
          </p>
        </motion.div>

        {/* Posts Grid */}
        <div className={`grid ${gridCols} gap-8`}>
          {displayPosts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/blog">
            <button className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-gray-700 transition-colors text-sm">
              View All Articles <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
