import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface WorkLogDialogProps {
    task: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLogSaved: () => void;
}

export function WorkLogDialog({ task, open, onOpenChange, onLogSaved }: WorkLogDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [hours, setHours] = useState("");
    const [summary, setSummary] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get current user's employee ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: emp, error: empError } = await supabase
                .from('hrms_employees')
                .select('id')
                .eq('auth_id', user.id)
                .single();

            if (empError || !emp) throw new Error("Employee record not found");

            const { error } = await supabase.from('hrms_work_logs').insert([{
                task_id: task.id,
                employee_id: emp.id,
                hours_spent: parseFloat(hours),
                summary: summary,
                log_date: new Date().toISOString().split('T')[0] // Today
            }]);

            if (error) throw error;

            // Optionally update task status to "ongoing" if it was "pending"
            if (task.status === 'pending') {
                await supabase.from('hrms_tasks').update({ status: 'ongoing' }).eq('id', task.id);
            }

            toast({
                title: "Work Logged",
                description: "Your daily report has been saved."
            });

            // Reset form
            setHours("");
            setSummary("");

            onLogSaved();
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Work for: {task?.title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="hours">Hours Spent</Label>
                        <Input
                            id="hours"
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            placeholder="e.g. 2.5"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">Work Summary</Label>
                        <Textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="What did you accomplish today?"
                            rows={4}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Submit Log"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
