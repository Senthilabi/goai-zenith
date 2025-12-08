import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";

// Mock insights data - in a real application, this would come from markdown files
const insights = [
  {
    id: 1,
    date: "December 6, 2025",
    title: "Global AI in Retail Market to Reach $14.03 Billion by 2025",
    excerpt: "The international retail sector is witnessing explosive growth in AI adoption. Driven by hyper-personalization and automated inventory management, the global market is projected to surge, with major players like Walmart and Amazon leading the charge in AI-first commerce.",
    topics: ["Global Market Growth", "Hyper-Personalization", "Inventory Automation"],
    url: "https://www.precedenceresearch.com/artificial-intelligence-in-retail-market",
  },
  {
    id: 2,
    date: "November 24, 2025",
    title: "India's Kirana Stores: The New Frontier for AI Adoption",
    excerpt: "Over 80% of Indian retailers are expected to adopt AI by 2025. From dynamic pricing to predictive stock alerts, technology is transforming traditional Kirana stores into 'Intelligent Retail' hubs, leveling the playing field against quick-commerce giants.",
    topics: ["Kirana Digitization", "Dynamic Pricing", "Predictive Analytics"],
    url: "https://www.financialexpress.com/business/industry/kirana-stores-adopting-technology-to-compete-with-q-commerce-players/3313214/",
  },
  {
    id: 3,
    date: "October 15, 2025",
    title: "Tamil Nadu Launches AI Mission to Boost Retail Tech",
    excerpt: "The Tamil Nadu government has rolled out the 'Tamil Nadu Artificial Intelligence Mission' (TNAIM) to integrating AI across sectors. With focus on coding in schools and AI labs for startups, the state is positioning itself as a hub for retail-tech innovation.",
    topics: ["TNAIM Initiative", "Regional Innovation", "Startup Ecosystem"],
    url: "https://www.thehindu.com/news/national/tamil-nadu/tn-budget-2024-artificial-intelligence-mission-to-be-integrated-in-schools/article67866336.ece",
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
                <Button asChild variant="ghost" className="w-full group">
                  <a href={insight.url} target="_blank" rel="noopener noreferrer">
                    Read Full Article
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-smooth" />
                  </a>
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
