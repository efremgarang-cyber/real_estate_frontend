import React from "react";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Home as HomeIcon, 
  Users as UsersIcon, 
  Shield as ShieldIcon 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { formatCurrency, cn } from "../../lib/utils";

const data = [
  { name: "Jan", deals: 4, revenue: 12000000 },
  { name: "Feb", deals: 7, revenue: 21000000 },
  { name: "Mar", deals: 5, revenue: 15000000 },
  { name: "Apr", deals: 8, revenue: 25000000 },
  { name: "May", deals: 12, revenue: 38000000 },
];

export const DashboardOverview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Active Listings" 
          value="42" 
          trend="+12%" 
          icon={HomeIcon} 
        />
        <StatCard 
          label="New Leads" 
          value="128" 
          trend="+24%" 
          icon={UsersIcon} 
        />
        <StatCard 
          label="Closed Deals" 
          value="18" 
          trend="+8%" 
          icon={TrendingUp} 
        />
        <StatCard 
          label="KYC Pending" 
          value="7" 
          trend="-2" 
          icon={ShieldIcon} 
          trendInverse
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dashboard-card">
          <h3 className="text-sm font-mono uppercase text-gray-500 mb-6 italic">Revenue performance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  fontFamily="JetBrains Mono"
                  tickFormatter={(val) => `KES ${val/1000000}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ 
                    backgroundColor: '#141414', 
                    border: 'none', 
                    color: '#E4E3E0',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="revenue" fill="#141414" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="text-sm font-mono uppercase text-gray-500 mb-6 italic">Deal volume</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  fontFamily="JetBrains Mono"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#141414', 
                    border: 'none', 
                    color: '#E4E3E0',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="deals" 
                  stroke="#141414" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#141414", strokeWidth: 2, stroke: "#E4E3E0" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black uppercase italic">Recent Listings</h3>
          <Link to="/properties" className="text-sm font-mono uppercase underline italic hover:text-gray-600 transition-colors">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: "1", title: "Modern Villa in Runda", price: 45000000, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" },
            { id: "2", title: "Luxury Apt Kilimani", price: 22000000, img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800" },
            { id: "3", title: "Naivasha Land Plot", price: 12000000, img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800" }
          ].map((item) => (
            <Link 
              key={item.id} 
              to={`/properties/${item.id}`}
              className="dashboard-card group cursor-pointer transition-all hover:translate-y-[-4px]"
            >
              <div className="relative aspect-video bg-gray-200 mb-4 overflow-hidden border border-[#141414]">
                <img 
                  src={item.img}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  alt="Property"
                />
                <div className="absolute top-2 right-2 bg-[#141414] text-[#E4E3E0] text-[10px] px-2 py-1 font-mono uppercase italic">
                  Active
                </div>
              </div>
              <h4 className="font-bold text-lg leading-tight mb-1">{item.title}</h4>
              <p className="text-xs font-mono text-gray-500 uppercase mb-4 italic">Nairobi, Kenya</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black">{formatCurrency(item.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon: Icon, trendInverse = false }: any) => {
  const isPositive = trend.startsWith("+");
  const trendingColor = trendInverse 
    ? (isPositive ? "text-red-500" : "text-green-500")
    : (isPositive ? "text-green-500" : "text-red-500");

  return (
    <div className="dashboard-card flex items-start justify-between">
      <div>
        <p className="text-[10px] font-mono text-gray-500 uppercase mb-1 italic">{label}</p>
        <p className="text-3xl font-black">{value}</p>
        <p className={cn("text-[10px] font-mono mt-2 flex items-center gap-1 italic", trendingColor)}>
          {trend} from last month
        </p>
      </div>
      <div className="bg-[#141414] text-[#E4E3E0] p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
        <Icon size={20} />
      </div>
    </div>
  );
};
