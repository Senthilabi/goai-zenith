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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Shield, ShieldAlert, CheckCircle2, Mail } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const EmployeeList = () => {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [authActionLoading, setAuthActionLoading] = useState<string | null>(null);


    // Form states
    const [selectedRole, setSelectedRole] = useState("employee");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedGender, setSelectedGender] = useState("");

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("hrms_employees")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error: any) {
            console.error("Error fetching employees:", error);
            toast({
                title: "Connection Error",
                description: `Details: ${error.message || JSON.stringify(error)} (Code: ${error.code})`,
                variant: "destructive",
                duration: 10000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const employeeData = {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            email: formData.get("email"),
            phone_number: formData.get("phone_number"),
            gender: selectedGender,
            employee_code: formData.get("employee_code"),
            department: formData.get("department"),
            designation: formData.get("designation"),
            joining_date: formData.get("joining_date"),
            hrms_role: selectedRole,
            ...(editingId ? {} : { status: 'active' })
        };

        try {
            if (editingId) {
                const { error } = await supabase
                    .from("hrms_employees")
                    .update(employeeData)
                    .eq("id", editingId);
                if (error) throw error;
                toast({ title: "Updated", description: "Employee details updated successfully" });
            } else {
                const { error } = await supabase
                    .from("hrms_employees")
                    .insert([employeeData]);
                if (error) throw error;
                toast({ title: "Created", description: "Employee added successfully" });
            }

            setIsAddOpen(false);
            setEditingId(null);
            fetchEmployees();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const openEditModal = (employee: any) => {
        setEditingId(employee.id);
        setSelectedRole(employee.hrms_role || "employee");
        setSelectedDepartment(employee.department || "");
        setSelectedGender(employee.gender || "");
        setIsAddOpen(true);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentEmployee = editingId ? employees.find(e => e.id === editingId) : null;

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin': return <Badge variant="destructive">Super Admin</Badge>;
            case 'hr_admin': return <Badge variant="default" className="bg-purple-600">HR Admin</Badge>;
            case 'team_manager': return <Badge variant="default" className="bg-blue-600">Manager</Badge>;
            default: return <Badge variant="secondary">Employee</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">Manage your organization's workforce.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setSelectedRole("employee");
                        setSelectedGender("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={() => {
                            setEditingId(null);
                            setSelectedRole("employee");
                            setSelectedGender("");
                        }}>
                            <UserPlus className="h-4 w-4" /> Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveEmployee} className="space-y-4 pt-4" key={editingId || 'new'}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        defaultValue={currentEmployee?.first_name || ''}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        defaultValue={currentEmployee?.last_name || ''}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={currentEmployee?.email || ''}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <Input
                                        id="phone_number"
                                        name="phone_number"
                                        placeholder="+91..."
                                        defaultValue={currentEmployee?.phone_number || ''}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_code">Emp Code</Label>
                                    <Input
                                        id="employee_code"
                                        name="employee_code"
                                        placeholder="EMP-001"
                                        defaultValue={currentEmployee?.employee_code || ''}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="joining_date">Joining Date</Label>
                                    <Input
                                        id="joining_date"
                                        name="joining_date"
                                        type="date"
                                        defaultValue={currentEmployee?.joining_date || ''}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={selectedGender} onValueChange={setSelectedGender}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        name="department"
                                        placeholder="Engineering"
                                        defaultValue={currentEmployee?.department || ''}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input
                                        id="designation"
                                        name="designation"
                                        placeholder="Developer"
                                        defaultValue={currentEmployee?.designation || ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">System Role</Label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employee (Standard Access)</SelectItem>
                                            <SelectItem value="team_manager">Team Manager (Can view team)</SelectItem>
                                            <SelectItem value="hr_admin">HR Admin (Full HRMS Access)</SelectItem>
                                            <SelectItem value="super_admin">Super Admin (Full System Access)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Determines what data this user can access in the portal.
                            </p>

                            <Button type="submit" className="w-full">
                                {editingId ? "Update Employee" : "Create Employee Record"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Directory</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
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
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role / Dept</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Auth Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Loading employees...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No employees found. Add your first one!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {emp.photo_url && (
                                                        <img
                                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding_docs/${emp.photo_url}`}
                                                            alt={`${emp.first_name} ${emp.last_name}`}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                                                        <div className="text-xs text-muted-foreground">{emp.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {getRoleBadge(emp.hrms_role)}
                                                    <div className="text-xs text-muted-foreground">{emp.department}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{emp.designation}</TableCell>
                                            <TableCell>
                                                {emp.auth_id ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        <span>Linked</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                                        <ShieldAlert className="h-3.5 w-3.5" />
                                                        <span>Not Linked</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {emp.auth_id && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={authActionLoading === emp.id}
                                                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                            onClick={async () => {
                                                                if (!confirm(`Send a password reset link to ${emp.first_name}'s email (${emp.email})?`)) return;
                                                                try {
                                                                    setAuthActionLoading(emp.id);
                                                                    const { error } = await supabase.auth.resetPasswordForEmail(emp.email, {
                                                                        redirectTo: `${window.location.origin}/employee-login?type=recovery`,
                                                                    });

                                                                    if (error) throw error;

                                                                    toast({
                                                                        title: "📧 Reset Link Sent",
                                                                        description: `A password reset instructions have been sent to ${emp.email}.`,
                                                                    });
                                                                } catch (err: any) {
                                                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                                                } finally {
                                                                    setAuthActionLoading(null);
                                                                }
                                                            }}
                                                        >
                                                            {authActionLoading === emp.id ? "Sending..." : "📧 Send Reset Link"}
                                                        </Button>
                                                    )}


                                                    <Button variant="ghost" size="sm" onClick={() => openEditModal(emp)}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={async () => {
                                                            if (!confirm("Are you sure you want to delete this employee?")) return;
                                                            try {
                                                                const { error } = await supabase.from('hrms_employees').delete().eq('id', emp.id);
                                                                if (error) throw error;
                                                                toast({ title: "Deleted", description: "Employee record removed." });
                                                                fetchEmployees();
                                                            } catch (err: any) {
                                                                toast({ title: "Error", description: err.message, variant: "destructive" });
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
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

export default EmployeeList;
