"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [htmlInput, setHtmlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string, addedCount?: number, updatedCount?: number} | null>(null);

  const handleGenerate = async () => {
    if (!htmlInput.trim()) {
      setResult({ success: false, message: "Please paste some HTML code first." });
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlInput }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult({ 
          success: true, 
          message: `Successfully processed!`,
          addedCount: data.addedCount,
          updatedCount: data.updatedCount
        });
        if ((data.addedCount ?? 0) > 0 || (data.updatedCount ?? 0) > 0) {
          setHtmlInput(""); // Clear input on success if items were processed
        }
      } else {
        setResult({ success: false, message: data.error || "Failed to parse HTML" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm">
        <Link href="/" className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Admin: Add & Update Movies</h1>
      </div>
      
      <div className="max-w-4xl w-full mx-auto p-6 flex-1 flex flex-col">
        <p className="text-gray-600 mb-6">
          Paste your newly scraped HTML code (containing the <code>&lt;div class="card"&gt;</code> blocks) into the box below.
          Clicking "Generate & Save" will automatically convert it to JSON. If any movie already exists in your database, the old movie entry will be removed and replaced with this latest updated version!
        </p>

        {result && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {result.success ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <div>
              <p className="font-bold">{result.message}</p>
              {result.addedCount !== undefined && (
                <p className="text-sm mt-1">
                  {((result.addedCount ?? 0) > 0 || (result.updatedCount ?? 0) > 0)
                    ? `Processed ${ (result.addedCount ?? 0) + (result.updatedCount ?? 0) } movies (${result.addedCount ?? 0} new added, ${result.updatedCount ?? 0} replaced/updated). They are now live on your app!` 
                    : "No movies were processed."}
                </p>
              )}
            </div>
          </div>
        )}

        <textarea
          className="flex-1 w-full bg-white border border-gray-300 rounded-xl p-4 font-mono text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#553cfb] focus:border-transparent resize-none mb-6"
          placeholder='Paste your HTML here...&#10;&#10;e.g.,&#10;<div class="card">&#10;  <div class="poster-box">...</div>&#10;...&#10;</div>'
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
        ></textarea>
        
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#553cfb] hover:bg-[#462ee6]"
            }`}
          >
            {isLoading ? "Processing Data..." : "Generate & Save to Database"}
          </button>
        </div>
      </div>
    </div>
  );
}
