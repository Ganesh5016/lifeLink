// src/app/dashboard/requests/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, MapPin, Clock, Users, Filter, Search, Check, X, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PRIORITIES = ['All', 'critical', 'high', 'medium', 'low'];

function RequestCard({ req, onAccept, onComplete, userId }: any) {
  const [accepting, setAccepting] = useState(false);
  const myResponse = req.responses?.find((r: any) => r.donor?._id === userId || r.donor === userId);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept(req._id);
      toast.success('Request accepted! Contact the patient to coordinate.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept');
    } finally {
      setAccepting(false);
    }
  };

  const priorityStyle = {
    critical: 'border-red-500/60 bg-red-500/5',
    high: 'border-orange-500/40 bg-orange-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-blue-500/30 bg-blue-500/5',
  }[req.priority] || 'border-white/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 border ${priorityStyle}`}
    >
      <div className="flex items-start gap-4">
        <div className="blood-badge flex-shrink-0">{req.bloodGroup}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white">{req.hospitalName}</h3>
            <span className={`priority-${req.priority} flex-shrink-0`}>{req.priority}</span>
          </div>

          <p className="text-slate-400 text-sm mb-3">
            Patient: <span className="text-white">{req.patientName}</span>
            {req.medicalReason && <span className="text-slate-500"> · {req.medicalReason}</span>}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1">
              <Droplets size={12} className="text-red-400" />
              {req.unitsRequired} units needed ({req.unitsCollected} collected)
            </span>
            {req.location?.address && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-blue-400" />
                {req.location.address.slice(0, 40)}...
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} className="text-green-400" />
              {req.responses?.length || 0} responses
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Units collected</span>
              <span>{req.unitsCollected}/{req.unitsRequired}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(req.unitsCollected / req.unitsRequired) * 100}%` }}
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {myResponse ? (
              <div className="flex items-center gap-2 text-sm">
                {myResponse.status === 'accepted' && (
                  <>
                    <span className="flex items-center gap-1 text-green-400">
                      <Check size={14} /> Accepted
                    </span>
                    <a href={`tel:${req.contactNumber}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all">
                      <Phone size={12} /> Call Patient
                    </a>
                    <button
                      onClick={() => onComplete(req._id)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                    >
                      Mark Donated
                    </button>
                  </>
                )}
                {myResponse.status === 'donated' && (
                  <span className="flex items-center gap-1 text-purple-400"><Check size={14} /> Donated ✓</span>
                )}
              </div>
            ) : req.status === 'active' ? (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="btn-emergency py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {accepting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                Accept & Donate
              </button>
            ) : (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <Check size={14} /> {req.status}
              </span>
            )}

            <a
              href={`tel:${req.contactNumber}`}
              className="ml-auto p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Phone size={16} />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ bloodGroup: 'All', priority: 'All', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (filters.bloodGroup !== 'All') params.set('bloodGroup', filters.bloodGroup);
      if (filters.priority !== 'All') params.set('priority', filters.priority);

      const { data } = await api.get(`/requests?${params}`);
      setRequests(data.requests || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filters, page]);

  const handleAccept = async (id: string) => {
    await api.put(`/requests/${id}/accept`);
    fetchRequests();
  };

  const handleComplete = async (id: string) => {
    await api.put(`/requests/${id}/complete`, { units: 1 });
    toast.success('Donation recorded! Thank you for saving a life! 🏆');
    fetchRequests();
  };

  const filtered = requests.filter(r =>
    !filters.search ||
    r.hospitalName?.toLowerCase().includes(filters.search.toLowerCase()) ||
    r.patientName?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white">
            Blood <span className="text-gradient">Requests</span>
          </h1>
          <p className="text-slate-400 mt-1">Active requests in your area</p>
        </div>
        <div className="live-badge"><span className="live-dot" />Live</div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by hospital or patient name..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/40 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Blood:</span>
            {BLOOD_GROUPS.map(bg => (
              <button key={bg} onClick={() => setFilters(f => ({ ...f, bloodGroup: bg }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  filters.bloodGroup === bg ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >{bg}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Priority:</span>
            {PRIORITIES.map(p => (
              <button key={p} onClick={() => setFilters(f => ({ ...f, priority: p }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all capitalize ${
                  filters.priority === p ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Request list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex gap-4">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48" />
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-4 w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Droplets size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-white font-semibold mb-2">No requests found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {filtered.map(req => (
              <RequestCard key={req._id} req={req} userId={user?._id} onAccept={handleAccept} onComplete={handleComplete} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition-all ${
                page === i + 1 ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/10 text-slate-500 hover:bg-white/5'
              }`}
            >{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
