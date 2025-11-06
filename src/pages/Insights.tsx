import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";

// Mock insights data - in a real application, this would come from markdown files
const insights = [
  {
    id: 1,
    date: "November 15, 2025",
    title: "AI Transforming Retail: November 2025 Insights",
    excerpt: "The retail landscape is experiencing unprecedented transformation through artificial intelligence. Small retailers adopting AI see 40% improvement in inventory management.",
    topics: ["Hyperlocal AI Solutions", "WhatsApp Commerce Growth", "Inventory Optimization"],
  },
  {
    id: 2,
    date: "October 20, 2025",
    title: "The Rise of Digital B2B Marketplaces in India",
    excerpt: "B2B digital marketplaces are revolutionizing wholesale trade in India. Retailers using digital ordering platforms report 15% cost savings and better credit terms.",
    topics: ["B2B Digital Transformation", "Credit Management", "Supply Chain Efficiency"],
  },
  {
    id: 3,
    date: "September 10, 2025",
    title: "Small Retailers in the Digital Age",
    excerpt: "Neighborhood stores are embracing technology at an accelerating pace. Over 60% of small retailers now use digital tools for inventory and billing.",
    topics: ["Digital Adoption Trends", "POS Systems", "Mobile-First Solutions"],
  },
];

const Insights = () => {
  return (
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="mb-4">Market Insights</h1>
          <p className="text-xl text-muted-foreground">
            Expert analysis, trends, and insights from the retail technology landscape in India.
          </p>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {insights.map((insight) => (
            <Card key={insight.id} className="shadow-elegant hover:shadow-hover transition-smooth flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{insight.date}</span>
                </div>
                <CardTitle className="text-xl">{insight.title}</CardTitle>
                <CardDescription>{insight.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Key Topics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" className="w-full group">
                  Read Full Article
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-smooth" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gradient-hero text-accent-foreground rounded-2xl p-12 max-w-4xl mx-auto text-center">
          <h2 className="mb-4 text-white">Get Monthly Insights Delivered</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Subscribe to our monthly newsletter for in-depth market analysis, retail trends, 
            and actionable insights for your business.
          </p>
          <Button asChild variant="secondary" size="lg">
            <a href="mailto:info@goai.in?subject=Newsletter Subscription">
              Subscribe to Newsletter <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Insights;
