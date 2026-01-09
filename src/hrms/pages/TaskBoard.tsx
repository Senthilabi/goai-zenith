import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog } from "../components/TaskDialog";
import { WorkLogDialog } from "../components/WorkLogDialog";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
type TaskStatus = 'pending' | 'ongoing' | 'completed' | 'reviewed';

interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    assigned_to: string;
    assigned_by: string;
    assignee?: {
        first_name: string;
        last_name: string;
        employee_code: string;
    };
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'pending', title: 'To Do', color: 'bg-slate-100' },
    { id: 'ongoing', title: 'In Progress', color: 'bg-blue-50' },
    { id: 'completed', title: 'Completed', color: 'bg-green-50' },
    { id: 'reviewed', title: 'Reviewed', color: 'bg-purple-50' }
];

const TaskBoard = () => {
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'my_tasks' | 'team_tasks'>('my_tasks');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>('employee');

    // Dialog States
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchUserAndTasks();
    }, [viewMode]);

    const fetchUserAndTasks = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get current employee details
            const { data: emp } = await supabase
                .from('hrms_employees')
                .select('id, hrms_role')
                .eq('auth_id', user.id)
                .single();

            if (emp) {
                setCurrentUser(emp);
                setUserRole(emp.hrms_role || 'employee');
            }

            // Fetch Tasks based on view mode
            let query = supabase
                .from('hrms_tasks')
                .select(`
                    *,
                    assignee:hrms_employees!assigned_to(first_name, last_name, employee_code)
                `)
                .order('created_at', { ascending: false });

            // RLS handles the main security, but we add UI logic
            if (viewMode === 'my_tasks' && emp) {
                query = query.eq('assigned_to', emp.id);
            }
            // For 'team_tasks', RLS will automatically filter to show allowed tasks for managers/admins

            const { data, error } = await query;
            if (error) throw error;

            setTasks(data || []);

        } catch (error: any) {
            console.error("Error fetching tasks:", error);
            toast({
                title: "Error",
                description: "Failed to load tasks.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId !== destination.droppableId) {
            const newStatus = destination.droppableId as TaskStatus;

            // Optimistic Update
            const updatedTasks = tasks.map(t =>
                t.id === draggableId ? { ...t, status: newStatus } : t
            );
            setTasks(updatedTasks);

            try {
                const { error } = await supabase
                    .from('hrms_tasks')
                    .update({ status: newStatus })
                    .eq('id', draggableId);

                if (error) throw error;
            } catch (error: any) {
                // Revert on error
                toast({ title: "Update Failed", description: error.message, variant: "destructive" });
                fetchUserAndTasks();
            }
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-amber-600 bg-amber-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    const canManageTasks = ['super_admin', 'hr_admin', 'team_manager'].includes(userRole);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
                    <p className="text-muted-foreground">Manage ongoing tasks and projects.</p>
                </div>
                {canManageTasks && (
                    <Button onClick={() => {
                        setSelectedTask(null);
                        setIsTaskDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> New Task
                    </Button>
                )}
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="my_tasks">My Tasks</TabsTrigger>
                    {canManageTasks && <TabsTrigger value="team_tasks">Team Tasks</TabsTrigger>}
                </TabsList>
            </Tabs>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[500px]">
                    {COLUMNS.map(column => (
                        <div key={column.id} className={`flex flex-col rounded-lg border bg-slate-50/50`}>
                            <div className={`p-3 font-semibold text-sm border-b ${column.color} rounded-t-lg flex justify-between`}>
                                {column.title}
                                <Badge variant="secondary" className="bg-white/50 text-slate-700">
                                    {tasks.filter(t => t.status === column.id).length}
                                </Badge>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="p-3 space-y-3 flex-1"
                                    >
                                        {tasks
                                            .filter(task => task.status === column.id)
                                            .map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing bg-white"
                                                        >
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority)} hover:bg-opacity-80 border-0`}>
                                                                        {task.priority}
                                                                    </Badge>
                                                                    {task.due_date && (
                                                                        <div className="text-[10px] text-muted-foreground flex items-center">
                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                            {format(new Date(task.due_date), 'MMM d')}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <h4 className="font-medium text-sm leading-tight mb-1">{task.title}</h4>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                                    {task.assignee ? (
                                                                        <div className="flex items-center gap-1.5" title={`${task.assignee.first_name} ${task.assignee.last_name}`}>
                                                                            <Avatar className="h-5 w-5">
                                                                                <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600">
                                                                                    {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                                                                {task.assignee.first_name}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                                                                    )}

                                                                    <div className="flex gap-1">
                                                                        {/* Only show 'Edit' for admins/managers */}
                                                                        {canManageTasks && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6"
                                                                                onClick={() => {
                                                                                    setSelectedTask(task);
                                                                                    setIsTaskDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <div className="sr-only">Edit</div>
                                                                                <span className="text-xs">✎</span>
                                                                            </Button>
                                                                        )}

                                                                        {/* Log Work Button */}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                            onClick={() => {
                                                                                setSelectedTask(task);
                                                                                setIsLogDialogOpen(true);
                                                                            }}
                                                                            title="Log Work"
                                                                        >
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Dialogs */}
            <TaskDialog
                open={isTaskDialogOpen}
                onOpenChange={setIsTaskDialogOpen}
                onTaskSaved={fetchUserAndTasks}
                initialData={selectedTask}
            />

            <WorkLogDialog
                open={isLogDialogOpen}
                onOpenChange={setIsLogDialogOpen}
                task={selectedTask}
                onLogSaved={fetchUserAndTasks}
            />
        </div>
    );
};

export default TaskBoard;
