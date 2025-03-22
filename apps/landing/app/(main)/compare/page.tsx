import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { competitors } from "./data";
import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import ComparisonComponent from "@/app/components/comparison";
import FadeIn from "@/app/components/FadeIn";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  LineChart, 
  BarChart, 
  Check, 
  X,
  Sparkles,
  CheckCircle
} from "lucide-react";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Analytics Comparison | Databuddy vs Google Analytics",
  description: "See how Databuddy Analytics compares to Google Analytics with our feature comparison. Discover the privacy, performance and data ownership benefits.",
  keywords: "analytics comparison, Google Analytics alternative, GDPR analytics, cookieless analytics, privacy-focused analytics, analytics comparison",
  alternates: {
    canonical: 'https://www.databuddy.cc/compare',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/compare',
    title: 'Analytics Comparison | Databuddy vs Google Analytics',
    description: 'Compare Databuddy Analytics to Google Analytics and see why our privacy-first approach delivers better results.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Databuddy vs Google Analytics Comparison',
    description: 'Compare Databuddy Analytics to Google Analytics and see why our privacy-first approach delivers better results.',
    creator: '@databuddyps',
  },
};

// Expanded comparison features
const additionalFeatures = [
  {
    name: "Script performance impact",
    us: "Minimal (<1.5KB)",
    ga: "Significant (371KB)",
    benefit: "Better Core Web Vitals scores and SEO ranking"
  },
  {
    name: "Ad-blocker resistance",
    us: "High",
    ga: "Low",
    benefit: "More complete data collection for accurate insights"
  },
  {
    name: "Data portability",
    us: "Full JSON/CSV exports",
    ga: "Limited",
    benefit: "Freedom to use your data in any system"
  },
  {
    name: "First-party data focus",
    us: "Yes",
    ga: "Mixed",
    benefit: "Future-proof against third-party cookie deprecation"
  },
];

// Static page for Comparison
export default function ComparisonPage() {
  const competitorsToCompare = competitors.filter(c => c.id !== "Databuddy");
  const databuddy = competitors.find(c => c.id === "Databuddy");
  
  if (!databuddy) {
    return <div>Error loading comparison data</div>;
  }
  
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
                  <BarChart className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6" itemProp="headline">
                  Databuddy vs Google Analytics
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  See how our privacy-first analytics compares to Google Analytics and why businesses are making the switch.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Main Comparison section */}
          <div id="feature-comparison">
            <ComparisonComponent />
          </div>

          {/* Additional comparison details */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Deeper Comparison</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Beyond the basic feature comparison, here are some key differences that make Databuddy a better choice:
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden max-w-4xl mx-auto">
                <div className="grid grid-cols-3 bg-slate-900/50 p-4">
                  <div className="text-slate-400">Advanced Features</div>
                  <div className="text-center font-semibold text-sky-400">Databuddy</div>
                  <div className="text-center font-semibold text-slate-400">Google Analytics</div>
                </div>

                {additionalFeatures.map((feature, index) => (
                  <div key={feature.name} className="grid grid-cols-3 p-4 border-t border-slate-800">
                    <div className="text-slate-300 pr-2">{feature.name}</div>
                    <div className="text-center text-sm text-sky-400">{feature.us}</div>
                    <div className="text-center text-sm text-slate-400">{feature.ga}</div>
                  </div>
                ))}
              </div>

              <div className="mt-12 max-w-3xl mx-auto bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Why Businesses Choose Databuddy</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-sky-400 mt-0.5 mr-3 shrink-0" />
                    <span className="text-slate-300">
                      <span className="font-medium text-white">Privacy Compliance:</span> Automatic GDPR and CCPA compliance without cookie banners
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-sky-400 mt-0.5 mr-3 shrink-0" />
                    <span className="text-slate-300">
                      <span className="font-medium text-white">Performance Impact:</span> Minimal effect on page load times and Core Web Vitals
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-sky-400 mt-0.5 mr-3 shrink-0" />
                    <span className="text-slate-300">
                      <span className="font-medium text-white">Data Ownership:</span> Complete control over your analytics data with no vendor lock-in
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-sky-400 mt-0.5 mr-3 shrink-0" />
                    <span className="text-slate-300">
                      <span className="font-medium text-white">Simplicity:</span> Intuitive interface that makes it easier to get actionable insights
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={150}>
            <div className="container mx-auto px-4 py-16 max-w-5xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to make the switch?</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Join thousands of businesses that have switched to Databuddy for privacy-first analytics that drives real growth.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo">Try Databuddy</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/contact">Talk to Sales</Link>
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
                "name": "Databuddy vs Google Analytics Comparison",
                "description": "Compare Databuddy Analytics to Google Analytics and see why our privacy-first approach delivers better results.",
                "mainEntity": {
                  "@type": "Table",
                  "about": "Comparison between Databuddy Analytics and Google Analytics",
                  "name": "Analytics Comparison Table"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "Databuddy Analytics",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.databuddy.cc/logo.png"
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