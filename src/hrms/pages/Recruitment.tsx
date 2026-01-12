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
    ShieldAlert, CheckCircle2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

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
                .select('*, onboarding:hrms_onboarding(id, offer_status, nda_status, photo_url, personal_email)')
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
                title: "Email Failed [v2.1]",
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
                toast({
                    title: "Candidate Approved!",
                    description: `Approval email sent to ${email}. You can now start onboarding.`,
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
            navigator.clipboard.writeText(link);
            toast({ title: "Link Copied", description: "Onboarding link copied to clipboard." });
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

            // 3. Show Success + Credentials (Simulated Email)
            toast({
                title: "✅ Employee Created & Credentials Sent!",
                description: `Sent to: ${app.email}\n\nLogin ID: ${systemLoginId}\nPassword: ${tempPassword}\n\nThey can now log in to the HRMS portal.`,
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
                                                    }}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
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
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center py-4">
                                                                            <p className="text-xs text-muted-foreground mb-2">Candidate is ready for onboarding?</p>
                                                                            <Button
                                                                                size="sm"
                                                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                                                                disabled={!['shortlisted', 'accepted'].includes(newStatus)}
                                                                                onClick={() => handleStartOnboarding(selectedApp.id, selectedApp.email)}
                                                                            >
                                                                                Start Onboarding
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>

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

                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-md text-[11px] text-amber-800 flex gap-2">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <div>
                                <strong>Tester Note:</strong> Resend Sandbox only sends to your registered email. If sending fails, use "Copy Info" to send manually.
                            </div>
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
        </div>
    );
};

export default Recruitment;
