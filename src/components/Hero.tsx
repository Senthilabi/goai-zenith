import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Smartifying Life</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Empowering Small Businesses with{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              AI-Driven Solutions
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Go-AI brings enterprise-grade retail technology to neighborhood stores across India, 
            making smart retail accessible for everyone.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Button asChild variant="hero" size="lg">
              <Link to="/products">
                Explore Products <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-500">
            <div className="p-6 rounded-xl bg-card shadow-elegant hover:shadow-hover transition-smooth">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Retail Partners</div>
            </div>
            <div className="p-6 rounded-xl bg-card shadow-elegant hover:shadow-hover transition-smooth">
              <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Daily Transactions</div>
            </div>
            <div className="p-6 rounded-xl bg-card shadow-elegant hover:shadow-hover transition-smooth">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
