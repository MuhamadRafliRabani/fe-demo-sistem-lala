import React from "react";
import { ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TabForm = () => {
  return (
    <div className="p-20 flex flex-col items-center justify-center text-center space-y-6 opacity-80">
      <ClipboardList size={60} className="text-emerald-400 mb-4" />
      <h3 className="text-2xl font-black text-white uppercase ">Survey Form</h3>
      <p className="text-slate-400 max-w-md">
        Access the digital survey form to input technical data.
      </p>
      <Button className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase tracking-widest">
        Open Form <ExternalLink className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
};
