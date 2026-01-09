import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskSaved: () => void;
    initialData?: any;
}

export function TaskDialog({ open, onOpenChange, onTaskSaved, initialData }: TaskDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    // Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [priority, setPriority] = useState("medium");
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        if (open) {
            fetchEmployees();
            if (initialData) {
                setTitle(initialData.title);
                setDescription(initialData.description || "");
                setAssignedTo(initialData.assigned_to || "");
                setPriority(initialData.priority || "medium");
                setDueDate(initialData.due_date || "");
            } else {
                // Reset form
                setTitle("");
                setDescription("");
                setAssignedTo("");
                setPriority("medium");
                setDueDate("");
            }
        }
    }, [open, initialData]);

    const fetchEmployees = async () => {
        // Fetch employees to assign tasks to
        // If Manager: only fetch their team (RLS could handle this, but let's be safe)
        // For now, simpler to fetch all and let RLS filter if we were strictly using it for dropdowns, 
        // but typically good to filter active ones.
        const { data, error } = await supabase
            .from('hrms_employees')
            .select('id, first_name, last_name, employee_code')
            .eq('status', 'active')
            .order('first_name');

        if (!error && data) {
            setEmployees(data);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const taskData = {
                title,
                description,
                assigned_to: assignedTo,
                priority,
                due_date: dueDate,
                // assigned_by is auto-handled by RLS default or we can set it via auth.uid() if needed, 
                // but usually RLS default policies using `auth.uid()` for `assigned_by` column are trickier.
                // Better to insert it explicitly.
                assigned_by: (await supabase.auth.getUser()).data.user?.id
            };

            const { error } = initialData
                ? await supabase.from('hrms_tasks').update(taskData).eq('id', initialData.id)
                : await supabase.from('hrms_tasks').insert([taskData]);

            if (error) throw error;

            toast({
                title: initialData ? "Task Updated" : "Task Created",
                description: `Task "${title}" has been saved.`
            });

            onTaskSaved();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Task" : "Create New Task"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Complete React Module 1"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignee">Assign To</Label>
                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Intern/Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details about the task..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
