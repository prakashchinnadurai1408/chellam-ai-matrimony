import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Heart, Plus, Loader2, Calendar, HeartHandshake, Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

interface Story {
  id: string;
  title: string;
  partner_name: string;
  story: string;
  photo_url: string | null;
  wedding_date: string | null;
  created_at: string;
}

const SuccessStories = () => {
  const { user, isAuthenticated } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", partnerName: "", story: "", weddingDate: "" });

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase
        .from("success_stories")
        .select("id, title, partner_name, story, photo_url, wedding_date, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (data) setStories(data);
      setLoading(false);
    };
    fetchStories();
  }, []);

  const handleSubmit = async () => {
    if (!user || !form.title || !form.partnerName || !form.story) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("success_stories").insert({
      user_id: user.id,
      title: form.title,
      partner_name: form.partnerName,
      story: form.story,
      wedding_date: form.weddingDate || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit story");
      return;
    }
    toast.success("Your story has been submitted! It will appear after review.");
    setSubmitOpen(false);
    setForm({ title: "", partnerName: "", story: "", weddingDate: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <HeartHandshake className="w-3.5 h-3.5" />
            Love Stories
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Success Stories
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Real couples who found their perfect match on Chellam. Your story could be next!
          </p>
          {isAuthenticated && (
            <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" /> Share Your Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" /> Share Your Love Story
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      placeholder="e.g. From First Chat to Forever"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Partner's Name *</Label>
                    <Input
                      placeholder="Your partner's name"
                      value={form.partnerName}
                      onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Your Story *</Label>
                    <Textarea
                      placeholder="Tell us how you met on Chellam and your journey together..."
                      value={form.story}
                      onChange={(e) => setForm({ ...form, story: e.target.value })}
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                  <div>
                    <Label>Wedding Date (optional)</Label>
                    <Input
                      type="date"
                      value={form.weddingDate}
                      onChange={(e) => setForm({ ...form, weddingDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="hero" className="gap-1.5" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className="w-3.5 h-3.5" />}
                    Submit Story
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stories */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : stories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No success stories yet. Be the first to share yours!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {stories.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {s.photo_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={s.photo_url} alt={s.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mt-1" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-4">{s.story}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span className="font-medium">{s.partner_name}</span>
                      </div>
                      {s.wedding_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(s.wedding_date), "MMM yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SuccessStories;
