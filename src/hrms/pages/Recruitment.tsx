import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Application {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    position: string;
    university: string;
    graduation_year: string;
    skills: string;
    motivation: string;
    resume_link: string;
    status: string;
    notes: string | null;
    created_at: string;
}

const Recruitment = () => {
    const { toast } = useToast();
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        filterApplications();
    }, [applications, searchTerm, statusFilter]);

    const fetchApplications = async () => {
        try {
            const { data, error } = await supabase
                .from("internship_applications")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filterApplications = () => {
        let filtered = applications;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(app =>
                app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.position.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        setFilteredApplications(filtered);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("internship_applications")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Status Updated",
                description: `Application status changed to ${newStatus}`,
            });

            fetchApplications();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const saveNotes = async (id: string) => {
        try {
            const { error } = await supabase
                .from("internship_applications")
                .update({ notes })
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Notes Saved",
                description: "Application notes updated successfully",
            });

            fetchApplications();
            setSelectedApp(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const downloadResume = async (filePath: string, applicantName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('resumes')
                .download(filePath);

            if (error) throw error;

            // Create download link
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${applicantName.replace(/\s+/g, '_')}_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Download Started",
                description: "Resume is being downloaded",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to download resume",
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'reviewing': return 'bg-yellow-100 text-yellow-800';
            case 'shortlisted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'hired': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = {
        total: applications.length,
        new: applications.filter(a => a.status === 'new').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    };

    if (loading) {
        return <div className="p-8 text-center">Loading applications...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
                <p className="text-muted-foreground">Manage internship applications and hiring</p>
            </div>

            {/* Stats */}
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
                        <div className="text-2xl font-bold text-yellow-600">{stats.reviewing}</div>
                        <p className="text-xs text-muted-foreground">Under Review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.shortlisted}</div>
                        <p className="text-xs text-muted-foreground">Shortlisted</p>
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
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
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
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                                                <div>📧 {app.email}</div>
                                                <div>📱 {app.phone}</div>
                                                <div>💼 {app.position}</div>
                                                <div>🎓 {app.university} ({app.graduation_year})</div>
                                                <div className="col-span-2 flex gap-4 mt-1">
                                                    {(app as any).linkedin_url && (
                                                        <a href={(app as any).linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                            LinkedIn
                                                        </a>
                                                    )}
                                                    {(app as any).portfolio_url && (
                                                        <a href={(app as any).portfolio_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-1">
                                                            Portfolio
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="col-span-2">📅 Applied: {format(new Date(app.created_at), 'MMM d, yyyy')}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        setSelectedApp(app);
                                                        setNotes(app.notes || "");
                                                    }}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>{app.full_name}'s Application</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Skills & Experience</h4>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{app.skills || 'Not provided'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Motivation</h4>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{app.motivation}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Status</h4>
                                                            <Select value={app.status} onValueChange={(val) => updateStatus(app.id, val)}>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="new">New</SelectItem>
                                                                    <SelectItem value="reviewing">Reviewing</SelectItem>
                                                                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                                    <SelectItem value="hired">Hired</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Notes</h4>
                                                            <Textarea
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                                placeholder="Add review notes..."
                                                                rows={4}
                                                            />
                                                            <Button className="mt-2" onClick={() => saveNotes(app.id)}>
                                                                Save Notes
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadResume(app.resume_link, app.full_name)}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Resume
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Recruitment;
