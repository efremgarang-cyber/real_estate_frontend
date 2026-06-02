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
    <div className="space-y-8 font-sans pb-12">
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
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-gray-400 mb-8">Revenue performance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  tick={{ fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(val) => `KES ${val/1000000}M`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #f3f4f6', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    color: '#141414',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                />
                <Bar dataKey="revenue" fill="#141414" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-gray-400 mb-8">Deal volume</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  tick={{ fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  tick={{ fill: '#9ca3af' }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #f3f4f6', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    color: '#141414',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="deals" 
                  stroke="#141414" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#ffffff", strokeWidth: 2, stroke: "#141414" }} 
                  activeDot={{ r: 6, fill: "#141414", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Listings Grid */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-[#141414]">Recent Listings</h3>
          <Link to="/properties" className="text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
            View all
          </Link>
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
              className="bg-white rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 group cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all flex flex-col"
            >
              <div className="relative aspect-video bg-gray-100 mb-5 overflow-hidden rounded-2xl shrink-0">
                <img 
                  src={item.img}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Property"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-display font-bold text-lg text-[#141414] leading-tight pr-4">{item.title}</h4>
                    {/* STRICT STATUS TEXT: Clean typography, no glow, no backgrounds */}
                    <span className="text-green-600 font-bold uppercase text-xs tracking-wider shrink-0 mt-1">
                      Active
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">Nairobi, Kenya</p>
                </div>
                <div className="mt-auto">
                  <span className="text-xl font-bold text-[#141414]">{formatCurrency(item.price)}</span>
                </div>
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
    <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 flex items-start justify-between transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold text-[#141414]">{value}</p>
        <p className={cn("text-sm font-medium mt-2 flex items-center gap-1.5", trendingColor)}>
          {trend} <span className="text-gray-400 text-xs">from last month</span>
        </p>
      </div>
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#141414] shrink-0">
        <Icon size={20} />
      </div>
    </div>
  );
};