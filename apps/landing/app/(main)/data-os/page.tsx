import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import DataOSComponent from "@/app/components/data-os";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  Boxes, 
  Server, 
  Database, 
  Globe, 
  RefreshCw, 
  Code,
  ArrowRight,
  CheckCircle
} from "lucide-react";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Data Operating System | Databuddy Analytics",
  description: "Databuddy's Data OS is more than analytics—it's an interoperable data layer with event streaming, plugin ecosystem, self-hosting, and data warehouse sync capabilities.",
  keywords: "data operating system, event streaming, analytics platform, data platform, data ecosystem, plugin ecosystem, self-hosted analytics",
  alternates: {
    canonical: 'https://www.databuddy.cc/data-os',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/data-os',
    title: 'Data Operating System | Databuddy Analytics',
    description: 'More than analytics: A complete data operating system with event streaming, developer API, and plugin ecosystem.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Databuddy Data Operating System',
    description: 'More than analytics: A complete data operating system with event streaming, developer API, and plugin ecosystem.',
    creator: '@databuddyps',
  },
};

// Static page for Data OS
export default function DataOSPage() {
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
                  <Boxes className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6" itemProp="headline">
                  More Than Analytics: A Data OS
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  Databuddy goes beyond traditional analytics to provide a complete data operating system that powers your entire digital ecosystem.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Link href="#data-os-features" className="flex items-center gap-2">
                      <Boxes className="h-4 w-4" />
                      Explore Data OS Features
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                    <Link href="/demo" className="flex items-center gap-2">
                      Get Early Access
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Main Data OS section */}
          <div id="data-os-features">
            <DataOSComponent />
          </div>

          {/* Benefits section */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why a Data Operating System?</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Traditional analytics tools focus only on collecting and visualizing data. Databuddy&apos;s Data OS approach delivers more value:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 bg-sky-500/10 rounded-lg mr-4">
                      <RefreshCw className="h-5 w-5 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-bold">Real-Time Processing</h3>
                  </div>
                  <p className="text-slate-400">
                    Process and react to data events in real-time with stream processing capabilities, enabling instant insights and actions.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">Millisecond data processing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">WebSocket event streaming</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 bg-sky-500/10 rounded-lg mr-4">
                      <Code className="h-5 w-5 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-bold">Developer-First</h3>
                  </div>
                  <p className="text-slate-400">
                    Built for developers with comprehensive APIs, webhooks, and extensibility options to integrate with your stack.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">GraphQL & REST APIs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">Customizable event triggers</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 bg-sky-500/10 rounded-lg mr-4">
                      <Database className="h-5 w-5 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-bold">Data Ownership</h3>
                  </div>
                  <p className="text-slate-400">
                    Full control over your data with self-hosting options and data warehouse integrations for unified analytics.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">Enterprise self-hosting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-sky-400 mr-2 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">Data warehouse sync</span>
                    </li>
                  </ul>
                </div>
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
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to go beyond analytics?</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Join our early access program and be among the first to experience the power of Databuddy&apos;s complete Data Operating System.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo">Get Early Access</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/contact">Contact Team</Link>
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
                "@type": "SoftwareApplication",
                "name": "Databuddy Data OS",
                "applicationCategory": "BusinessApplication",
                "applicationSubCategory": "DataPlatform",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Early access program available"
                },
                "description": "Databuddy's Data OS is more than analytics—it's an interoperable data layer with event streaming, plugin ecosystem, self-hosting, and more.",
                "features": [
                  "Event Streaming",
                  "Developer API",
                  "Plugin Ecosystem",
                  "Edge Computing",
                  "Self-Hosting Option",
                  "Data Warehouse Sync"
                ]
              })
            }}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
} 