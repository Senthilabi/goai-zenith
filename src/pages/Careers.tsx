
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, TrendingUp, Heart, Users, Upload, CheckCircle2, ChevronDown, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  linkedin_url: z.string().optional().or(z.literal("")).transform((val) => {
    if (val && !val.startsWith("http")) return `https://${val}`;
    return val;
  }),
  portfolio_url: z.string().optional().or(z.literal("")).transform((val) => {
    if (val && !val.startsWith("http")) return `https://${val}`;
    return val;
  }),
  position: z.string().min(1, "Please select a position"),
  university: z.string().min(2, "University name is required"),
  graduation_year: z.string().min(1, "Please select a graduation year"),
  skills: z.string().optional(),
  motivation: z.string().min(50, "Please provide at least 50 characters for your motivation"),
  fax_number: z.string().max(0, "Bot detected"), // Honeypot: must be empty
});

const Careers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailAuth, setEmailAuth] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const { toast } = useToast();
  const { user, loading } = useAuth(); // Auth Check

  const techSkills = [
    "Software Development", "Data Science", "AI/ML",
    "Python", "SQL", "React/Frontend", "Backend"
  ];
  const nonTechSkills = [
    "Business Development", "Marketing", "Social Media",
    "Content Writing", "HR", "Operations", "Graphic Design"
  ];

  const years = ["Before 2024", "2024", "2025", "2026", "2027", "2028"];

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };


  // Pre-fill email if logged in
  useEffect(() => {
    // Optional: Pre-fill logic if needed, but we mainly rely on user check
  }, [user]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
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

  const handleLinkedInLogin = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc', // Using OpenID Connect which is the modern standard
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "LinkedIn Login Failed",
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
          emailRedirectTo: window.location.origin + window.location.pathname,
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


  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        email: user.email,
        phone: formData.get("phone"),
        linkedin_url: formData.get("linkedin_url"),
        portfolio_url: formData.get("portfolio_url"),
        position: formData.get("position"),
        university: formData.get("university"),
        graduation_year: formData.get("graduation_year"),
        skills: [...selectedSkills, (formData.get("other_skills") || "")].filter(Boolean).join(", "),
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
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const fileExt = resumeFile.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['pdf', 'doc', 'docx'];

      if (!allowedTypes.includes(resumeFile.type) && (!fileExt || !allowedExts.includes(fileExt))) {
        throw new Error("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      }

      console.log("Uploading resume:", resumeFile.name);

      // Upload resume to Supabase Storage
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
        .insert([dbData]);

      if (dbError) {
        console.error("❌ Database error:", dbError);
        if (dbError.code === '23505') {
          setDuplicateError(true);
          return; // Exit normally, UI will switch to duplicate card
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("✅ Saved to database successfully:", savedData);

      // Send email notification to Admin (Background)
      console.log("Sending email notification...");

      // Fetch HR/Admin emails to include in notify message or CC
      const { data: adminUsers } = await supabase
        .from('hrms_employees')
        .select('email, first_name')
        .in('hrms_role', ['super_admin', 'hr_admin']);

      const adminEmailList = adminUsers?.map(a => a.email).join(', ') || "Hello@go-aitech.com";

      // 1. Notify Admins (Web3Forms is fine for this as it emails the owner)
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "eefdb10e-f591-4963-9a67-e45f0d8afda3",
          subject: `NEW Application: ${dbData.full_name} for ${dbData.position}`,
          from_name: "GoAi Recruitment System",
          email: "Hello@go-aitech.com",
          cc: adminEmailList,
          message: `
A new candidate has registered and submitted an application.

CANDIDATE DETAILS:
-----------------
Name: ${dbData.full_name}
Email: ${dbData.email} (Verified)
Position: ${dbData.position}
University: ${dbData.university} (${dbData.graduation_year})
Skills: ${dbData.skills}

This candidate is now available for review in the HRMS Recruitment Portal.

SYSTEM NOTIFICATION:
-------------------
The following HR/Admins have been notified: ${adminEmailList}

VIEW APPLICATION:
${window.location.origin}/hrms/recruitment
          `.trim()
        })
      });

      // 2. Send Acknowledgement to Candidate (Use Supabase RPC for reliable delivery)
      const ackSubject = `Application Received - GoAI Technologies`;
      const ackHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0;">
                    <!-- Letterhead Header -->
                    <div style="background-color: #ffffff; padding: 20px 40px; border-bottom: 2px solid #2563eb;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td align="left" style="vertical-align: middle; width: 70%;">
                                    <h1 style="margin: 0; color: #2563eb; font-size: 24px; font-weight: 700; line-height: 1.2;">GOAI TECHNOLOGIES</h1>
                                    <p style="margin: 5px 0 0; color: #64748b; font-size: 10px; letter-spacing: 1px; font-weight: 600;">INNOVATION FOR RETAIL</p>
                                </td>
                                <td align="right" style="vertical-align: middle; width: 30%;">
                                    <img src="https://go-aitech.com/logo.png" alt="GoAI Logo" style="height: 32px; display: block; border: 0;" />
                                </td>
                            </tr>
                        </table>
                    </div>

                <!-- Content -->
                <div style="padding: 40px; color: #334155; line-height: 1.8; font-size: 15px;">
                    <p style="margin-bottom: 24px;">Dear <strong>${dbData.full_name}</strong>,</p>
                    
                    <p>Thank you for applying to <strong>GoAI Technologies</strong> for the position of <strong>${dbData.position}</strong>.</p>
                    
                    <p>We have successfully received your application. Our recruitment team will review your profile and get back to you shortly if your qualifications match our requirements.</p>

                    <p>We appreciate your interest in joining our team.</p>
                </div>

                <!-- Letterhead Footer -->
                <div style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                        <p style="margin: 0; color: #2563eb;"><strong>GoAI Technologies Pvt Ltd</strong></p>
                        <p style="margin: 5px 0 0;">Building the Future of Retail AI</p>
                </div>
            </div>
      `;

      await supabase.rpc('send_interview_invite', {
        recipient_email: dbData.email,
        email_subject: ackSubject,
        email_html: ackHtml
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

        {/* Main Application Flow */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-elegant border-none bg-white/80 backdrop-blur-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-british-blue to-primary bg-clip-text text-transparent">
                {user ? "Complete Your Application" : "Register yourself to apply"}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {user
                  ? "Please verify your email using the Magic Link sent to you."
                  : "Fill out the form below to apply for the internship."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {duplicateError ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">Application Previously Submitted</h3>
                  <p className="text-amber-800 max-w-md mx-auto">
                    We noticed that you have already submitted an application with this email or phone number.
                  </p>
                  <div className="pt-4  text-sm text-amber-700">
                    <p>Our recruitment team is currently reviewing your profile.</p>
                    <p>You will receive an update via email regarding your application status.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-6 border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={() => window.location.reload()}
                  >
                    Return to Home
                  </Button>
                </div>
              ) : !user ? (
                <div className="space-y-6 py-4">
                  {!otpSent ? (
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <Button
                          type="button"
                          onClick={handleGoogleLogin}
                          variant="outline"
                          size="lg"
                          className="w-full flex items-center justify-center gap-3 border-slate-200 h-14 text-base font-semibold hover:bg-slate-50"
                          disabled={authLoading}
                        >
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                          Sign in with Google
                        </Button>
                        <Button
                          type="button"
                          onClick={handleLinkedInLogin}
                          variant="outline"
                          size="lg"
                          className="w-full flex items-center justify-center gap-3 border-slate-200 h-14 text-base font-semibold hover:bg-slate-50"
                          disabled={authLoading}
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="w-5 h-5" />
                          Sign in with LinkedIn
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-auth">Enter your email</Label>
                          <div className="flex gap-2">
                            <Input
                              id="email-auth"
                              type="email"
                              placeholder="name@example.com"
                              value={emailAuth}
                              onChange={(e) => setEmailAuth(e.target.value)}
                              className="h-12 text-lg"
                            />
                            <Button
                              type="button"
                              onClick={handleEmailSignIn}
                              className="h-12 px-8 bg-british-blue hover:bg-british-blue/90 text-white transition-all shadow-md font-semibold"
                              disabled={authLoading}
                            >
                              {authLoading ? "Submitting..." : "Submit"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in zoom-in-95">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-xl text-blue-900 mb-2">Check your email!</h4>
                      <p className="text-lg text-blue-700 leading-relaxed mb-6">
                        We've sent a magic link to <br /><strong>{emailAuth}</strong>.<br />
                        Click it to unlock the application form.
                      </p>
                      <Button
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100/50"
                        onClick={() => setOtpSent(false)}
                      >
                        Use a different email
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {/* Honeypot field - Hidden from users */}
                  <div className="hidden" aria-hidden="true">
                    <Input name="fax_number" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input id="full_name" name="full_name" required placeholder="Type Your Full Name" className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Verified)</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          value={user?.email || ""}
                          disabled
                          className="h-11 bg-slate-50 border-emerald-100 text-emerald-700 font-medium cursor-not-allowed pr-10"
                        />
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" name="phone" type="tel" required placeholder="+91 98765 43210" className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Preferred Role *</Label>
                      <Select name="position" required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select your interest" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="software-engineering">Software Engineering</SelectItem>
                          <SelectItem value="product-management">Product Management</SelectItem>
                          <SelectItem value="data-science">Data Science & AI</SelectItem>
                          <SelectItem value="business-development">Business Development</SelectItem>
                          <SelectItem value="marketing">Marketing & Communications</SelectItem>
                          <SelectItem value="design">UI/UX Design</SelectItem>
                          <SelectItem value="hr-operations">HR & Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Social & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                      <Input id="linkedin_url" name="linkedin_url" placeholder="https://..." className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolio_url">Portfolio/GitHub/Website</Label>
                      <Input id="portfolio_url" name="portfolio_url" placeholder="https://..." className="h-11" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="university">University/College *</Label>
                      <Input id="university" name="university" required placeholder="Institution Name" className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="graduation_year">Anticipated Graduation Date *</Label>
                      <Select name="graduation_year" required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Professional Competencies</Label>

                    <div className="space-y-4 border rounded-xl p-5 bg-slate-50/50">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Technical Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {techSkills.map(skill => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className={cn(
                                "cursor-pointer py-1.5 px-3 transition-all",
                                selectedSkills.includes(skill)
                                  ? "bg-british-blue text-white border-british-blue shadow-sm"
                                  : "bg-white hover:border-british-blue/50"
                              )}
                              onClick={() => toggleSkill(skill)}
                            >
                              {selectedSkills.includes(skill) && <Check className="w-3 h-3 mr-1" />}
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Non-Technical Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {nonTechSkills.map(skill => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className={cn(
                                "cursor-pointer py-1.5 px-3 transition-all",
                                selectedSkills.includes(skill)
                                  ? "bg-secondary text-white border-secondary shadow-sm"
                                  : "bg-white hover:border-secondary/50"
                              )}
                              onClick={() => toggleSkill(skill)}
                            >
                              {selectedSkills.includes(skill) && <Check className="w-3 h-3 mr-1" />}
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <Label htmlFor="other_skills" className="text-xs text-muted-foreground">Other specific skills?</Label>
                        <Input id="other_skills" name="other_skills" placeholder="Add any other relevant skills..." className="mt-1 h-9 bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="motivation">Why GoAi? * (Min 50 chars)</Label>
                    <Textarea
                      id="motivation"
                      name="motivation"
                      required
                      placeholder="What drives you to join our mission? What do you hope to achieve?"
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="resume">Resume / CV * (PDF, Word - Max 5MB)</Label>
                    <div className="group relative">
                      <input
                        id="resume"
                        name="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        required
                        className="flex h-12 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-british-blue file:text-white file:rounded-lg file:px-4 file:py-1 file:text-xs file:font-medium hover:bg-slate-50 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full h-14 text-lg shadow-xl hover:translate-y-[-2px] transition-transform"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </form>
              )}
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
