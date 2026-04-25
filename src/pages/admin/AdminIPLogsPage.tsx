import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Globe, Trash2, Loader2, RefreshCw, Filter,
  Monitor, Smartphone, Shield, ShieldAlert, ShieldCheck,
  AlertCircle, Check, X, WifiOff, Wifi, Eye,
  LogIn, MapPin, Clock, Scan,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatDatetime } from '../../lib/api';

interface IPLog {
  _id: string;
  ip: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: 'registration' | 'visit' | 'login';
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  userAgent?: string;
  createdAt: string;
  vpnStatus?: VPNStatus;
}

interface VPNStatus {
  checked: boolean;
  isVPN: boolean;
  isProxy: boolean;
  isHosting: boolean;
  type?: string;
  isp?: string;
  org?: string;
  risk?: number;
}

interface IPCacheEntry extends VPNStatus {
  checkedAt: number;
}

const CACHE_TTL = 1000 * 60 * 30;

function parseUA(ua: string) {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  let browser = 'Unknown';
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edge/i.test(ua)) browser = 'Edge';
  else if (/msie|trident/i.test(ua)) browser = 'IE';
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua) && !/android/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';
  return { device: isMobile ? 'Mobile' : 'Desktop', browser, os };
}

async function checkIPVPN(ip: string): Promise<VPNStatus> {
  try {
    const res = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1&risk=1`);
    const data = await res.json();
    if (data.status === 'ok' || data.status === 'warning') {
      const ipData = data[ip] || {};
      return {
        checked: true,
        isVPN: ipData.proxy === 'yes' || ipData.type === 'VPN',
        isProxy: ipData.proxy === 'yes',
        isHosting: ipData.type === 'Hosting',
        type: ipData.type || 'Residential',
        isp: ipData.provider || ipData.isp || '',
        org: ipData.organisation || ipData.org || '',
        risk: parseInt(ipData.risk) || 0,
      };
    }
    return { checked: true, isVPN: false, isProxy: false, isHosting: false, type: 'Unknown', isp: '', org: '', risk: 0 };
  } catch {
    return { checked: false, isVPN: false, isProxy: false, isHosting: false };
  }
}

function VPNBadge({ status, loading }: { status?: VPNStatus; loading?: boolean }) {
  if (loading) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      <Loader2 className="w-3 h-3 animate-spin" />Checking...
    </span>
  );
  if (!status?.checked) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400">
      <Shield className="w-3 h-3" />Not checked
    </span>
  );
  if (status.isVPN || status.isProxy) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
      <ShieldAlert className="w-3.5 h-3.5" />
      {status.isVPN ? 'VPN' : 'Proxy'} {status.type && `· ${status.type}`}
    </span>
  );
  if (status.isHosting) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
      <ShieldAlert className="w-3.5 h-3.5" />Data Center
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <ShieldCheck className="w-3.5 h-3.5" />Residential
    </span>
  );
}

export default function AdminIPLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<IPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [vpnFilter, setVpnFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vpnCache, setVpnCache] = useState<Record<string, IPCacheEntry>>({});
  const [checkingIPs, setCheckingIPs] = useState<Set<string>>(new Set());
  const [scanningAll, setScanningAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [terminateConfirm, setTerminateConfirm] = useState<IPLog | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailLog, setDetailLog] = useState<IPLog | null>(null);
  const [activeSessions, setActiveSessions] = useState<IPLog[]>([]);

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers as Record<string, string>) },
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) { navigate('/admin/login'); throw new Error('Unauthorized'); }
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
    return res.json();
  }, [navigate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/iplogs');
      setLogs(data.logs || data.ipLogs || []);
      setActiveSessions(data.activeSessions || []);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [adminFetch]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return; }
    fetchLogs();
    const cached = sessionStorage.getItem('vpnCache');
    if (cached) setVpnCache(JSON.parse(cached));
  }, [navigate, fetchLogs]);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(''); } else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 5000);
  };

  const checkSingleIP = useCallback(async (ip: string) => {
    const cached = vpnCache[ip];
    if (cached && Date.now() - cached.checkedAt < CACHE_TTL) return;

    setCheckingIPs((prev) => new Set([...prev, ip]));
    try {
      const result = await checkIPVPN(ip);
      const entry = { ...result, checkedAt: Date.now() };
      setVpnCache((prev) => {
        const next = { ...prev, [ip]: entry };
        sessionStorage.setItem('vpnCache', JSON.stringify(next));
        return next;
      });
    } finally {
      setCheckingIPs((prev) => { const next = new Set(prev); next.delete(ip); return next; });
    }
  }, [vpnCache]);

  const scanAllIPs = async () => {
    setScanningAll(true);
    const uniqueIPs = [...new Set(logs.map((l) => l.ip))];
    const needCheck = uniqueIPs.filter((ip) => {
      const cached = vpnCache[ip];
      return !cached || Date.now() - cached.checkedAt > CACHE_TTL;
    });
    try {
      for (const ip of needCheck) {
        await checkSingleIP(ip);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      showMsg(`Scanned ${needCheck.length} unique IP${needCheck.length !== 1 ? 's' : ''}`);
    } finally {
      setScanningAll(false);
    }
  };

  const deleteLog = async (logId: string) => {
    setActionLoading(logId);
    try {
      await adminFetch(`/api/admin/iplogs/${logId}`, { method: 'DELETE' });
      setLogs((prev) => prev.filter((l) => l._id !== logId));
      setDeleteConfirm(null);
      showMsg('Log deleted');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to delete.', true);
    } finally { setActionLoading(null); }
  };

  const bulkDelete = async () => {
    setActionLoading('bulk');
    try {
      await adminFetch('/api/admin/iplogs', { method: 'DELETE' });
      setLogs([]);
      setBulkDeleteConfirm(false);
      showMsg('All logs cleared');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to clear logs.', true);
    } finally { setActionLoading(null); }
  };

  const terminateSession = async (log: IPLog) => {
    if (!log.userId) return;
    setTerminating(log.userId);
    try {
      await adminFetch(`/api/admin/users/${log.userId}/terminate`, { method: 'POST' });
      setTerminateConfirm(null);
      setActiveSessions((prev) => prev.filter((s) => s.userId !== log.userId));
      showMsg(`Session terminated for ${log.userName || log.userEmail || 'user'}`);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to terminate session.', true);
    } finally { setTerminating(null); }
  };

  const getVPNStatus = (ip: string): VPNStatus | undefined => {
    const cached = vpnCache[ip];
    if (!cached) return undefined;
    return { checked: cached.checked, isVPN: cached.isVPN, isProxy: cached.isProxy, isHosting: cached.isHosting, type: cached.type, isp: cached.isp, org: cached.org, risk: cached.risk };
  };

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !log.ip?.toLowerCase().includes(q) &&
          !(log.country || '').toLowerCase().includes(q) &&
          !(log.city || '').toLowerCase().includes(q) &&
          !(log.userName || '').toLowerCase().includes(q) &&
          !(log.userEmail || '').toLowerCase().includes(q)
        ) return false;
      }
      if (typeFilter !== 'all' && log.type !== typeFilter) return false;
      if (vpnFilter !== 'all') {
        const s = getVPNStatus(log.ip);
        if (vpnFilter === 'vpn' && !(s?.isVPN || s?.isProxy)) return false;
        if (vpnFilter === 'clean' && (s?.isVPN || s?.isProxy)) return false;
        if (vpnFilter === 'datacenter' && !s?.isHosting) return false;
        if (vpnFilter === 'unchecked' && s?.checked) return false;
      }
      if (dateFrom && new Date(log.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(log.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, search, typeFilter, vpnFilter, dateFrom, dateTo, vpnCache]);

  const vpnCount = logs.filter((l) => { const s = getVPNStatus(l.ip); return s?.isVPN || s?.isProxy; }).length;
  const checkedCount = [...new Set(logs.map((l) => l.ip))].filter((ip) => vpnCache[ip]?.checked).length;
  const uniqueIPs = new Set(logs.map((l) => l.ip)).size;

  return (
    <AdminLayout title="IP Logs">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IP Logs</h1>
            <p className="text-slate-500 text-sm mt-0.5">{logs.length} total logs · {uniqueIPs} unique IPs</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={fetchLogs} className="btn-ghost p-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={scanAllIPs}
              disabled={scanningAll || loading}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {scanningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {scanningAll ? 'Scanning...' : 'Scan All IPs'}
            </button>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            <Check className="w-4 h-4" /><span>{success}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-500">Unique IPs</span></div>
            <p className="text-2xl font-bold text-slate-900">{uniqueIPs}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><ShieldAlert className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-500">VPN / Proxy</span></div>
            <p className="text-2xl font-bold text-red-600">{vpnCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Flagged connections</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span className="text-xs text-slate-500">Checked IPs</span></div>
            <p className="text-2xl font-bold text-slate-900">{checkedCount}<span className="text-base text-slate-400">/{uniqueIPs}</span></p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2"><Wifi className="w-4 h-4 text-blue-500" /><span className="text-xs text-slate-500">Total Logs</span></div>
            <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input-field pl-9" placeholder="Search by IP, country, city, user..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <input type="date" className="input-field sm:w-36 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input-field sm:w-36 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Type:</span>
            {['all', 'registration', 'login', 'visit'].map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${typeFilter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f}</button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="text-xs text-slate-500 font-medium">VPN Status:</span>
            {[
              { key: 'all', label: 'All' },
              { key: 'vpn', label: 'VPN/Proxy' },
              { key: 'clean', label: 'Residential' },
              { key: 'datacenter', label: 'Data Center' },
              { key: 'unchecked', label: 'Unchecked' },
            ].map((f) => (
              <button key={f.key} onClick={() => setVpnFilter(f.key)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${vpnFilter === f.key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f.label}</button>
            ))}
          </div>
        </div>

        {activeSessions.length > 0 && (
          <div className="card overflow-hidden border-orange-100 shadow-orange-500/5">
            <div className="bg-orange-50/50 px-6 py-4 border-b border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-orange-600" />
                <h2 className="font-bold text-orange-900">Active Sessions</h2>
              </div>
              <span className="text-xs font-bold text-orange-700 bg-white px-2 py-1 rounded-lg border border-orange-100">{activeSessions.length} Online</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    {['User', 'IP Address', 'Location', 'Device', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{session.userName || '—'}</p>
                        <p className="text-xs text-slate-400">{session.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{session.ip}</code>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {session.city ? `${session.city}, ` : ''}{session.country}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {parseUA(session.userAgent || '').browser} · {parseUA(session.userAgent || '').os}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setTerminateConfirm(session)}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <WifiOff className="w-3.5 h-3.5" />
                          Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['IP Address', 'VPN Status', 'Location', 'User', 'Type', 'Device', 'Date', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((log) => {
                    const ua = parseUA(log.userAgent || '');
                    const vpnStatus = getVPNStatus(log.ip);
                    const isChecking = checkingIPs.has(log.ip);
                    const DeviceIcon = ua.device === 'Mobile' ? Smartphone : Monitor;
                    return (
                      <tr key={log._id} className={`hover:bg-slate-50 transition-colors ${vpnStatus?.isVPN || vpnStatus?.isProxy ? 'bg-red-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-semibold text-slate-900">{log.ip}</code>
                          </div>
                          {vpnStatus?.isp && <p className="text-xs text-slate-400 mt-0.5">{vpnStatus.isp}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <VPNBadge status={vpnStatus} loading={isChecking} />
                            {!isChecking && (
                              <button
                                onClick={() => checkSingleIP(log.ip)}
                                className="p-1 text-slate-300 hover:text-primary-500 transition-colors rounded"
                                title="Check IP"
                              >
                                <Scan className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {vpnStatus?.risk !== undefined && vpnStatus.risk > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                              <div className={`h-1.5 rounded-full flex-1 max-w-16 ${vpnStatus.risk > 75 ? 'bg-red-400' : vpnStatus.risk > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${vpnStatus.risk}%` }} />
                              <span className="text-xs text-slate-400">Risk: {vpnStatus.risk}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {(log.city || log.country) ? (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-slate-700">{[log.city, log.region].filter(Boolean).join(', ')}</p>
                                <p className="text-xs text-slate-400">{log.country} {log.countryCode && `(${log.countryCode})`}</p>
                              </div>
                            </div>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {log.userName || log.userEmail ? (
                            <div>
                              <p className="text-sm font-medium text-slate-700">{log.userName || '—'}</p>
                              <p className="text-xs text-slate-400">{log.userEmail}</p>
                            </div>
                          ) : <span className="text-slate-400 text-sm">Anonymous</span>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                            log.type === 'registration' ? 'bg-blue-50 text-blue-700' :
                            log.type === 'login' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.type === 'login' && <LogIn className="w-3 h-3" />}
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <DeviceIcon className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-700 font-medium">{ua.browser}</p>
                              <p className="text-xs text-slate-400">{ua.os} · {ua.device}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatDatetime(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetailLog(log)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {log.userId && (
                              <button
                                onClick={() => setTerminateConfirm(log)}
                                className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                                title="Terminate session"
                              >
                                <WifiOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(log._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 animate-slide-up text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Delete Log?</h3>
            <p className="text-slate-500 text-sm mb-6">This log entry will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteLog(deleteConfirm)} disabled={actionLoading === deleteConfirm} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {actionLoading === deleteConfirm ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 animate-slide-up text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Clear All Logs?</h3>
            <p className="text-slate-500 text-sm mb-6">This will permanently delete all {logs.length} IP log entries. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={bulkDelete} disabled={actionLoading === 'bulk'} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {actionLoading === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {terminateConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 animate-slide-up text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Terminate Active Session</h3>
            <p className="text-slate-500 text-sm mb-2">
              <strong className="text-slate-700">{terminateConfirm.userName || terminateConfirm.userEmail}</strong>
            </p>
            <p className="text-slate-400 text-xs mb-2">IP: <code className="font-mono">{terminateConfirm.ip}</code></p>
            {(getVPNStatus(terminateConfirm.ip)?.isVPN || getVPNStatus(terminateConfirm.ip)?.isProxy) && (
              <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 mb-4 text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>This connection was flagged as VPN/Proxy</span>
              </div>
            )}
            <p className="text-slate-500 text-sm mb-6">Their active session token will be immediately invalidated. They will need to sign in again.</p>
            <div className="flex gap-3">
              <button onClick={() => setTerminateConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => terminateSession(terminateConfirm)} disabled={terminating === terminateConfirm.userId} className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {terminating === terminateConfirm.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <WifiOff className="w-4 h-4" />}
                Terminate
              </button>
            </div>
          </div>
        </div>
      )}

      {detailLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">IP Log Details</h3>
              <button onClick={() => setDetailLog(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['IP Address', <code key="ip" className="font-mono text-sm">{detailLog.ip}</code>],
                ['VPN / Proxy', <VPNBadge key="vpn" status={getVPNStatus(detailLog.ip)} loading={checkingIPs.has(detailLog.ip)} />],
                ...(getVPNStatus(detailLog.ip)?.isp ? [['ISP', getVPNStatus(detailLog.ip)?.isp]] : []),
                ...(getVPNStatus(detailLog.ip)?.org ? [['Organization', getVPNStatus(detailLog.ip)?.org]] : []),
                ...(getVPNStatus(detailLog.ip)?.type ? [['Connection Type', getVPNStatus(detailLog.ip)?.type]] : []),
                ['Type', detailLog.type],
                ['User', detailLog.userName || '—'],
                ['Email', detailLog.userEmail || '—'],
                ['Country', detailLog.country || '—'],
                ['City', detailLog.city || '—'],
                ['Region', detailLog.region || '—'],
                ['Date', formatDatetime(detailLog.createdAt)],
                ['Browser', parseUA(detailLog.userAgent || '').browser],
                ['OS', parseUA(detailLog.userAgent || '').os],
                ['Device', parseUA(detailLog.userAgent || '').device],
                ['User Agent', detailLog.userAgent || '—'],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between items-start gap-4">
                  <span className="text-sm text-slate-500 font-medium flex-shrink-0">{label}</span>
                  <span className="text-sm text-slate-900 font-medium text-right break-all">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              {detailLog.userId && (
                <button onClick={() => { setTerminateConfirm(detailLog); setDetailLog(null); }} className="flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-xl transition-colors">
                  <WifiOff className="w-4 h-4" />Terminate Session
                </button>
              )}
              <button onClick={() => checkSingleIP(detailLog.ip)} disabled={checkingIPs.has(detailLog.ip)} className="btn-secondary flex items-center gap-2 text-sm">
                <Scan className="w-4 h-4" />Re-check IP
              </button>
              <button onClick={() => setDetailLog(null)} className="btn-ghost ml-auto">Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
