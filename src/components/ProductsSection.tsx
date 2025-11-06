import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Smartphone, Network, Zap, ArrowRight } from "lucide-react";

const products = [
  {
    id: "smartpos",
    icon: Smartphone,
    title: "SmartPOS",
    description: "AI-powered point-of-sale system designed for small retailers. Real-time inventory tracking, smart alerts, and seamless billing.",
    features: ["Real-time Inventory", "Smart Stock Alerts", "WhatsApp Integration", "Offline Mode"],
    gradient: "gradient-primary",
  },
  {
    id: "zensomart",
    icon: Network,
    title: "Zensomart Retail Network",
    description: "B2B marketplace connecting retailers with FMCG distributors. Simplifying wholesale ordering with digital infrastructure.",
    features: ["Wholesale Ordering", "Credit Management", "Order Tracking", "Analytics Dashboard"],
    gradient: "gradient-secondary",
  },
  {
    id: "smartsupply",
    icon: Zap,
    title: "SmartSupply AI",
    description: "Intelligent supply chain optimization for retailers. Predict demand, optimize stock levels, and reduce waste.",
    features: ["Demand Prediction", "Auto-Reordering", "Waste Reduction", "Cost Optimization"],
    gradient: "gradient-hero",
  },
];

const ProductsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-4">Our Products</h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive AI-powered solutions designed to transform retail operations 
            and empower small businesses across India.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <Card
                key={product.id}
                className="group hover:shadow-hover transition-smooth cursor-pointer"
              >
                <CardHeader>
                  <div className={`w-12 h-12 ${product.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{product.title}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="ghost" className="w-full group-hover:text-primary">
                    <Link to={`/products#${product.id}`}>
                      Learn More <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/products">
              View All Products <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
