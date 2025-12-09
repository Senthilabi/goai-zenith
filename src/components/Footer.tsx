import { Link } from "react-router-dom";
import { Sparkles, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Go-AI Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold text-british-blue">GoAi Technologies Pvt Ltd</span>
            </Link>
            <p className="text-sm text-accent-foreground/70">
              Smartifying Life
            </p>
            <p className="text-xs text-accent-foreground/60 mt-2">
              R&D and Sales Partner of Idaitics Ltd, UK
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products#smartpos" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  SmartPOS
                </Link>
              </li>
              <li>
                <Link to="/products#zensomart" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  Zensomart Network
                </Link>
              </li>
              <li>
                <Link to="/products#smartsupply" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  SmartSupply AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  News
                </Link>
              </li>
              <li>
                <Link to="/insights" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  Market Insights
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-accent-foreground/70">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:hello@go-aitech.com" className="hover:text-accent-foreground transition-smooth">
                  hello@go-aitech.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-accent-foreground/70">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-accent-foreground transition-smooth">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-accent-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Periyar+TBI+PMIST+Vallam+Thanjavur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-foreground transition-smooth text-left"
                >
                  207, Periyar TBI, PMIST, Vallam, Thanjavur 613403
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-accent-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-accent-foreground/70">
              © {currentYear} GoAi Technologies Pvt Ltd. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-smooth">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
