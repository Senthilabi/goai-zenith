import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, Briefcase, Calendar, MapPin, Link as LinkIcon, Camera, Save, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("hrms_employees")
                .select("*")
                .eq("auth_id", user?.id)
                .single();

            if (error) throw error;
            setEmployee(data);
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!employee) return;

        try {
            setSaving(true);
            const formData = new FormData(e.currentTarget);

            const updates = {
                phone_number: formData.get("phone_number"),
                emergency_contact_name: formData.get("emergency_contact_name"),
                emergency_contact_phone: formData.get("emergency_contact_phone"),
                linkedin_url: formData.get("linkedin_url"),
                residential_address: formData.get("residential_address"),
            };

            const { error } = await supabase
                .from("hrms_employees")
                .update(updates)
                .eq("id", employee.id);

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your personal details have been saved successfully.",
            });
            fetchProfile();
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !employee) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `avatars/${employee.employee_code}_${Math.random()}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('onboarding_docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Update employee record
            const { error: updateError } = await supabase
                .from('hrms_employees')
                .update({ photo_url: filePath })
                .eq('id', employee.id);

            if (updateError) throw updateError;

            toast({
                title: "Photo Updated",
                description: "Your profile picture has been updated.",
            });
            fetchProfile();
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64">Loading profile...</div>;

    if (!employee) return (
        <div className="p-8 text-center border-2 border-dashed rounded-xl">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Profile Not Found</h2>
            <p className="text-muted-foreground">Your HRMS account is not properly linked. Please contact Admin.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                        {employee.photo_url ? (
                            <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding_docs/${employee.photo_url}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-16 h-16 text-slate-300" />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-lg transition-transform group-hover:scale-110">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="flex-1 space-y-2">
                    <h1 className="text-3xl font-bold">{employee.first_name} {employee.last_name}</h1>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 border-0">
                            {employee.employee_code}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 text-sm">{employee.designation}</Badge>
                        <Badge variant="outline" className="px-3 py-1 text-sm">{employee.department}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Fixed Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Employment Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Work Email</p>
                                    <p className="font-medium">{employee.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Joining Date</p>
                                    <p className="font-medium">{new Date(employee.joining_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Gender</p>
                                    <p className="font-medium">{employee.gender || 'Not Specified'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardContent className="pt-6">
                            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">Help & Safety</p>
                            <p className="text-xs text-blue-600 leading-relaxed italic">
                                Fixed fields like Gender and DOJ are managed by HR. If any info is incorrect, please reach out to hello@go-aitech.com.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Editable Info */}
                <div className="md:col-span-2">
                    <form onSubmit={handleUpdateProfile}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Personal Details</CardTitle>
                                <CardDescription>Update your contact and emergency information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone_number">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="phone_number" name="phone_number" className="pl-10" defaultValue={employee.phone_number} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="linkedin_url" name="linkedin_url" className="pl-10" placeholder="https://linkedin.com/in/..." defaultValue={employee.linkedin_url} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm border-b pb-2">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_name">Contact Name</Label>
                                            <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={employee.emergency_contact_name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                                            <Input id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={employee.emergency_contact_phone} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="residential_address">Residential Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Textarea id="residential_address" name="residential_address" className="pl-10 min-h-[100px]" defaultValue={employee.residential_address} />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="gap-2 px-8" disabled={saving}>
                                        {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
