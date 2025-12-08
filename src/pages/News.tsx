import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

// Mock news data - in a real application, this would come from an API or markdown files
const newsItems = [
  {
    id: 1,
    date: "December 3, 2025",
    title: "Strategic MOU Signed with Idaitics Ltd, UK",
    content: "GoAi Technologies Pvt Ltd has officially signed a Memorandum of Understanding (MOU) with Idaitics Ltd, UK. This strategic partnership focuses on deep collaboration in technology and market expansion, bringing world-class AI retail solutions to the Indian market.",
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
            href="mailto:hello@go-aitech.com?subject=Newsletter Subscription"
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
