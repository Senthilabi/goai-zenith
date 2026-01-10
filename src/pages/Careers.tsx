import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Rocket, Heart, TrendingUp, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

// Validation Schema
const applicationSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  linkedin_url: z.string().url("Invalid URL").refine((url) => url.includes("linkedin.com"), {
    message: "Must be a valid LinkedIn URL (e.g. https://www.linkedin.com/in/...)",
  }),
  portfolio_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  position: z.string().min(1, "Please select a position"),
  university: z.string().min(2, "University name is required"),
  graduation_year: z.string().regex(/^\d{4}$/, "Please enter a valid year (e.g., 2026)"),
  skills: z.string().optional(),
  motivation: z.string().min(50, "Please provide at least 50 characters for your motivation"),
  fax_number: z.string().max(0, "Bot detected"), // Honeypot: must be empty
});

const Careers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailAuth, setEmailAuth] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useAuth(); // Auth Check


  // Pre-fill email if logged in
  useEffect(() => {
    // Optional: Pre-fill logic if needed, but we mainly rely on user check
  }, [user]);

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Please try using the Email Link method instead.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!emailAuth) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailAuth,
        options: {
          emailRedirectTo: window.location.href,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "Magic Link Sent!",
        description: "Please check your email and click the link to verify your application.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send link",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Safety check: Form should not be submittable without a user
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please verify your email using the Magic Link before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget; // Store form reference

    try {
      // 1. Honeypot Check (Silent Fail for Bots)
      const honeypot = formData.get("fax_number");
      if (honeypot) {
        console.warn("Bot detected via honeypot");
        // Fake success to fool the bot
        toast({ title: "Application submitted!", description: "We'll review your application soon." });
        form.reset();
        return;
      }

      // 2. Data Validation
      const rawData = {
        full_name: formData.get("full_name"),
        email: user.email, // Always use verified email
        phone: formData.get("phone"),
        linkedin_url: formData.get("linkedin_url"),
        portfolio_url: formData.get("portfolio_url"),
        position: formData.get("position"),
        university: formData.get("university"),
        graduation_year: formData.get("graduation_year"),
        skills: formData.get("skills"),
        motivation: formData.get("motivation"),
        fax_number: formData.get("fax_number") || "",
      };

      // Validate Text Fields with Zod
      const validatedData = applicationSchema.parse(rawData);

      // 3. File Validation
      const resumeFile = formData.get("resume") as File;
      if (!resumeFile || resumeFile.size === 0) {
        throw new Error("Please upload your resume");
      }

      // Validate file size (5MB max)
      if (resumeFile.size > 5 * 1024 * 1024) throw new Error("Resume file size must be less than 5MB");

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(resumeFile.type)) throw new Error("Please upload a PDF or Word document");

      console.log("Uploading resume:", resumeFile.name);

      // Upload resume to Supabase Storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload resume: ${uploadError.message}`);
      }

      console.log("✅ Resume uploaded successfully:", filePath);

      // Prepare Final Data for DB
      const dbData = {
        full_name: validatedData.full_name,
        email: validatedData.email,
        phone: validatedData.phone,
        linkedin_url: validatedData.linkedin_url,
        portfolio_url: validatedData.portfolio_url || null,
        position: validatedData.position,
        university: validatedData.university,
        graduation_year: validatedData.graduation_year,
        skills: validatedData.skills || "",
        motivation: validatedData.motivation,
        resume_link: filePath,
      };

      console.log("Application data:", dbData);

      // Save to database
      console.log("Attempting to save to database...");
      const { data: savedData, error: dbError } = await supabase
        .from("internship_applications")
        .insert([dbData])
        .select();

      if (dbError) {
        console.error("❌ Database error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("✅ Saved to database successfully:", savedData);

      // Send email notification (Background)
      console.log("Sending email notification...");
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "eefdb10e-f591-4963-9a67-e45f0d8afda3",
          subject: "New Internship Application - GoAi Technologies",
          from_name: dbData.full_name,
          email: "Hello@go-aitech.com",
          message: `
New Application: ${dbData.full_name}
Email: ${dbData.email} (Verified)
Position: ${dbData.position}
LinkedIn: ${dbData.linkedin_url}
Portfolio: ${dbData.portfolio_url || 'N/A'}

View Full Application in HRMS: ${window.location.origin}/hrms/recruitment
          `.trim()
        })
      });

      toast({
        title: "Application submitted successfully!",
        description: "We have received your details. Good luck!",
      });

      form.reset();
      console.log("=== Application submission complete ===");
    } catch (error: any) {
      console.error("❌ ERROR submitting application:", error);

      // Handle Zod Validation Errors
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to submit application. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="pt-32 text-center">Loading...</div>;
  }

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

        {/* Auth Gate & Form */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl">Internship Application</CardTitle>
              <CardDescription>
                {user ? (
                  <span>Applying as <strong>{user.email}</strong></span>
                ) : (
                  <span>Sign in required to verify your application</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* HONEYPOT FIELD (Hidden) */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="fax_number">Fax Number</label>
                  <input type="text" name="fax_number" id="fax_number" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" name="full_name" required placeholder="John Doe" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email {user && "(Verified)"}</Label>
                    <Input
                      id="email"
                      name="email"
                      value={user?.email || ""}
                      disabled
                      placeholder={user ? "" : "Sign in to verify this field"}
                      className={user ? "bg-muted" : ""}
                    />
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

                {/* Social Media Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn Profile *</Label>
                    <Input id="linkedin_url" name="linkedin_url" required placeholder="https://linkedin.com/in/..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio_url">Portfolio/GitHub/Website</Label>
                    <Input id="portfolio_url" name="portfolio_url" placeholder="https://..." />
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
                  <Label htmlFor="motivation">Why do you want to join GoAi? *</Label>
                  <Textarea
                    id="motivation"
                    name="motivation"
                    required
                    placeholder="Share your motivation and what you hope to learn... (Min 50 chars)"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Resume/CV * (PDF, DOC, DOCX - Max 5MB)</Label>
                  <input
                    id="resume"
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload your resume in PDF or Word format
                  </p>
                </div>

                {user ? (
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                ) : (
                  <div className="space-y-6 pt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Sign in to verify & apply</span>
                      </div>
                    </div>

                    {!otpSent ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-auth">Work/Personal Email</Label>
                          <Input
                            id="email-auth"
                            type="email"
                            placeholder="name@example.com"
                            value={emailAuth}
                            onChange={(e) => setEmailAuth(e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleEmailSignIn}
                          className="w-full bg-british-blue hover:bg-british-blue/90 text-white"
                          disabled={authLoading}
                        >
                          {authLoading ? "Sending..." : "Send Magic Link to Email"}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in zoom-in-95">
                        <h4 className="font-semibold text-blue-900 mb-1">Check your inbox!</h4>
                        <p className="text-sm text-blue-700">
                          We've sent a magic link to <strong>{emailAuth}</strong>.
                          Click the link in the email to automatically verify and continue your application.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-4 text-blue-600 hover:text-blue-800"
                          onClick={() => setOtpSent(false)}
                        >
                          Use a different email
                        </Button>
                      </div>
                    )}
                  </div>
                )}


              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">
            For full-time positions or other inquiries, please email us at{" "}
            <a href="mailto:Hello@go-aitech.com" className="text-primary hover:underline">
              Hello@go-aitech.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Careers;
