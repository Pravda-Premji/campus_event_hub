import React, { useState } from "react";
import { X, HelpCircle, Mail } from "lucide-react";

const HelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleContactAdmin = () => {
    window.location.href = "mailto:pravdaji23@gmail.com?subject=Help Request - Campus Event Hub";
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center group">
        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 hidden md:block" />
        <button
          onClick={() => setIsOpen(true)}
          className="relative rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white w-14 h-14 shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 font-bold"
        >
          <HelpCircle className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300 p-8 flex flex-col items-center relative">
            
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <div className="flex justify-between items-center w-full mb-6 relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <HelpCircle className="text-indigo-600 dark:text-indigo-400 w-6 h-6" /> Need Help?
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center w-full relative z-10 group">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-[1.5rem] inline-block mx-auto mb-6 group-hover:scale-110 transition duration-300 border border-indigo-100 dark:border-indigo-500/20">
                <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              
              <h4 className="font-bold text-2xl text-slate-800 dark:text-white mb-3">Contact Admin</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium px-2">
                Click the email below to open your secure mail client and reach out to our team directly.
              </p>

              <div 
                onClick={handleContactAdmin}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 px-6 rounded-2xl flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 cursor-pointer transition-all duration-300 shadow-sm relative overflow-hidden"
              >
                pravdaji23@gmail.com
                <Mail className="w-4 h-4 ml-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
