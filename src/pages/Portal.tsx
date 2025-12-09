
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, User, LogOut, CheckCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Profile {
    full_name: string;
    role: string;
    department: string;
    designation: string;
}

interface Attendance {
    id: string;
    clock_in: string;
    clock_out: string | null;
}

interface LeaveRequest {
    id: string;
    start_date: string;
    end_date: string;
    leave_type: string;
    status: string;
}

const Portal = () => {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchTodayAttendance();
            fetchLeaves();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user!.id)
                .single();
            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const { data, error } = await supabase
                .from("attendance")
                .select("*")
                .eq("user_id", user!.id)
                .eq("date", today)
                .single();

            if (error && error.code !== "PGRST116") throw error;
            setAttendance(data);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const { data, error } = await supabase
                .from("leave_requests")
                .select("*")
                .eq("user_id", user!.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setLeaves(data || []);
        } catch (error) {
            console.error("Error fetching leaves:", error);
        }
    }

    const handleClockIn = async () => {
        try {
            const { data, error } = await supabase
                .from("attendance")
                .insert({ user_id: user!.id, date: new Date().toISOString().split("T")[0] })
                .select()
                .single();

            if (error) throw error;
            setAttendance(data);
            toast({ title: "Clocked In!", description: `Time: ${format(new Date(), "hh:mm a")}` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleClockOut = async () => {
        try {
            const { data, error } = await supabase
                .from("attendance")
                .update({ clock_out: new Date().toISOString() })
                .eq("id", attendance!.id)
                .select()
                .single();

            if (error) throw error;
            setAttendance(data);
            toast({ title: "Clocked Out!", description: `Time: ${format(new Date(), "hh:mm a")}` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleLeaveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const { error } = await supabase
                .from("leave_requests")
                .insert({
                    user_id: user!.id,
                    leave_type: formData.get("leave_type"),
                    start_date: formData.get("start_date"),
                    end_date: formData.get("end_date"),
                    reason: formData.get("reason"),
                    status: "pending"
                });

            if (error) throw error;

            toast({ title: "Leave Requested", description: "Your request has been sent for approval." });
            setLeaveModalOpen(false);
            fetchLeaves(); // Refresh list
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Portal...</div>;

    return (
        <div className="min-h-screen bg-muted/20 pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-british-blue">Employee Portal</h1>
                        <p className="text-muted-foreground">Welcome back, {profile?.full_name || user?.email}</p>
                    </div>
                    <Button variant="outline" onClick={signOut} className="text-destructive hover:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Attendance Card */}
                    <Card className="md:col-span-2 shadow-elegant border-british-blue/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" /> Today's Attendance
                            </CardTitle>
                            <CardDescription>{format(new Date(), "EEEE, MMMM do, yyyy")}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            {!attendance ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Clock className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-lg font-medium text-muted-foreground">You haven't clocked in yet.</p>
                                    <Button size="lg" onClick={handleClockIn} className="bg-green-600 hover:bg-green-700 w-48">
                                        Clock In
                                    </Button>
                                </div>
                            ) : attendance.clock_out ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-green-700">Day Completed!</p>
                                        <p className="text-sm text-muted-foreground">
                                            In: {format(new Date(attendance.clock_in), "hh:mm a")} •
                                            Out: {format(new Date(attendance.clock_out), "hh:mm a")}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 animate-pulse rounded-full flex items-center justify-center mx-auto">
                                        <Clock className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-blue-700">Currently Working</p>
                                        <p className="text-sm text-muted-foreground">
                                            Clocked in at {format(new Date(attendance.clock_in), "hh:mm a")}
                                        </p>
                                    </div>
                                    <Button size="lg" onClick={handleClockOut} variant="destructive" className="w-48">
                                        Clock Out
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Profile Quick View */}
                    <Card className="shadow-elegant border-british-blue/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> My Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</span>
                                <p className="font-medium">{profile?.full_name || "N/A"}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</span>
                                <p className="font-medium">{profile?.role || "Employee"}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</span>
                                <p className="font-medium">{profile?.department || "General"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leave Management */}
                    <Card className="md:col-span-3 shadow-elegant border-british-blue/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" /> Leave History
                                </CardTitle>
                                <CardDescription>Manage your time off requests</CardDescription>
                            </div>
                            <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" /> Apply for Leave
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Apply for Leave</DialogTitle>
                                        <DialogDescription>Submit a new leave request for approval.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="start_date">Start Date</Label>
                                                <Input id="start_date" name="start_date" type="date" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="end_date">End Date</Label>
                                                <Input id="end_date" name="end_date" type="date" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="leave_type">Leave Type</Label>
                                            <Select name="leave_type" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="casual">Casual Leave</SelectItem>
                                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                                    <SelectItem value="earned">Earned Leave</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Reason</Label>
                                            <Textarea id="reason" name="reason" placeholder="Brief reason for leave..." required />
                                        </div>
                                        <Button type="submit" className="w-full">Submit Request</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {leaves.length > 0 ? (
                                <div className="space-y-4">
                                    {leaves.map((leave) => (
                                        <div key={leave.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                                            <div>
                                                <div className="font-medium capitalize">{leave.leave_type} Leave</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {format(new Date(leave.start_date), "MMM d, yyyy")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                            <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {leave.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No leave history found.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Portal;
