import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks
} from "date-fns";

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
    };
}

const AttendanceCalendar = () => {
    const { toast } = useToast();
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewFilter, setViewFilter] = useState<'self' | 'team' | 'all'>('self');
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    useEffect(() => {
        fetchCurrentEmployee();
    }, []);

    useEffect(() => {
        if (currentEmployee) {
            fetchAttendance();
        }
    }, [currentEmployee, currentDate, viewMode, viewFilter]);

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

            // Set default view filter based on role
            if (employee) {
                if (employee.hrms_role === 'employee') {
                    setViewFilter('self');
                } else if (employee.hrms_role === 'team_manager') {
                    setViewFilter('team');
                } else {
                    setViewFilter('all');
                }
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);

            const startDate = viewMode === 'month'
                ? startOfMonth(currentDate)
                : startOfWeek(currentDate);
            const endDate = viewMode === 'month'
                ? endOfMonth(currentDate)
                : endOfWeek(currentDate);

            let query = supabase
                .from('hrms_attendance')
                .select(`
                    *,
                    employee:hrms_employees(first_name, last_name, employee_code, department)
                `)
                .gte('date', format(startDate, 'yyyy-MM-dd'))
                .lte('date', format(endDate, 'yyyy-MM-dd'));

            // Apply filters based on view
            if (viewFilter === 'self') {
                query = query.eq('employee_id', currentEmployee.id);
            } else if (viewFilter === 'team' && currentEmployee.department) {
                // Get team members from same department
                const { data: teamMembers } = await supabase
                    .from('hrms_employees')
                    .select('id')
                    .eq('department', currentEmployee.department);

                if (teamMembers) {
                    const teamIds = teamMembers.map(m => m.id);
                    query = query.in('employee_id', teamIds);
                }
            }
            // 'all' filter - no additional filtering needed

            const { data, error } = await query;

            if (error) throw error;
            setAttendanceData(data || []);
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

    const getAttendanceForDate = (date: Date) => {
        return attendanceData.filter(record =>
            isSameDay(new Date(record.date), date)
        );
    };

    const getDayStatus = (date: Date) => {
        const records = getAttendanceForDate(date);
        if (records.length === 0) return 'absent';

        const hasCheckOut = records.some(r => r.check_out);
        const hasCheckIn = records.some(r => r.check_in);

        if (hasCheckIn && hasCheckOut) return 'present';
        if (hasCheckIn && !hasCheckOut) return 'partial';
        return 'absent';
    };

    const getDayColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-100 border-green-500 text-green-900';
            case 'partial': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
            case 'absent': return 'bg-red-50 border-red-200 text-red-600';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        if (viewMode === 'month') {
            setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        } else {
            setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        }
    };

    const renderCalendar = () => {
        const startDate = viewMode === 'month'
            ? startOfMonth(currentDate)
            : startOfWeek(currentDate);
        const endDate = viewMode === 'month'
            ? endOfMonth(currentDate)
            : endOfWeek(currentDate);

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map(day => {
                    const status = getDayStatus(day);
                    const records = getAttendanceForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDay(day)}
                            className={`
                                min-h-[80px] p-2 border-2 rounded-lg transition-all
                                ${getDayColor(status)}
                                ${!isCurrentMonth && 'opacity-30'}
                                ${isSameDay(day, new Date()) && 'ring-2 ring-blue-500'}
                                hover:shadow-md
                            `}
                        >
                            <div className="text-sm font-semibold">{format(day, 'd')}</div>
                            {records.length > 0 && (
                                <div className="mt-1 text-xs">
                                    {viewFilter !== 'self' && (
                                        <div className="font-medium">{records.length} emp</div>
                                    )}
                                    {viewFilter === 'self' && records[0]?.check_in && (
                                        <div>{format(new Date(records[0].check_in), 'HH:mm')}</div>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderDayDetails = () => {
        if (!selectedDay) return null;

        const records = getAttendanceForDate(selectedDay);

        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {records.length === 0 ? (
                        <p className="text-muted-foreground">No attendance records for this day.</p>
                    ) : (
                        <div className="space-y-3">
                            {records.map(record => (
                                <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        {viewFilter !== 'self' && (
                                            <div className="font-medium">
                                                {record.employee?.first_name} {record.employee?.last_name}
                                            </div>
                                        )}
                                        <div className="text-sm text-muted-foreground">
                                            In: {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '-'}
                                            {' • '}
                                            Out: {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '-'}
                                        </div>
                                    </div>
                                    <Badge variant={record.check_out ? 'default' : 'secondary'}>
                                        {record.check_out ? 'Complete' : 'In Progress'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const canViewTeam = currentEmployee?.hrms_role === 'team_manager' || currentEmployee?.hrms_role === 'hr_admin' || currentEmployee?.hrms_role === 'super_admin';
    const canViewAll = currentEmployee?.hrms_role === 'hr_admin' || currentEmployee?.hrms_role === 'super_admin';

    if (loading) {
        return <div className="p-8 text-center">Loading attendance...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Calendar</h1>
                <p className="text-muted-foreground">View attendance records in calendar format.</p>
            </div>

            {/* View Filter Tabs */}
            {(canViewTeam || canViewAll) && (
                <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as any)}>
                    <TabsList>
                        <TabsTrigger value="self">
                            <User className="h-4 w-4 mr-2" />
                            Self
                        </TabsTrigger>
                        {canViewTeam && (
                            <TabsTrigger value="team">
                                <Users className="h-4 w-4 mr-2" />
                                My Team
                            </TabsTrigger>
                        )}
                        {canViewAll && (
                            <TabsTrigger value="all">
                                <Users className="h-4 w-4 mr-2" />
                                All Employees
                            </TabsTrigger>
                        )}
                    </TabsList>
                </Tabs>
            )}

            {/* Calendar Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <CardTitle className="text-xl">
                                {viewMode === 'month'
                                    ? format(currentDate, 'MMMM yyyy')
                                    : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
                                }
                            </CardTitle>
                            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'month' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                            >
                                Month
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('week')}
                            >
                                Week
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderCalendar()}
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex gap-4 items-center justify-center text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Partial (No Clock Out)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Absent</span>
                </div>
            </div>

            {/* Day Details */}
            {renderDayDetails()}
        </div>
    );
};

export default AttendanceCalendar;
