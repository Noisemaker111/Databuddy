import Background from "./components/background";
import Navbar from "./components/navbar";
import FadeIn from "./components/FadeIn";
import SidebarNavigation from "./components/sidebar-navigation";
import Hero from "./components/hero";
import Features from "./components/features";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Sparkles, Boxes, Target, Zap, Shield, BarChart } from "lucide-react";
import { Metadata } from "next";

import dynamic from "next/dynamic"; 

const CTA = dynamic(() => import("./components/cta"), { ssr: true });
const FAQ = dynamic(() => import("./components/faq"), { ssr: true });
const Testimonials = dynamic(() => import("./components/testimonials"), { ssr: true });
const Contact = dynamic(() => import("./components/contact"), { ssr: true });
const SocialProof = dynamic(() => import("./components/social-proof"), { ssr: true });
const Footer = dynamic(() => import("./components/footer"), { ssr: true });
const EarlyAccessPopup = dynamic(() => import("./components/EarlyAccessPopup"), { ssr: true });

export const metadata: Metadata = {
  title: "Databuddy Analytics | Privacy-First Web Analytics",
  description: "Fast, privacy-first web analytics that gives you the insights you need without compromising user privacy or site performance.",
  keywords: ["privacy analytics", "cookieless analytics", "GDPR compliant analytics", "web analytics", "fast analytics", "privacy-first"],
  alternates: {
    canonical: "https://www.databuddy.cc"
  },
  openGraph: {
    title: "Databuddy Analytics | Privacy-First Web Analytics",
    description: "Fast, privacy-first web analytics that gives you the insights you need without compromising user privacy or site performance.",
    url: "https://www.databuddy.cc",
    type: "website",
    siteName: "Databuddy Analytics"
  },
  twitter: {
    card: "summary_large_image",
    title: "Databuddy Analytics | Privacy-First Web Analytics",
    description: "Fast, privacy-first web analytics that gives you the insights you need without compromising user privacy or site performance."
  }
};

export default function Home() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scroll-smooth">
        <Navbar />
        <SidebarNavigation />
        <FadeIn>
          <Hero />
        </FadeIn>
        {/* <FadeIn delay={100}>
          <SocialProof />
        </FadeIn> */}
        
        <FadeIn delay={100}>
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Explore Databuddy</h2>
              <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-sm sm:text-base">
                Learn more about our features, performance, and privacy-focused approach to analytics.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Link href="/privacy" className="group">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4 group-hover:bg-sky-500/20 transition-colors">
                    <Shield className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-sky-400 transition-colors">Privacy First</h3>
                  <p className="text-slate-300 mb-6">
                    Learn how our cookieless, GDPR-compliant approach puts user privacy first while delivering powerful insights.
                  </p>
                  <div className="flex items-center text-sky-400 font-medium">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
              
              <Link href="/performance" className="group">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4 group-hover:bg-sky-500/20 transition-colors">
                    <Zap className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-sky-400 transition-colors">Lightning Fast</h3>
                  <p className="text-slate-300 mb-6">
                    Discover how our 247x smaller script boosts performance, improves Core Web Vitals, and enhances SEO.
                  </p>
                  <div className="flex items-center text-sky-400 font-medium">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
              
              <Link href="/compare" className="group">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
                  <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4 group-hover:bg-sky-500/20 transition-colors">
                    <BarChart className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-sky-400 transition-colors">Compare Analytics</h3>
                  <p className="text-slate-300 mb-6">
                    See how Databuddy stacks up against Google Analytics and other providers with our feature comparison.
                  </p>
                  <div className="flex items-center text-sky-400 font-medium">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={100}>
          <div id="cta-form">
            <CTA />
          </div>
        </FadeIn>
        <Footer />
        
        {/* Early Access Popup with Typeform link */}
        <EarlyAccessPopup typeformUrl="https://form.typeform.com/to/yXiXwsDD" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Databuddy Analytics",
              "url": "https://www.databuddy.cc",
              "logo": "https://www.databuddy.cc/logo.png",
              "description": "Privacy-first web analytics that doesn't compromise on features or performance.",
              "sameAs": [
                "https://twitter.com/databuddyps",
                "https://github.com/databuddy-analytics"
              ]
            })
          }}
        />
      </div>
    </div>
  );
}
