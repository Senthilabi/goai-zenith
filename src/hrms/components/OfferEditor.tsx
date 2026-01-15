import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, FileText, Send, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

interface OfferEditorProps {
    application: any;
    onUpdate: () => void; // Callback to refresh parent data
}

export const OfferEditor = ({ application, onUpdate }: OfferEditorProps) => {
    const { toast } = useToast();
    const [isSavingOffer, setIsSavingOffer] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasShared, setHasShared] = useState(false);

    // Helper for CamelCase/TitleCase
    const toTitleCase = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const [offerDetails, setOfferDetails] = useState({
        joiningDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        internshipPeriod: 6,
        customPosition: ''
    });

    // Load offer details when application changes
    useEffect(() => {
        if (application?.onboarding?.[0]) {
            const ob = application.onboarding[0];
            setOfferDetails({
                joiningDate: ob.joining_date || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                internshipPeriod: ob.internship_period_months || 6,
                customPosition: ob.custom_position || ''
            });
        }
    }, [application]);

    const saveOfferDetails = async (details = offerDetails) => {
        if (!application) return;
        setIsSavingOffer(true);
        try {
            // Check if onboarding record exists
            let onboardingId = application.onboarding?.[0]?.id;

            if (!onboardingId) {
                // Create if missing
                const { data: newOb, error: createError } = await supabase
                    .from('hrms_onboarding')
                    .insert([{ application_id: application.id, personal_email: application.email }])
                    .select()
                    .single();

                if (createError) throw createError;
                onboardingId = newOb.id;
                // Note: We can't easily update local application state deep here without a refetch, 
                // but onUpdate will handle global refresh if needed.
            }

            // Update details
            const { error } = await supabase
                .from('hrms_onboarding')
                .update({
                    joining_date: details.joiningDate,
                    internship_period_months: details.internshipPeriod,
                    custom_position: details.customPosition,
                    updated_at: new Date().toISOString()
                })
                .eq('id', onboardingId);

            if (error) throw error;
            setLastSaved(new Date());

            // We might want to trigger a refresh here if it was a new record
            if (!application.onboarding?.[0]) {
                onUpdate();
            }
        } catch (error) {
            console.error("Failed to save offer details", error);
            toast({ title: "Save Failed", description: "Could not save offer details.", variant: "destructive" });
        } finally {
            setIsSavingOffer(false);
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
            img.src = url.startsWith('http') ? url : window.location.origin + url;
        });
    };

    const getOfferLetterPDF = async () => {
        const doc = new jsPDF();

        // Background Letterhead
        try {
            const letterheadBase64 = await loadImageAsBase64("/letterhead.png");
            doc.addImage(letterheadBase64, 'PNG', 0, 0, 210, 297);
        } catch (e) {
            console.error("Letterhead failed to load", e);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("GOAI TECHNOLOGIES PVT LTD", 105, 25, { align: "center" });
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Ref: GoAI/OFFER/${application.id.slice(0, 8)}`, 20, 50);
        doc.text(`Date: ${format(new Date(), 'PPP')}`, 20, 57);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("INTERNSHIP INFORMATION & OFFER LETTER", 105, 75, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`To,`, 20, 90);
        doc.text(`${toTitleCase(application.full_name)}`, 20, 96);
        doc.text(`${toTitleCase(application.university)}`, 20, 102);

        const position = toTitleCase(offerDetails.customPosition || application.position);
        const joiningDate = offerDetails.joiningDate ? format(new Date(offerDetails.joiningDate), 'PPP') : format(new Date(), 'PPP');
        const period = offerDetails.internshipPeriod;

        const body = `Dear ${toTitleCase(application.full_name)},

Following your recent interview for the ${position} Intern position, we are pleased to offer you an internship with GoAI Technologies.

Your internship is scheduled to begin on ${joiningDate} for a duration of ${period} months. During this period, you will be working remotely/hybrid as per team requirements.

Compensation & Benefits:
• Internship Certificate and Letter of Recommendation (LOR) upon completion.
• Exposure to real-world AI and Retail Tech projects.

This offer is subject to the signing of our standard Non-Disclosure Agreement (NDA).

We look forward to having you join our team.

Sincerely,
HR Department
GoAI Technologies`;

        const splitText = doc.splitTextToSize(body, 170);
        doc.text(splitText, 20, 115);

        return { doc, position, joiningDate, period };
    };

    const previewOfferLetter = async () => {
        try {
            toast({ title: "Checking for existing letter...", description: "Please wait..." });

            // 1. Check if an offer letter already exists for this candidate
            const { data: existingDocs, error: fetchError } = await supabase
                .from('hrms_documents')
                .select('file_path')
                .eq('candidate_id', application.id)
                .eq('doc_type', 'offer_letter')
                .order('created_at', { ascending: false })
                .limit(1);

            if (fetchError) {
                console.error("Error fetching documents:", fetchError);
            }

            if (existingDocs && existingDocs.length > 0) {
                // 2. If exists, create signed URL and open
                const filePath = existingDocs[0].file_path;
                const { data: signedData, error: signError } = await supabase.storage
                    .from('hrms_generated_docs')
                    .createSignedUrl(filePath, 3600); // Valid for 1 hour

                if (signError) throw signError;

                window.open(signedData.signedUrl, '_blank');
                toast({ title: "Previewing", description: "Opening existing offer letter." });
            } else {
                // 3. Fallback: Generate draft preview
                toast({ title: "Generating Draft Preview", description: "No saved letter found. Generating draft..." });
                const { doc } = await getOfferLetterPDF();
                window.open(doc.output('bloburl'), '_blank');
            }
        } catch (error) {
            console.error("Preview error:", error);
            toast({ title: "Error", description: "Failed to preview offer letter.", variant: "destructive" });
        }
    };

    const saveDocument = async (appId: string | null, empId: string | null, docType: string, blob: Blob, fileName: string) => {
        try {
            const filePath = `${empId || appId}/${Date.now()}_${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('hrms_generated_docs')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
                .from('hrms_documents')
                .insert({
                    candidate_id: appId,
                    employee_id: empId,
                    doc_type: docType,
                    file_path: filePath,
                    issued_by: (await supabase.auth.getUser()).data.user?.id
                });

            if (dbError) throw dbError;

            return filePath;
        } catch (error: any) {
            console.error('Error saving document:', error);
            throw error;
        }
    };

    const shareOfferLetter = async () => {
        if (!confirm(`Are you sure you want to share the offer letter with ${application.full_name}?`)) return;

        // Ensure details are saved first
        await saveOfferDetails();

        toast({ title: "Sending Offer", description: "Generating document and sending email..." });

        try {
            const { doc, position, joiningDate, period } = await getOfferLetterPDF();
            const pdfBlob = doc.output('blob');

            // Save to storage and DB
            await saveDocument(application.id, null, 'offer_letter', pdfBlob, 'Offer_Letter.pdf');

            // Construct Email
            const subject = `Internship Offer Letter – ${position}`;
            const htmlMessage = `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0;">
                    <!-- Letterhead Header -->
                    <div style="background-color: #ffffff; padding: 20px 40px; border-bottom: 2px solid #2563eb;">
                        <table style="width: 100%;">
                            <tr>
                                <td align="left" style="vertical-align: middle;">
                                    <h1 style="margin: 0; color: #2563eb; font-size: 24px; font-weight: 700; line-height: 1;">GOAI TECHNOLOGIES</h1>
                                    <p style="margin: 5px 0 0; color: #64748b; font-size: 10px; letter-spacing: 1px; font-weight: 600;">INNOVATION FOR RETAIL</p>
                                </td>
                                <td align="right" style="vertical-align: middle;">
                                    <img src="https://go-aitech.com/logo.png" alt="GoAI Logo" style="height: 32px; display: block;" />
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Content -->
                    <div style="padding: 40px; color: #334155; line-height: 1.8; font-size: 15px;">
                        <p style="text-align: right; color: #64748b; font-size: 13px; margin-bottom: 40px;">Date: ${format(new Date(), 'MMMM dd, yyyy')}</p>
                    
                        <p style="margin-bottom: 24px;">Dear <strong>${toTitleCase(application.full_name)}</strong>,</p>
                        
                        <p>We are delighted to extend this offer of internship to you for the position of <strong>${toTitleCase(position)}</strong> at GoAI Technologies Pvt Ltd.</p>

                        <p>We were impressed by your background and enthusiasm, and we believe you will be a valuable addition to our team.</p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0;">
                            <h3 style="margin: 0 0 15px; color: #0f172a; font-size: 16px;">Offer Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td>
                                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${toTitleCase(position)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Start Date:</td>
                                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${joiningDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Duration:</td>
                                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${period} Months</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Location:</td>
                                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">Remote / Collaborative Workspace</td>
                                </tr>
                            </table>
                        </div>

                        <p>Please review the full details in the attached Offer Letter PDF. To proceed, you are required to complete the onboarding process, which includes signing the Non-Disclosure Agreement (NDA) and uploading necessary documents.</p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <!-- Placeholder for Button -->
                           CHECK_BUTTON_PLACEHOLDER
                        </div>
                    </div>

                    <!-- Letterhead Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                         <p style="margin: 0; color: #2563eb;"><strong>GoAI Technologies Pvt Ltd</strong></p>
                         <p style="margin: 5px 0 0;">Building the Future of Retail AI</p>
                    </div>
                </div>
            `;

            // Create onboarding record if doesn't exist (should already exist from saveOfferDetails, but double check)
            let onboardingLink = '';
            const { data: existingOnboarding } = await supabase
                .from('hrms_onboarding')
                .select('id')
                .eq('application_id', application.id)
                .single();

            if (existingOnboarding) {
                onboardingLink = `${window.location.origin}/onboarding/${existingOnboarding.id}`;
            }

            // Update email to include onboarding link
            const finalHtmlMessage = htmlMessage.replace(
                'CHECK_BUTTON_PLACEHOLDER',
                `<a href="${onboardingLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 16px;">Complete Onboarding</a>`
            );

            const { error: emailError } = await supabase.rpc('send_interview_invite', {
                recipient_email: application.email,
                email_subject: subject,
                email_html: finalHtmlMessage
            });

            if (emailError) {
                console.error("Email send error:", emailError);
                toast({
                    title: "Letter Saved, Email Failed",
                    description: "Offer letter saved but email could not be sent. Please send manually.",
                    variant: "destructive"
                });
            } else {
                // Update status to 'approved' if not already
                if (application.status !== 'approved') {
                    await supabase.from('internship_applications').update({ status: 'approved' }).eq('id', application.id);
                }

                setHasShared(true);
                toast({
                    title: "Offer Letter Shared!",
                    description: `Email sent to ${application.email} successfully.`
                });
                onUpdate(); // Refresh parent
            }
        } catch (error) {
            console.error("Email error:", error);
            toast({
                title: "Error",
                description: "Failed to generate or send offer letter.",
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-3 bg-white p-3 rounded border relative">
            <div className="absolute top-2 right-2 flex items-center gap-1">
                {isSavingOffer ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>
                ) : lastSaved ? (
                    <span className="text-[10px] text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Joining Date</label>
                    <Input
                        type="date"
                        value={offerDetails.joiningDate}
                        onChange={(e) => setOfferDetails({ ...offerDetails, joiningDate: e.target.value })}
                        onBlur={() => saveOfferDetails()}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Period (Months)</label>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                const newVal = Math.max(1, offerDetails.internshipPeriod - 1);
                                const newDetails = { ...offerDetails, internshipPeriod: newVal };
                                setOfferDetails(newDetails);
                                saveOfferDetails(newDetails);
                            }}
                        >
                            -
                        </Button>
                        <div className="flex-1 text-center text-sm font-medium border rounded h-8 flex items-center justify-center bg-slate-50">
                            {offerDetails.internshipPeriod} Months
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                const newVal = offerDetails.internshipPeriod + 1;
                                const newDetails = { ...offerDetails, internshipPeriod: newVal };
                                setOfferDetails(newDetails);
                                saveOfferDetails(newDetails);
                            }}
                        >
                            +
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Position (Optional Override)</label>
                <Input
                    placeholder={application.position}
                    value={offerDetails.customPosition}
                    onChange={(e) => setOfferDetails({ ...offerDetails, customPosition: e.target.value })}
                    onBlur={() => saveOfferDetails()}
                    className="h-8 text-sm"
                />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={previewOfferLetter}
                >
                    <FileText className="mr-2 h-4 w-4" /> Preview
                </Button>
                <Button
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    onClick={shareOfferLetter}
                    disabled={hasShared}
                >
                    <Send className="mr-2 h-4 w-4" /> {hasShared ? "Shared" : "Share Letter"}
                </Button>
            </div>
        </div>
    );
};
