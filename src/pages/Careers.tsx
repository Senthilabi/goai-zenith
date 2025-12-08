import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Rocket, Heart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Careers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Application submitted!",
          description: "We'll review your application and get back to you soon.",
        });
        e.currentTarget.reset();
      } else {
        throw new Error("Failed to submit application");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="mb-4">Join Our Team</h1>
          <p className="text-xl text-muted-foreground">
            Be part of the mission to transform retail across India. We're looking for passionate
            individuals who want to make a real impact.
          </p>
        </div>

        {/* Why Join Us */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Work on cutting-edge AI and retail tech
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Growth</h3>
              <p className="text-sm text-muted-foreground">
                Rapid learning and career advancement
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Impact</h3>
              <p className="text-sm text-muted-foreground">
                Empower thousands of small businesses
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-hover transition-smooth">
            <CardContent className="pt-8 text-center">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Culture</h3>
              <p className="text-sm text-muted-foreground">
                Collaborative and inclusive team
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Internship Form */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl">Internship Application</CardTitle>
              <CardDescription>
                We're always looking for talented interns to join our team. Fill out the form below to apply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY" />
                <input type="hidden" name="subject" value="New Internship Application from GoAi Technologies Pvt Ltd Website" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" name="full_name" required placeholder="John Doe" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="+91 98765 43210" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Preferred Position *</Label>
                    <Select name="position" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="software-engineering">Software Engineering</SelectItem>
                        <SelectItem value="product-management">Product Management</SelectItem>
                        <SelectItem value="data-science">Data Science & AI</SelectItem>
                        <SelectItem value="business-development">Business Development</SelectItem>
                        <SelectItem value="marketing">Marketing & Communications</SelectItem>
                        <SelectItem value="design">UI/UX Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="university">University/College *</Label>
                    <Input id="university" name="university" required placeholder="Your institution" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduation_year">Expected Graduation *</Label>
                    <Input id="graduation_year" name="graduation_year" required placeholder="e.g., 2026" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Relevant Skills & Experience</Label>
                  <Textarea
                    id="skills"
                    name="skills"
                    placeholder="Tell us about your skills, projects, and experience..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Why do you want to join Go-AI? *</Label>
                  <Textarea
                    id="motivation"
                    name="motivation"
                    required
                    placeholder="Share your motivation and what you hope to learn..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume_link">Resume Link (Google Drive, Dropbox, etc.)</Label>
                  <Input id="resume_link" name="resume_link" type="url" placeholder="https://..." />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">
            For full-time positions or other inquiries, please email us at{" "}
            <a href="mailto:careers@goai.in" className="text-primary hover:underline">
              careers@goai.in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Careers;
