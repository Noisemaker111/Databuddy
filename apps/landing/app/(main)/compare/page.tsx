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
  CheckCircle,
  Award,
  Star
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

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

// Feature comparison categories
const comparisonCategories = [
  {
    category: "Privacy",
    items: [
      { feature: "GDPR Compliant", databuddy: true },
      { feature: "Cookieless Tracking", databuddy: true },
      { feature: "No User Consent Required", databuddy: true },
      { feature: "Anonymized IP Addresses", databuddy: true },
      { feature: "No Personal Data Collection", databuddy: true },
      { feature: "Automatic Data Deletion", databuddy: true }
    ]
  },
  {
    category: "Performance",
    items: [
      { feature: "Script Size < 2KB", databuddy: true },
      { feature: "Minimal CPU Impact", databuddy: true },
      { feature: "No Layout Shifts", databuddy: true },
      { feature: "Improves Core Web Vitals", databuddy: true },
      { feature: "Energy Efficient", databuddy: true },
      { feature: "Ad-Blocker Resistant", databuddy: true }
    ]
  },
  {
    category: "Features",
    items: [
      { feature: "Real-time Analytics", databuddy: true },
      { feature: "Custom Events Tracking", databuddy: true },
      { feature: "User Flow Analysis", databuddy: true },
      { feature: "Data Ownership", databuddy: true },
      { feature: "AI-Powered Insights", databuddy: true },
      { feature: "Easy Setup", databuddy: true }
    ]
  }
];

// Rating component 
const Rating = ({ score, max = 5 }: { score: number; max?: number }) => (
  <div className="flex">
    {Array.from({ length: max }).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < score ? 'fill-sky-400 text-sky-400' : 'text-slate-700'}`} 
      />
    ))}
  </div>
);

// Static page for Comparison
export default function ComparisonPage() {
  const databuddy = competitors.find(c => c.id === "Databuddy");
  const competitorsToCompare = competitors.filter(c => c.id !== "Databuddy");
  
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
                  Databuddy vs The Competition
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10" itemProp="description">
                  See how our privacy-first analytics compares to other solutions and why businesses are making the switch.
                </p>
              </div>
            </div>
          </FadeIn>
          
          {/* Databuddy overview */}
          <FadeIn delay={50}>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 md:p-8">
                <div className="md:flex items-start gap-6">
                  <div className="mb-6 md:mb-0 md:w-1/4 flex justify-center">
                    <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-center">
                      <div className="relative h-32 w-32">
                        <Image 
                          src="/logo.svg" 
                          alt="Databuddy Logo" 
                          fill
                          className="object-contain" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <div className="flex items-center mb-4">
                      <h2 className="text-2xl font-bold mr-3">Databuddy Analytics</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        Our Platform
                      </span>
                    </div>
                    <p className="text-slate-300 mb-6">{databuddy.overview}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <h3 className="text-white text-lg font-semibold mb-2 flex items-center">
                          <Award className="h-5 w-5 text-sky-400 mr-2" />
                          Key Strengths
                        </h3>
                        <ul className="space-y-1.5">
                          {databuddy.strengths.map((strength, index) => (
                            <li key={index} className="text-slate-300 text-sm flex items-start">
                              <CheckCircle className="h-4 w-4 text-sky-400 mt-0.5 mr-2 shrink-0" />
                              <span>{strength.split(':')[0]}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-white text-lg font-semibold mb-2">Ratings</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 text-sm">Privacy</span>
                            <Rating score={databuddy.ratings.privacy} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 text-sm">Ease of Use</span>
                            <Rating score={databuddy.ratings.easeOfUse} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 text-sm">Features</span>
                            <Rating score={databuddy.ratings.features} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 text-sm">Performance</span>
                            <Rating score={databuddy.ratings.performance} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 text-sm">Customization</span>
                            <Rating score={databuddy.ratings.customization} />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-white text-lg font-semibold mb-2">Target Audience</h3>
                        <p className="text-slate-300 text-sm">{databuddy.ratings.targetAudience}</p>
                        
                        <h3 className="text-white text-lg font-semibold mt-4 mb-2">Data Ownership</h3>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          {databuddy.ratings.dataOwnership}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                        <Link href="/demo">Try Databuddy</Link>
                      </Button>
                      <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                        <Link href="/privacy">Learn About Privacy</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Comparison Tabs */}
          <FadeIn delay={100}>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Side-by-Side Comparison</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  See how Databuddy compares to other analytics platforms on key metrics.
                </p>
              </div>
              
              <Tabs defaultValue={competitorsToCompare[0].id} className="w-full">
                <TabsList className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-xl p-2 mb-8 flex justify-between overflow-x-auto w-full max-w-3xl mx-auto">
                  {competitorsToCompare.map((competitor) => (
                    <TabsTrigger 
                      key={competitor.id} 
                      value={competitor.id}
                      className="rounded-lg py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500/20 data-[state=active]:to-blue-600/20 data-[state=active]:text-white data-[state=active]:border-sky-500/50 transition-all duration-200 flex items-center gap-2 min-w-max border border-transparent data-[state=active]:border-sky-500/30"
                    >
                      {competitor.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {competitorsToCompare.map((competitor) => (
                  <TabsContent key={competitor.id} value={competitor.id} className="animate-in fade-in-50 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Competitor Info */}
                      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center mb-6">
                          <div className="h-12 w-12 mr-4 bg-slate-800 rounded-lg p-2 flex items-center justify-center">
                            <div className="relative h-8 w-8">
                              <Image 
                                src={competitor.logo || "/placeholder.svg"} 
                                alt={`${competitor.name} Logo`} 
                                fill
                                className="object-contain" 
                              />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{competitor.name}</h3>
                            <div className="flex mt-1">
                              <span className="text-xs text-slate-400">vs</span>
                              <span className="text-xs text-sky-400 ml-1">Databuddy</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-slate-300 mb-6">{competitor.overview}</p>
                        
                        <h4 className="text-white font-semibold mb-2">Key Differences</h4>
                        <p className="text-slate-300 text-sm mb-6">{competitor.outshine}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-semibold mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              Strengths
                            </h4>
                            <ul className="space-y-1">
                              {competitor.strengths.map((strength, index) => (
                                <li key={index} className="text-slate-300 text-xs flex items-start">
                                  <span className="text-green-400 mr-1.5">•</span>
                                  <span>{strength.split(':')[0]}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-semibold mb-2 flex items-center">
                              <X className="h-4 w-4 text-red-400 mr-2" />
                              Weaknesses
                            </h4>
                            <ul className="space-y-1">
                              {competitor.weaknesses.map((weakness, index) => (
                                <li key={index} className="text-slate-300 text-xs flex items-start">
                                  <span className="text-red-400 mr-1.5">•</span>
                                  <span>{weakness.split(':')[0]}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Feature Comparison */}
                      <div>
                        {comparisonCategories.map((category) => (
                          <div key={category.category} className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">{category.category} Features</h3>
                            <div className="bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden">
                              <div className="grid grid-cols-3 bg-slate-900/50 p-3">
                                <div className="text-slate-400 text-sm">Feature</div>
                                <div className="text-center text-sm font-semibold text-sky-400">Databuddy</div>
                                <div className="text-center text-sm font-semibold text-slate-400">{competitor.name}</div>
                              </div>
                              
                              {category.items.map((item, index) => {
                                // Determine if competitor has this feature (50% chance for demo)
                                // In a real implementation, you would have actual data here
                                const competitorHasFeature = index % 2 === 0 || 
                                  (competitor.id === "google-analytics" && category.category === "Features");
                                
                                return (
                                  <div key={item.feature} className="grid grid-cols-3 p-3 border-t border-slate-800">
                                    <div className="text-slate-300 text-xs">{item.feature}</div>
                                    <div className="flex justify-center">
                                      {item.databuddy ? (
                                        <Check className="h-4 w-4 text-sky-400" />
                                      ) : (
                                        <X className="h-4 w-4 text-slate-600" />
                                      )}
                                    </div>
                                    <div className="flex justify-center">
                                      {competitorHasFeature ? (
                                        <Check className="h-4 w-4 text-slate-400" />
                                      ) : (
                                        <X className="h-4 w-4 text-slate-600" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {/* Ratings Comparison */}
                        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
                          <h3 className="text-lg font-semibold text-white mb-3">Rating Comparison</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-5 gap-2 items-center">
                              <div className="text-slate-300 text-xs col-span-2">Privacy</div>
                              <div className="col-span-3 flex justify-between items-center gap-4">
                                <Rating score={databuddy.ratings.privacy} />
                                <span className="text-slate-400 text-xs">vs</span>
                                <Rating score={competitor.ratings.privacy} />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 items-center">
                              <div className="text-slate-300 text-xs col-span-2">Ease of Use</div>
                              <div className="col-span-3 flex justify-between items-center gap-4">
                                <Rating score={databuddy.ratings.easeOfUse} />
                                <span className="text-slate-400 text-xs">vs</span>
                                <Rating score={competitor.ratings.easeOfUse} />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 items-center">
                              <div className="text-slate-300 text-xs col-span-2">Features</div>
                              <div className="col-span-3 flex justify-between items-center gap-4">
                                <Rating score={databuddy.ratings.features} />
                                <span className="text-slate-400 text-xs">vs</span>
                                <Rating score={competitor.ratings.features} />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 items-center">
                              <div className="text-slate-300 text-xs col-span-2">Performance</div>
                              <div className="col-span-3 flex justify-between items-center gap-4">
                                <Rating score={databuddy.ratings.performance} />
                                <span className="text-slate-400 text-xs">vs</span>
                                <Rating score={competitor.ratings.performance} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </FadeIn>

          {/* General Comparison section */}
          <FadeIn delay={150}>
            <div id="feature-comparison">
              <ComparisonComponent />
            </div>
          </FadeIn>

          {/* CTA section */}
          <FadeIn delay={200}>
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
                    "url": "https://databuddy.cc/logo.png"
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