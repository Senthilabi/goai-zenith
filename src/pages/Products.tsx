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
    title: "Zensomart Retail Network",
    tagline: "Your Digital Wholesale Marketplace",
    description: "Connect directly with FMCG distributors and brands. Zensomart simplifies B2B ordering, credit management, and logistics for small retailers across Tamil Nadu.",
    features: [
      "Direct ordering from 500+ FMCG brands",
      "Flexible credit terms and payment options",
      "Real-time order tracking",
      "Bulk discount management",
      "Automated inventory replenishment",
      "Dedicated relationship manager",
    ],
    benefits: [
      "Save 15% on wholesale costs",
      "Get credit lines up to ₹5 lakhs",
      "Next-day delivery guaranteed",
    ],
  },
  {
    id: "smartsupply",
    icon: Zap,
    title: "SmartSupply AI",
    tagline: "Intelligent Supply Chain Management",
    description: "Predict demand, optimize stock levels, and eliminate waste with AI-powered supply chain intelligence. Know what to order, when to order, and how much.",
    features: [
      "AI-based demand forecasting",
      "Automatic reorder point calculation",
      "Expiry date tracking and FIFO management",
      "Supplier performance analytics",
      "Cost optimization recommendations",
      "Seasonal trend analysis",
    ],
    benefits: [
      "Reduce inventory waste by 40%",
      "Improve cash flow efficiency",
      "Never miss a sales opportunity",
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
