
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const AdminRoute = () => {
    const { user, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkAdminRole = async () => {
            if (!user) {
                setIsAdmin(false);
                setCheckingRole(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (error || !data) {
                    console.error("Error verifying admin role:", error);
                    setIsAdmin(false);
                } else {
                    setIsAdmin(data.role === "admin");
                }
            } catch (error) {
                setIsAdmin(false);
            } finally {
                setCheckingRole(false);
            }
        };

        checkAdminRole();
    }, [user]);

    if (loading || checkingRole) {
        return <div className="h-screen flex items-center justify-center">Verifying access...</div>;
    }

    return user && isAdmin ? <Outlet /> : <Navigate to="/portal" />;
};
