import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
}

interface StatCard {
  label: string;
  value: string | number;
  color: string;
}

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({
    totalLeads: 0,
    leadsToday: 0,
    avgPerHour: 0,
    recommendedTeamSize: 0,
  });
  const [frequencyData, setFrequencyData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://srv1519953.hstgr.cloud/crm_exports/leads.csv');
      if (!response.ok) throw new Error('Failed to fetch CSV');

      const csv = await response.text();
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const parsedLeads: Lead[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          id: values[0] || '',
          name: values[1] || '',
          phone: values[2] || '',
          status: values[3] || '',
          created_at: values[4] || '',
        };
      }).filter(lead => lead.id && lead.name);

      setLeads(parsedLeads);
      calculateStats(parsedLeads);
      calculateFrequency(parsedLeads);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData: Lead[]) => {
    const today = new Date().toDateString();
    const leadsToday = leadsData.filter(lead =>
      new Date(lead.created_at).toDateString() === today
    ).length;

    const avgPerHour = leadsToday > 0 ? (leadsToday / 24).toFixed(2) : '0';
    const recommendedTeamSize = Math.ceil(leadsToday / 10);

    setStats({
      totalLeads: leadsData.length,
      leadsToday,
      avgPerHour: parseFloat(avgPerHour),
      recommendedTeamSize: recommendedTeamSize > 0 ? recommendedTeamSize : 1,
    });
  };

  const calculateFrequency = (leadsData: Lead[]) => {
    const frequency: Record<string, number> = {};

    leadsData.forEach(lead => {
      const date = new Date(lead.created_at);
      const hours = Math.floor(date.getHours() / 0.5) * 0.5;
      const timeSlot = `${String(Math.floor(hours)).padStart(2, '0')}:${String((hours % 1) * 60).padStart(2, '0')}`;

      frequency[timeSlot] = (frequency[timeSlot] || 0) + 1;
    });

    setFrequencyData(frequency);
  };

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 60000);
    return () => clearInterval(interval);
  }, []);

  const maxFrequency = Math.max(...Object.values(frequencyData), 1);
  const recentLeads = leads.slice(0, 10);

  const statCards: StatCard[] = [
    { label: 'Total Leads', value: stats.totalLeads, color: 'bg-blue-500' },
    { label: 'Leads Today', value: stats.leadsToday, color: 'bg-green-500' },
    { label: 'Avg/Hour', value: stats.avgPerHour, color: 'bg-purple-500' },
    { label: 'Recommended Team', value: stats.recommendedTeamSize, color: 'bg-orange-500' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Leads Dashboard</h1>
        <div className="flex items-center justify-between">
          <p className="text-slate-600">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`${card.color} h-2`}></div>
            <div className="p-6">
              <p className="text-slate-600 text-sm font-medium mb-2">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Frequency Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Leads by 30-Minute Intervals (Last 24H)</h2>
        <div className="flex items-end gap-1 h-64 overflow-x-auto pb-2">
          {Object.entries(frequencyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([timeSlot, count]) => {
              const height = (count / maxFrequency) * 100;
              return (
                <div key={timeSlot} className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500"
                    style={{ height: `${height}%` }}
                    title={`${timeSlot}: ${count} leads`}
                  ></div>
                  <p className="text-xs text-slate-600 mt-2 text-center">{timeSlot}</p>
                </div>
              );
            })}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Total intervals: {Object.keys(frequencyData).length} | Peak: {Math.max(...Object.values(frequencyData), 0)} leads
        </p>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Recent Leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length > 0 ? (
                recentLeads.map((lead, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-mono">{lead.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{lead.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : lead.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(lead.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {loading ? 'Loading leads...' : 'No leads found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentLeads.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            Showing {recentLeads.length} of {leads.length} leads
          </div>
        )}
      </div>
    </div>
  );
}
