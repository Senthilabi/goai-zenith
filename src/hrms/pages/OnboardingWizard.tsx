import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, FileText, PenTool, Home } from "lucide-react";
import jsPDF from "jspdf";

const OnboardingWizard = () => {
    const { id } = useParams(); // onboarding_id
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Details, 2: Docs, 3: Offer, 4: NDA, 5: Done
    const [data, setData] = useState<any>(null);
    const [application, setApplication] = useState<any>(null);

    // Form States
    const [address, setAddress] = useState("");
    const [agreedToOffer, setAgreedToOffer] = useState(false);
    const [agreedToNDA, setAgreedToNDA] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // File States
    const [photo, setPhoto] = useState<File | null>(null);
    const [idProof, setIdProof] = useState<File | null>(null);
    const [certificates, setCertificates] = useState<File | null>(null);

    useEffect(() => {
        if (id) fetchOnboardingData();
    }, [id]);

    const fetchOnboardingData = async () => {
        try {
            // Fetch Onboarding Record
            const { data: obData, error: obError } = await supabase
                .from('hrms_onboarding')
                .select('*')
                .eq('id', id)
                .single();

            if (obError) throw obError;
            setData(obData);
            setAddress(obData.residential_address || "");

            // Fetch Application Details (for Name, Position etc.)
            const { data: appData, error: appError } = await supabase
                .from('internship_applications')
                .select('*')
                .eq('id', obData.application_id)
                .single();

            if (appError) throw appError;
            setApplication(appData);

            // Determine Step
            if (obData.nda_status === 'signed') setStep(5);
            else if (obData.offer_status === 'accepted') setStep(4);
            else if (obData.photo_url && obData.id_proof_url) setStep(3); // Docs done
            else if (obData.residential_address) setStep(2);
            else setStep(1);

        } catch (error) {
            console.error("Error loading onboarding:", error);
            toast({ title: "Error", description: "Invalid or expired onboarding link.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 1: SAVE ADDRESS ---
    const handleSaveAddress = async () => {
        if (!address.trim()) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('hrms_onboarding')
                .update({
                    residential_address: address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            setStep(2);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    // --- STEP 2: UPLOAD DOCS ---
    const handleUploadDocs = async () => {
        if (!photo || !idProof) {
            toast({ title: "Missing Files", description: "Please upload at least Photo and ID Proof.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const uploadFile = async (file: File, prefix: string) => {
                const ext = file.name.split('.').pop();
                const path = `${id}/${prefix}_${Date.now()}.${ext}`;
                const { error } = await supabase.storage.from('onboarding_docs').upload(path, file);
                if (error) throw error;
                return path;
            };

            const photoUrl = await uploadFile(photo, 'photo');
            const idProofUrl = await uploadFile(idProof, 'id_proof');
            const certUrl = certificates ? await uploadFile(certificates, 'certs') : null;

            const { error } = await supabase
                .from('hrms_onboarding')
                .update({
                    photo_url: photoUrl,
                    id_proof_url: idProofUrl,
                    certificates_url: certUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Documents Uploaded", description: "Proceeding to Offer Letter." });
            setStep(3);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    // --- STEP 3: GENERATE & ACCEPT OFFER ---
    const generateOfferLetter = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text("GoAi Technologies", 105, 20, { align: "center" });

        doc.setFontSize(16);
        doc.text("Internship Offer Letter", 105, 30, { align: "center" });

        // Content
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);

        doc.text(`Dear ${application.full_name},`, 20, 65);

        const body = `We are pleased to offer you the position of ${application.position} Intern at GoAi Technologies. This is an exciting opportunity to work on cutting-edge AI and retail solutions.

Your internship will commence effectively from today.

Terms:
1. Duration: 6 Months
2. Location: Remote / Office (Hybrid)
3. Stipend: Performance Based

We look forward to welcoming you to the team.`;

        const splitText = doc.splitTextToSize(body, 170);
        doc.text(splitText, 20, 80);

        doc.text("Sincerely,", 20, 150);
        doc.text("HR Department", 20, 160);
        doc.text("GoAi Technologies", 20, 165);

        // Open in new tab
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleAcceptOffer = async () => {
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('hrms_onboarding')
                .update({
                    offer_status: 'accepted',
                    offer_accepted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Offer Accepted!", description: "Welcome aboard!" });
            setStep(4);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    // --- STEP 4: SIGN NDA ---
    const handleSignNDA = async () => {
        setSubmitting(true);
        try {
            // Get IP (Simulated/Best Effort)
            // In a real edge function we'd get the header, client-side we can just store user agent
            const { error } = await supabase
                .from('hrms_onboarding')
                .update({
                    nda_status: 'signed',
                    nda_signed_at: new Date().toISOString(),
                    ip_address: 'client-ip-placeholder',
                    user_agent: navigator.userAgent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            toast({ title: "NDA Signed", description: "Onboarding Complete!" });
            setStep(5);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (!data) return <div className="h-screen flex items-center justify-center text-red-500">Invalid Link</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center border-b bg-white rounded-t-xl">
                    <CardTitle className="text-2xl font-bold text-slate-900">
                        {step === 5 ? "Welcome to GoAi!" : "Candidate Onboarding"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Step 1/4: Confirm Details"}
                        {step === 2 && "Step 2/4: Document Verification"}
                        {step === 3 && "Step 3/4: Offer Letter"}
                        {step === 4 && "Step 4/4: Non-Disclosure Agreement"}
                        {step === 5 && "Setup Complete"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">

                    {/* STEP 1: ADDRESS */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
                                <p><strong>Hello {application.full_name},</strong></p>
                                <p>Congratulations! We are excited to proceed with your internship application. Please confirm your current residential address for our records.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Residential Address *</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter your full address..."
                                />
                            </div>
                            <Button onClick={handleSaveAddress} disabled={!address.trim() || submitting} className="w-full">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Content & Proceed
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: DOCUMENTS */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-4">
                                <p>Please upload the following documents for identity verification.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Passport Size Photo *</Label>
                                    <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Govt ID Proof (Aadhaar/PAN/Passport) *</Label>
                                    <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setIdProof(e.target.files?.[0] || null)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Certificates (Optional - Combined PDF)</Label>
                                    <Input type="file" accept=".pdf" onChange={(e) => setCertificates(e.target.files?.[0] || null)} />
                                </div>
                            </div>

                            <Button onClick={handleUploadDocs} disabled={!photo || !idProof || submitting} className="w-full">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload & Continue
                            </Button>
                        </div>
                    )}

                    {/* STEP 3: OFFER LETTER */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center space-y-4">
                                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold">Your Offer Letter is Ready</h3>
                                <p className="text-muted-foreground text-sm">Please review the details of your internship offer.</p>

                                <Button variant="outline" onClick={generateOfferLetter} className="w-full sm:w-auto">
                                    <FileText className="mr-2 h-4 w-4" /> Download/View Offer PDF
                                </Button>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <div className="flex items-start space-x-2">
                                    <Checkbox id="offer-agree" checked={agreedToOffer} onCheckedChange={(c) => setAgreedToOffer(c as boolean)} />
                                    <Label htmlFor="offer-agree" className="text-sm leading-none font-normal">
                                        I accept the terms and conditions outlined in the Offer Letter.
                                    </Label>
                                </div>
                                <Button onClick={handleAcceptOffer} disabled={!agreedToOffer || submitting} className="w-full">
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Accept Offer
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: NDA */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="space-y-4">
                                <Label>Non-Disclosure Agreement (Standard)</Label>
                                <div className="h-48 overflow-y-auto border rounded-md p-4 bg-slate-50 text-xs text-slate-600 leading-relaxed font-mono">
                                    <p className="mb-2"><strong>CONFIDENTIALITY AGREEMENT</strong></p>
                                    <p>This Agreement is made between GoAi Technologies ("Company") and {application.full_name} ("Intern").</p>
                                    <p>1. <strong>Confidential Information</strong>: The Intern agrees not to disclose any proprietary information, code, or trade secrets belonging to the Company.</p>
                                    <p>2. <strong>Intellectual Property</strong>: All work created during the internship is the sole property of the Company.</p>
                                    <p>3. <strong>Term</strong>: This agreement is effective from the start date of the internship and continues indefinitely regarding confidential information.</p>
                                    <p className="mt-4">[... Full Legal Text Placeholder ...]</p>
                                </div>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <div className="flex items-start space-x-2">
                                    <Checkbox id="nda-agree" checked={agreedToNDA} onCheckedChange={(c) => setAgreedToNDA(c as boolean)} />
                                    <Label htmlFor="nda-agree" className="text-sm leading-none font-normal">
                                        I have read and agree to the Non-Disclosure Agreement. I understand this serves as my digital signature.
                                    </Label>
                                </div>
                                <Button onClick={handleSignNDA} disabled={!agreedToNDA || submitting} className="w-full">
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign NDA & Complete
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {step === 5 && (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">You're All Set!</h3>
                                <p className="text-muted-foreground mt-2">
                                    Your onboarding documents have been submitted securely.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-lg text-left text-sm space-y-3">
                                <h4 className="font-semibold">Next Steps:</h4>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                    <li>HR will verify your documents.</li>
                                    <li>You will receive your <strong>Employee ID</strong> and <strong>Portal Access</strong> via email shortly.</li>
                                    <li>Keep an eye on your inbox: <strong>{data.personal_email}</strong></li>
                                </ul>
                            </div>
                            <Button variant="outline" onClick={() => navigate('/')}>
                                Return to Home
                            </Button>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="bg-slate-50 rounded-b-xl text-xs text-center text-slate-400 justify-center py-4">
                    GoAi Technologies HRMS • Secure Onboarding Portal
                </CardFooter>
            </Card>
        </div>
    );
};

export default OnboardingWizard;
