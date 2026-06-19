import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Bot, RefreshCw, Loader2, Info } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface RoiForecast {
  estimated_annual_roi_percent: number;
  estimated_rental_yield_percent: number;
  estimated_appreciation_percent: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  comparable_basis: string;
}

export const RoiAssessmentWidget: React.FC<{ property: any }> = ({ property }) => {
  const [forecast, setForecast] = useState<RoiForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoi = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    setError(null);

    try {
      const response = await api.post('/properties/predict-roi', {
        property_id: property.id,
        property_title: property.title,
        location: property.location || property.city,
        price: property.price,
        property_type: property.type || "Apartment",
        force_refresh: forceRefresh // Tell backend whether to bypass cache
      });
      setForecast(response.data);
    } catch (err: any) {
      setError("Failed to generate AI financial forecast. " + (err.response?.data?.message || ""));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (property?.id) fetchRoi(false);
  }, [property]);


  if (isLoading) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-300 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Running Market Analysis...</p>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-300 p-6 flex flex-col items-center text-center">
        <AlertTriangle className="text-gray-400 mb-3" size={24} />
        <p className="text-sm font-medium text-gray-500 mb-4">{error || "Analysis unavailable."}</p>
        <button 
          onClick={() => fetchRoi(true)} 
          className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-[#141414] hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const ConfidenceIcon = 
    forecast.confidence === "high" ? CheckCircle2 : 
    forecast.confidence === "medium" ? BarChart3 : AlertTriangle;

  const confidenceColor = 
    forecast.confidence === "high" ? "text-green-600" : 
    forecast.confidence === "medium" ? "text-amber-600" : "text-gray-500";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-300 shadow-sm overflow-hidden flex flex-col">
      {/* Dark Header */}
      <div className="bg-[#141414] p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Bot size={20} className="text-white" />
          <h3 className="text-base font-bold text-white">AI Market Estimate</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Confidence:</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1", confidenceColor)}>
              <ConfidenceIcon size={12} /> {forecast.confidence}
            </span>
          </div>
          {/* Recalculate Button */}
          <button 
            onClick={() => fetchRoi(true)}
            disabled={isRefreshing}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Recalculate Forecast"
          >
            <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* Warning Banner for Low Confidence (Option 1 State) */}
        {forecast.confidence === 'low' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              <strong>Estimation Caveat:</strong> This forecast is based on generalized market patterns. It is not currently backed by verified local comparable sales. Use as a directional guide only.
            </p>
          </div>
        )}

        {/* Top Metrics Row - Using Tildes for Approximation */}
        <div className="grid grid-cols-3 gap-6 pb-6 border-b border-gray-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Projected ROI</p>
            <p className="text-3xl font-bold text-[#141414] flex items-center gap-2">
              ~{forecast.estimated_annual_roi_percent}%
              <TrendingUp size={20} className="text-gray-400" />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Rental Yield</p>
            <p className="text-2xl font-bold text-gray-600">~{forecast.estimated_rental_yield_percent}%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Appreciation</p>
            <p className="text-2xl font-bold text-gray-600">~{forecast.estimated_appreciation_percent}%</p>
          </div>
        </div>

        {/* Reasoning Block */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#141414] mb-3">Analyst Reasoning</h4>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {forecast.reasoning}
          </p>
        </div>

        {/* Comparable Basis Block */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-300 mt-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#141414] mb-2">Data Grounding</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            {forecast.comparable_basis}
          </p>
        </div>

      </div>
    </div>
  );
};