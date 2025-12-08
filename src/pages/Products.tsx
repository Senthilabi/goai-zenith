import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Smartphone, Network, Zap, Check } from "lucide-react";

const products = [
  {
    id: "smartpos",
    icon: Smartphone,
    title: "SmartPOS",
    tagline: "Point-of-Sale, Reimagined",
    description: "Transform your retail counter into a smart, AI-powered hub. SmartPOS handles billing, inventory, and customer engagement - all in one elegant solution.",
    features: [
      "Real-time inventory tracking with smart alerts",
      "WhatsApp-based order management",
      "Offline-first architecture for uninterrupted service",
      "Sales analytics and business insights",
      "Multi-payment support (UPI, cards, cash)",
      "Customer loyalty program integration",
    ],
    benefits: [
      "Reduce stock-outs by 60%",
      "Process transactions 3x faster",
      "Zero learning curve for staff",
    ],
  },
  {

    id: "zensomart",
    icon: Network,
    title: "Zensomart",
    tagline: "Intelligent Business Management",
    description: "An efficient, data-driven daily management service for small and individual shop owners. Zensomart automates your day-to-day operations—from AI-powered sales insights and staff scheduling to digital catalogs—empowering you to run your business professionally and efficiently.",
    features: [
      "AI-powered sales insights & stock alerts",
      "Digital catalog for WhatsApp & online orders",
      "Automated customer loyalty & offers",
      "Staff scheduling & performance tracking",
      "Real-time dashboards for owner decision-making",
      "Powered by Go-AI branding for every store",
      "Collective buying power & shared promotions",
    ],
    benefits: [
      "Save time with fast billing & easy stock management",
      "Increase sales through smart product mix suggestions",
      "Reduce losses with expiry & low-stock alerts",
      "Attract customers with digital presence",
      "Run the shop efficiently even with minimal staff",
    ],
  },
  {
    id: "smartsupply",
    icon: Zap,
    title: "SmartSupply AI",
    tagline: "Intelligent Supply Chain & Retail Network",
    description: "A unified solution for supply chain optimization and B2B procurement. Predict demand with AI and order directly from 500+ brands. SmartSupply AI combines intelligent forecasting with a seamless wholesale marketplace.",
    features: [
      "AI-based demand forecasting",
      "Direct ordering from 500+ FMCG brands",
      "Flexible credit terms (up to ₹5 Lakhs)",
      "Automatic reorder point calculation",
      "Next-day delivery guaranteed",
      "Bulk discount management",
      "Expiry date tracking and FIFO management",
    ],
    benefits: [
      "Reduce inventory waste by 40%",
      "Save 15% on wholesale procurement costs",
      "Never miss a sales opportunity",
      "Improve cash flow with flexible credit",
    ],
  },
];

const Products = () => {
  return (
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="mb-4">Our Products</h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive retail technology suite designed to empower small businesses
            with enterprise-grade AI capabilities.
          </p>
        </div>

        {/* Products */}
        <div className="space-y-20">
          {products.map((product, idx) => {
            const Icon = product.icon;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={product.id}
                id={product.id}
                className="scroll-mt-24"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className={isEven ? '' : 'lg:order-2'}>
                    <div className={`w-16 h-16 ${idx === 0 ? 'gradient-primary' : idx === 1 ? 'gradient-secondary' : 'gradient-hero'} rounded-2xl flex items-center justify-center mb-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="mb-2">{product.title}</h2>
                    <p className="text-xl text-primary font-semibold mb-4">{product.tagline}</p>
                    <p className="text-lg text-muted-foreground mb-8">
                      {product.description}
                    </p>

                    {/* Benefits */}
                    <div className="bg-muted/50 rounded-xl p-6 mb-8">
                      <h3 className="text-lg font-semibold mb-4">Key Benefits</h3>
                      <ul className="space-y-3">
                        {product.benefits.map((benefit, bidx) => (
                          <li key={bidx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button asChild variant="hero" size="lg">
                      <Link to="/contact">Get Started</Link>
                    </Button>
                  </div>

                  {/* Features Card */}
                  <div className={isEven ? '' : 'lg:order-1'}>
                    <Card className="shadow-elegant">
                      <CardHeader>
                        <CardTitle>Features</CardTitle>
                        <CardDescription>Everything you need to succeed</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          {product.features.map((feature, fidx) => (
                            <li key={fidx} className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                              <span className="text-foreground/80">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-muted/30 rounded-2xl p-12">
          <h2 className="mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of retailers already using Go-AI's solutions to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link to="/contact">Schedule a Demo</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">Learn More About Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Products;
