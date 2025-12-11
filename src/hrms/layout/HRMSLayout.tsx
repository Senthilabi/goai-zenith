import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    Users,
    Calendar,
    Clock,
    LayoutDashboard,
    Briefcase,
    Menu,
    X,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const HRMSLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { signOut } = useAuth();

    const isActive = (path: string) => location.pathname.startsWith(path);

    const navItems = [
        { name: "Dashboard", path: "/hrms/dashboard", icon: LayoutDashboard },
        { name: "Employees", path: "/hrms/employees", icon: Users },
        { name: "Attendance", path: "/hrms/attendance", icon: Clock },
        { name: "Leave Mgmt", path: "/hrms/leaves", icon: Calendar },
        { name: "Recruitment", path: "/hrms/recruitment", icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20`}
            >
                <div className="p-4 flex items-center justify-between border-b border-slate-700">
                    {isSidebarOpen && <span className="font-bold text-xl tracking-wider">Zenith HRMS</span>}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive(item.path)
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {isSidebarOpen && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <Button
                        variant="ghost"
                        className={`w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 ${!isSidebarOpen && "px-0"}`}
                        onClick={signOut}
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {isSidebarOpen && <span className="ml-2">Sign Out</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 p-8 ${isSidebarOpen ? "ml-64" : "ml-20"
                    }`}
            >
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default HRMSLayout;
