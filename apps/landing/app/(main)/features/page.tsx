import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import FeaturesComponent from "@/app/components/features";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  BarChart2, 
  Code, 
  Shield, 
  Gauge, 
  Sparkles, 
  Boxes,
  Server,
  Database,
  GitBranch,
  Activity,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  FileJson
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Features | Databuddy Analytics",
  description: "Explore the complete feature set of Databuddy Analytics. Privacy-first web analytics with powerful features, simple integration, and zero impact on site performance.",
  keywords: "web analytics, privacy analytics, GDPR analytics, cookieless tracking, performance analytics, data visualization, event streaming, plugin ecosystem, developer API",
  alternates: {
    canonical: 'https://www.databuddy.cc/features',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/features',
    title: 'Features | Databuddy Analytics',
    description: 'Privacy-first web analytics with powerful features and zero impact on your site performance.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Databuddy Analytics Features',
    description: 'Privacy-first web analytics with powerful features and zero impact on your site performance.',
    creator: '@databuddyps',
  },
};

// Define feature categories and their details for the page
const featureCategories = [
  {
    id: "core",
    title: "Core Analytics",
    description: "Essential analytics features that form the foundation of understanding your visitors and their behavior.",
    icon: <BarChart2 className="h-6 w-6" />,
    color: "from-blue-400 to-blue-600",
    highlights: [
      "Real-time visitor tracking",
      "Traffic source analysis",
      "Page performance metrics",
      "Visitor demographics",
      "Custom events tracking"
    ],
    link: "#core-analytics"
  },
  {
    id: "privacy",
    title: "Privacy Features",
    description: "Privacy-first analytics that respects your visitors while still providing valuable insights.",
    icon: <Shield className="h-6 w-6" />,
    color: "from-green-400 to-green-600",
    highlights: [
      "Cookieless tracking",
      "GDPR & CCPA compliance",
      "No personal data collection",
      "IP anonymization",
      "Data ownership"
    ],
    link: "/privacy"
  },
  {
    id: "integration",
    title: "Easy Integration",
    description: "Simple setup with any website or application, regardless of your tech stack.",
    icon: <Code className="h-6 w-6" />,
    color: "from-purple-400 to-purple-600",
    highlights: [
      "Next.js integration",
      "Plain JavaScript snippet",
      "React/Vue/Angular support",
      "GitHub integration",
      "Comprehensive API"
    ],
    link: "#integration"
  },
  {
    id: "performance",
    title: "Performance",
    description: "Lightning-fast analytics with zero impact on your site's speed and performance.",
    icon: <Gauge className="h-6 w-6" />,
    color: "from-orange-400 to-orange-600",
    highlights: [
      "Lightweight script (<2KB)",
      "Edge processing",
      "Core Web Vitals tracking",
      "Resource monitoring",
      "Self-hosted option"
    ],
    link: "/performance"
  },
  {
    id: "dataos",
    title: "Data OS Platform",
    description: "A complete data operating system for developers and data analysts.",
    icon: <Boxes className="h-6 w-6" />,
    color: "from-sky-400 to-sky-600",
    highlights: [
      "Event streaming",
      "Developer API",
      "Plugin ecosystem",
      "Edge computing",
      "Data warehouse integration"
    ],
    link: "/data-os"
  },
  {
    id: "advanced",
    title: "Advanced Features",
    description: "Powerful capabilities for in-depth analysis and optimization.",
    icon: <Sparkles className="h-6 w-6" />,
    color: "from-pink-400 to-pink-600",
    highlights: [
      "AI insights",
      "Custom dashboards",
      "Goal tracking",
      "Heatmaps (coming soon)",
      "A/B testing (coming soon)"
    ],
    link: "#advanced-features"
  }
];

// Feature showcase items
const featureShowcase = [
  {
    id: "core-analytics",
    title: "Powerful Core Analytics",
    description: "Understand your audience with comprehensive yet privacy-focused analytics",
    icon: <BarChart2 className="h-10 w-10" />,
    color: "from-blue-500 to-blue-700",
    features: [
      {
        title: "Real-time Dashboard",
        description: "See who's on your site right now with live updates and minimal latency",
        icon: <Activity className="h-5 w-5" />
      },
      {
        title: "Traffic Sources",
        description: "Understand exactly where your visitors are coming from without using cookies",
        icon: <Globe className="h-5 w-5" />
      },
      {
        title: "User Flow Analysis",
        description: "Track how users navigate through your site to optimize conversion paths",
        icon: <GitBranch className="h-5 w-5" />
      }
    ],
    image: "/dashboard.png"
  },
  {
    id: "integration",
    title: "Seamless Integration",
    description: "Add Databuddy to any website or application in minutes, regardless of your tech stack",
    icon: <Code className="h-10 w-10" />,
    color: "from-purple-500 to-purple-700",
    features: [
      {
        title: "One-line Setup",
        description: "Add a single line of code to your site and get instant analytics",
        icon: <Code className="h-5 w-5" />
      },
      {
        title: "API Access",
        description: "Comprehensive REST API for custom dashboards and integrations",
        icon: <FileJson className="h-5 w-5" />
      },
      {
        title: "Framework Support",
        description: "Dedicated packages for React, Vue, Angular, and more",
        icon: <Boxes className="h-5 w-5" />
      }
    ],
    image: "/code-snippet.png"
  },
  {
    id: "advanced-features",
    title: "Advanced Capabilities",
    description: "Go beyond basic analytics with powerful tools for serious growth",
    icon: <Sparkles className="h-10 w-10" />,
    color: "from-pink-500 to-pink-700",
    features: [
      {
        title: "AI Insights",
        description: "Get intelligent recommendations to improve site performance and conversion",
        icon: <Sparkles className="h-5 w-5" />
      },
      {
        title: "Custom Dashboards",
        description: "Build personalized dashboards with the metrics that matter to you",
        icon: <BarChart2 className="h-5 w-5" />
      },
      {
        title: "Goal Tracking",
        description: "Set and monitor conversion goals to measure site effectiveness",
        icon: <Activity className="h-5 w-5" />
      }
    ],
    image: "/ai-insights.png"
  }
];

// Static page for features
export default function FeaturesPage() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="pt-8" itemScope itemType="https://schema.org/WebPage">
          {/* Hero section */}
          <FadeIn>
            <div className="container mx-auto px-4 py-16 max-w-6xl relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
              
              <div className="text-center mb-8 relative">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6" itemProp="headline">
                  Powerful Features, Simple Interface
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  Everything you need to understand your audience without compromising their privacy or your site&apos;s performance.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Link href="#all-features" className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Explore All Features
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                    <Link href="/demo" className="flex items-center gap-2">
                      See Live Demo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Feature categories overview */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Feature Categories</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Explore the different areas of functionality that make Databuddy the most powerful privacy-first analytics platform.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {featureCategories.map((category) => (
                  <div key={category.id} id={category.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300" itemScope itemType="https://schema.org/ItemList">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} text-white`}>
                        {category.icon}
                      </div>
                      <h2 className="text-xl font-bold" itemProp="name">{category.title}</h2>
                    </div>
                    <p className="text-slate-400 mb-4" itemProp="description">{category.description}</p>
                    <ul className="space-y-2 mb-6">
                      {category.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                          <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                          <span className="text-slate-300 text-sm" itemProp="name">{highlight}</span>
                          <meta itemProp="position" content={String(index + 1)} />
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="ghost" className="w-full justify-between hover:bg-sky-500/10 hover:text-sky-400">
                      <Link href={category.link} className="flex items-center">
                        Learn more
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          
          {/* Feature showcase sections */}
          <FadeIn delay={120}>
            {featureShowcase.map((showcase, index) => (
              <div key={showcase.id} id={showcase.id} className={`py-16 ${index % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4 max-w-6xl">
                  <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${showcase.color} text-white inline-flex mb-4`}>
                        {showcase.icon}
                      </div>
                      <h2 className="text-3xl font-bold mb-4">{showcase.title}</h2>
                      <p className="text-slate-300 text-lg mb-8">{showcase.description}</p>
                      
                      <div className="space-y-6 mb-8">
                        {showcase.features.map((feature) => (
                          <div key={feature.title} className="flex items-start">
                            <div className="mt-1 p-2 rounded-lg bg-sky-500/10 text-sky-400 mr-4">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                              <p className="text-slate-400">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                        <Link href="/demo">Try it yourself</Link>
                      </Button>
                    </div>
                    <div className="lg:w-1/2 order-1 lg:order-2">
                      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-xl opacity-50" />
                        <div className="relative h-[300px] rounded-lg overflow-hidden">
                          {/* Image will be added here in a real implementation */}
                          <div className="absolute inset-0 bg-gradient-to-r from-sky-900/50 to-blue-900/50 flex items-center justify-center">
                            <p className="text-sky-300 text-lg">Image: {showcase.image}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </FadeIn>

          {/* All features section */}
          <div id="all-features">
            <FeaturesComponent />
          </div>

          {/* Why choose Databuddy section */}
          <FadeIn delay={150}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Databuddy?</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Built for modern web applications with a focus on privacy, performance, and simplicity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-sky-500/10 rounded-full">
                      <Shield className="h-8 w-8 text-sky-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Privacy-First</h3>
                  <p className="text-slate-400">
                    No cookies, no personal data collection, and full GDPR compliance while still providing valuable insights.
                  </p>
                  <Button asChild variant="link" className="mt-4 text-sky-400">
                    <Link href="/privacy">Learn about our privacy approach</Link>
                  </Button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-sky-500/10 rounded-full">
                      <Gauge className="h-8 w-8 text-sky-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
                  <p className="text-slate-400">
                    Lightweight script less than 2KB with edge processing for minimal impact on your site&apos;s performance.
                  </p>
                  <Button asChild variant="link" className="mt-4 text-sky-400">
                    <Link href="/performance">See performance metrics</Link>
                  </Button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-sky-500/10 rounded-full">
                      <Database className="h-8 w-8 text-sky-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Data Ownership</h3>
                  <p className="text-slate-400">
                    You own 100% of your analytics data with full export capabilities and no vendor lock-in.
                  </p>
                  <Button asChild variant="link" className="mt-4 text-sky-400">
                    <Link href="/data-os">Explore Data OS platform</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* FAQ Tabs section */}
          <FadeIn delay={200}>
            <div className="container mx-auto px-4 py-16 max-w-3xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-slate-400">
                  Common questions about Databuddy&apos;s features and capabilities
                </p>
              </div>
              
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">How does Databuddy compare to Google Analytics?</h3>
                      <p className="text-slate-300">Databuddy offers privacy-first analytics without cookies, faster performance with a lightweight script, and gives you complete ownership of your data, unlike Google Analytics.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Is there a free plan available?</h3>
                      <p className="text-slate-300">Yes, Databuddy offers a generous free plan for small websites with up to 10,000 monthly page views and access to core analytics features.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Does Databuddy work with all types of websites?</h3>
                      <p className="text-slate-300">Yes, Databuddy works with any website or web application, regardless of technology. We provide dedicated integrations for popular frameworks like Next.js, React, Vue, and more.</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="privacy" className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">How does cookieless tracking work?</h3>
                      <p className="text-slate-300">Databuddy uses advanced fingerprinting techniques that don&apos;t rely on personal data to track sessions anonymously, providing accurate analytics without compromising privacy or requiring consent banners.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Is Databuddy GDPR compliant?</h3>
                      <p className="text-slate-300">Yes, Databuddy is built from the ground up to be GDPR, CCPA, and ePrivacy compliant. We don&apos;t collect personal data or use cookies, eliminating most compliance concerns.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Do I need a cookie consent banner with Databuddy?</h3>
                      <p className="text-slate-300">No, since Databuddy doesn&apos;t use cookies or collect personal data, you typically don&apos;t need a cookie consent banner just for analytics purposes.</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="technical" className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">How do I integrate Databuddy with my site?</h3>
                      <p className="text-slate-300">Integration is simple - either add our lightweight JavaScript snippet to your site&apos;s header or use one of our framework-specific packages for an even easier setup.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Can I export my analytics data?</h3>
                      <p className="text-slate-300">Yes, Databuddy allows you to export your data in CSV, JSON formats or connect directly to your data warehouse, giving you complete ownership and flexibility.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Is there an API available?</h3>
                      <p className="text-slate-300">Yes, Databuddy offers a comprehensive REST API for custom integrations, along with a GraphQL API for more complex data queries.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={250}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to try Databuddy?</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Join thousands of businesses using Databuddy for privacy-first analytics that drives real growth.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo">Try For Free</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/contact">Schedule a Demo</Link>
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
                "@type": "WebPage",
                "name": "Databuddy Analytics Features",
                "description": "Privacy-first web analytics with powerful features and zero impact on your site performance.",
                "url": "https://databuddy.cc/features",
                "mainEntity": {
                  "@type": "SoftwareApplication",
                  "name": "Databuddy Analytics",
                  "applicationCategory": "WebApplication",
                  "operatingSystem": "All",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "127"
                  }
                }
              })
            }}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
} 