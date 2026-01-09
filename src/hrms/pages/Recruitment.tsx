import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
    Search, Filter, Download, UserPlus, FileText,
    Linkedin, Globe, Calendar, GraduationCap, Mail, Phone, Rocket
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const Recruitment = () => {
    const { toast } = useToast();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Notes/Status Update State
    const [notes, setNotes] = useState("");
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('internship_applications')
                .select('*, onboarding:hrms_onboarding(id, offer_status, nda_status)')
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

    const handleUpdateStatus = async () => {
        if (!selectedApp || !newStatus) return;

        try {
            const { error } = await supabase
                .from('internship_applications')
                .update({ status: newStatus, notes: notes }) // Assuming notes field exists or we just update status
                .eq('id', selectedApp.id);

            if (error) throw error;

            toast({ title: "Updated", description: "Application status updated successfully" });
            fetchApplications();
            setIsDetailsOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleStartOnboarding = async (appId: string) => {
        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from('hrms_onboarding')
                .select('id')
                .eq('application_id', appId)
                .single();

            if (existing) {
                // Generate Link
                const link = `${window.location.origin}/onboarding/${existing.id}`;
                navigator.clipboard.writeText(link);
                toast({
                    title: "Onboarding Active",
                    description: "Link copied to clipboard! (Share with candidate)"
                });
                return;
            }

            // Create New
            const { data, error } = await supabase
                .from('hrms_onboarding')
                .insert([{
                    application_id: appId,
                    personal_email: selectedApp?.email || "" // Capture verified email
                }])
                .select()
                .single();

            if (error) throw error;

            const link = `${window.location.origin}/onboarding/${data.id}`;
            navigator.clipboard.writeText(link);

            toast({
                title: "Onboarding Started!",
                description: "Onboarding link copied to clipboard. Send it to the candidate."
            });
            fetchApplications();

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch =
            app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.position?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'reviewing': return 'bg-blue-100 text-blue-800';
            case 'shortlisted': return 'bg-purple-100 text-purple-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
                    <p className="text-muted-foreground">Manage internship applications and hiring pipeline.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {applications.filter(a => a.status === 'pending').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {applications.filter(a => a.status === 'shortlisted').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {applications.filter(a => a.status === 'accepted').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search candidates..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="accepted">Accepted / Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Applications Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Applied Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Onboarding</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading applications...</TableCell>
                                </TableRow>
                            ) : filteredApps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No applications found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredApps.map((app) => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="font-medium">{app.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{app.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{app.position}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(app.status)} variant="secondary">
                                                {app.status?.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {app.onboarding && app.onboarding.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="text-[10px] w-fit">
                                                        Offer: {app.onboarding[0].offer_status}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] w-fit">
                                                        NDA: {app.onboarding[0].nda_status}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                setSelectedApp(app);
                                                setNewStatus(app.status);
                                                setNotes(app.notes || "");
                                                setIsDetailsOpen(true);
                                            }}>
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Application Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Candidate Profile</DialogTitle>
                        <DialogDescription>Review application details and update status.</DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedApp.full_name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1"><Mail className="h-4 w-4" /> {selectedApp.email}</div>
                                        <div className="flex items-center gap-1"><Phone className="h-4 w-4" /> {selectedApp.phone}</div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        {selectedApp.linkedin_url && (
                                            <a href={selectedApp.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                                <Linkedin className="h-3 w-3" /> LinkedIn
                                            </a>
                                        )}
                                        {selectedApp.portfolio_url && (
                                            <a href={selectedApp.portfolio_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-sm">
                                                <Globe className="h-3 w-3" /> Portfolio
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className="text-sm px-3 py-1 mb-2">{selectedApp.position}</Badge>
                                    <div className="text-xs text-muted-foreground">
                                        Applied: {new Date(selectedApp.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Education & Skills */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2 mb-2"><GraduationCap className="h-4 w-4" /> Education</h3>
                                    <p className="text-sm font-medium">{selectedApp.university}</p>
                                    <p className="text-xs text-muted-foreground">Class of {selectedApp.graduation_year}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2 mb-2"><Rocket className="h-4 w-4" /> Skills</h3>
                                    <p className="text-sm">{selectedApp.skills || "Not specified"}</p>
                                </div>
                            </div>

                            {/* Motivation */}
                            <div>
                                <h3 className="font-semibold mb-2">Motivation</h3>
                                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg italic">
                                    "{selectedApp.motivation}"
                                </p>
                            </div>

                            {/* Resume */}
                            <div>
                                <h3 className="font-semibold mb-2">Resume</h3>
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        // In real app, generate signed URL
                                        const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/resumes/${selectedApp.resume_link}`;
                                        window.open(url, '_blank');
                                    }}>
                                        <FileText className="mr-2 h-4 w-4" /> View Resume
                                    </Button>
                                </div>
                            </div>

                            {/* Onboarding Actions */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold mb-4">Hiring Actions</h3>
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
                                    <div className="space-y-2 w-full sm:w-auto">
                                        <label className="text-xs font-medium">Update Status</label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="reviewing">Reviewing</SelectItem>
                                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                                <SelectItem value="accepted">Accepted / Hired</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* ONBOARDING BUTTON */}
                                    {(newStatus === 'shortlisted' || newStatus === 'accepted') && (
                                        <Button
                                            variant="secondary"
                                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
                                            onClick={() => handleStartOnboarding(selectedApp.id)}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            {selectedApp.onboarding && selectedApp.onboarding.length > 0
                                                ? "Copy Onboarding Link"
                                                : "Start Onboarding"}
                                        </Button>
                                    )}

                                    <Button onClick={handleUpdateStatus}>Save Changes</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Recruitment;
