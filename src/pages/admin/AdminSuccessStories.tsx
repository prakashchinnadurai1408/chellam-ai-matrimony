import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Plus, Trash2, Edit2, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export interface SuccessStory {
  id: string;
  couple_name: string;
  image_url: string | null;
  location: string | null;
  married_date: string | null;
  match_score: number | null;
  story: string;
  highlights: string[] | null;
  duration: string | null;
  created_at?: string;
}

const AdminSuccessStories = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);

  // Form State
  const [coupleName, setCoupleName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [marriedDate, setMarriedDate] = useState("");
  const [matchScore, setMatchScore] = useState<number | "">("");
  const [story, setStory] = useState("");
  const [highlights, setHighlights] = useState("");
  const [duration, setDuration] = useState("");
  
  const [saving, setSaving] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("success_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load stories.");
    } else {
      setStories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const openModal = (storyToEdit?: SuccessStory) => {
    if (storyToEdit) {
      setEditingStory(storyToEdit);
      setCoupleName(storyToEdit.couple_name);
      setImageUrl(storyToEdit.image_url || "");
      setLocation(storyToEdit.location || "");
      setMarriedDate(storyToEdit.married_date || "");
      setMatchScore(storyToEdit.match_score || "");
      setStory(storyToEdit.story);
      setHighlights((storyToEdit.highlights || []).join(", "));
      setDuration(storyToEdit.duration || "");
    } else {
      setEditingStory(null);
      setCoupleName("");
      setImageUrl("");
      setLocation("");
      setMarriedDate("");
      setMatchScore("");
      setStory("");
      setHighlights("");
      setDuration("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStory(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName || !story) {
      toast.error("Couple name and story are required.");
      return;
    }
    setSaving(true);

    const highlightsArray = highlights
      .split(",")
      .map(h => h.trim())
      .filter(h => h.length > 0);

    const match_score = matchScore === "" ? null : Number(matchScore);

    const payload = {
      couple_name: coupleName,
      image_url: imageUrl || null,
      location: location || null,
      married_date: marriedDate || null,
      match_score,
      story,
      highlights: highlightsArray,
      duration: duration || null,
    };

    if (editingStory) {
      const { error } = await supabase
        .from("success_stories")
        .update(payload)
        .eq("id", editingStory.id);

      if (error) toast.error("Error updating story.");
      else {
        toast.success("Story updated.");
        fetchStories();
        closeModal();
      }
    } else {
      const { error } = await supabase
        .from("success_stories")
        .insert([payload]);

      if (error) toast.error("Error creating story.");
      else {
        toast.success("Story created.");
        fetchStories();
        closeModal();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    const { error } = await supabase
      .from("success_stories")
      .delete()
      .eq("id", id);
    if (error) toast.error("Failed to delete.");
    else {
      toast.success("Story deleted.");
      fetchStories();
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Success Stories</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage dynamically added success stories.</p>
          </div>
          <Button onClick={() => openModal()} className="gap-2">
            <Plus className="w-4 h-4" /> Add Story
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Couple</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Match Score</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                  ) : stories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        No success stories in Database.<br />Hardcoded records will still show on the site.
                      </td>
                    </tr>
                  ) : (
                    stories.map((s) => (
                      <tr key={s.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {s.image_url ? (
                              <img src={s.image_url} alt={s.couple_name} className="w-10 h-10 object-cover rounded-md" />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                <Heart className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{s.couple_name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{s.location || "No location"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{s.married_date || "—"}</td>
                        <td className="p-4">
                          {s.match_score ? (
                            <Badge variant="outline" className="gap-1 border-accent/30 text-accent bg-accent/5">
                              <Sparkles className="w-3 h-3" /> {s.match_score}%
                            </Badge>
                          ) : "—"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={() => openModal(s)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStory ? "Edit Story" : "Add New Story"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Couple Name *</label>
                  <Input value={coupleName} onChange={(e) => setCoupleName(e.target.value)} placeholder="e.g. Arjun & Priya" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Image URL</label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Chennai, Tamil Nadu" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Married Date</label>
                  <Input value={marriedDate} onChange={(e) => setMarriedDate(e.target.value)} placeholder="e.g. December 2025" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Match Score (%)</label>
                  <Input type="number" min="0" max="100" value={matchScore} onChange={(e) => setMatchScore(e.target.value ? Number(e.target.value) : "")} placeholder="94" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Duration</label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3 months from match to marriage" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Story / Testimonial *</label>
                <Textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="Their awesome story..." rows={4} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Highlights (Comma separated)</label>
                <Input value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="e.g. Same community, AI Match, Horoscope" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Story
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSuccessStories;
