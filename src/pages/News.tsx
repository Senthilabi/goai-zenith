import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

// Mock news data - in a real application, this would come from an API or markdown files
const newsItems = [
  {
    id: 1,
    date: "November 2025",
    title: "Zensomart Retail Network Launch",
    content: "GoAi Technologies Pvt Ltd launches Zensomart Retail Network in Tamil Nadu, connecting local retailers with digital infrastructure and enabling seamless B2B ordering. The network now serves over 500 retailers across the state.",
  },
  {
    id: 2,
    date: "October 2025",
    title: "SmartPOS v2 Release",
    content: "SmartPOS v2 introduces AI-based stock alerts and enhanced inventory management capabilities for small retailers. The new version features predictive analytics and automated reordering suggestions.",
  },
  {
    id: 3,
    date: "September 2025",
    title: "Partnership with Leading FMCG Brand",
    content: "GoAi Technologies Pvt Ltd partners with major FMCG distributors to expand Zensomart's reach across Tamil Nadu. This partnership brings over 200 new brands to our platform, offering retailers unprecedented choice and competitive pricing.",
  },
  {
    id: 4,
    date: "August 2025",
    title: "AI Innovation Award",
    content: "GoAi Technologies Pvt Ltd receives recognition for innovative AI applications in retail technology at the Tamil Nadu Startup Awards 2025. Our SmartSupply AI solution was highlighted for its impact on reducing inventory waste.",
  },
  {
    id: 5,
    date: "July 2025",
    title: "500+ Retailers Milestone",
    content: "GoAi Technologies Pvt Ltd celebrates serving over 500 retail partners across Tamil Nadu, processing more than 50,000 daily transactions. This milestone reinforces our commitment to empowering small businesses with technology.",
  },
];

const News = () => {
  return (
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="mb-4">Company News</h1>
          <p className="text-xl text-muted-foreground">
            Stay updated with the latest developments, milestones, and announcements from GoAi Technologies Pvt Ltd.
          </p>
        </div>

        {/* News Grid */}
        <div className="max-w-4xl mx-auto space-y-8">
          {newsItems.map((item) => (
            <Card key={item.id} className="shadow-elegant hover:shadow-hover transition-smooth">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{item.date}</span>
                </div>
                <CardTitle className="text-2xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 leading-relaxed">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-muted/30 rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="mb-4 text-3xl">Want to stay in the loop?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Subscribe to our newsletter for the latest updates and market insights.
          </p>
          <a
            href="mailto:info@goai.in?subject=Newsletter Subscription"
            className="text-primary hover:underline font-medium"
          >
            Subscribe Now →
          </a>
        </div>
      </div>
    </main>
  );
};

export default News;
