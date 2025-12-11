import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Rocket, Heart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Careers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget; // Store form reference

    const applicationData = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      position: formData.get("position") as string,
      university: formData.get("university") as string,
      graduation_year: formData.get("graduation_year") as string,
      skills: formData.get("skills") as string,
      motivation: formData.get("motivation") as string,
      resume_link: formData.get("resume_link") as string,
    };

    try {
      console.log("=== Starting application submission ===");

      // Get resume file
      const resumeFile = formData.get("resume") as File;
      if (!resumeFile || resumeFile.size === 0) {
        throw new Error("Please upload your resume");
      }

      // Validate file size (5MB max)
      if (resumeFile.size > 5 * 1024 * 1024) {
        throw new Error("Resume file size must be less than 5MB");
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(resumeFile.type)) {
        throw new Error("Please upload a PDF or Word document");
      }

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

      const applicationData = {
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        position: formData.get("position") as string,
        university: formData.get("university") as string,
        graduation_year: formData.get("graduation_year") as string,
        skills: formData.get("skills") as string || "",
        motivation: formData.get("motivation") as string,
        resume_link: filePath, // Store the file path
      };

      console.log("Application data:", applicationData);

      // Save to database
      console.log("Attempting to save to database...");
      const { data: savedData, error: dbError } = await supabase
        .from("internship_applications")
        .insert([applicationData])
        .select();

      if (dbError) {
        console.error("❌ Database error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("✅ Saved to database successfully:", savedData);

      // Send email notification
      console.log("Sending email notification...");
      const emailResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "eefdb10e-f591-4963-9a67-e45f0d8afda3",
          subject: "New Internship Application - GoAi Technologies",
          from_name: applicationData.full_name,
          email: "Hello@go-aitech.com",
          message: `
New Internship Application Received

Name: ${applicationData.full_name}
Email: ${applicationData.email}
Phone: ${applicationData.phone}
Position: ${applicationData.position}
University: ${applicationData.university}
Graduation Year: ${applicationData.graduation_year}

Skills & Experience:
${applicationData.skills || 'Not provided'}

Motivation:
${applicationData.motivation}

Resume: Uploaded (${filePath})
Download from: Supabase Storage > resumes bucket

View in HRMS: ${window.location.origin}/hrms/recruitment
          `.trim()
        })
      });

      const emailResult = await emailResponse.json();
      console.log("Email response:", emailResult);

      if (!emailResponse.ok) {
        console.warn("⚠️ Email failed but continuing:", emailResult);
      } else {
        console.log("✅ Email sent successfully");
      }

      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      form.reset(); // Use stored form reference
      console.log("=== Application submission complete ===");
    } catch (error: any) {
      console.error("❌ ERROR submitting application:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
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
                  <Label htmlFor="motivation">Why do you want to join GoAi? *</Label>
                  <Textarea
                    id="motivation"
                    name="motivation"
                    required
                    placeholder="Share your motivation and what you hope to learn..."
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
