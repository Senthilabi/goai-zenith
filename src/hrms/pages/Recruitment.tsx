import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    Search, Filter, Download, UserPlus, FileText,
    Linkedin, Globe, GraduationCap, Mail, Phone, Rocket, Eye,
    ShieldAlert, CheckCircle2, Send
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

const Recruitment = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    // Interview Scheduling State
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [schedulingApp, setSchedulingApp] = useState<any | null>(null);
    const [interviewData, setInterviewData] = useState({
        date: '',
        time: '',
        mode: 'Online',
        location: '',
        interviewer: 'HR Team'
    });

    // Notes/Status Update State
    const [notes, setNotes] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [issuedDocs, setIssuedDocs] = useState<any[]>([]);

    // Offer Letter Details State
    const [offerDetails, setOfferDetails] = useState({
        joiningDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        internshipPeriod: 6,
        customPosition: ''
    });

    const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            // Use the full URL if it is a relative path to ensure it loads in all environments
            img.src = url.startsWith('http') ? url : window.location.origin + url;
        });
    };

    const saveDocument = async (appId: string | null, empId: string | null, docType: string, blob: Blob, fileName: string) => {
        try {
            const filePath = `${empId || appId}/${Date.now()}_${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('hrms_generated_docs')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
                .from('hrms_documents')
                .insert({
                    candidate_id: appId,
                    employee_id: empId,
                    doc_type: docType,
                    file_path: filePath,
                    issued_by: user?.id
                });

            if (dbError) throw dbError;

            return filePath;
        } catch (error: any) {
            console.error('Error saving document:', error);
            throw error;
        }
    };

    const generateOfferLetter = async (app: any, isFinal: boolean = false) => {
        const doc = new jsPDF();

        // Background Letterhead
        try {
            const letterheadBase64 = await loadImageAsBase64("/letterhead.png");
            doc.addImage(letterheadBase64, 'PNG', 0, 0, 210, 297);
        } catch (e) {
            console.error("Letterhead failed to load", e);
            // Fallback branding if letterhead fails
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("GOAI TECHNOLOGIES PVT LTD", 105, 25, { align: "center" });
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Ref: GoAI/OFFER/${app.id.slice(0, 8)}`, 20, 50);
        doc.text(`Date: ${format(new Date(), 'PPP')}`, 20, 57);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("INTERNSHIP INFORMATION & OFFER LETTER", 105, 75, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`To,`, 20, 90);
        doc.text(`${app.full_name}`, 20, 96);
        doc.text(`${app.university}`, 20, 102);

        const position = offerDetails.customPosition || app.position;
        const joiningDate = offerDetails.joiningDate ? format(new Date(offerDetails.joiningDate), 'PPP') : format(new Date(), 'PPP');
        const period = offerDetails.internshipPeriod;

        const body = `Dear ${app.full_name},

Following your recent interview for the ${position} Intern position, we are pleased to offer you an internship with GoAI Technologies.

Your internship is scheduled to begin on ${joiningDate} for a duration of ${period} months. During this period, you will be working remotely/hybrid as per team requirements.

Compensation & Benefits:
• Internship Certificate and Letter of Recommendation (LOR) upon completion.
• Exposure to real-world AI and Retail Tech projects.

This offer is subject to the signing of our standard Non-Disclosure Agreement (NDA).

We look forward to having you join our team.

Sincerely,
HR Department
GoAI Technologies`;

        const splitText = doc.splitTextToSize(body, 170);
        doc.text(splitText, 20, 115);

        if (isFinal) {
            const pdfBlob = doc.output('blob');
            await saveDocument(app.id, null, 'offer_letter', pdfBlob, 'Offer_Letter.pdf');

            // Send email to candidate
            try {
                const subject = `Internship Offer Letter – ${position}`;
                const htmlMessage = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f8fafc; padding: 24px; border-bottom: 2px solid #10b981;">
                            <img src="${window.location.origin}/logo.png" alt="GoAI Logo" style="height: 48px; width: auto; margin-bottom: 12px; display: block;" />
                            <h2 style="margin: 0; color: #1e293b; font-size: 20px;">GOAI TECHNOLOGIES PVT LTD</h2>
                            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Internship Offer Letter</p>
                        </div>
                        <div style="padding: 32px; color: #334155; line-height: 1.6;">
                            <p>Dear <strong>${app.full_name}</strong>,</p>
                            <p>Congratulations! We are pleased to offer you an internship position at <strong>GoAI Technologies</strong>.</p>
                            
                            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; margin: 24px 0;">
                                <h3 style="margin: 0 0 12px; color: #059669; font-size: 16px;">Offer Details</h3>
                                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                                    <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Position:</td><td style="padding: 4px 0; font-weight: 600;">${position}</td></tr>
                                    <tr><td style="padding: 4px 0; color: #64748b;">Joining Date:</td><td style="padding: 4px 0; font-weight: 600;">${joiningDate}</td></tr>
                                    <tr><td style="padding: 4px 0; color: #64748b;">Duration:</td><td style="padding: 4px 0; font-weight: 600;">${period} Months</td></tr>
                                    <tr><td style="padding: 4px 0; color: #64748b;">Mode:</td><td style="padding: 4px 0; font-weight: 600;">Remote/Hybrid</td></tr>
                                </table>
                            </div>

                            <p style="margin-bottom: 24px;">Please find your official offer letter attached to this email. To proceed with onboarding, please check your email for the onboarding link.</p>
                            
                            <p style="margin-top: 32px; font-size: 14px;"><strong>Next Steps:</strong><br/>
                            1. Review the attached offer letter<br/>
                            2. Complete the onboarding process via the link sent separately<br/>
                            3. Sign the NDA and upload required documents</p>
                        </div>
                        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} GoAI Technologies Pvt Ltd</p>
                            <p style="margin: 4px 0;">Email: hr@go-aitech.com | Website: www.go-aitech.com</p>
                        </div>
                    </div>
                `;

                const { error: emailError } = await supabase.rpc('send_interview_invite', {
                    recipient_email: app.email,
                    email_subject: subject,
                    email_html: htmlMessage
                });

                if (emailError) {
                    console.error("Email send error:", emailError);
                    toast({
                        title: "Letter Saved, Email Failed",
                        description: "Offer letter saved but email could not be sent. Please send manually.",
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Offer Letter Shared!",
                        description: `Email sent to ${app.email} successfully.`
                    });
                }
            } catch (error) {
                console.error("Email error:", error);
                toast({
                    title: "Letter Saved",
                    description: "Saved to records. Email sending failed - please send manually."
                });
            }
        }

        window.open(doc.output('bloburl'), '_blank');
        if (!isFinal) {
            toast({ title: "Preview Generated", description: "Opening selection letter preview..." });
        }
    };

    const generateCertificate = async (app: any, isFinal: boolean = false) => {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Fancy Border
        doc.setDrawColor(20, 184, 166); // Teal-500
        doc.setLineWidth(2);
        doc.rect(10, 10, 277, 190);
        doc.setLineWidth(0.5);
        doc.rect(12, 12, 273, 186);

        // Content
        try {
            const logoBase64 = await loadImageAsBase64("/logo.png");
            doc.addImage(logoBase64, 'PNG', 135, 20, 25, 25);
        } catch (e) {
            console.error("Logo failed to load", e);
        }

        doc.setFontSize(36);
        doc.setFont("times", "bolditalic");
        doc.setTextColor(20, 184, 166); // Teal-500
        doc.text("Certificate of Completion", 148, 60, { align: "center" });

        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text("INTERNSHIP COMPLETION CERTIFICATE", 148.5, 58, { align: "center" });

        // Body
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        const body = `This is to certify that ${app.full_name} has successfully completed an internship with GoAI Technologies Pvt Ltd as a ${app.position || 'Intern'} for a period of 6 Months from ${format(new Date(app.created_at), 'PPP')} to ${format(new Date(), 'PPP')}.`;
        const splitBody = doc.splitTextToSize(body, 220);
        doc.text(splitBody, 148.5, 90, { align: "center" });

        doc.text("During this period, the intern demonstrated dedication, sincerity, and a willingness to learn. We wish them success in their future academic and professional endeavors.", 148.5, 125, { align: "center", maxWidth: 220 });

        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 155);

        // Footer
        doc.line(180, 170, 250, 170);
        doc.text("For GoAI Technologies Pvt Ltd", 215, 175, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.text("Authorized Signatory", 215, 182, { align: "center" });

        if (isFinal) {
            const pdfBlob = doc.output('blob');
            await saveDocument(null, app.emp_id || app.id, 'certificate', pdfBlob, 'Completion_Certificate.pdf');
            toast({ title: "Certificate Issued", description: "Successfully saved to employee records." });
        }

        window.open(doc.output('bloburl'), '_blank');
        if (!isFinal) {
            toast({ title: "Preview Generated", description: "Opening certificate preview..." });
        }
    };

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('hrms_employees')
                    .select('hrms_role')
                    .eq('auth_id', user.id)
                    .single();

                if (error || !data) {
                    setIsAuthorized(false);
                } else {
                    const hasAccess = data.hrms_role === 'super_admin' || data.hrms_role === 'hr_admin';
                    setIsAuthorized(hasAccess);
                    if (hasAccess) fetchApplications();
                }
            } catch (err) {
                setIsAuthorized(false);
            }
        };

        checkAccess();
    }, [user]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('internship_applications')
                .select('*, onboarding:hrms_onboarding(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error: any) {
            console.error("Error fetching applications:", error);
            toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchIssuedDocs = async (appId: string) => {
        try {
            const { data, error } = await supabase
                .from('hrms_documents')
                .select('*')
                .eq('candidate_id', appId)
                .order('generated_at', { ascending: false });

            if (error) throw error;
            setIssuedDocs(data || []);
        } catch (error: any) {
            console.error('Error fetching docs:', error);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('internship_applications')
                .update({ status: status })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Updated", description: "Application status updated successfully" });
            fetchApplications();
            if (selectedApp) setSelectedApp({ ...selectedApp, status: status });
            setNewStatus(status);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const saveNotes = async (id: string) => {
        try {
            const { error } = await supabase
                .from('internship_applications')
                .update({ notes: notes })
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Saved", description: "Notes updated successfully" });
            fetchApplications();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleSendInterviewInvite = async () => {
        if (!schedulingApp) return;

        try {
            // Updated Subject & Body according to user's draft
            const subject = `Interview Schedule – ${schedulingApp.position}`;
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 24px; border-bottom: 2px solid #3b82f6;">
                        <img src="${window.location.origin.includes('localhost') ? 'https://go-aitech.com/logo.png' : window.location.origin + '/logo.png'}" alt="GoAI Logo" style="height: 48px; width: auto; margin-bottom: 12px; display: block;" />
                        <h2 style="margin: 0; color: #1e293b; font-size: 20px;">GOAI TECHNOLOGIES PVT LTD</h2>
                        <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Official Interview Invitation</p>
                    </div>
                    <div style="padding: 32px; color: #334155; line-height: 1.6;">
                        <p>Dear <strong>${schedulingApp.full_name}</strong>,</p>
                        <p>Thank you for your interest in joining <strong>GoAI Technologies</strong>. We have carefully reviewed your profile and are pleased to invite you for an interview for the <strong>${schedulingApp.position}</strong> role.</p>
                        
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin: 24px 0;">
                            <h3 style="margin: 0 0 12px; color: #1d4ed8; font-size: 16px;">Schedule Details</h3>
                            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                                <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Interview Date:</td><td style="padding: 4px 0; font-weight: 600;">${interviewData.date}</td></tr>
                                <tr><td style="padding: 4px 0; color: #64748b;">Interview Time:</td><td style="padding: 4px 0; font-weight: 600;">${interviewData.time}</td></tr>
                                <tr><td style="padding: 4px 0; color: #64748b;">Mode:</td><td style="padding: 4px 0; font-weight: 600;">${interviewData.mode}</td></tr>
                                <tr><td style="padding: 4px 0; color: #64748b;">Interviewer(s):</td><td style="padding: 4px 0; font-weight: 600;">${interviewData.interviewer}</td></tr>
                            </table>
                        </div>

                        <p style="margin-bottom: 24px;">Please click the button below to join the interview or view details:</p>
                        
                        <a href="${interviewData.location}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Join Interview / Open Link</a>

                        <p style="margin-top: 32px; font-size: 14px;"><strong>Preparation Notes:</strong><br/>
                        For online interviews, please ensure a stable internet connection and a quiet environment. If you need to reschedule, please let us know at least 24 hours in advance.</p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} GoAI Technologies Pvt Ltd</p>
                        <p style="margin: 4px 0;">Email: hello@go-aitech.com | Website: www.go-aitech.com</p>
                    </div>
                </div>
            `;

            console.log("Sending invite via Supabase RPC to:", schedulingApp.email);

            // Call the database function (RPC) we just created
            const { data: rpcResponse, error: rpcError } = await supabase.rpc('send_interview_invite', {
                recipient_email: schedulingApp.email,
                email_subject: subject,
                email_html: htmlMessage
            });

            if (rpcError) {
                console.error("RPC Error:", rpcError);
                throw new Error("Database failed to process email. Please ensure you ran the SQL script.");
            }

            // Check if Resend returned an error inside the response
            if (rpcResponse && (rpcResponse.statusCode >= 400 || rpcResponse.error)) {
                let msg = rpcResponse.message || "Failed to send email via Resend Service.";
                if (msg.includes("Single Recipient")) {
                    msg = "Resend Sandbox Mode: Direct emails only work to your registered Zoho email. Verify your domain in Resend to send to anyone!";
                }
                throw new Error(msg);
            }

            toast({
                title: "Interview Invite Sent!",
                description: `Branded email sent to ${schedulingApp.email} successfully.`,
            });

            // Update status to interview_scheduled
            await updateStatus(schedulingApp.id, 'interview_scheduled');
            setIsScheduleDialogOpen(false);
            fetchApplications();
        } catch (error: any) {
            toast({
                title: "Email Failed [v2.3]",
                description: error.message,
                variant: "destructive",
                duration: 8000
            });
        }
    };

    const copyInviteToClipboard = () => {
        if (!schedulingApp) return;
        const text = `Dear ${schedulingApp.full_name},\n\nJoin us for an interview at GoAI Technologies.\n\nPosition: ${schedulingApp.position}\nDate: ${interviewData.date}\nTime: ${interviewData.time}\nLink/Location: ${interviewData.location}\n\nRegards,\nHR Team`;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Invitation text copied to clipboard." });
    };

    const handleMarkInterviewed = async (appId: string) => {
        try {
            const { error } = await supabase
                .from('internship_applications')
                .update({ status: 'interviewed' })
                .eq('id', appId);

            if (error) throw error;
            toast({ title: "Updated", description: "Marked as interviewed" });
            fetchApplications();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handlePostInterviewDecision = async (appId: string, decision: 'approved' | 'on_hold' | 'rejected', email: string) => {
        try {
            await updateStatus(appId, decision);

            if (decision === 'approved') {
                const subject = "Congratulations! Your Application at GoAI Technologies";
                const htmlMessage = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f8fafc; padding: 24px; border-bottom: 2px solid #22c55e;">
                            <img src="${window.location.origin.includes('localhost') ? 'https://go-aitech.com/logo.png' : window.location.origin + '/logo.png'}" alt="GoAI Logo" style="height: 48px; width: auto; margin-bottom: 12px; display: block;" />
                            <h2 style="margin: 0; color: #1e293b; font-size: 20px;">GOAI TECHNOLOGIES PVT LTD</h2>
                            <p style="margin: 4px 0 0; color: #166534; font-size: 14px;">Selection Notification</p>
                        </div>
                        <div style="padding: 32px; color: #334155; line-height: 1.6;">
                            <p>Dear Candidate,</p>
                            <p>Congratulations! We are pleased to inform you that you have been <strong>selected</strong> for the position at <strong>GoAI Technologies</strong>.</p>
                            <p>We were impressed with your skills and experience, and we believe you will be a valuable addition to our team.</p>
                            <p><strong>Next Steps:</strong> Our HR team will soon initiate the onboarding process. You will receive a separate email with a link to complete your documentation and sign the NDA.</p>
                            <p>Welcome aboard!</p>
                        </div>
                        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} GoAI Technologies Pvt Ltd</p>
                        </div>
                    </div>
                `;

                await supabase.rpc('send_interview_invite', {
                    recipient_email: email,
                    email_subject: subject,
                    email_html: htmlMessage
                });

                toast({
                    title: "Candidate Approved!",
                    description: `Approval email sent to ${email} successfully.`,
                    duration: 6000
                });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };


    const handleStartOnboarding = async (appId: string, email: string) => {
        try {
            // Check existing
            const { data: existing } = await supabase.from('hrms_onboarding').select('id').eq('application_id', appId).single();

            let onboardingId = existing?.id;

            if (!existing) {
                const { data, error } = await supabase.from('hrms_onboarding').insert([{
                    application_id: appId,
                    personal_email: email
                }]).select().single();

                if (error) throw error;
                onboardingId = data.id;
                toast({ title: "Started", description: "Onboarding initialized." });
            }

            const link = `${window.location.origin}/onboarding/${onboardingId}`;

            // Send Onboarding Email
            const subject = "Next Steps: Complete Your Onboarding at GoAI Technologies";
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 24px; border-bottom: 2px solid #3b82f6;">
                        <img src="${window.location.origin.includes('localhost') ? 'https://go-aitech.com/logo.png' : window.location.origin + '/logo.png'}" alt="GoAI Logo" style="height: 48px; width: auto; margin-bottom: 12px; display: block;" />
                        <h2 style="margin: 0; color: #1e293b; font-size: 20px;">GOAI TECHNOLOGIES PVT LTD</h2>
                        <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Onboarding Documentation Request</p>
                    </div>
                    <div style="padding: 32px; color: #334155; line-height: 1.6;">
                        <p>Dear Candidate,</p>
                        <p>Welcome to the GoAI family! To proceed with your recruitment, we require you to complete your onboarding documentation and sign the Non-Disclosure Agreement (NDA).</p>
                        <p>Please click the button below to access your secure onboarding portal:</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${link}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Complete My Onboarding</a>
                        </div>
                        <p style="font-size: 14px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br/>${link}</p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} GoAI Technologies Pvt Ltd</p>
                    </div>
                </div>
            `;

            await supabase.rpc('send_interview_invite', {
                recipient_email: email,
                email_subject: subject,
                email_html: htmlMessage
            });

            toast({ title: "Email Sent", description: "Onboarding link sent to candidate successfully." });
            fetchApplications();

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleCreateEmployee = async (app: any) => {
        if (!confirm(`Are you sure you want to hire ${app.full_name}? This will create their login account and send credentials to ${app.email}.`)) return;

        try {
            // 1. Generate Employee Code & Login Credentials
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const empCode = `EMP-${randomId}`;
            const systemLoginId = `${empCode.toLowerCase()}@go-aitech.com`;
            const tempPassword = `Welcome${randomId}!`;

            // 2. Call RPC Function to Create Auth User + Employee Record
            const { data, error } = await supabase.rpc('create_user_for_employee', {
                new_email: systemLoginId,
                new_password: tempPassword,
                new_employee_code: empCode,
                new_first_name: app.full_name.split(' ')[0],
                new_last_name: app.full_name.split(' ').slice(1).join(' ') || '',
                new_designation: app.position + ' Intern',
                new_photo_url: app.onboarding?.[0]?.photo_url || null
            });

            if (error) throw error;

            // Check if the RPC returned an error in the JSON response
            if (data && !data.success) {
                throw new Error(data.error || 'Failed to create user');
            }

            // 3. Send Credentials Email
            const subject = "Official Access: Your GoAI Technologies HRMS Account";
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 24px; border-bottom: 2px solid #22c55e;">
                        <img src="${window.location.origin.includes('localhost') ? 'https://go-aitech.com/logo.png' : window.location.origin + '/logo.png'}" alt="GoAI Logo" style="height: 48px; width: auto; margin-bottom: 12px; display: block;" />
                        <h2 style="margin: 0; color: #1e293b; font-size: 20px;">GOAI TECHNOLOGIES PVT LTD</h2>
                        <p style="margin: 4px 0 0; color: #166534; font-size: 14px;">Employee Login Credentials</p>
                    </div>
                    <div style="padding: 32px; color: #334155; line-height: 1.6;">
                        <p>Dear <strong>${app.full_name}</strong>,</p>
                        <p>Welcome to <strong>GoAI Technologies</strong>! Your official employee account has been created. You can now access our HRMS portal for attendance, leaves, and your professional profile.</p>
                        
                        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0 0 10px;"><strong>Portal Link:</strong> <a href="${window.location.origin}">${window.location.origin}</a></p>
                            <p style="margin: 0 0 10px;"><strong>Login ID:</strong> ${systemLoginId}</p>
                            <p style="margin: 0;"><strong>Initial Password:</strong> ${tempPassword}</p>
                        </div>
                        
                        <p style="background: #fff7ed; padding: 12px; border-left: 4px solid #f97316; font-size: 13px;">
                            <strong>Note:</strong> We recommend changing your password after your first login through the "My Profile" section.
                        </p>
                    </div>
                </div>
            `;

            await supabase.rpc('send_interview_invite', {
                recipient_email: app.email,
                email_subject: subject,
                email_html: htmlMessage
            });

            toast({
                title: "✅ Employee Created & Email Sent!",
                description: `Branded email with credentials sent to ${app.email}.`,
                duration: 12000,
            });

            // 4. Update Application Status to Hired
            await updateStatus(app.id, 'hired');

            // 5. Refresh the applications list
            fetchApplications();

        } catch (error: any) {
            console.error('Error creating employee:', error);
            toast({
                title: "Error",
                description: error.message || 'Failed to create employee account',
                variant: "destructive"
            });
        }
    };

    const downloadResume = async (path: string, name: string) => {
        if (!path) return;
        try {
            const { data, error } = await supabase.storage.from('resumes').download(path);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}_Resume.pdf`;
            a.click();
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to download resume", variant: "destructive" });
        }
    };

    // Filter Logic
    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.position?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'reviewing': return 'bg-orange-100 text-orange-800';
            case 'shortlisted': return 'bg-purple-100 text-purple-800';
            case 'interview_scheduled': return 'bg-indigo-100 text-indigo-800';
            case 'interviewed': return 'bg-violet-100 text-violet-800';
            case 'approved': return 'bg-emerald-100 text-emerald-800';
            case 'on_hold': return 'bg-yellow-100 text-yellow-800';
            case 'hired': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = {
        total: applications.length,
        new: applications.filter(a => a.status === 'new').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        hired: applications.filter(a => a.status === 'hired').length,
    };

    if (isAuthorized === false) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600">
                        You do not have the required permissions to view recruitment data.
                        Please contact your administrator to request an "HR Admin" role.
                    </p>
                </div>
            </div>
        );
    }

    if (loading || isAuthorized === null) return <div className="p-8 text-center">Loading applications...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
                <p className="text-muted-foreground">Manage internship applications and hiring</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total Applications</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                        <p className="text-xs text-muted-foreground">New</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{stats.reviewing}</div>
                        <p className="text-xs text-muted-foreground">Pending Review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
                        <p className="text-xs text-muted-foreground">Hired</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or position..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="reviewing">Reviewing</SelectItem>
                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                                <SelectItem value="interviewed">Interviewed</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Internship Applications ({filteredApplications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredApplications.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No applications found</p>
                        ) : (
                            filteredApplications.map((app) => (
                                <div key={app.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{app.full_name}</h3>
                                                <Badge className={getStatusColor(app.status)}>
                                                    {app.status}
                                                </Badge>
                                                {/* Onboarding Badges */}
                                                {(app as any).onboarding?.[0] && (
                                                    <div className="flex gap-1 ml-2">
                                                        {(app as any).onboarding[0].offer_status === 'accepted' &&
                                                            <Badge variant="outline" className="text-green-600 border-green-200">Offer Accepted</Badge>}
                                                        {(app as any).onboarding[0].nda_status === 'signed' &&
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200">NDA Signed</Badge>}
                                                        {(app as any).onboarding[0].photo_url &&
                                                            <Badge variant="outline" className="text-purple-600 border-purple-200">Docs</Badge>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                                                <div>📧 {app.email}</div>
                                                <div>📱 {app.phone}</div>
                                                <div>💼 {app.position}</div>
                                                <div>🎓 {app.university} ({app.graduation_year})</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        setSelectedApp(app);
                                                        setNewStatus(app.status);
                                                        setNotes(app.notes || "");
                                                        fetchIssuedDocs(app.id);
                                                    }}>
                                                        View Details
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>{app.full_name}</DialogTitle>
                                                        <DialogDescription>Application Review & Onboarding</DialogDescription>
                                                    </DialogHeader>

                                                    {selectedApp && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                                            {/* LEFT COLUMN: DETAILS */}
                                                            <div className="space-y-4">
                                                                {/* Links */}
                                                                <div className="flex gap-3 text-sm">
                                                                    {selectedApp.linkedin_url && (
                                                                        <a href={selectedApp.linkedin_url} target="_blank" className="text-blue-600 flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</a>
                                                                    )}
                                                                    {selectedApp.portfolio_url && (
                                                                        <a href={selectedApp.portfolio_url} target="_blank" className="text-purple-600 flex items-center gap-1"><Globe className="h-3 w-3" /> Portfolio</a>
                                                                    )}
                                                                </div>

                                                                {/* Candidate Photo */}
                                                                {selectedApp.onboarding?.[0]?.photo_url && (
                                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                                        <div className="font-semibold mb-2 text-sm">Candidate Photo</div>
                                                                        <img
                                                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding_docs/${selectedApp.onboarding[0].photo_url}`}
                                                                            alt={`${selectedApp.full_name} photo`}
                                                                            className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200 mx-auto"
                                                                        />
                                                                    </div>
                                                                )}

                                                                <div className="bg-slate-50 p-3 rounded-lg text-sm">
                                                                    <div className="font-semibold mb-1">Skills</div>
                                                                    <p>{selectedApp.skills || 'None listed'}</p>
                                                                </div>

                                                                <div className="bg-slate-50 p-3 rounded-lg text-sm">
                                                                    <div className="font-semibold mb-1">Motivation</div>
                                                                    <p className="italic">"{selectedApp.motivation}"</p>
                                                                </div>

                                                                <Button variant="outline" size="sm" className="w-full" onClick={() => downloadResume(selectedApp.resume_link, selectedApp.full_name)}>
                                                                    <FileText className="mr-2 h-4 w-4" /> Download Resume
                                                                </Button>
                                                            </div>

                                                            {/* RIGHT COLUMN: ACTIONS */}
                                                            <div className="space-y-4">
                                                                {/* Status Select */}
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Status</label>
                                                                    <Select value={newStatus} onValueChange={(val) => {
                                                                        setNewStatus(val);
                                                                        if (selectedApp.status !== val) updateStatus(selectedApp.id, val);
                                                                    }}>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="new">New</SelectItem>
                                                                            <SelectItem value="reviewing">Reviewing</SelectItem>
                                                                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                                                            <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                                                                            <SelectItem value="interviewed">Interviewed</SelectItem>
                                                                            <SelectItem value="approved">Approved</SelectItem>
                                                                            <SelectItem value="on_hold">On Hold</SelectItem>
                                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                                            <SelectItem value="hired">Hired</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {selectedApp.status === 'shortlisted' && (
                                                                    <div className="border rounded-lg p-4 bg-blue-50">
                                                                        <h4 className="font-semibold text-sm mb-2">Interview Stage</h4>
                                                                        <Button
                                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                                            onClick={() => {
                                                                                setSchedulingApp(selectedApp);
                                                                                setIsScheduleDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            📧 Send Interview Invite
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                {selectedApp.status === 'interview_scheduled' && (
                                                                    <div className="border rounded-lg p-4 bg-indigo-50">
                                                                        <h4 className="font-semibold text-sm mb-2">Interview Scheduled</h4>
                                                                        <Button
                                                                            className="w-full"
                                                                            variant="outline"
                                                                            onClick={() => handleMarkInterviewed(selectedApp.id)}
                                                                        >
                                                                            ✓ Mark as Interviewed
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                {selectedApp.status === 'interviewed' && (
                                                                    <div className="border rounded-lg p-4 bg-violet-50 space-y-2">
                                                                        <h4 className="font-semibold text-sm mb-2">Post-Interview Decision</h4>
                                                                        <Button
                                                                            className="w-full bg-green-600 hover:bg-green-700"
                                                                            onClick={() => handlePostInterviewDecision(selectedApp.id, 'approved', selectedApp.email)}
                                                                        >
                                                                            ✓ Approve Candidate
                                                                        </Button>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                onClick={() => handlePostInterviewDecision(selectedApp.id, 'on_hold', selectedApp.email)}
                                                                            >
                                                                                ⏸ Hold
                                                                            </Button>
                                                                            <Button
                                                                                variant="destructive"
                                                                                onClick={() => handlePostInterviewDecision(selectedApp.id, 'rejected', selectedApp.email)}
                                                                            >
                                                                                ✗ Reject
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {selectedApp.status === 'approved' && (
                                                                    <div className="border rounded-lg p-4 bg-green-50 space-y-3">
                                                                        <h4 className="font-semibold text-sm mb-2">Offer Letter Details</h4>

                                                                        {/* Offer Details Editor */}
                                                                        <div className="space-y-3 bg-white p-3 rounded border">
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <div className="space-y-1">
                                                                                    <label className="text-xs font-medium text-muted-foreground">Joining Date</label>
                                                                                    <Input
                                                                                        type="date"
                                                                                        value={offerDetails.joiningDate}
                                                                                        onChange={(e) => setOfferDetails({ ...offerDetails, joiningDate: e.target.value })}
                                                                                        className="h-8 text-sm"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-xs font-medium text-muted-foreground">Period (Months)</label>
                                                                                    <Select
                                                                                        value={offerDetails.internshipPeriod.toString()}
                                                                                        onValueChange={(val) => setOfferDetails({ ...offerDetails, internshipPeriod: parseInt(val) })}
                                                                                    >
                                                                                        <SelectTrigger className="h-8 text-sm">
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="3">3 Months</SelectItem>
                                                                                            <SelectItem value="6">6 Months</SelectItem>
                                                                                            <SelectItem value="12">12 Months</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-xs font-medium text-muted-foreground">Position (Optional Override)</label>
                                                                                <Input
                                                                                    placeholder={selectedApp.position}
                                                                                    value={offerDetails.customPosition}
                                                                                    onChange={(e) => setOfferDetails({ ...offerDetails, customPosition: e.target.value })}
                                                                                    className="h-8 text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Buttons */}
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                                onClick={() => generateOfferLetter(selectedApp, false)}
                                                                            >
                                                                                <FileText className="mr-2 h-4 w-4" /> Preview
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                                                                                onClick={() => generateOfferLetter(selectedApp, true)}
                                                                            >
                                                                                <Send className="mr-2 h-4 w-4" /> Share Letter
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Onboarding Panel */}
                                                                <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                                                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                                                        <UserPlus className="h-4 w-4" /> Onboarding Pipeline
                                                                    </h4>

                                                                    {selectedApp.onboarding && selectedApp.onboarding.length > 0 ? (
                                                                        <div className="space-y-2 text-sm">
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div className="bg-white p-2 rounded border text-center">
                                                                                    <div className="text-xs text-muted-foreground">Offer</div>
                                                                                    <div className="font-medium text-green-600">{selectedApp.onboarding[0].offer_status}</div>
                                                                                </div>
                                                                                <div className="bg-white p-2 rounded border text-center">
                                                                                    <div className="text-xs text-muted-foreground">NDA</div>
                                                                                    <div className="font-medium text-blue-600">{selectedApp.onboarding[0].nda_status}</div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex justify-between items-center bg-white p-2 rounded border">
                                                                                <span className="text-xs">Identity Docs:</span>
                                                                                {selectedApp.onboarding[0].photo_url ? (
                                                                                    <Button variant="link" className="h-auto p-0 text-blue-600 h-6" onClick={() => {
                                                                                        const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding_docs/${selectedApp.onboarding[0].photo_url}`;
                                                                                        window.open(url, '_blank');
                                                                                    }}>View Uploads</Button>
                                                                                ) : (
                                                                                    <span className="text-xs text-muted-foreground">Pending</span>
                                                                                )}
                                                                            </div>

                                                                            <Button variant="outline" size="sm" className="w-full" onClick={() => {
                                                                                const link = `${window.location.origin}/onboarding/${selectedApp.onboarding[0].id}`;
                                                                                navigator.clipboard.writeText(link);
                                                                                toast({ title: "Copied", description: "Link copied to clipboard" });
                                                                            }}>
                                                                                Copy Onboarding Link
                                                                            </Button>

                                                                            {/* APPROVAL BUTTON */}
                                                                            {(selectedApp.onboarding[0].nda_status === 'signed' && selectedApp.status !== 'hired') && (
                                                                                <Button
                                                                                    className="w-full bg-green-600 hover:bg-green-700 mt-2"
                                                                                    onClick={() => handleCreateEmployee(selectedApp)}
                                                                                >
                                                                                    Approve & Send Credentials
                                                                                </Button>
                                                                            )}

                                                                            {selectedApp.status === 'hired' && (
                                                                                <div className="pt-2 border-t mt-2 space-y-2">
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            className="w-full"
                                                                                            onClick={() => generateCertificate(selectedApp, false)}
                                                                                        >
                                                                                            <FileText className="mr-2 h-4 w-4" /> Preview
                                                                                        </Button>
                                                                                        <Button
                                                                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                                                                            onClick={() => generateCertificate(selectedApp, true)}
                                                                                        >
                                                                                            <GraduationCap className="mr-2 h-4 w-4" /> Issue Cert
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            <div className="text-xs text-muted-foreground text-center py-2">
                                                                                Onboarding record not found.
                                                                            </div>
                                                                            <Button
                                                                                size="sm"
                                                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                                                                disabled={!['shortlisted', 'accepted', 'approved'].includes(newStatus)}
                                                                                onClick={() => handleStartOnboarding(selectedApp.id, selectedApp.email)}
                                                                            >
                                                                                Start Onboarding
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Issued Documents Panel */}
                                                                {issuedDocs.length > 0 && (
                                                                    <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                                                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                                                            <FileText className="h-4 w-4" /> Issued Documents
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {issuedDocs.map((doc) => (
                                                                                <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium capitalize">{doc.doc_type.replace('_', ' ')}</span>
                                                                                        <span className="text-[10px] text-muted-foreground">{format(new Date(doc.generated_at), 'PPP')}</span>
                                                                                    </div>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                                        onClick={() => {
                                                                                            const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/hrms_generated_docs/${doc.file_path}`;
                                                                                            window.open(url, '_blank');
                                                                                        }}
                                                                                    >
                                                                                        View
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Notes Box */}
                                                                <div className="space-y-1">
                                                                    <label className="text-xs font-medium">Notes</label>
                                                                    <Textarea
                                                                        value={notes}
                                                                        onChange={(e) => setNotes(e.target.value)}
                                                                        placeholder="Internal notes..."
                                                                        className="text-sm"
                                                                    />
                                                                    <Button variant="ghost" size="sm" className="w-full" onClick={() => saveNotes(selectedApp.id)}>Save Notes</Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Interview Dialog */}
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Schedule Interview</DialogTitle>
                        <DialogDescription>
                            Complete the details below to send a branded invite to {schedulingApp?.full_name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Interview Date</label>
                                <Input
                                    type="date"
                                    value={interviewData.date}
                                    onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Interview Time</label>
                                <Input
                                    type="time"
                                    value={interviewData.time}
                                    onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Interview Mode</label>
                            <Select value={interviewData.mode} onValueChange={(val) => setInterviewData({ ...interviewData, mode: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Online">Online / Video Call</SelectItem>
                                    <SelectItem value="In-Person">In-Person / At Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                                {interviewData.mode === 'Online' ? 'Meeting Link' : 'Office Location'}
                            </label>
                            <Input
                                placeholder={interviewData.mode === 'Online' ? 'https://meet.google.com/...' : 'Office Address Line 1...'}
                                value={interviewData.location}
                                onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Interviewer(s)</label>
                            <Input
                                placeholder="Name of interviewer"
                                value={interviewData.interviewer}
                                onChange={(e) => setInterviewData({ ...interviewData, interviewer: e.target.value })}
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button variant="outline" className="flex-1 gap-2" onClick={copyInviteToClipboard}>
                                <FileText className="h-4 w-4" /> Copy Info
                            </Button>
                            <Button className="flex-[2] bg-blue-600 hover:bg-blue-700" onClick={handleSendInterviewInvite}>
                                <Mail className="w-4 h-4 mr-2" /> Confirm & Send
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default Recruitment;
