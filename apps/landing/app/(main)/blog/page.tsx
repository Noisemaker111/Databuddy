import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  BookOpen,
  ChevronRight,
  Clock,
  Calendar,
  Tag,
  ArrowRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Blog | Databuddy Analytics",
  description: "Read the latest insights, tutorials and updates about privacy-first analytics, web performance, and data collection best practices.",
  keywords: "analytics blog, privacy-first analytics, web performance, GDPR compliance, cookieless tracking, data analytics, analytics insights",
  alternates: {
    canonical: 'https://www.databuddy.cc/blog',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/blog',
    title: 'Blog | Databuddy Analytics',
    description: 'Insights, tutorials and updates about privacy-first analytics and web performance.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Databuddy Analytics Blog',
    description: 'Insights, tutorials and updates about privacy-first analytics and web performance.',
    creator: '@databuddyps',
  },
};

// Sample blog categories
const categories = [
  { name: "Product Updates", slug: "product-updates", count: 8 },
  { name: "Tutorials", slug: "tutorials", count: 5 },
  { name: "Case Studies", slug: "case-studies", count: 3 },
  { name: "Privacy", slug: "privacy", count: 7 },
  { name: "Performance", slug: "performance", count: 4 },
  { name: "API & Developers", slug: "developers", count: 6 }
];

// Sample blog posts for initial display
const blogPosts = [
  {
    id: "cookieless-analytics",
    title: "The Complete Guide to Cookieless Analytics in 2023",
    excerpt: "Learn how to implement effective analytics without cookies, why it matters for privacy, and how it can improve your user experience.",
    date: "2023-09-15",
    readTime: "8 min read",
    category: "Privacy",
    image: "/blog/cookieless-analytics.jpg",
    featured: true
  },
  {
    id: "core-web-vitals",
    title: "How Analytics Scripts Impact Core Web Vitals",
    excerpt: "Analyzing the performance impact of popular analytics tools on your Core Web Vitals scores and what you can do to minimize it.",
    date: "2023-08-22",
    readTime: "6 min read",
    category: "Performance",
    image: "/blog/web-vitals.jpg",
    featured: true
  },
  {
    id: "gdpr-guide",
    title: "GDPR Compliance: A Practical Guide for Websites",
    excerpt: "Everything you need to know about making your website GDPR compliant, especially for analytics and tracking.",
    date: "2023-07-18",
    readTime: "10 min read",
    category: "Privacy",
    image: "/blog/gdpr-guide.jpg",
    featured: false
  },
  {
    id: "nextjs-integration",
    title: "Integrating Databuddy with Next.js App Router",
    excerpt: "A step-by-step guide to setting up Databuddy Analytics in your Next.js application using the App Router.",
    date: "2023-06-30",
    readTime: "5 min read",
    category: "Tutorials",
    image: "/blog/nextjs.jpg",
    featured: false
  },
  {
    id: "event-tracking",
    title: "Advanced Event Tracking Strategies",
    excerpt: "Learn how to implement custom event tracking to gather meaningful insights about user behavior.",
    date: "2023-06-05",
    readTime: "7 min read",
    category: "Tutorials",
    image: "/blog/event-tracking.jpg",
    featured: false
  },
  {
    id: "autumn-update",
    title: "Autumn 2023 Update: New Features and Improvements",
    excerpt: "We've added new dashboard visualizations, enhanced API capabilities, and improved performance in our latest update.",
    date: "2023-09-28",
    readTime: "4 min read",
    category: "Product Updates",
    image: "/blog/autumn-update.jpg",
    featured: false
  }
];

// Static page for Blog
export default function BlogPage() {
  // Get featured posts
  const featuredPosts = blogPosts.filter(post => post.featured);
  // Get remaining posts
  const recentPosts = blogPosts.filter(post => !post.featured);
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="pt-8">
          {/* Hero section */}
          <FadeIn>
            <div className="container mx-auto px-4 py-16 max-w-6xl relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
              
              <div className="text-center mb-8 relative">
                <div className="inline-flex items-center justify-center p-2 bg-sky-500/10 rounded-full mb-5 border border-sky-500/20">
                  <BookOpen className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6">
                  Databuddy Analytics Blog
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
                  Insights, tutorials, and best practices for privacy-first analytics and web performance
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Featured posts */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-12 max-w-6xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Featured Articles</h2>
                <Button asChild variant="ghost" className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10">
                  <Link href="#all-posts">
                    All posts
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <div key={post.id} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300">
                    <div className="h-48 bg-slate-800 relative">
                      {/* In a real implementation, this would be an Image component */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-sky-900/50 to-blue-900/50">
                        <p className="text-sky-300">Featured Image: {post.image}</p>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-xs font-medium rounded-full border border-sky-500/30">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 hover:text-sky-400 transition-colors">
                        <Link href={`/blog/${post.id}`}>{post.title}</Link>
                      </h3>
                      <p className="text-slate-400 mb-4">{post.excerpt}</p>
                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        <span className="mr-4">{post.date}</span>
                        <Clock className="h-4 w-4 mr-1.5" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Recent posts and sidebar */}
          <FadeIn delay={150}>
            <div id="all-posts" className="container mx-auto px-4 py-12 max-w-6xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">Recent Articles</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main content - posts */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300">
                        <div className="h-40 bg-slate-800 relative">
                          {/* In a real implementation, this would be an Image component */}
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-slate-900/80 to-slate-800/80">
                            <p className="text-slate-400">Image: {post.image}</p>
                          </div>
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-slate-800/80 text-sky-400 text-xs font-medium rounded-full">
                              {post.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-bold mb-2 hover:text-sky-400 transition-colors">
                            <Link href={`/blog/${post.id}`}>{post.title}</Link>
                          </h3>
                          <p className="text-slate-400 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                          <div className="flex items-center text-xs text-slate-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="mr-3">{post.date}</span>
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center space-x-2">
                      <Button disabled variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 h-9 w-9 p-0">
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 h-9 w-9 p-0">1</Button>
                      <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 h-9 w-9 p-0">2</Button>
                      <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 h-9 w-9 p-0">3</Button>
                      <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 h-9 w-9 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Categories */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-lg font-bold mb-4">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <Link 
                          key={category.slug} 
                          href={`/blog/category/${category.slug}`}
                          className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 text-sky-400 mr-2" />
                            <span className="text-slate-300">{category.name}</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-slate-800 rounded-full text-slate-400">
                            {category.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  {/* Newsletter signup */}
                  <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-xl p-5 border border-sky-500/20">
                    <h3 className="text-lg font-bold mb-3">Subscribe to our newsletter</h3>
                    <p className="text-slate-300 text-sm mb-4">Get the latest articles and insights about analytics directly to your inbox.</p>
                    <div className="space-y-3">
                      <Input 
                        type="email" 
                        placeholder="Your email address" 
                        className="bg-slate-900/70 border-slate-700 focus:border-sky-500 focus:ring-sky-500"
                      />
                      <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                        Subscribe
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={200}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Want to try Databuddy?</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Experience privacy-first analytics that doesn&apos;t compromise on features or performance. See why thousands of businesses trust Databuddy.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo" className="flex items-center gap-2">
                        Try For Free
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/features">
                        Explore Features
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          
          {/* Structured data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Blog",
                "name": "Databuddy Analytics Blog",
                "description": "Insights, tutorials and updates about privacy-first analytics and web performance.",
                "url": "https://databuddy.cc/blog",
                "publisher": {
                  "@type": "Organization",
                  "name": "Databuddy Analytics",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://databuddy.cc/logo.png"
                  }
                },
                "blogPost": blogPosts.map(post => ({
                  "@type": "BlogPosting",
                  "headline": post.title,
                  "description": post.excerpt,
                  "datePublished": post.date,
                  "author": {
                    "@type": "Organization",
                    "name": "Databuddy Analytics Team"
                  },
                  "url": `https://databuddy.cc/blog/${post.id}`
                }))
              })
            }}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
} 