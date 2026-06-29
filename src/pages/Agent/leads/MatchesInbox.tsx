import React, { useState, useEffect } from "react";
import { 
  Bot, MapPin, Bed, Bath, 
  MessageCircle, FileText, X, Check,
  Search, Filter, Loader2, Copy
} from "lucide-react";
import { formatCurrency, cn } from "@/src/lib/utils";
// Import your API client here. Adjust the path as necessary.
import { api } from "@/src/lib/api";

export const MatchesInbox: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  const MOCK_MATCHES = [
  {
    id: "match_001",
    score: 96,
    status: "unread",
    created_at: "2026-06-19T08:30:00.000Z",
    lead: { 
      name: "Bruce Wayne", 
      phone: "+254700000001", 
      email: "bruce@wayneenterprises.com" 
    },
    property: {
      id: 10,
      title: "The Oribi Penthouse",
      location: "Muthaiga",
      price: 85000000,
      beds: 4,
      baths: 5,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600"
    },
    reasoning: "Exceptional match. The client requested a highly secure, luxury 4+ bedroom property in Muthaiga or Runda with a budget up to 90M. The Oribi Penthouse hits every requirement, including the requested private elevator and uninterrupted power backup."
  },
  {
    id: "match_002",
    score: 82,
    status: "unread",
    created_at: "2026-06-18T14:15:00.000Z",
    lead: { 
      name: "Diana Prince", 
      phone: "+254722000002", 
      email: "diana.p@themyscira.org" 
    },
    property: {
      id: 14,
      title: "Nyali Oceanfront Retreat",
      location: "Nyali Beach",
      price: 55000000,
      beds: 3,
      baths: 4,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600"
    },
    reasoning: "Client is looking for a coastal investment property under 50M. While this is slightly above budget at 55M, it features the exact beachfront access and modern finishings she prioritized. Recommend negotiating or pitching the higher ROI potential."
  },
  {
    id: "match_003",
    score: 68,
    status: "read",
    created_at: "2026-06-17T09:45:00.000Z",
    lead: { 
      name: "Clark Kent", 
      phone: "+254733000003", 
      email: "ckent@dailyplanet.com" 
    },
    property: {
      id: 22,
      title: "Suburban Starter Maisonette",
      location: "Ruaka",
      price: 12000000,
      beds: 3,
      baths: 2,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600"
    },
    reasoning: "Partial match. Client wants a 3-bedroom in a quiet neighborhood near the bypass. Ruaka fits the geographical constraint, but the property lacks the requested home office space and DSQ. Flagged as a fallback option."
  },
  {
    id: "match_004",
    score: 91,
    status: "unread",
    created_at: "2026-06-19T10:05:00.000Z",
    lead: { 
      name: "Arthur Curry", 
      phone: "+254799000004", 
      email: "arthur@atlantis.com" 
    },
    property: {
      id: 31,
      title: "Mount Kenya Wildlife Estate Chalet",
      location: "Nanyuki",
      price: 68000000,
      beds: 4,
      baths: 4,
      image: "https://images.unsplash.com/photo-1600607687931-cebf10cb4cb8?q=80&w=600"
    },
    reasoning: "Perfect alignment for a holiday home. Client specifically asked for property in Nanyuki with clear views of Mount Kenya and access to a clubhouse. This chalet is 12M under their maximum budget."
  }
];
  
  // New States for Actions
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedProposal, setDraftedProposal] = useState<string | null>(null);

  useEffect(() => {
    const loadMockData = () => {
      // Simulate network delay
      setTimeout(() => {
        setMatches(MOCK_MATCHES);
        setSelectedId(MOCK_MATCHES[0].id);
        setIsLoading(false);
      }, 1500);
    };

    loadMockData();

    // COMMENTED OUT UNTIL THE LARAVEL ENDPOINT IS READY
    /*
    const fetchMatches = async () => {
      try {
        const response = await api.get('/me/notifications'); 
        const data = response.data?.data || response.data || [];
        const aiMatches = data.filter((m: any) => m.type === 'property_match' || m.property);
        
        setMatches(aiMatches);
        if (aiMatches.length > 0) {
          setSelectedId(aiMatches[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatches();
    */
  }, []);

  const selectedMatch = matches.find(m => m.id === selectedId);

  const handleDismiss = async (id: string) => {
    try {
      await api.post('/me/notifications/read', { id });
      
      const updated = matches.filter(m => m.id !== id);
      setMatches(updated);
      if (selectedId === id) setSelectedId(updated[0]?.id || "");
    } catch (error) {
      console.error("Failed to dismiss match:", error);
    }
  };

  const handleWhatsApp = () => {
    if (!selectedMatch?.lead?.phone) return;
    const phone = selectedMatch.lead.phone.replace(/[^0-9]/g, '');
    const message = `Hi ${selectedMatch.lead.name}, this is regarding your property search — I found a listing that closely matches what you're looking for: ${selectedMatch.property?.title}. Would you be available for a quick call or viewing this week?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDraftProposal = async () => {
    if (!selectedMatch) return;
    setIsDrafting(true);
    try {
      const response = await api.post('/matches/draft', {
        lead_name: selectedMatch.lead?.name || "Client",
        property_title: selectedMatch.property?.title,
        location: selectedMatch.property?.location || selectedMatch.property?.city,
        price: selectedMatch.property?.price,
        reasoning: selectedMatch.reasoning
      });      
      setDraftedProposal(response.data?.proposal);
    } catch (error) {
      console.error("Failed to draft proposal:", error);
      setDraftedProposal(`Dear ${selectedMatch.lead?.name},\n\nI hope you're doing well. Based on what you've shared about your search in ${selectedMatch.property?.location}, I wanted to bring a property to your attention: ${selectedMatch.property?.title}, listed at ${formatCurrency(Number(selectedMatch.property?.price || 0))}.\n\n${selectedMatch.reasoning}\n\nI'd be happy to arrange a viewing at a time that works for you. Please let me know your availability.\n\nBest regards,\nYour Agent`);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyProposal = () => {
    if (draftedProposal) {
      navigator.clipboard.writeText(draftedProposal);
      setDraftedProposal(null);
    }
  };

  const scoreColor = (s: number) => {
    if (s >= 90) return "text-green-600";
    if (s >= 75) return "text-amber-500";
    return "text-gray-400";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-4">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-12 relative">
      
      {/* PROPOSAL MODAL OVERLAY */}
      {draftedProposal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#141414]/20 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] border border-gray-300 shadow-2xl p-8 max-w-2xl w-full flex flex-col h-[80vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-[#141414]">AI Drafted Proposal</h2>
              <button onClick={() => setDraftedProposal(null)} className="text-gray-400 hover:text-[#141414] cursor-pointer transition-colors">
                <X size={20} />
              </button>
            </div>
            <textarea 
              value={draftedProposal}
              onChange={(e) => setDraftedProposal(e.target.value)}
              className="flex-1 w-full p-6 bg-gray-50 rounded-2xl border border-gray-300 text-sm text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#141414]/10 resize-none mb-6 min-h-0"
            />
            <div className="flex justify-end shrink-0">
              <button onClick={handleCopyProposal} className="cursor-pointer flex items-center gap-2 px-6 py-3.5 bg-[#141414] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                <Copy size={16} /> Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-6">
        
        {/* Header Panel */}
        <div className="bg-white rounded-[2rem] border border-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#141414] flex items-center justify-center shrink-0">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#141414]">AI Triage Inbox</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Review & action automated matches</p>
            </div>
          </div>
          <button className="cursor-pointer flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-[#141414] hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filter Queue
          </button>
        </div>

        {/* Inbox Layout */}
        <div className="flex flex-1 min-h-0 gap-6">
          
          {/* Left Pane: Match List */}
          <div className="w-[420px] bg-white rounded-[2rem] border border-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden shrink-0">
            <div className="p-6 border-b border-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search matches..." 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-[2rem] border border-gray-300 text-sm font-medium text-[#141414] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {matches.length === 0 ? (
                <div className="p-12 text-center">
                  <Check size={32} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Inbox is empty</p>
                </div>
              ) : (
                matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedId(match.id)}
                    className={cn(
                      "cursor-pointer w-full text-left p-6 border-b border-gray-50 transition-colors hover:bg-gray-50/50 block",
                      selectedId === match.id ? "bg-gray-50/80 border-l-4 border-l-[#141414]" : "border-l-4 border-l-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-[#141414] text-base">{match.lead?.name || "Unknown Lead"}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", scoreColor(match.score))}>
                        {match.score}% MATCH
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 line-clamp-1 mb-3">{match.property?.title || "Property Details Unavailable"}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{match.property?.location}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {new Date(match.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Pane: Match Details & Actions */}
          <div className="flex-1 bg-white rounded-[2rem] border border-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
            {selectedMatch ? (
              <>
                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                  {/* Top Header: Lead & Score */}
                  <div className="flex justify-between items-start mb-10 pb-8 border-b border-gray-50">
                    <div>
                      <h2 className="text-3xl font-bold text-[#141414] mb-2">{selectedMatch.lead?.name}</h2>
                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <span>{selectedMatch.lead?.email}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{selectedMatch.lead?.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-4xl font-bold", scoreColor(selectedMatch.score))}>
                        {selectedMatch.score}%
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Confidence Score</p>
                    </div>
                  </div>

                  {/* AI Reasoning Block */}
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#141414] flex items-center justify-center">
                        <Bot size={14} className="text-white" />
                      </div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gemini Analysis</h3>
                    </div>
                    <p className="text-base text-[#141414] leading-relaxed p-6 bg-gray-50 rounded-2xl border border-gray-300">
                      {selectedMatch.reasoning}
                    </p>
                  </div>

                  {/* Property Snippet */}
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Target Property</h3>
                  <div className="flex flex-col xl:flex-row gap-6 p-6 border border-gray-300 rounded-2xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-shadow">
                    <div className="w-full xl:w-64 h-40 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                      <img 
                        src={selectedMatch.property?.images?.[0] || selectedMatch.property?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400"} 
                        alt={selectedMatch.property?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <h4 className="text-xl font-bold text-[#141414] mb-3">{selectedMatch.property?.title}</h4>
                      <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                        <span className="flex items-center gap-2"><MapPin size={14} className="text-[#141414]" /> {selectedMatch.property?.location || selectedMatch.property?.city}</span>
                        <span className="flex items-center gap-2"><Bed size={14} className="text-[#141414]" /> {selectedMatch.property?.beds || 0} BEDS</span>
                        <span className="flex items-center gap-2"><Bath size={14} className="text-[#141414]" /> {selectedMatch.property?.baths || 0} BATHS</span>
                      </div>
                      <p className="text-2xl font-bold text-[#141414]">{formatCurrency(Number(selectedMatch.property?.price || 0))}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-6 lg:p-8 border-t border-gray-50 flex items-center justify-between shrink-0 bg-white">
                  <button 
                    onClick={() => handleDismiss(selectedMatch.id)}
                    className="cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} /> Dismiss Match
                  </button>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleWhatsApp}
                      className="cursor-pointer flex items-center gap-2 px-6 py-3.5 border border-gray-300 rounded-xl text-sm font-bold text-[#141414] hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle size={18} /> WhatsApp Lead
                    </button>
                    <button 
                      onClick={handleDraftProposal}
                      disabled={isDrafting}
                      className="cursor-pointer flex items-center gap-2 px-6 py-3.5 bg-[#141414] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isDrafting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                      {isDrafting ? "Drafting..." : "Draft Proposal"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                  <Check size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-[#141414] mb-2">Queue Cleared</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No active matches selected</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};