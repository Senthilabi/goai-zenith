import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Users } from "lucide-react";

const About = () => {
  return (
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="mb-4">About Go-AI</h1>
          <p className="text-xl text-muted-foreground">
            Empowering small businesses across India with AI-driven retail technology.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="mb-6 text-center">Our Story</h2>
          <div className="prose prose-lg max-w-none text-foreground/80 space-y-4">
            <p>
              Founded in 2023, Go-AI Pvt. Ltd. was born from a simple observation: 
              while large retail chains had access to cutting-edge technology, millions of 
              small neighborhood stores were being left behind in the digital revolution.
            </p>
            <p>
              We set out to change that. Our mission is to bring enterprise-grade AI and 
              retail technology to every small business in India, regardless of their size 
              or technical expertise.
            </p>
            <p>
              Today, we're proud to serve over 500 retail partners across Tamil Nadu, 
              processing more than 50,000 transactions daily and helping small businesses 
              compete effectively in the modern retail landscape.
            </p>
          </div>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-4">Our Mission</h3>
              <p className="text-muted-foreground">
                To democratize retail technology and make AI-powered solutions accessible 
                to every small business in India.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-4">Our Vision</h3>
              <p className="text-muted-foreground">
                A future where every neighborhood store has the tools and technology to 
                thrive in the digital economy.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-4">Our Values</h3>
              <p className="text-muted-foreground">
                Simplicity, accessibility, and unwavering commitment to small business success 
                guide everything we do.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="bg-muted/30 rounded-2xl p-12">
          <div className="text-center mb-12">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="mb-4">Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're a passionate team of technologists, retail experts, and business builders 
              dedicated to transforming India's retail landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-background rounded-xl p-6 shadow-elegant">
              <h3 className="text-lg font-semibold mb-2">Technology Team</h3>
              <p className="text-muted-foreground">
                Expert engineers building scalable, AI-powered solutions with deep expertise 
                in machine learning, mobile development, and cloud infrastructure.
              </p>
            </div>
            <div className="bg-background rounded-xl p-6 shadow-elegant">
              <h3 className="text-lg font-semibold mb-2">Business Team</h3>
              <p className="text-muted-foreground">
                Retail veterans and business strategists who understand the ground realities 
                of small business operations in India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default About;
