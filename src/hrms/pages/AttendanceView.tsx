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
import { Calendar, Search, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AttendanceRecord {
    id: string;
    employee_id: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: string;
    employee?: {
        first_name: string;
        last_name: string;
        employee_code: string;
        department: string;
    };
}

const AttendanceView = () => {
    const { toast } = useToast();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchAttendance();
    }, [dateFilter]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("hrms_attendance")
                .select(`
                    *,
                    employee:hrms_employees(first_name, last_name, employee_code, department)
                `)
                .eq('date', dateFilter)
                .order("check_in", { ascending: false });

            if (error) throw error;
            setAttendance(data || []);
        } catch (error: any) {
            console.error("Error fetching attendance:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = (checkIn: string | null, checkOut: string | null) => {
        if (!checkIn) return "-";
        if (!checkOut) return "In Progress";

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return "-";
        return format(new Date(timestamp), 'hh:mm a');
    };

    const filteredAttendance = attendance.filter(record => {
        const employee = record.employee;
        if (!employee) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
            employee.first_name?.toLowerCase().includes(searchLower) ||
            employee.last_name?.toLowerCase().includes(searchLower) ||
            employee.employee_code?.toLowerCase().includes(searchLower) ||
            employee.department?.toLowerCase().includes(searchLower)
        );
    });

    const stats = {
        total: filteredAttendance.length,
        present: filteredAttendance.filter(a => a.check_in).length,
        absent: filteredAttendance.filter(a => !a.check_in).length,
        inProgress: filteredAttendance.filter(a => a.check_in && !a.check_out).length
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
                <p className="text-muted-foreground">Monitor employee attendance and working hours.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Present</CardTitle>
                        <Clock className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                        <Clock className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle>Attendance Records</CardTitle>
                        <div className="flex gap-4">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search employees..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-48"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Check In</TableHead>
                                    <TableHead>Check Out</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Loading attendance records...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAttendance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No attendance records found for this date.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAttendance.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-mono text-xs">
                                                {record.employee?.employee_code}
                                            </TableCell>
                                            <TableCell>
                                                {record.employee?.first_name} {record.employee?.last_name}
                                            </TableCell>
                                            <TableCell>{record.employee?.department}</TableCell>
                                            <TableCell>{formatTime(record.check_in)}</TableCell>
                                            <TableCell>{formatTime(record.check_out)}</TableCell>
                                            <TableCell>{calculateDuration(record.check_in, record.check_out)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        record.check_in && record.check_out ? 'default' :
                                                            record.check_in ? 'secondary' : 'destructive'
                                                    }
                                                >
                                                    {record.check_in && record.check_out ? 'Completed' :
                                                        record.check_in ? 'In Progress' : 'Absent'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceView;
