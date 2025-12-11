import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Search, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LeaveRequest {
    id: string;
    employee_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    manager_comment: string | null;
    created_at: string;
    employee?: {
        first_name: string;
        last_name: string;
        employee_code: string;
        department: string;
    };
}

const LeaveManager = () => {
    const { toast } = useToast();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
    const [managerComment, setManagerComment] = useState("");

    useEffect(() => {
        fetchLeaveRequests();
    }, [statusFilter]);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from("hrms_leave_requests")
                .select(`
                    *,
                    employee:hrms_employees(first_name, last_name, employee_code, department)
                `)
                .order("created_at", { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLeaveRequests(data || []);
        } catch (error: any) {
            console.error("Error fetching leave requests:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async (leaveId: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from("hrms_leave_requests")
                .update({
                    status: newStatus,
                    manager_comment: managerComment || null
                })
                .eq("id", leaveId);

            if (error) throw error;

            toast({
                title: newStatus === 'approved' ? "Leave Approved" : "Leave Rejected",
                description: `Leave request has been ${newStatus}.`
            });

            setReviewingLeave(null);
            setManagerComment("");
            fetchLeaveRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const calculateDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const filteredRequests = leaveRequests.filter(request => {
        const employee = request.employee;
        if (!employee) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
            employee.first_name?.toLowerCase().includes(searchLower) ||
            employee.last_name?.toLowerCase().includes(searchLower) ||
            employee.employee_code?.toLowerCase().includes(searchLower) ||
            request.leave_type?.toLowerCase().includes(searchLower)
        );
    });

    const stats = {
        total: leaveRequests.length,
        pending: leaveRequests.filter(r => r.status === 'pending').length,
        approved: leaveRequests.filter(r => r.status === 'approved').length,
        rejected: leaveRequests.filter(r => r.status === 'rejected').length
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                <p className="text-muted-foreground">Review and manage employee leave requests.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('all')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('pending')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Calendar className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('approved')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('rejected')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Leave Requests Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle>Leave Requests</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search requests..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Loading leave requests...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No leave requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {request.employee?.first_name} {request.employee?.last_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {request.employee?.employee_code}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{request.leave_type}</TableCell>
                                            <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{calculateDays(request.start_date, request.end_date)} days</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        request.status === 'approved' ? 'default' :
                                                            request.status === 'rejected' ? 'destructive' : 'secondary'
                                                    }
                                                >
                                                    {request.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {request.status === 'pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setReviewingLeave(request);
                                                            setManagerComment(request.manager_comment || "");
                                                        }}
                                                    >
                                                        Review
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={!!reviewingLeave} onOpenChange={(open) => !open && setReviewingLeave(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Leave Request</DialogTitle>
                    </DialogHeader>
                    {reviewingLeave && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold">Employee:</span>
                                    <p>{reviewingLeave.employee?.first_name} {reviewingLeave.employee?.last_name}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Department:</span>
                                    <p>{reviewingLeave.employee?.department}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Leave Type:</span>
                                    <p className="capitalize">{reviewingLeave.leave_type}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Duration:</span>
                                    <p>{calculateDays(reviewingLeave.start_date, reviewingLeave.end_date)} days</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-semibold">Dates:</span>
                                    <p>
                                        {format(new Date(reviewingLeave.start_date), 'MMM dd, yyyy')} - {format(new Date(reviewingLeave.end_date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-semibold">Reason:</span>
                                    <p className="text-muted-foreground">{reviewingLeave.reason}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manager_comment">Manager Comment (Optional)</Label>
                                <Textarea
                                    id="manager_comment"
                                    value={managerComment}
                                    onChange={(e) => setManagerComment(e.target.value)}
                                    placeholder="Add a comment..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    variant="default"
                                    onClick={() => handleApproveReject(reviewingLeave.id, 'approved')}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="destructive"
                                    onClick={() => handleApproveReject(reviewingLeave.id, 'rejected')}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveManager;
