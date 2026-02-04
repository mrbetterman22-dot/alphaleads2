"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/data-provider";
import { useToast } from "@/hooks/use-toast";

export function AddMonitorDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addMonitor } = useData();
  const { toast } = useToast();

  // Form States
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !location) return;

    setLoading(true);
    try {
      // Send data to Supabase via our Provider
      await addMonitor({
        keyword,
        location,
        status: "active",
      });

      toast({
        title: "Monitor Created",
        description: `Now tracking ${keyword} in ${location}`,
      });

      // Reset and Close
      setKeyword("");
      setLocation("");
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create monitor. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Transparent button that fits inside the dashboard's yellow wrapper */}
        <Button variant="ghost" className="text-black hover:bg-transparent px-4 py-2 font-bold flex items-center gap-2 shadow-none">
          <Plus size={16} />
          Add Monitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle>New Market Monitor</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Define the target business and location you want to track.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="keyword">Target Keyword</Label>
            <Input
              id="keyword"
              placeholder="e.g. Dentists, Gyms, Roofers"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#ffe600]"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">City / Area</Label>
            <Input
              id="location"
              placeholder="e.g. London, Budapest, Berlin"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#ffe600]"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !keyword || !location}
              className="w-full bg-[#ffe600] text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Monitor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
