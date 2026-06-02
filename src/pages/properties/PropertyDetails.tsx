import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  CheckCircle,
  Phone,
  Mail,
  Download,
  Share2,
  Lock,
  Loader2,
  FileText,
  Plus,
  Send,
  Sparkles,
  X,
  AlertCircle,
  Check,
  Info,
  MessageCircle,
  User,
  Building2
} from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import { propertyApi } from "../../api/properties";
import { api } from "../../lib/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Toast Notification Component
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />
  };

  const colors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-orange-50 border-orange-200",
    info: "bg-blue-50 border-blue-200"
  };

  return (
    <div className={`fixed top-4 right-4 z-50 w-96 rounded-xl border shadow-lg ${colors[notification.type]} animate-in slide-in-from-top-2 duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icons[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
          </div>
          <button title="Close notification"
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Share Modal Component
const ShareModal: React.FC<{ property: any; onClose: () => void; onCopySuccess: () => void }> = ({ 
  property, 
  onClose, 
  onCopySuccess 
}) => {
  const shareUrl = `${window.location.origin}/properties/${property.id}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      onCopySuccess();
      onClose();
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=Check out this property: ${property.title}&body=I thought you might be interested in this property: ${shareUrl}`;
    onClose();
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=Check out this property: ${property.title} - ${shareUrl}`, '_blank');
    onClose();
  };

  const shareViaTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=Check out this property: ${property.title}&url=${shareUrl}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-[#141414]">Share Property</h3>
          <button title="Close share modal"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Property Link</p>
            <p className="text-sm font-medium text-[#141414] break-all">{shareUrl}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
            >
              Copy Link
            </button>
            <button
              onClick={shareViaEmail}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
            >
              Email
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={shareViaTwitter}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors"
            >
              Twitter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contact Agent Modal Component
const ContactAgentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  agent: any;
  property: any;
  onSuccess: () => void;
}> = ({ isOpen, onClose, agent, property, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send to backend API
      await api.post('/contact-agent', {
        agentId: agent.id,
        agentEmail: agent.email,
        agentName: agent.name,
        propertyId: property.id,
        propertyTitle: property.title,
        propertyUrl: window.location.href,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        message: formData.message,
        timestamp: new Date().toISOString()
      });

      onSuccess();
      onClose();
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Phone size={20} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[#141414]">Contact Agent</h3>
          </div>
          <button title="Close modal"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 mb-2">
            <p className="text-sm font-semibold text-gray-700">Agent: {agent.name}</p>
            <p className="text-xs text-gray-500 mt-1">Property: {property.title}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder="254712345678"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              rows={4}
              placeholder={`I'm interested in ${property.title}. I would like to schedule a viewing...`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Send Email Modal Component
const SendEmailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  agent: any;
  property: any;
  onSuccess: () => void;
}> = ({ isOpen, onClose, agent, property, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/send-email', {
        to: agent.email || `${agent.name.toLowerCase().replace(' ', '.')}@vantage.com`,
        cc: formData.email,
        subject: formData.subject,
        body: formData.message,
        template: 'direct_email',
        data: {
          customerName: formData.name,
          agentName: agent.name,
          propertyTitle: property.title,
          propertyUrl: window.location.href
        }
      });

      onSuccess();
      onClose();
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Mail size={20} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-[#141414]">Send Email to Agent</h3>
          </div>
          <button title="Close modal"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">To:</span> {agent.email || `${agent.name.toLowerCase().replace(' ', '.')}@vantage.com`}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">Property:</span> {property.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder={`Inquiry about ${property.title}`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              rows={6}
              placeholder="Write your message here..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isSubmitting ? "Sending..." : "Send Email"}
          </button>
        </form>
      </div>
    </div>
  );
};

// DocuSign Request Modal Component
const DocuSignModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  agent: any;
  property: any;
  onSuccess: () => void;
}> = ({ isOpen, onClose, agent, property, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idNumber: '',
    documentType: 'nda',
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/docusign/request', {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        customerName: formData.name,
        customerEmail: formData.email,
        customerId: formData.idNumber,
        propertyId: property.id,
        propertyTitle: property.title,
        documentType: formData.documentType,
        additionalNotes: formData.additionalNotes,
        returnUrl: `${window.location.origin}/documents/sign`
      });

      onSuccess();
      onClose();
      setFormData({ name: '', email: '', idNumber: '', documentType: 'nda', additionalNotes: '' });
    } catch (error) {
      console.error("Error requesting DocuSign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[#141414]">Request DocuSign</h3>
          </div>
          <button title="Close modal"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">🔐 Powered by Vantage Legal Engine</p>
            <p>Securely sign documents online with DocuSign integration</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ID Number *</label>
            <input
              type="text"
              required
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
            <select title="formdata"
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
            >
              <option value="nda">Non-Disclosure Agreement (NDA)</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="sales_agreement">Sales Agreement</option>
              <option value="lease_agreement">Lease Agreement</option>
              <option value="commission_agreement">Commission Agreement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
              rows={3}
              placeholder="Any specific requirements or notes for the document..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {isSubmitting ? "Requesting..." : "Request Signature"}
          </button>
        </form>
      </div>
    </div>
  );
};

// PDF Generation Function
const generatePDFBrochure = async (property: any, images: string[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yOffset = margin;

  const checkNewPage = (additionalHeight: number) => {
    if (yOffset + additionalHeight > pageHeight - margin) {
      pdf.addPage();
      yOffset = margin;
      return true;
    }
    return false;
  };

  // Title Section
  pdf.setFillColor(20, 20, 20);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(property.title || "Property Brochure", margin, 25);
  yOffset = 55;

  // Property Images
  if (images.length > 0) {
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(margin, yOffset, pageWidth - (margin * 2), 80, 5, 5, 'FD');
    
    try {
      const img = await html2canvas(document.createElement('div'), {
        backgroundColor: '#f5f5f5',
        scale: 2
      });
      const imgData = img.toDataURL('image/jpeg');
      pdf.addImage(imgData, 'JPEG', margin + 5, yOffset + 5, (pageWidth - (margin * 2) - 10) / 2, 70);
    } catch (error) {
      console.error("Error adding image to PDF:", error);
    }
    
    yOffset += 95;
  }

  // Property Details Section
  pdf.setFontSize(18);
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.text("Property Details", margin, yOffset);
  yOffset += 10;
  
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 10;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  
  const details = [
    { label: "Price", value: formatCurrency(property.price) },
    { label: "Location", value: property.location || "Not specified" },
    { label: "Bedrooms", value: property.beds?.toString() || "-" },
    { label: "Bathrooms", value: property.baths?.toString() || "-" },
    { label: "Area", value: property.sqft ? `${property.sqft.toLocaleString()} SQFT` : "-" },
    { label: "Status", value: property.status || "Active" },
  ];

  details.forEach((detail, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = margin + (col * ((pageWidth - (margin * 2)) / 2));
    
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 100, 100);
    pdf.text(detail.label, x, yOffset + (row * 15));
    
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20, 20, 20);
    pdf.text(detail.value, x, yOffset + (row * 15) + 5);
  });
  
  yOffset += Math.ceil(details.length / 2) * 15 + 15;

  // Description Section
  checkNewPage(60);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.text("Description", margin, yOffset);
  yOffset += 8;
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 80);
  const description = property.description || "No description provided.";
  const splitDescription = pdf.splitTextToSize(description, pageWidth - (margin * 2));
  pdf.text(splitDescription, margin, yOffset);
  yOffset += (splitDescription.length * 5) + 15;

  // Amenities Section
  if (property.amenities?.length > 0) {
    checkNewPage(50);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 20, 20);
    pdf.text("Amenities", margin, yOffset);
    yOffset += 8;
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    
    const amenitiesPerRow = 2;
    property.amenities.forEach((amenity: string, index: number) => {
      const row = Math.floor(index / amenitiesPerRow);
      const col = index % amenitiesPerRow;
      const x = margin + (col * ((pageWidth - (margin * 2)) / amenitiesPerRow));
      pdf.text(`• ${amenity}`, x, yOffset + (row * 7));
    });
    yOffset += Math.ceil(property.amenities.length / amenitiesPerRow) * 7 + 15;
  }

  // Agent Information Section
  checkNewPage(50);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.text("Listing Agent", margin, yOffset);
  yOffset += 8;
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 80);
  const agent = property.agent || { name: "System Admin" };
  pdf.text(`Name: ${agent.name}`, margin, yOffset);
  yOffset += 6;
  pdf.text("Verified Professional", margin, yOffset);
  yOffset += 15;

  // Footer
  pdf.setFillColor(245, 245, 245);
  pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated on ${new Date().toLocaleDateString()} - Vantage Real Estate Platform`, margin, pageHeight - 10);

  return pdf;
};

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // New modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDocuSignModalOpen, setIsDocuSignModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  const addNotification = (type: ToastNotification['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await propertyApi.getById(id);
        setProperty(response.data);
        if (response.data) {
          setOfferAmount(response.data.price.toString());
        }
      } catch (err) {
        console.error("Failed to fetch property:", err);
        setError("Failed to load property details. Please try again.");
        addNotification('error', 'Loading Failed', 'Unable to load property details. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleDownloadBrochure = async () => {
    if (!property) return;
    
    setIsGeneratingPDF(true);
    addNotification('info', 'Generating Brochure', 'Please wait while we create your PDF brochure...');
    
    try {
      const images = property.images?.length > 0 ? property.images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"];
      const pdf = await generatePDFBrochure(property, images);
      pdf.save(`${property.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_brochure.pdf`);
      addNotification('success', 'Brochure Downloaded', 'Your property brochure has been successfully generated and downloaded.');
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      addNotification('error', 'Download Failed', 'Unable to generate brochure. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleCopySuccess = () => {
    addNotification('success', 'Link Copied!', 'Property link has been copied to your clipboard.');
  };

  // New handlers for agent actions
  const handleContactAgent = () => {
    setIsContactModalOpen(true);
  };

  const handleSendEmail = () => {
    setIsEmailModalOpen(true);
  };

  const handleDocuSign = () => {
    setIsDocuSignModalOpen(true);
  };

  const handleAgentActionSuccess = (action: string) => {
    addNotification('success', `${action} Sent!`, `Your ${action.toLowerCase()} has been successfully sent to the agent.`);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setIsSubmittingLead(true);
    try {
      await api.post('/leads', {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        value: parseFloat(offerAmount),
        property_id: property.id,
        kanban_stage: 'new'
      });

      setLeadSuccess(true);
      addNotification('success', 'Offer Submitted!', 'Your offer has been successfully sent to our pipeline. An agent will contact you shortly.');
    } catch (err) {
      console.error("Failed to forward checkout to leads pipeline:", err);
      addNotification('error', 'Submission Failed', 'Unable to submit your offer. Please check your connection and try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-4">
        <Loader2 size={32} className="animate-spin text-[#141414]" />
        <p className="text-sm font-medium text-gray-500">Retrieving secure vault data...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center p-12 font-sans">
        <h2 className="font-display text-2xl font-bold text-[#141414] mb-4">
          {error || "Property Not Found"}
        </h2>
        <Link to="/properties" className="px-6 py-3 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-colors">
          Back to Listings
        </Link>
      </div>
    );
  }

  const expirationDate = property.contract_end_date || property.expirationDate;
  const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
  const isNearExpiry = expirationDate ? (new Date(expirationDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  const images = property.images?.length > 0 ? property.images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"];
  const agent = property.agent || { 
    name: "System Admin", 
    email: "admin@vantage.com",
    phone: "+254700000000",
    avatar: "https://ui-avatars.com/api/?name=Admin&background=141414&color=fff" 
  };
  const amenities = property.amenities || [];

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Toast Notifications */}
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      {/* Modals */}
      {isShareModalOpen && (
        <ShareModal
          property={property}
          onClose={() => setIsShareModalOpen(false)}
          onCopySuccess={handleCopySuccess}
        />
      )}

      <ContactAgentModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        agent={agent}
        property={property}
        onSuccess={() => handleAgentActionSuccess('Message')}
      />

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        agent={agent}
        property={property}
        onSuccess={() => handleAgentActionSuccess('Email')}
      />

      <DocuSignModal
        isOpen={isDocuSignModalOpen}
        onClose={() => setIsDocuSignModalOpen(false)}
        agent={agent}
        property={property}
        onSuccess={() => handleAgentActionSuccess('DocuSign Request')}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/properties" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
          <ArrowLeft size={16} /> Back to Listings
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Share2 size={16} /> Share
          </button>
          <button 
            onClick={handleDownloadBrochure}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isGeneratingPDF ? "Generating..." : "Brochure"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 aspect-[21/9] bg-gray-100 rounded-[2rem] overflow-hidden">
              <img
                src={images[0]}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                alt={property.title}
              />
            </div>
            {images.slice(1, 3).map((img: string, i: number) => (
              <div key={i} className="aspect-video bg-gray-100 rounded-[2rem] overflow-hidden">
                <img
                  src={img}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  alt={`${property.title} extra ${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl font-bold text-[#141414] mb-2">{property.title}</h1>
                <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MapPin size={16} /> {property.location}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Asking Price</p>
                <p className="text-3xl font-bold text-[#141414] mb-2">{formatCurrency(property.price)}</p>
                <span className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  property.status === "active" || property.status === "Active" ? "text-green-600" : "text-gray-400"
                )}>
                  {property.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-2xl mb-8">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Beds</span>
                <div className="flex items-center gap-2 font-bold text-[#141414] text-lg">
                  <Bed size={20} className="text-gray-400" /> {property.bedrooms || "-"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Baths</span>
                <div className="flex items-center gap-2 font-bold text-[#141414] text-lg">
                  <Bath size={20} className="text-gray-400" /> {property.baths || "-"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Area</span>
                <div className="flex items-center gap-2 font-bold text-[#141414] text-lg">
                  <Maximize2 size={20} className="text-gray-400" /> {property.sqft ? property.sqft.toLocaleString() : "-"} <span className="text-xs font-medium text-gray-500">SQFT</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expiry</span>
                <div className={cn(
                  "flex items-center gap-2 font-bold text-lg",
                  isExpired ? "text-red-500" : isNearExpiry ? "text-orange-500" : "text-[#141414]"
                )}>
                  <Calendar size={20} className={isExpired ? "text-red-400" : isNearExpiry ? "text-orange-400" : "text-gray-400"} />
                  <span className="text-sm">{expirationDate || "Not Set"}</span>
                </div>
              </div>
            </div>

            {isNearExpiry && !isExpired && (
              <div className="mb-8 p-4 bg-orange-50 rounded-xl text-orange-800 text-sm font-medium flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar size={18} className="text-orange-600" />
                </div>
                <span>Warning: Smart Listing Engine alert - Contract expires in less than 7 days. Automatic unlisting scheduled.</span>
              </div>
            )}

            {isExpired && (
              <div className="mb-8 p-4 bg-red-50 rounded-xl text-red-800 text-sm font-medium flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar size={18} className="text-red-600" />
                </div>
                <span>System Notice: Property is EXPIRED. Listing has been automatically hidden from public frontends.</span>
              </div>
            )}

            <div>
              <h3 className="font-display text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed">{property.description || "No description provided."}</p>
            </div>

            {amenities.length > 0 && (
              <div className="mt-10">
                <h3 className="font-display text-xs font-semibold uppercase text-gray-400 tracking-wider mb-6">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5">
                  {amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-3 text-sm font-medium text-[#141414]">
                      <CheckCircle size={18} className="text-gray-300" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Layout */}
        <div className="space-y-6">
          {/* Listing Agent Section - WITH WORKING BUTTONS */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
            <h3 className="font-display text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">Listing Agent</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                <img src={agent.avatar} className="w-full h-full object-cover" alt={agent.name} />
              </div>
              <div>
                <p className="font-bold text-[#141414] text-lg">{agent.name}</p>
                <p className="text-xs font-medium text-gray-500">Verified Professional</p>
                {agent.email && (
                  <p className="text-xs text-gray-400 mt-1">{agent.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {/* Contact Agent Button - WORKING */}
              <button 
                onClick={handleContactAgent}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors"
              >
                <Phone size={18} /> Contact Agent
              </button>
              
              {/* Send Email Button - WORKING */}
              <button 
                onClick={handleSendEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-sm font-medium transition-colors"
              >
                <Mail size={18} /> Send Email
              </button>

              <div className="pt-4 mt-2 border-t border-gray-100">
                {/* Request DocuSign Button - WORKING */}
                <button 
                  onClick={handleDocuSign}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
                >
                  <FileText size={18} /> Request DocuSign
                </button>
                <p className="text-[10px] font-medium text-center text-gray-400 mt-3">
                  Powered by Vantage Legal Engine
                </p>
              </div>
            </div>
          </div>

          {/* Secure Vault Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gray-50 rounded-xl text-[#141414]">
                <Lock size={18} />
              </div>
              <h3 className="font-display font-bold text-[#141414] text-sm">Title Deed Verification</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">Documentation for this property is locked in the Vantage Secure Vault. Agents: Upload Title Deed to initiate verification.</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/vault")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} /> Upload to Vault
              </button>
              <div className="bg-gray-50 py-2.5 px-4 rounded-xl text-xs font-semibold text-center text-gray-500 border border-gray-100">
                Status: Pending Verification
              </div>
            </div>
          </div>

          {/* Customer Checkout Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-60 -mr-5 -mt-5" />
            
            {!leadSuccess ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 block mb-1">Secure Checkout</span>
                  <h3 className="font-display text-xl font-bold text-[#141414] mb-1">Acquire Asset</h3>
                  <p className="text-xs text-gray-400 leading-snug">Submit your details to establish secure routing to the negotiation desk.</p>
                </div>

                <div className="pt-2 border-t border-gray-50 space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#141414] focus:bg-white transition-all text-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#141414] focus:bg-white transition-all text-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="2547XXXXXXXX"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#141414] focus:bg-white transition-all text-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your Offer (KES)</label>
                    <input title="offeramount"
                      type="number" required value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#141414] focus:bg-white transition-all text-[#141414]"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmittingLead}
                  className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#141414] hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
                >
                  {isSubmittingLead ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                  {isSubmittingLead ? "Opening File..." : "Submit Offer to Pipeline"}
                </button>
              </form>
            ) : (
              <div className="py-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#141414]">Offer Logged Successfully!</h4>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed px-1">
                    Your checkout file has been transmitted to the core ecosystem. An account manager has been assigned to coordinate negotiations.
                  </p>
                </div>
                <button 
                  onClick={() => setLeadSuccess(false)}
                  className="text-xs font-bold text-gray-500 hover:text-[#141414] underline underline-offset-4 pt-2 transition-colors"
                >
                  Submit another inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};