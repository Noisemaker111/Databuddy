import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import PrivacyComponent from "@/app/components/privacy";
import FadeIn from "@/app/components/FadeIn";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { 
  Shield, 
  Lock, 
  Database,
  FileCheck,
  Cookie,
  UserX,
  ArrowRight,
  CheckCircle
} from "lucide-react";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Privacy-First Analytics | Databuddy Analytics",
  description: "Databuddy provides GDPR & CCPA compliant web analytics without cookies. No consent banners needed while still getting accurate data.",
  keywords: "privacy analytics, GDPR analytics, CCPA compliant, cookieless tracking, consent-free analytics, privacy-focused data collection",
  alternates: {
    canonical: 'https://www.databuddy.cc/privacy',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.databuddy.cc/privacy',
    title: 'Privacy-First Analytics | Databuddy',
    description: 'Get accurate web analytics without collecting personal data. No cookies, no consent banners, full GDPR & CCPA compliance.',
    siteName: 'Databuddy Analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy-First Analytics | Databuddy',
    description: 'Get accurate web analytics without collecting personal data. No cookies, no consent banners, full GDPR & CCPA compliance.',
    creator: '@databuddyps',
  },
};

// Static page for Privacy
export default function PrivacyPage() {
  const dataWeCollect = [
    {
      title: "We Do Collect",
      items: [
        "Page views and sessions (anonymized)",
        "Referrer domain (not full URL)",
        "Browser type and version",
        "Device type and screen size",
        "Country-level location (no precise geolocation)",
        "Session duration and navigation paths",
        "Custom events (pageloads, clicks, etc.)"
      ],
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    {
      title: "We NEVER Collect",
      items: [
        "Personal identifying information",
        "IP addresses (anonymized on collection)",
        "Individual user profiles or history",
        "Cross-site tracking information",
        "Exact geolocation data",
        "Keystroke logging",
        "Form inputs or sensitive data"
      ],
      icon: <UserX className="h-5 w-5 text-red-500" />
    }
  ];

  const complianceFeatures = [
    {
      title: "Cookieless Tracking",
      description: "Our technology uses privacy-preserving fingerprinting alternatives that don't rely on cookies or local storage, eliminating the need for consent banners.",
      icon: Cookie,
      color: "from-sky-400 to-blue-500"
    },
    {
      title: "Data Anonymization",
      description: "All data is anonymized at collection. IP addresses are hashed and truncated, making it impossible to identify individual users.",
      icon: UserX,
      color: "from-green-400 to-emerald-500"
    },
    {
      title: "Automated Deletion",
      description: "Automated data retention policies ensure data is only kept as long as necessary, with customizable timeframes to match your compliance needs.",
      icon: Database,
      color: "from-amber-400 to-orange-500"
    },
    {
      title: "Compliance Documentation",
      description: "Ready-to-use documentation for your privacy policy, including GDPR and CCPA disclosures that accurately describe how Databuddy works.",
      icon: FileCheck,
      color: "from-purple-400 to-indigo-500"
    }
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
                  <Shield className="h-6 w-6 text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-6" itemProp="headline">
                  Privacy-First Analytics
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  Get the insights you need without compromising user privacy. No cookies, no consent banners, full compliance.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Main Privacy section */}
          <div id="privacy-features">
            <PrivacyComponent />
          </div>

          {/* Data Collection section */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Data Collection</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  We believe in complete transparency about what data is collected and how it&apos;s used.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {dataWeCollect.map((category) => (
                  <div key={category.title} className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      {category.icon}
                      <span className="ml-2">{category.title}</span>
                    </h3>
                    <ul className="space-y-2">
                      {category.items.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-sky-400 mr-2">•</span>
                          <span className="text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Compliance Features */}
          <FadeIn delay={150}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Compliance</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Our privacy-first approach helps you stay compliant with global privacy regulations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {complianceFeatures.map((feature) => (
                  <div key={feature.title} className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all duration-300">
                    <div className="flex items-start mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color} mr-4`}>
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                    </div>
                    <p className="text-slate-300">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Regulations compliance */}
          <FadeIn delay={200}>
            <div className="container mx-auto px-4 py-16 max-w-5xl">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Global Privacy Compliance</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                    Databuddy helps you meet privacy requirements in jurisdictions worldwide.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="p-2 bg-sky-500/10 rounded-full mb-3">
                      <Shield className="h-6 w-6 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">GDPR</h3>
                    <p className="text-center text-xs text-slate-400">European Union</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="p-2 bg-sky-500/10 rounded-full mb-3">
                      <Shield className="h-6 w-6 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">CCPA/CPRA</h3>
                    <p className="text-center text-xs text-slate-400">California, USA</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="p-2 bg-sky-500/10 rounded-full mb-3">
                      <Shield className="h-6 w-6 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">PIPEDA</h3>
                    <p className="text-center text-xs text-slate-400">Canada</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="p-2 bg-sky-500/10 rounded-full mb-3">
                      <Shield className="h-6 w-6 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">LGPD</h3>
                    <p className="text-center text-xs text-slate-400">Brazil</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={250}>
            <div className="container mx-auto px-4 py-16 max-w-5xl">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 border border-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
                <div className="md:flex items-center justify-between">
                  <div className="mb-8 md:mb-0 md:mr-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Privacy without compromise</h2>
                    <p className="text-slate-300 md:text-lg max-w-xl">
                      Join thousands of companies that get the insights they need while respecting user privacy.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                      <Link href="/demo">Try for Free</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                      <Link href="/contact">Talk to Privacy Expert</Link>
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
                "name": "Privacy-First Analytics | Databuddy Analytics",
                "description": "Databuddy provides GDPR & CCPA compliant web analytics without cookies. No consent banners needed while still getting accurate data.",
                "mainEntity": {
                  "@type": "SoftwareApplication",
                  "name": "Databuddy Analytics",
                  "applicationCategory": "AnalyticsApplication",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "keywords": "privacy analytics, GDPR analytics, CCPA compliant, cookieless tracking",
                  "featureList": "Cookieless tracking, Data anonymization, Automated data deletion, Compliance documentation"
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