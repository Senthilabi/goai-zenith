import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LeaveRequest {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    manager_comment: string | null;
    created_at: string;
}

const LeaveRequestWidget = () => {
    const { toast } = useToast();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);

    useEffect(() => {
        fetchCurrentEmployee();
    }, []);

    const fetchCurrentEmployee = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: employee } = await supabase
                .from('hrms_employees')
                .select('*')
                .eq('auth_id', user.id)
                .maybeSingle();

            setCurrentEmployee(employee);
            if (employee) {
                await fetchLeaveRequests(employee.id);
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveRequests = async (employeeId: string) => {
        try {
            const { data, error } = await supabase
                .from('hrms_leave_requests')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setLeaveRequests(data || []);
        } catch (error: any) {
            console.error("Error fetching leave requests:", error);
        }
    };

    const handleSubmitLeave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentEmployee) {
            toast({
                title: "Error",
                description: "Employee profile not found",
                variant: "destructive"
            });
            return;
        }

        const formData = new FormData(e.currentTarget);

        try {
            const { error } = await supabase
                .from('hrms_leave_requests')
                .insert([{
                    employee_id: currentEmployee.id,
                    leave_type: formData.get('leave_type'),
                    start_date: formData.get('start_date'),
                    end_date: formData.get('end_date'),
                    reason: formData.get('reason'),
                    status: 'pending'
                }]);

            if (error) throw error;

            toast({
                title: "Leave Request Submitted",
                description: "Your leave request has been sent for approval."
            });

            setIsDialogOpen(false);
            fetchLeaveRequests(currentEmployee.id);
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

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Leave Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        My Leave Requests
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Apply
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Apply for Leave</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmitLeave} className="space-y-4">
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
                                            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                        id="reason"
                                        name="reason"
                                        placeholder="Brief reason for leave..."
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">Submit Request</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {leaveRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No leave requests yet. Click "Apply" to request leave.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {leaveRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium capitalize text-sm">{request.leave_type}</span>
                                        <Badge
                                            variant={
                                                request.status === 'approved' ? 'default' :
                                                    request.status === 'rejected' ? 'destructive' : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {request.status}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                                        {' • '}
                                        {calculateDays(request.start_date, request.end_date)} days
                                    </div>
                                    {request.manager_comment && (
                                        <div className="text-xs text-muted-foreground mt-1 italic">
                                            "{request.manager_comment}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LeaveRequestWidget;
