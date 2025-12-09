
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Clock, CheckCircle, XCircle, Search, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
    const { signOut } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("leaves");

    // Data States
    const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, pendingLeaves: 0 });
    const [leaves, setLeaves] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit Employee State
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Employees
            const { data: empData } = await supabase.from("profiles").select("*");
            setEmployees(empData || []);

            // 2. Fetch Pending Leaves
            const { data: leaveData } = await supabase
                .from("leave_requests")
                .select(`*, profiles(full_name, email)`)
                .eq("status", "pending");
            setLeaves(leaveData || []);

            // 3. Fetch Today's Attendance
            const today = new Date().toISOString().split("T")[0];
            const { data: attData } = await supabase
                .from("attendance")
                .select(`*, profiles(full_name)`)
                .eq("date", today);
            setAttendance(attData || []);

            // 4. Set Stats
            setStats({
                totalEmployees: empData?.length || 0,
                presentToday: attData?.length || 0,
                pendingLeaves: leaveData?.length || 0
            });

        } catch (error) {
            console.error("Error fetching admin data:", error);
            toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
        }
    };

    const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from("leave_requests")
                .update({ status })
                .eq("id", id);

            if (error) throw error;

            toast({ title: "Success", description: `Leave request ${status}` });
            fetchDashboardData(); // Refresh
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    role: formData.get("role"),
                    department: formData.get("department"),
                    designation: formData.get("designation")
                })
                .eq("id", editingEmployee.id);

            if (error) throw error;

            toast({ title: "Profile Updated", description: "Employee details have been updated." });
            setEditModalOpen(false);
            fetchDashboardData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm("Are you sure? This will delete the employee profile. (You must also delete the Auth user in Supabase)")) return;

        try {
            const { error } = await supabase.from("profiles").delete().eq("id", id);
            if (error) throw error;

            toast({ title: "Deleted", description: "Profile removed." });
            fetchDashboardData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-muted/20 pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-british-blue">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage employees, attendance, and requests.</p>
                    </div>
                    <Button variant="outline" onClick={signOut}>Sign Out</Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">{stats.pendingLeaves}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="employees">Employees</TabsTrigger>
                    </TabsList>

                    {/* LEAVE REQUESTS TAB */}
                    <TabsContent value="leaves">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Leave Requests</CardTitle>
                                <CardDescription>Review and action employee leave applications.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {leaves.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No pending requests.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {leaves.map(leave => (
                                            <div key={leave.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg bg-card">
                                                <div>
                                                    <p className="font-semibold">{leave.profiles?.full_name || "Unknown"} <span className="text-muted-foreground text-sm">({leave.leave_type})</span></p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-sm mt-1">"{leave.reason}"</p>
                                                </div>
                                                <div className="flex gap-2 mt-4 md:mt-0">
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleLeaveAction(leave.id, 'approved')}>
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-red-50" onClick={() => handleLeaveAction(leave.id, 'rejected')}>
                                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ATTENDANCE TAB */}
                    <TabsContent value="attendance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Today's Attendance Log</CardTitle>
                                <CardDescription>{format(new Date(), "MMMM do, yyyy")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {attendance.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No attendance records for today yet.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {attendance.map(att => (
                                            <div key={att.id} className="flex justify-between items-center p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${att.clock_out ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                                                    <span className="font-medium">{att.profiles?.full_name}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    In: {format(new Date(att.clock_in), "hh:mm a")}
                                                    {att.clock_out && ` • Out: ${format(new Date(att.clock_out), "hh:mm a")}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* EMPLOYEES TAB */}
                    <TabsContent value="employees">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle>Employee Directory</CardTitle>
                                    <CardDescription>Manage user roles and profiles.</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search employees..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredEmployees.map(emp => (
                                        <div key={emp.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/10 transition-colors">
                                            <div>
                                                <p className="font-semibold">{emp.full_name || "No Name"}</p>
                                                <p className="text-sm text-muted-foreground">{emp.email}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary">{emp.role}</Badge>
                                                    {emp.department && <Badge variant="outline">{emp.department}</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Dialog open={editModalOpen && editingEmployee?.id === emp.id} onOpenChange={(open) => {
                                                    if (open) setEditingEmployee(emp);
                                                    setEditModalOpen(open);
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Employee</DialogTitle>
                                                        </DialogHeader>
                                                        <form onSubmit={handleUpdateEmployee} className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label>Role</Label>
                                                                <Select name="role" defaultValue={emp.role}>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="employee">Employee</SelectItem>
                                                                        <SelectItem value="admin">Admin</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Department</Label>
                                                                <Input name="department" defaultValue={emp.department} placeholder="e.g. Engineering" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Designation</Label>
                                                                <Input name="designation" defaultValue={emp.designation} placeholder="e.g. Senior Developer" />
                                                            </div>
                                                            <Button type="submit" className="w-full">Save Changes</Button>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEmployee(emp.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminDashboard;
