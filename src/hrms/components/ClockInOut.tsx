import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TodayAttendance {
    id: string;
    check_in: string | null;
    check_out: string | null;
    date: string;
}

const ClockInOut = () => {
    const { toast } = useToast();
    const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);

    useEffect(() => {
        fetchCurrentEmployee();
    }, []);

    const fetchCurrentEmployee = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log("No authenticated user found");
                return;
            }

            console.log("Fetching employee for user:", user.id);

            const { data: employee, error } = await supabase
                .from('hrms_employees')
                .select('*')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (error) {
                console.error("Error fetching employee:", error);
                toast({
                    title: "Database Error",
                    description: error.message,
                    variant: "destructive"
                });
                return;
            }

            if (!employee) {
                console.log("No employee record found for user:", user.id);
                toast({
                    title: "Employee Profile Not Found",
                    description: "Please contact HR to set up your employee profile.",
                    variant: "destructive"
                });
                return;
            }

            console.log("Employee found:", employee);
            setCurrentEmployee(employee);
            if (employee) {
                await fetchTodayAttendance(employee.id);
            }
        } catch (error: any) {
            console.error("Error in fetchCurrentEmployee:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayAttendance = async (employeeId: string) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data } = await supabase
                .from('hrms_attendance')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('date', today)
                .maybeSingle();

            setTodayAttendance(data);
        } catch (error) {
            console.error("Error fetching today's attendance:", error);
        }
    };

    const handleClockIn = async () => {
        if (!currentEmployee) {
            toast({
                title: "Error",
                description: "Employee profile not found",
                variant: "destructive"
            });
            return;
        }

        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('hrms_attendance')
                .insert([{
                    employee_id: currentEmployee.id,
                    date: today,
                    check_in: new Date().toISOString(),
                    status: 'present'
                }])
                .select()
                .single();

            if (error) throw error;

            setTodayAttendance(data);
            toast({
                title: "Clocked In",
                description: `Welcome! You clocked in at ${format(new Date(), 'hh:mm a')}`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleClockOut = async () => {
        if (!todayAttendance) return;

        try {
            const { error } = await supabase
                .from('hrms_attendance')
                .update({ check_out: new Date().toISOString() })
                .eq('id', todayAttendance.id);

            if (error) throw error;

            await fetchTodayAttendance(currentEmployee.id);
            toast({
                title: "Clocked Out",
                description: `See you tomorrow! You clocked out at ${format(new Date(), 'hh:mm a')}`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const calculateDuration = () => {
        if (!todayAttendance?.check_in) return "Not clocked in";

        const start = new Date(todayAttendance.check_in);
        const end = todayAttendance.check_out ? new Date(todayAttendance.check_out) : new Date();
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Attendance
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
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Attendance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {todayAttendance ? (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Clock In:</span>
                                <span className="font-medium">
                                    {todayAttendance.check_in ? format(new Date(todayAttendance.check_in), 'hh:mm a') : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Clock Out:</span>
                                <span className="font-medium">
                                    {todayAttendance.check_out ? format(new Date(todayAttendance.check_out), 'hh:mm a') : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="font-medium">{calculateDuration()}</span>
                            </div>
                        </div>

                        {!todayAttendance.check_out && (
                            <Button
                                onClick={handleClockOut}
                                className="w-full"
                                variant="destructive"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Clock Out
                            </Button>
                        )}

                        {todayAttendance.check_out && (
                            <div className="text-center text-sm text-muted-foreground">
                                You have completed your attendance for today.
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            You haven't clocked in today yet.
                        </p>
                        <Button onClick={handleClockIn} className="w-full">
                            <LogIn className="h-4 w-4 mr-2" />
                            Clock In
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ClockInOut;
