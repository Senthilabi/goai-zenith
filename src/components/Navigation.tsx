import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = [{
    name: "Home",
    path: "/"
  }, {
    name: "Products",
    path: "/products"
  }, {
    name: "About",
    path: "/about"
  }, {
    name: "News",
    path: "/news"
  }, {
    name: "Insights",
    path: "/insights"
  }, {
    name: "Careers",
    path: "/careers"
  }];
  const isActive = (path: string) => location.pathname === path;
  return <nav className="fixed top-0 w-full bg-british-blue/5 backdrop-blur-md border-b border-british-blue/10 z-50">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 flex items-center justify-center transition-smooth group-hover:scale-105">
            <img src="/logo.png" alt="GoAi Technologies Pvt Ltd Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold text-british-blue">GoAi Technologies Pvt Ltd</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(link => <Link key={link.path} to={link.path} className={cn("text-sm font-medium transition-smooth hover:text-primary", isActive(link.path) ? "text-primary" : "text-foreground/70")}>
          {link.name}
        </Link>)}
      </div>

      {/* CTA Button */}
      <div className="hidden md:block">
        <Button asChild variant="hero">
          <Link to="/contact">Get Started</Link>
        </Button>
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>

    {/* Mobile Menu */}
    {mobileMenuOpen && <div className="md:hidden py-4 border-t border-border">
      <div className="flex flex-col gap-4">
        {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)} className={cn("text-sm font-medium transition-smooth hover:text-primary py-2", isActive(link.path) ? "text-primary" : "text-foreground/70")}>
          {link.name}
        </Link>)}
        <Button asChild variant="hero" className="w-full">
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </Link>
        </Button>
      </div>
    </div>}
  </div>
  </nav >;
};
export default Navigation;