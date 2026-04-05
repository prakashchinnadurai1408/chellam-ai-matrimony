import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle, Clock, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

const templates = [
  { id: "welcome", name: "Welcome Email", subject: "Welcome to Chellam Matrimony!", description: "Sent to new users after registration." },
  { id: "match", name: "Daily Match Alert", subject: "New Matches Found for You!", description: "Personalized match recommendations." },
  { id: "interest", name: "Interest Received", subject: "Someone is interested in you!", description: "Notification when a user clicks 'Interested'." },
  { id: "premium", name: "Premium Offer", subject: "Unlock 2x More Matches with Premium", description: "Promotional email for paid plans." },
];

const AdminEmailCampaigns = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendTest = () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }
    setSending(true);
    // Scaffolded: Simulate API call
    setTimeout(() => {
      toast.success(`Test email '${selectedTemplate.name}' sent to ${testEmail}`);
      setSending(false);
      setTestEmail("");
    }, 1500);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Email Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and preview automated system emails</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" /> History
            </Button>
            <Button className="gap-2">
              <Send className="w-4 h-4" /> Send Bulk
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Templates</h2>
            {templates.map((t) => (
              <Card 
                key={t.id} 
                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedTemplate.id === t.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setSelectedTemplate(t)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${selectedTemplate.id === t.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{t.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Preview & Test */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
               <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-muted-foreground">Subject:</span>
                    <span className="text-foreground">{selectedTemplate.subject}</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">Preview</div>
               </div>
               <CardContent className="p-8 bg-white dark:bg-slate-900 min-h-[400px]">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="flex items-center gap-2 mb-8">
                       <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                         <Sparkles className="w-4 h-4 text-white" />
                       </div>
                       <span className="font-display font-bold text-lg text-slate-900 dark:text-white">Chellam Matrimony</span>
                    </div>

                    <div className="space-y-4">
                       <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                         {selectedTemplate.id === 'welcome' ? 'Welcome to your journey, User!' : 'Hello from Chellam,'}
                       </h2>
                       <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                         {selectedTemplate.description} Our AI is working hard to find you the most compatible profiles based on your Preferences and Horoscope.
                       </p>
                    </div>

                    <div className="py-6 border-y border-slate-100 dark:border-slate-800 flex justify-around">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                       ))}
                    </div>

                    <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25">
                      Explore Matches
                    </Button>

                    <div className="pt-8 text-center text-xs text-slate-400">
                       <p>© 2026 Chellam Matrimony. Chennai, India.</p>
                       <p className="mt-1 underline">Unsubscribe</p>
                    </div>
                  </div>
               </CardContent>
            </Card>

            {/* Test Send Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Send Test Email</CardTitle>
                <CardDescription>Verify how this template looks in your inbox before going live.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                 <div className="flex-1 space-y-2">
                   <Label htmlFor="test-email" className="text-xs">Destination Email</Label>
                   <Input 
                     id="test-email" 
                     placeholder="admin@example.com" 
                     value={testEmail}
                     onChange={(e) => setTestEmail(e.target.value)}
                   />
                 </div>
                 <Button 
                   className="mt-6 gap-2" 
                   onClick={handleSendTest}
                   disabled={sending}
                 >
                   {sending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                   Send Test
                 </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailCampaigns;
