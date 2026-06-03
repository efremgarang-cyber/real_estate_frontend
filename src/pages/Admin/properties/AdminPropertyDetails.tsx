import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, DollarSign, Calendar, Users, Shield, 
  CheckCircle, XCircle, AlertCircle, TrendingUp, FileText, 
  Edit3, Trash2, Save, ArrowLeft, Download, Eye, 
  BarChart3, MessageSquare, History, UserPlus, Settings,
  Loader2
} from 'lucide-react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";

// --- TypeScript Interfaces ---
interface PropertyAnalytics {
  totalViews: number;
  totalLeads: number;
  conversionRate: number;
  revenuePipeline: number;
  viewingRequests: number;
}

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  role: 'Admin' | 'Agent' | 'System';
  timestamp: string;
  details: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  commissionRate: number;
  activeListings: number;
}

interface PropertyData {
  id: string;
  title: string;
  price: number;
  location: string;
  type: string;
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Archived';
  agentId: string;
  description: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  featured: boolean;
  boosted: boolean;
}

// --- Mock Data tailored for global operations ---
const mockAgents: Agent[] = [
  { id: 'ag-01', name: 'Sarah Jenkins', email: 'sarah.j@agency.com', commissionRate: 2.5, activeListings: 12 },
  { id: 'ag-02', name: 'Michael Chang', email: 'm.chang@agency.com', commissionRate: 3.0, activeListings: 8 },
  { id: 'ag-03', name: 'Elena Rostova', email: 'e.rostova@agency.com', commissionRate: 2.8, activeListings: 15 },
];

const mockAnalytics: PropertyAnalytics = {
  totalViews: 14250,
  totalLeads: 382,
  conversionRate: 2.68,
  revenuePipeline: 45000000,
  viewingRequests: 45
};

const mockAuditLogs: AuditLog[] = [
  { id: 'log-1', action: 'Price Updated', performedBy: 'Sarah Jenkins', role: 'Agent', timestamp: '2026-06-02 14:22', details: 'Changed price from KSh 42,000,000 to KSh 45,000,000' },
  { id: 'log-2', action: 'Status Changed', performedBy: 'System Auto-Audit', role: 'System', timestamp: '2026-05-28 09:00', details: 'Moved from Draft to Pending Approval' },
  { id: 'log-3', action: 'Document Uploaded', performedBy: 'Sarah Jenkins', role: 'Agent', timestamp: '2026-05-27 11:15', details: 'Uploaded TitleDeed_Final.pdf' },
];

export const AdminPropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Layout and view states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'documents' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Core Asset State Node
  const [property, setProperty] = useState<PropertyData>({
    id: id || 'prop-991',
    title: 'Serene Luxury Villa & Spa',
    price: 45000000,
    location: 'Runda, Nairobi, Kenya',
    type: 'Residential',
    status: 'Pending Approval',
    agentId: 'ag-01',
    description: 'An architectural masterpiece featuring state-of-the-art smart home configurations, infinity lap pool, and a private wellness pavilion set against lush mature gardens.',
    sqft: 4500,
    bedrooms: 5,
    bathrooms: 5.5,
    featured: true,
    boosted: false
  });

  const [selectedAgent, setSelectedAgent] = useState<string>(property.agentId);
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);

  // Field mutators for direct configuration edits
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProperty(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleToggleChange = (name: 'featured' | 'boosted') => {
    setProperty(prev => ({ ...prev, [name]: !prev[name] }));
    addAuditLog(`Toggled System Configuration`, `Admin switched ${name} flag to ${!property[name] ? 'ON' : 'OFF'}`);
  };

  const updateStatus = (newStatus: PropertyData['status']) => {
    setProperty(prev => ({ ...prev, status: newStatus }));
    addAuditLog(`Status Level Updated`, `Property status manually altered to: ${newStatus}`);
  };

  const handleAgentReassignment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentId = e.target.value;
    setSelectedAgent(newAgentId);
    setProperty(prev => ({ ...prev, agentId: newAgentId }));
    const agentName = mockAgents.find(a => a.id === newAgentId)?.name || 'Unknown Agent';
    addAuditLog(`Agent Reassigned`, `Ownership transferred to ${agentName}`);
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      performedBy: 'Head Administrator',
      role: 'Admin',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const saveGlobalChanges = () => {
    setIsEditing(false);
    addAuditLog('Batch Content Save', 'Admin saved core structural and copywriting alterations.');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={32} className="animate-spin text-[#141414]" />
        <p className="text-sm font-medium text-gray-500">Pulling structural inventory logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Back to registry navigation tracking item */}
      <div className="flex items-center gap-4">
        <Link 
          to="/admin/properties" 
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#141414] shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs font-semibold text-gray-400">Inventory Management Registry</p>
          <h2 className="text-xl font-bold text-[#141414] tracking-tight">Asset Audit Panel</h2>
        </div>
      </div>

      {/* --- ADMINISTRATIVE MASTER DASHBOARD CONTROLS --- */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">ID: {property.id}</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                property.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' :
                property.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-gray-50 text-gray-400 border-gray-200'
              )}>
                {property.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#141414] tracking-tight">{property.title || 'Untitled Asset'}</h1>
          </div>
        </div>

        {/* System state transition toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {property.status === 'Pending Approval' && (
            <>
              <button 
                onClick={() => updateStatus('Active')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-black transition text-white text-xs font-bold rounded-xl shadow-sm uppercase tracking-wider"
              >
                <CheckCircle size={14} /> Approve & List Live
              </button>
              <button 
                onClick={() => updateStatus('Archived')}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 transition text-xs font-bold rounded-xl uppercase tracking-wider"
              >
                <XCircle size={14} /> Deny Validation
              </button>
            </>
          )}
          {property.status === 'Active' && (
            <button 
              onClick={() => updateStatus('Archived')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#141414] text-xs font-bold rounded-xl transition uppercase tracking-wider border border-gray-200 shadow-sm"
            >
              <AlertCircle size={14} /> Deprecate Listing
            </button>
          )}
          {property.status === 'Archived' && (
            <button 
              onClick={() => updateStatus('Draft')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-black text-white text-xs font-bold rounded-xl transition uppercase tracking-wider shadow-sm"
            >
              <History size={14} /> Rollback to Draft
            </button>
          )}
        </div>
      </div>

      {/* --- PLATFORM CONVERSION METRICS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ecosystem Views</span>
            <Eye size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-black text-[#141414] tracking-tight">{mockAnalytics.totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline Leads</span>
            <MessageSquare size={16} className="text-green-500" />
          </div>
          <div className="text-xl font-black text-[#141414] tracking-tight">{mockAnalytics.totalLeads}</div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Conversion rate</span>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 tracking-tight">{mockAnalytics.conversionRate}%</div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline weight</span>
            <span className="text-xs font-bold text-cyan-500 font-mono">KES</span>
          </div>
          <div className="text-xl font-black text-[#141414] tracking-tight">{formatCurrency(mockAnalytics.revenuePipeline)}</div>
        </div>
      </div>

      {/* --- DATA PANELS ARCHITECTURE TAB CONTROL DECK --- */}
      <div className="border-b border-gray-100 flex gap-6 overflow-x-auto scrollbar-none pt-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn("pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap", activeTab === 'overview' ? 'border-[#141414] text-[#141414]' : 'border-transparent text-gray-400 hover:text-gray-600')}
        >
          Listing Schema Blueprint
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={cn("pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap", activeTab === 'analytics' ? 'border-[#141414] text-[#141414]' : 'border-transparent text-gray-400 hover:text-gray-600')}
        >
          Ecosystem Engagement
        </button>
        <button 
          onClick={() => setActiveTab('documents')}
          className={cn("pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap", activeTab === 'documents' ? 'border-[#141414] text-[#141414]' : 'border-transparent text-gray-400 hover:text-gray-600')}
        >
          Compliance Vault
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={cn("pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap", activeTab === 'audit' ? 'border-[#141414] text-[#141414]' : 'border-transparent text-gray-400 hover:text-gray-600')}
        >
          Ecosystem Audit Logs ({logs.length})
        </button>
      </div>

      {/* --- SPLIT ACTION BOARD WORKSPACE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* STRUCTURAL CONTENT DECK BLOCK */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h3 className="font-display text-sm font-black text-[#141414] uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={16} className="text-gray-400" /> Core Asset Specification Template
                </h3>
                <button
                  onClick={() => isEditing ? saveGlobalChanges() : setIsEditing(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all shadow-sm",
                    isEditing ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {isEditing ? <><Save size={12} /> Commit Fields</> : <><Edit3 size={12} /> Override Schema</>}
                </button>
              </div>

              {/* Editable Fields Map Frame */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Property Designation Title</label>
                  <input 
                    type="text" name="title" disabled={!isEditing} value={property.title} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-semibold text-[#141414] disabled:opacity-60 focus:outline-none focus:border-[#141414] focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Asset Listing Price Valuation (KES)</label>
                  <input 
                    type="number" name="price" disabled={!isEditing} value={property.price} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-green-600 disabled:opacity-60 focus:outline-none focus:border-[#141414] focus:bg-white transition-all shadow-inner font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Geographic Location Boundaries</label>
                  <input 
                    type="text" name="location" disabled={!isEditing} value={property.location} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-semibold text-[#141414] disabled:opacity-60 focus:outline-none focus:border-[#141414] focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Asset Classification Domain</label>
                  <select 
                    name="type" disabled={!isEditing} value={property.type} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-semibold text-[#141414] disabled:opacity-60 focus:outline-none focus:border-[#141414] focus:bg-white transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="Residential">Residential Portfolio</option>
                    <option value="Commercial">Commercial Portfolio</option>
                    <option value="Industrial">Industrial Infrastructure</option>
                    <option value="Land / Plot">Speculative Land Development</option>
                  </select>
                </div>

                {/* Quantitative Vector Grid */}
                <div className="grid grid-cols-3 gap-3 md:col-span-2 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-center">Gross SQFT</label>
                    <input type="number" name="sqft" disabled={!isEditing} value={property.sqft} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-center text-[#141414]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-center">Bed Units</label>
                    <input type="number" name="bedrooms" disabled={!isEditing} value={property.bedrooms} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-center text-[#141414]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-center">Bath Configurations</label>
                    <input type="number" name="bathrooms" disabled={!isEditing} value={property.bathrooms} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-center text-[#141414]" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Marketing Copywriting Matrix</label>
                  <textarea 
                    name="description" rows={5} disabled={!isEditing} value={property.description} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] p-4 text-xs font-medium text-gray-700 disabled:opacity-60 focus:outline-none focus:border-[#141414] focus:bg-white transition-all shadow-inner resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-display text-sm font-black text-[#141414] uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-4">
                <BarChart3 size={16} className="text-gray-400" /> Funnel Performance Metrics
              </h3>
              <div className="bg-gray-50 p-8 rounded-[1.5rem] border border-gray-100 text-center space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ecosystem Activity Heatmap Diagram</p>
                <div className="h-40 flex items-end justify-center gap-6 pt-4 border-b border-gray-200/60 max-w-md mx-auto">
                  <div className="w-10 bg-gray-200 h-1/4 rounded-t-lg"></div>
                  <div className="w-10 bg-gray-200 h-2/5 rounded-t-lg"></div>
                  <div className="w-10 bg-gray-300 h-3/5 rounded-t-lg"></div>
                  <div className="w-10 bg-[#141414] h-5/6 rounded-t-lg shadow-sm"></div>
                </div>
                <p className="text-[11px] text-gray-400 font-medium pt-2">Algorithmic ingestion rate trends monitored over the active billing lifecycle cycle.</p>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-display text-sm font-black text-[#141414] uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-4">
                <FileText size={16} className="text-gray-400" /> Secure Documents Vault Tree
              </h3>
              <div className="space-y-2.5">
                {['Registry_Title_Deed_Signed.pdf', 'Exclusive_Listing_Mandate.pdf', 'NEMA_Compliance_Certificate.pdf'].map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-all">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                      <FileText size={16} className="text-amber-500 shrink-0" />
                      {doc}
                    </div>
                    <button className="text-[10px] flex items-center gap-1 text-[#141414] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50">
                      <Download size={12} /> Audit File
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-display text-sm font-black text-[#141414] uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-4">
                <History size={16} className="text-gray-400" /> Immutable Administrative History Logs
              </h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-800">{log.action}</span>
                      <span className="text-gray-400 font-mono text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{log.details}</p>
                    <div className="text-[10px] font-bold text-blue-900 flex items-center gap-1 pt-0.5">
                      <span>{log.performedBy}</span> 
                      <span className="text-gray-400 font-medium">({log.role})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- GLOBAL ADMINISTRATIVE COMPLIANCE DECK SIDEBAR --- */}
        <div className="space-y-6">
          
          {/* ASSIGNMENT CONTROL PANEL MODULE */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#141414] flex items-center gap-2 border-b border-gray-50 pb-3">
              <UserPlus size={14} className="text-gray-400" /> Representative Mapping
            </h4>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Agent Representative</label>
              <select
                value={selectedAgent}
                onChange={handleAgentReassignment}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-inner appearance-none cursor-pointer"
              >
                {mockAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} (Split: {agent.commissionRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100/60 text-[11px] space-y-2 text-gray-500 font-medium">
              <div className="flex justify-between">
                <span>Active Agent Structural Load:</span>
                <span className="font-bold text-[#141414]">
                  {mockAgents.find(a => a.id === selectedAgent)?.activeListings} Properties
                </span>
              </div>
              <div className="flex justify-between">
                <span>Agency Commission Model:</span>
                <span className="font-bold text-green-600">
                  {mockAgents.find(a => a.id === selectedAgent)?.commissionRate}% Fixed Split
                </span>
              </div>
            </div>
          </div>

          {/* DISCOVERY CORE TUNING ENGINES */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#141414] flex items-center gap-2 border-b border-gray-50 pb-3">
              <Settings size={14} className="text-gray-400" /> Algorithmic Indexing Parameters
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100/60">
                <div>
                  <span className="block text-xs font-bold text-[#141414]">Feature on Homepage Matrix</span>
                  <span className="text-[10px] font-medium text-gray-400 block mt-0.5">Pins listing to corporate root views.</span>
                </div>
                <button 
                  onClick={() => handleToggleChange('featured')}
                  className={cn("w-10 h-5.5 rounded-full transition-colors relative outline-none border border-transparent", property.featured ? 'bg-[#141414]' : 'bg-gray-200')}
                >
                  <span className={cn("absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm", property.featured ? 'translate-x-4.5' : '')} />
                </button>
              </div>

              <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100/60">
                <div>
                  <span className="block text-xs font-bold text-[#141414]">Ecosystem Recommendation Boost</span>
                  <span className="text-[10px] font-medium text-gray-400 block mt-0.5">Applies search indexing multiplier.</span>
                </div>
                <button 
                  onClick={() => handleToggleChange('boosted')}
                  className={cn("w-10 h-5.5 rounded-full transition-colors relative outline-none border border-transparent", property.boosted ? 'bg-[#141414]' : 'bg-gray-200')}
                >
                  <span className={cn("absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm", property.boosted ? 'translate-x-4.5' : '')} />
                </button>
              </div>
            </div>
          </div>

          {/* SYSTEM RETENTION SECURITY BLOCK */}
          <div className="bg-red-50/40 p-5 rounded-[2rem] border border-red-100 space-y-3 text-center">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-red-600 flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> Critical Data Purge Clearance
            </h5>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed px-1">
              Purging this structural entity removes active ledger records, historic analytics, token instances, and compliance logs instantly.
            </p>
            <button 
              onClick={() => { if(confirm('Purge structural asset entirely from servers?')) alert('Asset Purged.'); }}
              className="w-full py-2.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all uppercase tracking-wider shadow-sm"
            >
              Purge Asset Record
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};