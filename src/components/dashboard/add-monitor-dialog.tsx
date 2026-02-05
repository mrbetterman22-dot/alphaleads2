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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/data-provider";
import { useToast } from "@/hooks/use-toast";

export function AddMonitorDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false); // State for warning popup
  const { addMonitor } = useData();
  const { toast } = useToast();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!keyword || !location) return;
  
      setLoading(true);
      try {
        const deactivatedExisting = await addMonitor({
          keyword,
          location,
          status: "active",
        });
  
        if (deactivatedExisting) {
          setShowWarning(true);
        } else {
          toast({
            title: "Monitor Created",
            description: `Now tracking ${keyword} in ${location}`,
          });
        }
  
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
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {/* FIX: Yellow background is now FORCED here */}
            <Button
              className="!bg-[#ffe600] text-black hover:!bg-[#ffe600] font-bold shadow-lg shadow-[#ffe600]/20 transition-all flex items-center gap-2 px-6"
            >
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
                  className="w-full !bg-[#ffe600] text-black hover:!bg-[#ffe600] font-bold rounded-3xl"
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
  
        {showWarning && (
          <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Multiple Active Monitors for Location</AlertDialogTitle>
                <AlertDialogDescription>
                  You can only have one active monitor per location. Your previous active monitor for this location has been set to "paused".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowWarning(false)}>
                  Got it!
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </>
    );
  }
