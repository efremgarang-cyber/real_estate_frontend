import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Bot, RefreshCw, Loader2, Info } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface RoiForecast {
  estimated_annual_roi_percent:    number;
  estimated_rental_yield_percent:  number;
  estimated_appreciation_percent:  number;
  confidence:    "low" | "medium" | "high";
  reasoning:     string;
  comparable_basis: string;
  generated_at?: string;   // we'll add this on the backend
}

export const RoiAssessmentWidget: React.FC<{ property: any }> = ({ property }) => {
  const [forecast, setForecast]   = useState<RoiForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchRoi = async (forceRefresh = false) => {
    forceRefresh ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/properties/predict-roi', {
        property_id:    property.id,
        property_title: property.title,
        location:       property.location || property.city,
        price:          property.price,
        property_type:  property.type || "Apartment",
        force_refresh:  forceRefresh,
      });

      setForecast(response.data);
    } catch (err: any) {
      if (err.response) {
        const msg = err.response.data?.message || err.response.data?.error || "Server error";
        setError(`Error: ${msg}`);
      } else if (err.request) {
        setError("Network error: Could not reach the server.");
      } else {
        setError(`Failed to generate AI forecast: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (property?.id) fetchRoi(false);
  }, [property?.id]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Running Market Analysis...
        </p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error || !forecast) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-gray-500">
            {error || "Analysis unavailable."}
          </p>
        </div>
        <button
          onClick={() => fetchRoi(true)}
          className="text-xs font-bold text-[#141414] hover:underline uppercase tracking-widest"
        >
          Retry →
        </button>
      </div>
    );
  }

  const ConfidenceIcon =
    forecast.confidence === "high"   ? CheckCircle2 :
    forecast.confidence === "medium" ? BarChart3    : AlertTriangle;

  const confidenceColor =
    forecast.confidence === "high"   ? "text-green-500" :
    forecast.confidence === "medium" ? "text-amber-500" : "text-gray-400";

  const isCached = !!forecast.generated_at;

  // ── Forecast state ─────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">

      {/* Header */}
      <div className="bg-[#141414] px-6 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Bot size={15} className="text-[#C9A96E]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AI Market Estimate</p>
            <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest">
              Gemini Flash · ROI Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence badge */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
            <ConfidenceIcon size={11} className={confidenceColor} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", confidenceColor)}>
              {forecast.confidence}
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchRoi(true)}
            disabled={isRefreshing}
            title="Generate a fresh forecast"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isRefreshing
              ? <Loader2 size={11} className="text-white/70 animate-spin" />
              : <TrendingUp size={11} className="text-white/70" />
            }
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {isRefreshing ? "Refreshing..." : "New Forecast"}
            </span>
          </button>
        </div>
      </div>

      {/* Cached notice */}
      {isCached && !isRefreshing && (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 border-b border-gray-100">
          <CheckCircle2 size={12} className="text-green-500 shrink-0" />
          <p className="text-[10px] text-gray-400 font-medium">
            Loaded from saved forecast ·{" "}
            {new Date(forecast.generated_at!).toLocaleDateString("en-KE", {
              day: "numeric", month: "short", year: "numeric"
            })}
            {" · "}
            <button
              onClick={() => fetchRoi(true)}
              className="text-[#141414] font-bold hover:underline"
            >
              Refresh
            </button>
          </p>
        </div>
      )}

      <div className="p-6 lg:p-8 flex-1 flex flex-col gap-6">

        {/* Low confidence caveat */}
        {forecast.confidence === "low" && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-gray-200 rounded-xl">
            <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              <strong>Estimation caveat:</strong> This forecast is based on generalized market
              patterns, not verified comparable sales. Use as a directional guide only.
            </p>
          </div>
        )}

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4 pb-6 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Projected ROI
            </p>
            <p className="text-3xl font-bold text-[#141414] flex items-baseline gap-1">
              {forecast.estimated_annual_roi_percent}
              <span className="text-base font-bold text-gray-400">%</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Rental Yield
            </p>
            <p className="text-2xl font-bold text-gray-600">
              {forecast.estimated_rental_yield_percent}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Appreciation
            </p>
            <p className="text-2xl font-bold text-gray-600">
              {forecast.estimated_appreciation_percent}%
            </p>
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414] mb-2">
            Analyst Reasoning
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {forecast.reasoning}
          </p>
        </div>

        {/* Comparable basis */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414] mb-2">
            Data Grounding
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {forecast.comparable_basis}
          </p>
        </div>

      </div>
    </div>
  );
};