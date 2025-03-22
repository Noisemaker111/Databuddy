import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import PerformanceComponent from "@/app/components/performance";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  Zap, 
  Clock, 
  Cpu, 
  Leaf,
  ChartBar,
  LineChart,
  ArrowRight,
  CheckCircle
} from "lucide-react";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Lightning Fast Performance | Databuddy Analytics",
  description: "Databuddy's analytics script is 247x smaller than Google Analytics, loads 6x faster, and uses 10x less energy, improving your Core Web Vitals.",
  keywords: "analytics performance, fast analytics, Core Web Vitals, web performance, lightweight analytics, site speed",
  alternates: {
    canonical: 'https://www.databuddy.cc/performance',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/performance',
    title: 'Lightning Fast Analytics Performance | Databuddy',
    description: 'Databuddy\'s analytics script is 247x smaller than Google Analytics, loads 6x faster, and uses 10x less energy.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lightning Fast Analytics Performance',
    description: 'Databuddy\'s analytics script is 247x smaller than Google Analytics, loads 6x faster, and uses 10x less energy.',
    creator: '@databuddyps',
  },
};

// Static page for Performance metrics
export default function PerformancePage() {
  const coreWebVitals = [
    {
      name: "Largest Contentful Paint (LCP)",
      impact: "Databuddy adds 0 ms to LCP, compared to 80-200ms for GA",
      description: "Measures loading performance. LCP should occur within 2.5 seconds of page start."
    },
    {
      name: "First Input Delay (FID)",
      impact: "Databuddy's minimal CPU usage prevents input delays, unlike GA",
      description: "Measures interactivity. Pages should have a FID of less than 100 milliseconds."
    },
    {
      name: "Cumulative Layout Shift (CLS)",
      impact: "Databuddy's asynchronous loading causes zero layout shifts",
      description: "Measures visual stability. Pages should maintain a CLS of less than 0.1."
    },
    {
      name: "Interaction to Next Paint (INP)",
      impact: "Databuddy's lightweight script minimizes response time impact",
      description: "Measures responsiveness. Good sites should have an INP of 200 milliseconds or less."
    },
  ];

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
              <div className="absolute top-0 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
              
              <div className="text-center mb-8 relative">
                <div className="inline-flex items-center justify-center p-2 bg-sky-500/10 rounded-full mb-5 border border-sky-500/20" aria-hidden="true">
                  <Zap className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6" itemProp="headline">
                  Lightning Fast Performance
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  Our analytics script is built for speed and efficiency, directly improving your site's SEO, user experience, and conversion rates.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Main Performance section */}
          <div id="performance-metrics">
            <PerformanceComponent />
          </div>

          {/* Core Web Vitals section */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Impact on Core Web Vitals</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Core Web Vitals are essential metrics Google uses to rank your website. Here's how Databuddy helps improve them:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {coreWebVitals.map((metric) => (
                  <div key={metric.name} className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-3">{metric.name}</h3>
                    <p className="text-sky-400 font-medium mb-3">{metric.impact}</p>
                    <p className="text-slate-400 text-sm">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* SEO Impact section */}
          <FadeIn delay={150}>
            <div className="container mx-auto px-4 py-16 max-w-4xl">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="text-center mb-8">
                  <ChartBar className="h-10 w-10 text-sky-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4">Impact on SEO & Conversion</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                    Performance directly affects your search rankings and conversion rates. Here's the real-world impact:
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Search Rankings</h3>
                      <p className="text-slate-300 mb-3">
                        Faster sites rank higher. Our customers see an average of <span className="text-sky-400 font-medium">20% improvement</span> in Core Web Vitals scores after switching from GA4.
                      </p>
                      <div className="text-sm text-slate-400">
                        <LineChart className="h-4 w-4 inline-block mr-1 text-green-400" /> 
                        Positive correlation with higher SERP positions
                      </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Conversion Rates</h3>
                      <p className="text-slate-300 mb-3">
                        A 1-second delay in page load time can reduce conversions by 7%. Customers report <span className="text-sky-400 font-medium">5-15% higher conversion rates</span> after switching.
                      </p>
                      <div className="text-sm text-slate-400">
                        <LineChart className="h-4 w-4 inline-block mr-1 text-green-400" /> 
                        Especially significant on mobile devices
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">User Experience</h3>
                    <p className="text-slate-300 mb-4">
                      Performance isn't just about SEO—it's about delivering a smooth, frustration-free experience for your users. Every 100ms of latency can reduce conversion rates by 1%.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-sky-400 mt-0.5 mr-2 shrink-0" />
                        <span className="text-slate-300">Lower bounce rates</span>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-sky-400 mt-0.5 mr-2 shrink-0" />
                        <span className="text-slate-300">Longer session durations</span>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-sky-400 mt-0.5 mr-2 shrink-0" />
                        <span className="text-slate-300">Higher pages per session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={200}>
            <div className="container mx-auto px-4 py-16 max-w-5xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Boost your site performance</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Switch to Databuddy and see the difference in your site's speed, performance, and conversion rates.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo">Try Databuddy Free</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/contact">Request Performance Audit</Link>
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
                "name": "Lightning Fast Performance | Databuddy Analytics",
                "description": "Databuddy's analytics script is 247x smaller than Google Analytics, loads 6x faster, and uses 10x less energy, improving your Core Web Vitals.",
                "mainEntity": {
                  "@type": "Product",
                  "name": "Databuddy Analytics",
                  "description": "Privacy-first web analytics with exceptional performance",
                  "brand": {
                    "@type": "Brand",
                    "name": "Databuddy"
                  },
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
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