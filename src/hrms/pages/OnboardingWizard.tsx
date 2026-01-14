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

    const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            // Use the full URL if it is a relative path to ensure it loads in all environments
            img.src = url.startsWith('http') ? url : window.location.origin + url;
        });
    };

    const saveDocument = async (docType: string, blob: Blob, fileName: string) => {
        try {
            const filePath = `${application.id}/${Date.now()}_${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('hrms_generated_docs')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

            // Map to database
            const { error: dbError } = await supabase
                .from('hrms_documents')
                .insert({
                    candidate_id: application.id,
                    employee_id: null,
                    doc_type: docType,
                    file_path: filePath
                });

            if (dbError) throw dbError;
            return filePath;
        } catch (error: any) {
            console.error('Error saving document:', error);
            throw error;
        }
    };

    const generateAndStoreSignedNDA = async () => {
        const doc = new jsPDF();

        // Background Letterhead
        try {
            const letterheadBase64 = await loadImageAsBase64("/letterhead.png");
            doc.addImage(letterheadBase64, 'PNG', 0, 0, 210, 297);
        } catch (e) {
            console.error("Letterhead failed to load", e);
            // Fallback branding
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("GOAI TECHNOLOGIES PVT LTD", 105, 25, { align: "center" });
        }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold underline");
        doc.text("NON-DISCLOSURE AGREEMENT (NDA)", 105, 52, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);

        const intro = `This Non-Disclosure Agreement ("Agreement") is entered into between GoAI Technologies Pvt Ltd ("Company") and ${application.full_name} ("Recipient") for the purpose of protecting confidential and proprietary information.`;
        doc.text(doc.splitTextToSize(intro, 170), 20, 75);

        const body = `1. Definition of Confidential Information: Includes technical data, source code, designs, algorithms, business plans, etc.\n2. Obligation of Confidentiality: Recipient agrees not to disclose or use information for unauthorized purposes.\n3. Exclusions: Publicly available or independently developed info.\n4. Term: Effective during engagement and for 2 Years thereafter.\n5. Return of Materials: Return/delete all company materials upon termination.\n6. Intellectual Property: Any work developed is sole property of the Company.\n7. Breach: Result in termination and legal action.\n8. Governing Law: Laws of India.`;
        doc.text(doc.splitTextToSize(body, 170), 20, 95);

        // Digital Acceptance Section
        doc.setFont("helvetica", "bold");
        doc.text("Digital Acceptance & Confirmation", 20, 180);
        doc.setFont("helvetica", "normal");
        doc.text(`"I have read, understood, and agree to the terms... Digital acceptance is legally binding."`, 20, 188, { maxWidth: 170 });

        doc.text(`Recipient Name: ${application.full_name}`, 20, 205);
        doc.text(`Date of Acceptance: ${new Date().toLocaleDateString()}`, 20, 212);
        doc.text(`Digital Fingerprint: ${application.id.substring(0, 12)}...`, 20, 219);

        doc.text("For GoAI Technologies Pvt Ltd", 130, 205);
        doc.setFont("helvetica", "bold");
        doc.text("Authorized Signatory", 130, 220);

        const pdfBlob = doc.output('blob');
        await saveDocument('nda', pdfBlob, 'Signed_NDA.pdf');
    };

    // --- STEP 4: SIGN NDA ---
    const handleSignNDA = async () => {
        setSubmitting(true);
        try {
            // 1. Generate and Store PDF
            await generateAndStoreSignedNDA();

            // 2. Update Status
            const { error } = await supabase
                .from('hrms_onboarding')
                .update({
                    nda_status: 'signed',
                    nda_signed_at: new Date().toISOString(),
                    ip_address: 'client-ip-capture',
                    user_agent: navigator.userAgent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            toast({ title: "NDA Signed & Saved", description: "Onboarding Complete!" });
            setStep(5);
        } catch (error: any) {
            console.error(error);
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
                                <Label>Non-Disclosure Agreement (Official)</Label>
                                <div className="h-72 overflow-y-auto border rounded-md p-6 bg-slate-50 text-[13px] text-slate-700 leading-relaxed font-sans shadow-inner">
                                    <div className="text-center mb-6">
                                        <h3 className="font-bold text-lg text-slate-900">GOAI TECHNOLOGIES PVT LTD</h3>
                                        <p className="text-[11px] text-slate-500">Registered Office: [Company Address Line 1, Line 2]</p>
                                        <p className="text-[11px] text-slate-500">Email: hr@go-aitech.com | Website: www.go-aitech.com</p>
                                        <h4 className="font-bold border-b-2 border-slate-900 inline-block mt-4 pb-1">NON-DISCLOSURE AGREEMENT (NDA)</h4>
                                    </div>

                                    <p className="mb-4 text-right"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>

                                    <p className="mb-4">
                                        This Non-Disclosure Agreement ("Agreement") is entered into between <strong>GoAI Technologies Pvt Ltd</strong> ("Company") and <strong>{application.full_name}</strong> ("Recipient") for the purpose of protecting confidential and proprietary information.
                                    </p>

                                    <ol className="list-decimal pl-5 space-y-3 mb-6">
                                        <li><strong>Definition of Confidential Information:</strong> Confidential Information includes, but is not limited to, technical data, source code, product designs, algorithms, business plans, customer data, financial information, processes, documentation, and any other non-public information disclosed by the Company.</li>
                                        <li><strong>Obligation of Confidentiality:</strong> The Recipient agrees not to disclose, copy, distribute, or use any Confidential Information for any purpose other than authorized company work.</li>
                                        <li><strong>Exclusions:</strong> Confidential Information does not include information that is publicly available, independently developed, or lawfully obtained from a third party without breach of this Agreement.</li>
                                        <li><strong>Term:</strong> This Agreement shall remain in effect during the internship/engagement period and for a period of <strong>2 Years</strong> after termination.</li>
                                        <li><strong>Return of Materials:</strong> Upon completion or termination, the Recipient shall return or delete all confidential materials belonging to the Company.</li>
                                        <li><strong>Intellectual Property:</strong> Any work, invention, code, or material developed during the engagement shall be the sole property of the Company.</li>
                                        <li><strong>Breach:</strong> Any breach of this Agreement may result in immediate termination and legal action as per applicable laws.</li>
                                        <li><strong>Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of India.</li>
                                    </ol>

                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        <h4 className="font-bold mb-4 underline">Digital Acceptance & Confirmation</h4>
                                        <p className="mb-2 italic">"I have read, understood, and agree to the terms of this Non-Disclosure Agreement."</p>
                                        <p className="mb-6 italic">"I acknowledge that digital acceptance is legally binding and equivalent to a physical signature."</p>

                                        <div className="grid grid-cols-2 gap-8 text-[12px]">
                                            <div className="space-y-1">
                                                <p className="font-bold">Recipient Name:</p>
                                                <p className="border-b border-slate-400 pb-1">{application.full_name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold">Date of Acceptance:</p>
                                                <p className="border-b border-slate-400 pb-1">{new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 grid grid-cols-2 gap-8 text-[12px]">
                                            <div className="space-y-4">
                                                <div className="h-10"></div>
                                                <p className="border-t border-slate-400 pt-1 font-bold">Digital Signature / Typed Name</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold">For GoAI Technologies Pvt Ltd</p>
                                                <div className="h-10"></div>
                                                <p className="border-t border-slate-400 pt-1 font-bold">Authorized Signatory</p>
                                                <p className="text-slate-500">Managing Director</p>
                                            </div>
                                        </div>
                                    </div>
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
