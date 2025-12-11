import { useEffect, useState } from "react";
import ClockInOut from "../components/ClockInOut";
import LeaveRequestWidget from "../components/LeaveRequestWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        onLeaveToday: 0
    });

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

            // Fetch stats only for HR admins
            if (employee && (employee.hrms_role === 'super_admin' || employee.hrms_role === 'hr_admin')) {
                await fetchStats();
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        }
    };

    const fetchStats = async () => {
        try {
            // Total employees
            const { count: totalEmployees } = await supabase
                .from('hrms_employees')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Present today
            const today = new Date().toISOString().split('T')[0];
            const { count: presentToday } = await supabase
                .from('hrms_attendance')
                .select('*', { count: 'exact', head: true })
                .eq('date', today);

            // On leave today
            const { count: onLeaveToday } = await supabase
                .from('hrms_leave_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved')
                .lte('start_date', today)
                .gte('end_date', today);

            setStats({
                totalEmployees: totalEmployees || 0,
                presentToday: presentToday || 0,
                onLeaveToday: onLeaveToday || 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const isAdmin = currentEmployee && (currentEmployee.hrms_role === 'super_admin' || currentEmployee.hrms_role === 'hr_admin');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h1>
                <p className="text-muted-foreground">Welcome to your HR Management System.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Clock In/Out Widget */}
                <ClockInOut />

                {/* Leave Request Widget */}
                <LeaveRequestWidget />

                {/* Quick Stats - Only for HR Admins */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Employees:</span>
                                <span className="font-medium">{stats.totalEmployees}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Present Today:</span>
                                <span className="font-medium text-green-600">{stats.presentToday}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">On Leave:</span>
                                <span className="font-medium text-blue-600">{stats.onLeaveToday}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
