import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RegisterModule } from '../components/RegisterModule';
import { useSocket } from '../context/SocketContext';
import BluetoothService from '../services/BluetoothService';
import ErrorBoundary from '../components/ErrorBoundary';

// --- Shared Helper Utilities ---
const formatDateIST = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime12h = (timeStr) => {
    if (!timeStr) return '-';
    const [hours, mins] = timeStr.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mins} ${ampm}`;
};

const formatDateTimeIST = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
    });
};

const Dashboard = () => {
    const { user, logout, loading } = useAuth();
    const [activeTab, setActiveTab] = React.useState('profile');
    const hasInitialTabSet = React.useRef(false);

    // Set initial tab based on role ONLY ONCE on load
    React.useEffect(() => {
        if (!loading && user?.role && !hasInitialTabSet.current) {
            if (user.role === 'mess_warden') setActiveTab('mess');
            else if (user.role === 'student') setActiveTab('profile');
            else setActiveTab('approvals');
            hasInitialTabSet.current = true;
        }
    }, [user?.role, loading]); // Only trigger on role change or initial load
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg-dark)',
                color: 'white'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1.5rem'
                }} />
                <h2 className="text-grad" style={{ fontSize: '1.5rem', fontWeight: '800' }}>HMS ARENA</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>Authenticating Session...</p>
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2.5rem',
                borderBottom: '1px solid var(--border-main)',
                paddingBottom: '1.5rem'
            }}>
                <div>
                    <h1 className="text-grad" style={{ fontSize: '2rem', letterSpacing: '-1px' }}>HMS ARENA</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Eagle-Eye Hostel Management</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', fontSize: '1rem' }}>{user?.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{user?.role}</span>
                    </div>
                    <button onClick={handleLogout} className="arena-btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                        Logout
                    </button>
                </div>
            </header>

            <main>
                {/* Mobile Tablet Friendly Navigation */}
                <nav style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {(() => {
                        if (user?.role === 'warden' || user?.role === 'admin') {
                            return ['approvals', 'residents', 'register', 'blocked', 'complaints', 'mess', 'fees', 'labour', 'salary', 'security'];
                        } else if (user?.role === 'hostel_warden') {
                            return ['approvals', 'residents', 'register', 'blocked', 'complaints', 'fees', 'labour', 'salary'];
                        } else if (user?.role === 'mess_warden') {
                            return ['mess', 'register', 'complaints', 'fees', 'labour', 'salary'];
                        } else {
                            return ['profile', 'leaves', 'outpass', 'complaints', 'mess', 'fees'];
                        }
                    })().map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`arena-btn ${activeTab === tab ? '' : 'btn-secondary'}`}
                            style={{
                                textTransform: 'capitalize',
                                minWidth: '120px',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab}
                        </button>
                    ))}

                </nav>
                {user?.role === 'student' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                        <div className="animate-slide-up">
                            <ErrorBoundary>
                                {activeTab === 'profile' && (
                                    <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '2rem' }}>
                                        <div className="arena-card animate-slide-up" style={{ padding: '2.5rem' }}>
                                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
                                                <div style={{
                                                    width: '100px', height: '100px', borderRadius: '50%',
                                                    background: 'var(--grad-premium)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold',
                                                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '4px' }}>{user?.name}</h2>
                                                    <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem' }}>{user?.rollNo || 'WARDEN ACCESS'}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                                <div>
                                                    <h3 className="section-title">Personal Details</h3>
                                                    <div className="profile-grid">
                                                        <ProfileItem label="Email" value={user?.email || 'N/A'} />
                                                        <ProfileItem label="Gender" value={user?.gender} />
                                                        <ProfileItem label="DOB" value={user?.dob} />
                                                        <ProfileItem label="Father Name" value={user?.fatherName} />
                                                        <ProfileItem label="Mobile" value={user?.studentMobile} />
                                                        <ProfileItem label="Parent Mobile" value={user?.fatherMobile} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <div className="arena-card">
                                                <h3 className="section-title">Academic Info</h3>
                                                <div className="profile-grid">
                                                    <ProfileItem label="Dept" value={user?.department} />
                                                    <ProfileItem label="Batch" value={user?.batch} />
                                                    <ProfileItem label="Program" value={user?.program} />
                                                    <ProfileItem label="Register No" value={user?.registerNo} />
                                                </div>
                                            </div>
                                            <div className="arena-card">
                                                <h3 className="section-title">Hostel Info</h3>
                                                <div className="profile-grid">
                                                    <ProfileItem label="Hostel" value={user?.hostelName} />
                                                    <ProfileItem label="Room" value={user?.roomNo} />
                                                    <ProfileItem label="FP ID" value={user?.fingerprintId} />
                                                    <ProfileItem label="Approval" value={user?.approvalNo} />
                                                </div>
                                            </div>
                                            <div className="arena-card animate-slide-up" style={{ border: '1px solid var(--accent-blue)', background: 'rgba(59,130,246,0.02)' }}>
                                                <h3 className="section-title">Latest Leave Status</h3>
                                                <LeaveStatusSummary studentId={user?._id} />
                                                <button onClick={() => setActiveTab('leaves')} className="arena-link" style={{ fontSize: '0.8rem', marginTop: '1rem', display: 'block', textAlign: 'center', width: '100%' }}>
                                                    View Leave History →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'leaves' && (
                                    <div className="arena-card">
                                        <h3 className="section-title">Apply for Leave</h3>
                                        <LeaveModule studentId={user?._id} setActiveTab={setActiveTab} />
                                    </div>
                                )}

                                {activeTab === 'outpass' && (
                                    <div className="arena-card">
                                        <h3 className="section-title">Digital Outpass Gateway</h3>
                                        <OutpassModule studentId={user?._id} />
                                    </div>
                                )}

                                {activeTab === 'complaints' && (
                                    <div className="arena-card">
                                        <h3 className="section-title">Submit Complaint</h3>
                                        <ComplaintModule studentId={user?._id} />
                                    </div>
                                )}

                                {activeTab === 'mess' && (
                                    <div className="arena-card">
                                        <h3 className="section-title">Special Food Token Gateway</h3>
                                        <StudentMessModule studentId={user?._id} />
                                    </div>
                                )}

                                {activeTab === 'fees' && (
                                    <div className="arena-card">
                                        <h3 className="section-title">Fees Dashboard</h3>
                                        <FeesModule studentId={user?._id} initialFees={{ balance: user?.feesBalance, paid: user?.feesPaid }} />
                                    </div>
                                )}
                            </ErrorBoundary>
                        </div>
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        <ErrorBoundary>
                            {activeTab === 'approvals' && <WardenApprovalModule />}
                            {activeTab === 'residents' && <StudentResidentModule />}
                            {activeTab === 'register' && (
                                <div className="mobile-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <RegisterModule
                                        onFinish={() => {
                                            const target = user?.role === 'student' ? 'profile' : 'residents';
                                            setTimeout(() => setActiveTab(target), 2000);
                                        }}
                                        restrictedRoles={
                                            user?.role === 'mess_warden' ? ['mess_employee'] :
                                                user?.role === 'hostel_warden' ? ['hostel_employee'] :
                                                    ['student', 'mess_employee', 'hostel_employee', 'warden']
                                        }
                                    />
                                    {(user?.role === 'warden' || user?.role === 'admin') && (
                                        <div className="arena-card animate-slide-up" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
                                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Admin System Health</h3>
                                            <div className="census-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                <p style={{ fontSize: '0.85rem' }}>• Database: <span style={{ color: '#22c55e' }}>Connected</span></p>
                                                <p style={{ fontSize: '0.85rem' }}>• Modules: <span style={{ color: '#22c55e' }}>Fully Active</span></p>
                                                <p style={{ fontSize: '0.85rem' }}>• Last Sync: <span style={{ color: 'var(--accent-blue)' }}>Real-time</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'blocked' && <BlockedStudentsModule />}
                            {activeTab === 'complaints' && <WardenComplaintModule />}
                            {activeTab === 'security' && <SecuritySettingsModule />}
                            {activeTab === 'mess' && <MessManagementModule />}
                            {activeTab === 'fees' && <WardenFeesModule />}
                            {activeTab === 'labour' && <LabourModule />}
                            {activeTab === 'salary' && <SalaryModule />}
                        </ErrorBoundary>
                    </div>
                )}
            </main>
        </div>
    );
}

const WardenApprovalModule = () => {
    const { user: currentUser } = useAuth(); // Get staff identity
    const [search, setSearch] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const handleSearch = async (val) => {
        setSearch(val);
        if (val.length >= 2) {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:5000/api/student/leave/search/${val}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setResults(data);
                } else {
                    setResults([]);
                }
            } catch (err) {
                setResults([]);
            }
            setLoading(false);
        } else {
            setResults([]);
        }
    };

    const handleAction = async (leaveId, status) => {
        try {
            await fetch(`http://localhost:5000/api/student/leave/approve/warden`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ leaveId, status })
            });
            // Refresh results
            handleSearch(search);
        } catch (err) { }
    };

    const fetchAllPending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/student/leave/search/ALL`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setResults(data);
            } else {
                setResults([]);
            }
            setSearch('');
        } catch (err) {
            setResults([]);
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="arena-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 className="section-title" style={{ marginBottom: 0 }}>Leave Approval Portal (Warden)</h3>
                    <button onClick={fetchAllPending} className="arena-btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        🔄 Refresh / View All Pending
                    </button>
                </div>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <label className="field-label">Quick Search (ID / Roll No / Reg No)</label>
                    <input
                        type="text"
                        className="arena-input"
                        placeholder="Search student..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ fontSize: '1.1rem', textAlign: 'center' }}
                    />
                </div>

                {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Searching database...</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {results.length === 0 && search.length >= 2 && !loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {search === 'ALL' ? 'No pending leave applications.' : `No leave records found for student ID/Roll No ending in "${search}"`}
                        </p>
                    )}
                    {results.length > 0 && search.length >= 2 && search !== 'ALL' && (
                        <p style={{ textAlign: 'center', color: 'var(--accent-blue)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                            Showing all leave history for matching student(s)
                        </p>
                    )}
                    {Array.isArray(results) && results.map(l => (
                        <div key={l._id} className="arena-card animate-slide-up" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1.5px solid var(--border-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ color: 'var(--accent-blue)', marginBottom: '4px' }}>{l.student.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Reg No: {l.student.registerNo} | Room: {l.student.roomNo} | ID: {l.student.approvalNo}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{l.leaveType}</span>
                                    <p style={{ fontSize: '0.8rem' }}>{formatDateIST(l.outDate)} {formatTime12h(l.outTime)}</p>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-main)' }}>
                                    " {l.reason} "
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => handleAction(l._id, 'Approved')}
                                    className="arena-btn"
                                    style={{ flex: 2, background: '#22c55e', color: 'white' }}
                                >
                                    Approve Leave
                                </button>
                                <button
                                    onClick={() => handleAction(l._id, 'Rejected')}
                                    className="arena-btn"
                                    style={{ flex: 1, background: '#ef4444', color: 'white' }}
                                >
                                    Reject
                                </button>
                            </div>

                            {l.wardenStatus === 'Approved' && (
                                <button
                                    onClick={async () => {
                                        const receipt = BluetoothService.generateOutpassReceipt(
                                            l.student.name,
                                            l.student.rollNo || l.student.registerNo,
                                            'MANUAL',
                                            formatDateIST(l.outDate) + " " + l.outTime,
                                            formatDateIST(l.inDate) + " " + l.inTime,
                                            l._id.toString().slice(-8).toUpperCase()
                                        );
                                        try {
                                            await BluetoothService.print(receipt);
                                            alert("Manual Outpass Sent to Printer! 🖨️");
                                        } catch (e) {
                                            alert(e.message);
                                        }
                                    }}
                                    className="arena-btn btn-secondary"
                                    style={{ width: '100%', marginTop: '1rem', borderColor: '#a855f7', color: '#a855f7' }}
                                >
                                    🖨️ Print Manual Outpass
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BlockedStudentsModule = () => {
    const [blockedStudents, setBlockedStudents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');

    const fetchBlocked = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/blocked-students', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setBlockedStudents(data);
        } catch (err) { }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchBlocked();
    }, []);

    const handleUnblock = async (studentId) => {
        if (!window.confirm("Are you sure you want to unblock this student?")) return;
        try {
            const res = await fetch('http://localhost:5000/api/student/block-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ studentId, isBlocked: false })
            });
            if (res.ok) fetchBlocked();
        } catch (err) { }
    };

    const handleUnblockAll = async () => {
        if (!window.confirm("CRITICAL: Are you sure you want to restore access for ALL blocked students?")) return;
        try {
            const res = await fetch('http://localhost:5000/api/student/unblock-all', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            if (res.ok) fetchBlocked();
        } catch (err) { }
    };

    const filtered = (Array.isArray(blockedStudents) ? blockedStudents : []).filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="arena-card animate-slide-up">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 className="section-title" style={{ margin: 0 }}>Restricted Students (Blocked)</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{blockedStudents.length} Students Restricted</p>
                </div>
                {blockedStudents.length > 0 && (
                    <button
                        onClick={handleUnblockAll}
                        className="arena-btn"
                        style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '0.85rem' }}
                    >
                        🔓 Unblock All Students
                    </button>
                )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="arena-input"
                    style={{ width: '100%', padding: '0.8rem 1rem' }}
                />
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Scanning security records...</p>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-main)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {searchTerm ? 'No restricted students match your search.' : 'No student accounts are currently restricted.'}
                    </p>
                    {!searchTerm && <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>System Integrity: 100%</p>}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered.map(s => (
                        <div key={s._id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.2rem',
                            background: 'rgba(239, 68, 68, 0.03)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            borderRadius: '12px'
                        }}>
                            <div>
                                <p style={{ fontWeight: '600', color: '#ef4444' }}>{s.name}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll No: {s.rollNo} | Room: {s.roomNo}</p>
                            </div>
                            <button
                                onClick={() => handleUnblock(s._id)}
                                className="arena-btn"
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    color: '#22c55e',
                                    border: '1px solid rgba(34, 197, 94, 0.2)'
                                }}
                            >
                                ✅ Restore Access
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SecuritySettingsModule = () => {
    const [config, setConfig] = React.useState({
        attendanceStart: '19:00',
        attendanceEnd: '20:00',
        collegeEndTime: '16:00',
        curfewTime: '22:00'
    });
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/config');
            const data = await res.json();
            if (data.attendanceStart) setConfig(data);
        } catch (err) { }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchConfig();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify(config)
            });
            if (res.ok) alert('Security Protocol Updated Successfully! 🛡️');
        } catch (err) { }
        setSaving(false);
    };

    if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Initialing secure connection...</p>;

    return (
        <div className="arena-card animate-slide-up">
            <h3 className="section-title">System Security Configuration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Warden: Adjust the timing windows below to enforce automated hostel security protocols.
            </p>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="arena-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-main)' }}>
                        <TimePickerIST
                            label="Daily Attendance Start"
                            value={config.attendanceStart}
                            onChange={val => setConfig({ ...config, attendanceStart: val })}
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Fingerprint scanning opens.</p>
                    </div>
                    <div className="arena-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-main)' }}>
                        <TimePickerIST
                            label="Active Scanning Deadline"
                            value={config.attendanceEnd}
                            onChange={val => setConfig({ ...config, attendanceEnd: val })}
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Machine stops accepting regular check-ins.</p>
                    </div>
                    <div className="arena-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-main)' }}>
                        <TimePickerIST
                            label="College Working Hours End"
                            value={config.collegeEndTime}
                            onChange={val => setConfig({ ...config, collegeEndTime: val })}
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Standard Outpasses allowed after this.</p>
                    </div>
                    <div className="arena-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-main)' }}>
                        <TimePickerIST
                            label="Final Lockdown Curfew"
                            value={config.curfewTime}
                            onChange={val => setConfig({ ...config, curfewTime: val })}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '8px' }}>The absolute deadline. All absentees are BLOCKED after this.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="arena-btn" style={{ flex: 1 }} disabled={saving}>
                        {saving ? 'Encrypting Logic...' : '🔒 Deploy Security Protocol'}
                    </button>
                    <button
                        type="button"
                        onClick={fetchConfig}
                        className="arena-btn btn-secondary"
                    >
                        🔄 Reload
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <p style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '500' }}>
                    💡 Tip: The Attendance Window is for scanning. The **Final Lockdown Curfew** is the absolute point of no return for automated blocking.
                </p>
            </div>

            <div className="arena-card" style={{ marginTop: '2rem', border: '1.5px solid #a855f7', background: 'rgba(168, 85, 247, 0.02)' }}>
                <h3 className="section-title">Hardware Peripheral Station</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Connect to external Bluetooth printers for manual outpass and token generation.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={async () => {
                            const success = await BluetoothService.connect();
                            if (success) alert("Printer Connected Successfully! 🖨️");
                            else alert("Connection Failed. Ensure Bluetooth is on.");
                        }}
                        className="arena-btn"
                        style={{ background: '#a855f7', flex: 1 }}
                    >
                        🔗 Pair Bluetooth Printer
                    </button>
                    <div style={{ flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>STATUS: </span>
                        <span style={{ fontWeight: 'bold', color: '#a855f7' }}>READY FOR PAIRING</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimePickerIST = ({ name, label, value, onChange }) => {
    // Initial state from value prop (HH:MM)
    const initialH = value ? (() => {
        let [h24] = value.split(':').map(Number);
        let h12 = h24 % 12 || 12;
        return h12.toString().padStart(2, '0');
    })() : "09";

    const initialM = value ? value.split(':')[1] : "00";

    const initialAP = value ? (() => {
        let [h24] = value.split(':').map(Number);
        return h24 >= 12 ? "PM" : "AM";
    })() : "AM";

    const [h, setH] = React.useState(initialH);
    const [m, setM] = React.useState(initialM);
    const [ap, setAp] = React.useState(initialAP);

    // Sync internal state if value prop changes externally (important for Settings reload)
    React.useEffect(() => {
        if (value) {
            let [h24, mm] = value.split(':');
            let hr24 = parseInt(h24);
            let h12 = hr24 % 12 || 12;
            setH(h12.toString().padStart(2, '0'));
            setM(mm);
            setAp(hr24 >= 12 ? "PM" : "AM");
        }
    }, [value]);

    const getCurrent24Value = (newH, newM, newAp) => {
        let hrs = parseInt(newH) || 0;
        if (newAp === "PM" && hrs < 12) hrs += 12;
        if (newAp === "AM" && hrs === 12) hrs = 0;
        const mm = newM.toString().padStart(2, '0');
        return `${hrs.toString().padStart(2, '0')}:${mm}`;
    };

    const handleChange = (newH, newM, newAp) => {
        setH(newH);
        setM(newM);
        setAp(newAp);
        if (onChange) {
            onChange(getCurrent24Value(newH, newM, newAp));
        }
    };

    const finalValue = getCurrent24Value(h, m, ap);

    return (
        <div style={{ flex: 1 }}>
            <label className="field-label">{label}</label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                    type="number"
                    value={h}
                    min="1" max="12"
                    onChange={e => {
                        let val = e.target.value;
                        if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                            handleChange(val, m, ap);
                        }
                    }}
                    onBlur={() => {
                        let hh = h;
                        if (h === '' || parseInt(h) < 1) hh = '01';
                        else if (parseInt(h) > 12) hh = '12';
                        handleChange(hh.toString().padStart(2, '0'), m, ap);
                    }}
                    className="arena-input"
                    style={{ flex: 1, padding: '0.6rem 0.4rem', textAlign: 'center' }}
                />
                <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>:</span>
                <input
                    type="number"
                    value={m}
                    min="0" max="59"
                    onChange={e => {
                        let val = e.target.value;
                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                            handleChange(h, val, ap);
                        }
                    }}
                    onBlur={() => {
                        let mm = m;
                        if (m === '') mm = '00';
                        else if (parseInt(m) > 59) mm = '59';
                        handleChange(h, mm.toString().padStart(2, '0'), ap);
                    }}
                    className="arena-input"
                    style={{ flex: 1, padding: '0.6rem 0.4rem', textAlign: 'center' }}
                />
                <select
                    value={ap}
                    onChange={e => handleChange(h, m, e.target.value)}
                    className="arena-input"
                    style={{ flex: 1, padding: '0.6rem 0.4rem', textAlign: 'center', background: 'var(--primary)', fontWeight: 'bold' }}
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
                <input type="hidden" name={name} value={finalValue} />
            </div>
        </div>
    );
};


const LeaveStatusSummary = ({ studentId }) => {
    const [latestLeave, setLatestLeave] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const socket = useSocket();

    const fetchLatest = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/leave/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setLatestLeave(data[0]); // Most recent
            }
        } catch (err) { }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchLatest();
    }, [studentId]);

    React.useEffect(() => {
        if (!socket) return;
        socket.on('outpass_update', (data) => {
            if (data.studentId === studentId) {
                console.log('Real-time Outpass update received');
                fetchLatest();
            }
        });
        return () => socket.off('outpass_update');
    }, [socket, studentId]);

    if (loading) return <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading status...</p>;
    if (!latestLeave) return <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active leave applications found.</p>;

    const statusMap = {
        'Pending': { color: '#eab308', icon: '⏳' },
        'Approved': { color: '#22c55e', icon: '✅' },
        'Rejected': { color: '#ef4444', icon: '❌' }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{latestLeave.leaveType}</span>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    color: statusMap[latestLeave.wardenStatus || 'Pending']?.color || 'var(--text-muted)'
                }}>
                    {statusMap[latestLeave.wardenStatus || 'Pending']?.icon} Warden: {latestLeave.wardenStatus || 'Pending'}
                </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatDateIST(latestLeave.outDate)} {formatTime12h(latestLeave.outTime)} → {formatDateIST(latestLeave.inDate)} {formatTime12h(latestLeave.inTime)}
            </p>
            {latestLeave.parentStatus !== 'Pending' && (
                <span style={{
                    fontSize: '0.7rem',
                    color: statusMap[latestLeave.parentStatus]?.color || 'var(--text-muted)'
                }}>
                    {statusMap[latestLeave.parentStatus]?.icon} Parent: {latestLeave.parentStatus}
                </span>
            )}
            {latestLeave.outpassType !== 'None' && (
                <div style={{
                    marginTop: '0.5rem',
                    padding: '4px 8px',
                    background: latestLeave.outpassStatus === 'Closed' ? 'rgba(239, 68, 68, 0.1)' : '#22c55e22',
                    borderRadius: '4px',
                    border: latestLeave.outpassStatus === 'Closed' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #22c55e44'
                }}>
                    <p style={{
                        fontSize: '0.7rem',
                        color: latestLeave.outpassStatus === 'Closed' ? '#ef4444' : '#22c55e',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        🎫 {latestLeave.outpassType} Outpass {latestLeave.outpassStatus === 'Closed' ? 'Closed' : 'Active'}
                    </p>
                </div>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`arena-btn ${active ? '' : 'btn-secondary'}`}
        style={{
            justifyContent: 'flex-start',
            padding: '1rem',
            width: '100%',
            gap: '12px',
            background: active ? 'var(--grad-premium)' : 'rgba(255,255,255,0.03)',
            border: active ? 'none' : '1px solid var(--border-main)',
            opacity: active ? 1 : 0.8
        }}
    >
        <span>{icon}</span>
        <span>{label}</span>
    </button>
);

const LeaveModule = ({ studentId, setActiveTab }) => {
    const { user } = useAuth(); // FIX: Access user from context for attendance logic
    const [loading, setLoading] = React.useState(false);
    const [msg, setMsg] = React.useState('');
    const [leaves, setLeaves] = React.useState([]);
    const [config, setConfig] = React.useState(null);

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (err) { }
    };

    const fetchLeaves = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/leave/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setLeaves(data);
            } else {
                setLeaves([]);
            }
        } catch (err) {
            setLeaves([]);
        }
    }, [studentId]);

    React.useEffect(() => {
        fetchLeaves();
        fetchConfig();
        const interval = setInterval(fetchLeaves, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [fetchLeaves]);

    const handleApply = async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        try {
            const res = await fetch('http://localhost:5000/api/student/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ ...data, studentId })
            });
            if (res.ok) {
                setMsg('Leave applied successfully!');
                e.target.reset();
                fetchLeaves();
            } else {
                const err = await res.json();
                setMsg(err.message || 'Error applying for leave.');
            }
        } catch (err) {
            setMsg('Error applying for leave.');
        }
        setLoading(false);
    };

    const simulateApprove = async (leaveId, actor, status) => {
        try {
            await fetch(`http://localhost:5000/api/student/leave/approve/${actor}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ leaveId, status })
            });
            fetchLeaves();
        } catch (err) { }
    };

    const handleCancelLeave = async (leaveId) => {
        if (!window.confirm("Are you sure you want to withdraw this leave application?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/student/leave/${leaveId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            if (res.ok) {
                fetchLeaves();
            }
        } catch (err) { }
    };

    const generateOutpass = async (leaveId, type) => {
        try {
            const res = await fetch('http://localhost:5000/api/student/leave/generate-outpass', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ leaveId, type })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`${type} Outpass Generated! Check the 'Outpass' tab.`);
                fetchLeaves();
            } else {
                alert(data.message);
            }
        } catch (err) { }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* 1 & 2: Apply Form */}
            <form onSubmit={handleApply} className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="mobile-span-all" style={{ gridColumn: 'span 2' }}>
                    <label className="field-label">Leave Type</label>
                    <select name="leaveType" className="arena-input" required>
                        <option value="Leave">Leave</option>
                        <option value="General Leave">General Leave</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Outing">Outing</option>
                    </select>
                </div>
                <div>
                    <label className="field-label">Out Date</label>
                    <input type="date" name="outDate" className="arena-input" required />
                </div>
                <TimePickerIST name="outTime" label="Out Time" />
                <div>
                    <label className="field-label">In Date</label>
                    <input type="date" name="inDate" className="arena-input" required />
                </div>
                <TimePickerIST name="inTime" label="In Time" />
                <div className="mobile-span-all" style={{ gridColumn: 'span 2' }}>
                    <label className="field-label">Reason</label>
                    <textarea name="reason" className="arena-input" rows="2" required placeholder="Describe why you are leaving..."></textarea>
                </div>
                <button type="submit" className="arena-btn mobile-span-all" style={{ gridColumn: 'span 2' }} disabled={loading}>
                    {loading ? 'Submitting...' : 'Apply for Leave'}
                </button>
                {msg && <p className="mobile-span-all" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{msg}</p>}
            </form>

            {/* Leave History & Outpass Generation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Approval Flow & Outpass Status</h4>
                {(!Array.isArray(leaves) || leaves.length === 0) && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No leave applications found.</p>}
                {Array.isArray(leaves) && leaves.map(l => (
                    <div key={l._id} className="arena-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', border: '1px solid var(--border-main)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <strong style={{ color: 'var(--accent-blue)' }}>{l.leaveType}</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateIST(l.outDate)} {formatTime12h(l.outTime)} → {formatDateIST(l.inDate)} {formatTime12h(l.inTime)}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Warden</p>
                                    <span style={{ color: l.wardenStatus === 'Approved' ? '#22c55e' : l.wardenStatus === 'Rejected' ? '#ef4444' : '#eab308' }}>{l.wardenStatus}</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Parent</p>
                                    <span style={{ color: l.parentStatus === 'Approved' ? '#22c55e' : l.parentStatus === 'Rejected' ? '#ef4444' : '#eab308' }}>{l.parentStatus}</span>
                                </div>
                            </div>
                        </div>

                        {/* Simulation Controls (For User Testing) */}
                        {l.parentStatus === 'Pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                {l.wardenStatus === 'Pending' && (
                                    <button onClick={() => simulateApprove(l._id, 'warden', 'Approved')} className="arena-btn" style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#22c55e22', color: '#22c55e' }}>Warden Approve (Forward to Parent)</button>
                                )}
                                {(l.wardenStatus === 'Approved' || l.leaveType === 'General Leave') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ fontSize: '0.65rem', color: '#3b82f6', fontStyle: 'italic' }}>⚡ Auto-forwarded to Parent via IVR</p>
                                        <button onClick={() => simulateApprove(l._id, 'parent', 'Approved')} className="arena-btn" style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#3b82f622', color: '#3b82f6' }}>Parent Approve (Simulate SMS/Call)</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Digital Redirect */}
                        {l.parentStatus === 'Approved' && l.outpassType === 'None' && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.05)', borderRadius: '8px', border: '1px dashed #3b82f644', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '8px' }}>Leave has been approved by Parents! 🥳</p>
                                <button
                                    onClick={() => setActiveTab('outpass')}
                                    className="arena-link"
                                    style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                                >
                                    Go to Outpass Tab to Generate Pass →
                                </button>
                            </div>
                        )}

                        {l.outpassType !== 'None' && (
                            <div style={{ background: 'rgba(34,197,94,0.1)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
                                <p style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 'bold' }}>{l.outpassType} Outpass Generated</p>
                                <button
                                    onClick={() => setActiveTab('outpass')}
                                    className="arena-link"
                                    style={{ fontSize: '0.75rem', marginTop: '4px' }}
                                >
                                    View in Outpass Tab →
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const OutpassModule = ({ studentId }) => {
    const [leaves, setLeaves] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [conflictId, setConflictId] = React.useState(null);
    const { user } = useAuth();

    const fetchLeaves = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/leave/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setLeaves(data.filter(l => l.parentStatus === 'Approved'));
            } else {
                setLeaves([]);
            }
        } catch (err) {
            setLeaves([]);
        }
        setLoading(false);
    }, [studentId]);

    React.useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleGenerate = async (l) => {
        if (l.outpassType === 'Physical') {
            setConflictId(l._id);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/student/leave/generate-outpass', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ leaveId: l._id, type: 'Digital' })
            });
            if (res.ok) {
                fetchLeaves();
                setConflictId(null);
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (err) { }
    };

    if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Fetching authorized passes...</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {leaves.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: 'var(--text-muted)', fontStyle: 'italic', border: '1px dashed var(--border-main)' }}>
                        No parent-approved leaves found. <br />
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Apply for leave and get parent approval to generate a digital pass.</span>
                    </p>
                ) : (
                    leaves.map(l => (
                        <div key={l._id} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {l.outpassType !== 'Digital' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="arena-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-main)' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Approved Leave</p>
                                            <strong style={{ color: 'var(--accent-blue)', fontSize: '1.1rem' }}>{l.leaveType}</strong>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                                                {formatDateIST(l.outDate)} {formatTime12h(l.outTime)} → {formatDateIST(l.inDate)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleGenerate(l)}
                                            className="arena-btn"
                                            style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}
                                        >
                                            Generate Digital Pass
                                        </button>
                                    </div>

                                    {/* Physical Conflict Notification (Shown after click attempt or if already detected) */}
                                    {(l.outpassType === 'Physical' || conflictId === l._id) && (
                                        <div className="arena-card animate-slide-up" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', textAlign: 'center' }}>
                                            <h4 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '0.95rem' }}>🚫 Digital Pass Generation Disabled</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                You have already registered your fingerprint at the warden's office for this leave.
                                                The digital outpass option is now terminated for this request.
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '12px', fontWeight: 'bold' }}>
                                                Physical Registry: {formatDateTimeIST(l.outpassGeneratedAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="arena-card" style={{ border: '1px solid #22c55e', background: 'rgba(34, 197, 94, 0.1)', textAlign: 'center', padding: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 'bold' }}>
                                            ✅ Digital Outpass Active
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            You have generated a Digital Outpass. Manual fingerprint registration at the warden's office is now disabled.
                                        </p>
                                    </div>
                                    <DigitalOutpassTicket leave={l} user={user} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div style={{ padding: '1.2rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <p style={{ fontSize: '0.85rem', color: '#3b82f6', lineHeight: '1.5' }}>
                    <strong>HMS Arena Policy:</strong> To prevent duplicate exits, the system allows only one outpass format. Generating a Digital Pass blocks the physical option, and manual registration blocks the digital option.
                </p>
            </div>
        </div>
    );
};

const DigitalOutpassTicket = ({ leave, user }) => {
    return (
        <div className="arena-card animate-scale-up" style={{
            background: leave.outpassStatus === 'Closed'
                ? 'linear-gradient(135deg, #18181b 0%, #27272a 100%)'
                : 'var(--grad-premium)',
            padding: '2rem',
            borderRadius: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: leave.outpassStatus === 'Closed' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)'
        }}>
            {/* Watermark/Background Pattern */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                fontSize: '12rem',
                opacity: 0.05,
                fontWeight: '900',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none'
            }}>
                PASS
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>DIGITAL OUTPASS</h2>
                    <p style={{ opacity: 0.8, fontSize: '0.8rem', textTransform: 'uppercase' }}>HMS ARENA Security Verified</p>
                </div>
                <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{leave.leaveType}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Resident Name</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.name}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Roll / Reg No</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.rollNo || user?.registerNo}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Out Timing</p>
                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatDateIST(leave.outDate)} | {formatTime12h(leave.outTime)}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>In Timing</p>
                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatDateIST(leave.inDate)} | {formatTime12h(leave.inTime)}</p>
                </div>
            </div>

            <div style={{
                borderTop: '2px dashed rgba(255,255,255,0.2)',
                paddingTop: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <p style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '2px' }}>PASS ID</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', fontFamily: 'monospace' }}>{leave._id.toString().slice(-12).toUpperCase()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '2px' }}>Generated At</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: '500' }}>{formatDateTimeIST(leave.outpassGeneratedAt)}</p>
                </div>
            </div>

            {/* Status Stamp */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                padding: '4px 12px',
                background: leave.outpassStatus === 'Closed' ? '#ef4444' : '#22c55e',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.6rem',
                fontWeight: 'bold',
                transform: 'rotate(-5deg)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                {leave.outpassStatus === 'Closed' ? 'PASS CLOSED' : 'VALID PASS'}
            </div>
        </div>
    );
};

const ComplaintModule = ({ studentId }) => {
    const [loading, setLoading] = React.useState(false);
    const [msg, setMsg] = React.useState('');
    const [complaints, setComplaints] = React.useState([]);

    const fetchComplaints = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/complaint/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setComplaints(data);
            } else {
                setComplaints([]);
            }
        } catch (err) {
            setComplaints([]);
        }
    }, [studentId]);

    React.useEffect(() => {
        fetchComplaints();
        const interval = setInterval(fetchComplaints, 5000); // 5s Polling
        return () => clearInterval(interval);
    }, [fetchComplaints]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        try {
            await fetch('http://localhost:5000/api/student/complaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ ...data, studentId })
            });
            setMsg('Complaint submitted successfully!');
            e.target.reset();
            fetchComplaints();
        } catch (err) { setMsg('Error submitting complaint.'); }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <form onSubmit={handleSubmit} className="mobile-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label className="field-label">Category</label>
                    <select name="category" className="arena-input" required>
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Mess">Mess</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="field-label">Description</label>
                    <textarea name="description" className="arena-input" rows="3" required placeholder="Describe the issue in detail..."></textarea>
                </div>
                <button type="submit" className="arena-btn" disabled={loading}>
                    {loading ? 'Submitting...' : 'Register Complaint'}
                </button>
                {msg && <p style={{ textAlign: 'center', color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{msg}</p>}
            </form>

            <div className="arena-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>My Complaints</h4>
                {complaints.map(c => (
                    <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-main)' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{c.category}: {c.description}</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateIST(c.createdAt)}</span>
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: c.status === 'Solved' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                            color: c.status === 'Solved' ? '#22c55e' : '#eab308',
                            height: 'fit-content'
                        }}>{c.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StudentMessModule = ({ studentId }) => {
    const { user } = useAuth();
    const [tokens, setTokens] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [config, setConfig] = React.useState(null);

    const fetchConfig = React.useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (err) { }
    }, []);

    const fetchTokens = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/mess/tokens/student/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTokens(data);
            } else {
                setTokens([]);
            }
        } catch (err) {
            setTokens([]);
        }
    }, [studentId]);

    React.useEffect(() => {
        fetchTokens();
        fetchConfig();
    }, [fetchTokens, fetchConfig]);

    const handleGenerate = async (type) => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/mess/token/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ studentId, tokenType: type })
            });
            const data = await res.json();
            if (res.ok) {
                fetchTokens();
                alert(`${type} Token Generated!`);
            } else {
                alert(data.message || 'Error generating token');
            }
        } catch (err) { }
        setLoading(false);
    };

    const isRegistrationOpen = () => {
        if (!config || config.specialFoodSession === 'None' || !config.specialFoodStartTime || !config.specialFoodEndTime) return false;

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const todayStr = `${d}.${m}.${y}`;

        if (todayStr !== config.specialFoodDate) return false;

        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = (() => {
            try {
                const [h, m] = (config.specialFoodStartTime || "00:00").split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            } catch (e) { return 0; }
        })();
        const endMinutes = (() => {
            try {
                const [h, m] = (config.specialFoodEndTime || "00:00").split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            } catch (e) { return 0; }
        })();

        return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
    };

    const registrationStatusMsg = () => {
        if (!config || config.specialFoodSession === 'None') return 'No special food scheduled.';

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const todayStr = `${d}.${m}.${y}`;

        if (todayStr !== config.specialFoodDate) return `Next special food registration on ${config.specialFoodDate || 'TBA'}.`;

        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = (() => {
            try {
                const [h, m] = (config.specialFoodStartTime || "00:00").split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            } catch (e) { return 0; }
        })();
        const endMinutes = (() => {
            try {
                const [h, m] = (config.specialFoodEndTime || "00:00").split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            } catch (e) { return 0; }
        })();

        if (currentTimeMinutes < startMinutes) return `Registration for ${config.specialFoodName || 'Special Food'} opens at ${formatTime12h(config.specialFoodStartTime)}.`;
        if (currentTimeMinutes > endMinutes) return `Registration for ${config.specialFoodName || 'Special Food'} is finished/closed.`;

        return `Registration for ${config.specialFoodName || 'Special Food'} is ACTIVE until ${formatTime12h(config.specialFoodEndTime)}.`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Daily Regular Menu Section */}
            <div className="arena-card animate-slide-up" style={{
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--accent-blue)', fontSize: '1rem' }}>Today's Regular Menu</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updated: {config?.regularMenu?.lastUpdated ? formatDateIST(config.regularMenu.lastUpdated) : 'Recently'}</span>
                </div>
                <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Main Dish</p>
                        <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{config?.regularMenu?.mainDish || 'Pending...'}</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Side Dish</p>
                        <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{config?.regularMenu?.sideDish || 'Pending...'}</p>
                    </div>
                </div>
            </div>

            <div className="arena-card" style={{
                background: isRegistrationOpen() ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                border: isRegistrationOpen() ? '1px dashed #22c55e66' : '1px dashed #ef444466',
                textAlign: 'center'
            }}>
                <h4 style={{ color: isRegistrationOpen() ? '#22c55e' : '#ef4444', marginBottom: '1rem' }}>
                    {config?.specialFoodName || 'Special Food Token'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {config && config.specialFoodSession !== 'None' ? `${config.specialFoodSession} | Registration: ${config.specialFoodDate}` : 'No session scheduled'}
                    </p>
                    {config?.specialFoodProvidingDate && (
                        <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                            Providing Date: {config.specialFoodProvidingDate}
                        </p>
                    )}
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {registrationStatusMsg()}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => handleGenerate('Digital')}
                        className="arena-btn"
                        disabled={loading || !isRegistrationOpen()}
                        style={{ opacity: isRegistrationOpen() ? 1 : 0.5 }}
                    >
                        Get Digital Token
                    </button>
                    <button
                        onClick={() => handleGenerate('Manual')}
                        className="arena-btn btn-secondary"
                        disabled={loading || !isRegistrationOpen()}
                        style={{ opacity: isRegistrationOpen() ? 1 : 0.5 }}
                    >
                        Register Manual Token
                    </button>
                </div>
            </div>

            <div className="arena-card">
                <h4 style={{ marginBottom: '1.2rem', color: 'var(--accent-blue)' }}>Active Tokens</h4>
                {tokens.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No active tokens found.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {Array.isArray(tokens) && tokens.map(t => (
                            <div key={t._id} className="arena-card animate-scale-up" style={{
                                background: 'var(--grad-premium)',
                                padding: '1.2rem',
                                textAlign: 'center',
                                borderRadius: '16px',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '0.6rem', opacity: 0.7, marginBottom: '4px' }}>{t.tokenType.toUpperCase()} PASS</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>{t.tokenId}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{t.foodName || 'Special Food'}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '4px' }}>{t.sessionType} | {user?.rollNo || user?.registerNo || 'N/A'}</div>
                                {t.providingDate && <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 'bold', marginBottom: '8px' }}>FOR: {t.providingDate}</div>}
                                <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Reg: {formatDateIST(t.generatedAt)}</div>

                                <div style={{
                                    marginTop: '12px',
                                    padding: '4px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '6px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold'
                                }}>VALID FOR FOOD</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                * Digital tokens will be closed by the mess warden after you receive your food.
            </p>
        </div>
    );
};

const MessManagementModule = () => {
    const { user } = useAuth();
    const [config, setConfig] = React.useState(null);
    const [activeTokens, setActiveTokens] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [stats, setStats] = React.useState({ totalSpent: '', studentCount: '' });
    const [feeInputs, setFeeInputs] = React.useState({
        hostelFee: '',
        fixedMessFee: '',
        commonFoodFee: '',
        hostelBillingCycle: 'Yearly',
        messBillingCycle: 'Yearly'
    });
    const [specialFood, setSpecialFood] = React.useState({
        specialFoodName: '',
        specialFoodDate: '',
        specialFoodProvidingDate: '',
        specialFoodStartTime: '08:00',
        specialFoodEndTime: '10:00',
        specialFoodSession: 'None'
    });
    const [regularMenu, setRegularMenu] = React.useState({ mainDish: '', sideDish: '' });
    const [masterList, setMasterList] = React.useState([]);
    const [newFoodItem, setNewFoodItem] = React.useState('');

    const fetchConfig = React.useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setConfig(data);
            if (data) {
                setFeeInputs({
                    hostelFee: data.hostelFee || '',
                    fixedMessFee: data.fixedMessFee || '',
                    commonFoodFee: data.commonFoodFee || '',
                    hostelBillingCycle: data.hostelBillingCycle || 'Yearly',
                    messBillingCycle: data.messBillingCycle || 'Yearly'
                });
            }
            if (data?.specialFoodName !== undefined) {
                setSpecialFood({
                    specialFoodName: data.specialFoodName || '',
                    specialFoodDate: data.specialFoodDate || '',
                    specialFoodProvidingDate: data.specialFoodProvidingDate || '',
                    specialFoodStartTime: data.specialFoodStartTime || '08:00',
                    specialFoodEndTime: data.specialFoodEndTime || '10:00',
                    specialFoodSession: data.specialFoodSession || 'None'
                });
            }
            if (data?.regularMenu) {
                setRegularMenu({
                    mainDish: data.regularMenu.mainDish || '',
                    sideDish: data.regularMenu.sideDish || ''
                });
            }
            if (data?.specialFoodMasterList) {
                setMasterList(data.specialFoodMasterList);
            }
        } catch (err) { }
    }, []);

    const fetchActiveTokens = React.useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/mess/tokens/active', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setActiveTokens(data);
        } catch (err) { }
    }, []);

    React.useEffect(() => {
        fetchConfig();
        fetchActiveTokens();
    }, [fetchConfig, fetchActiveTokens]);

    const handleAddFood = async () => {
        if (!newFoodItem.trim()) return;
        const updatedList = [...masterList, newFoodItem.trim()];
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ specialFoodMasterList: updatedList })
            });
            if (res.ok) {
                setMasterList(updatedList);
                setNewFoodItem('');
            }
        } catch (err) { }
        setLoading(false);
    };

    const handleRemoveFood = async (item) => {
        const updatedList = masterList.filter(i => i !== item);
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ specialFoodMasterList: updatedList })
            });
            if (res.ok) setMasterList(updatedList);
        } catch (err) { }
        setLoading(false);
    };

    const handleUpdateRegularMenu = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ regularMenu: { ...regularMenu, lastUpdated: new Date() } })
            });
            if (res.ok) alert('Daily Regular Menu Updated! 🍚');
        } catch (err) { }
        setLoading(false);
    };

    const handleUpdateStructure = async (type) => {
        setLoading(true);
        try {
            const body = {
                type,
                hostelFee: feeInputs.hostelFee || config.hostelFee,
                fixedMessFee: feeInputs.fixedMessFee || config.fixedMessFee,
                commonFoodFee: feeInputs.commonFoodFee || config.commonFoodFee,
                hostelBillingCycle: feeInputs.hostelBillingCycle || config.hostelBillingCycle,
                messBillingCycle: feeInputs.messBillingCycle || config.messBillingCycle
            };
            const res = await fetch('http://localhost:5000/api/student/fees/structure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                await fetchConfig();
                alert(`Mess System Settings Saved Successfully! 💾`);
            }
        } catch (err) { }
        setLoading(false);
    };

    const handleCloseToken = async (tokenId) => {
        if (!stats.totalSpent || !stats.studentCount) {
            alert('Please provide total spent and total students for calculation.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/mess/token/close', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({
                    tokenId,
                    totalSpent: stats.totalSpent,
                    studentCount: stats.studentCount,
                    wardenId: user._id
                })
            });
            if (res.ok) {
                fetchActiveTokens();
                alert('Token closed and billed.');
            }
        } catch (err) { }
        setLoading(false);
    };

    const handlePrintManualToken = async (token) => {
        const receipt = BluetoothService.generateTokenReceipt(
            token.student.name,
            token.student.rollNo || token.student.registerNo,
            token.foodName,
            token.sessionType,
            token.tokenId
        );
        try {
            await BluetoothService.print(receipt);
            alert("Manual Token Sent to Printer! 🖨️");
        } catch (e) {
            alert(e.message);
        }
    };

    if (!config) return <p>Loading Mess Control...</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Mode Selector & Status */}
            {/* Mess Method Status & Toggle */}
            <div className="arena-card animate-slide-up" style={{
                border: '1px solid rgba(255,255,255,0.05)',
                background: config.feeStructureType === 'Common' ? 'rgba(34,197,94,0.02)' : 'rgba(59,130,246,0.02)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '150px',
                    height: '150px',
                    background: config.feeStructureType === 'Common' ? 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 className="section-title" style={{ marginBottom: '4px' }}>Mess Operating Mode</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Currently: <span style={{ color: config.feeStructureType === 'Common' ? '#22c55e' : '#3b82f6', fontWeight: 'bold' }}>
                                {config.feeStructureType === 'Common' ? 'Fixed Yearly Fee (Common)' : 'Token Registration (Separate)'}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to switch to the ${config.feeStructureType === 'Common' ? 'Separate (Token)' : 'Common (Fixed)'} method? This will change how student fees are calculated.`)) {
                                handleUpdateStructure(config.feeStructureType === 'Common' ? 'Separate' : 'Common');
                            }
                        }}
                        className="arena-btn"
                        style={{
                            width: 'fit-content',
                            background: 'var(--grad-premium)',
                            border: 'none',
                            padding: '0.8rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🔄 Change Method
                    </button>
                </div>

                <div className="profile-grid" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '12px', position: 'relative', zIndex: 1 }}>
                    <ProfileItem label="Method" value={config.feeStructureType === 'Common' ? '🍚 COMMON / FIXED' : '🎫 SEPARATE / TOKEN'} valueColor={config.feeStructureType === 'Common' ? '#22c55e' : '#3b82f6'} />
                    <ProfileItem label="Hostel Rent" value={`₹${config.hostelFee} / ${config.hostelBillingCycle === 'Monthly' ? 'Month' : 'Year'}`} />
                    {config.feeStructureType === 'Common' ? (
                        <ProfileItem label="Fixed Mess Bill" value={`₹${config.fixedMessFee} / ${config.messBillingCycle === 'Monthly' ? 'Month' : 'Year'}`} valueColor="#fbbf24" />
                    ) : (
                        <ProfileItem label="Mess Utility (Base)" value={`₹${config.commonFoodFee} / ${config.messBillingCycle === 'Monthly' ? 'Month' : 'Year'}`} valueColor="#fbbf24" />
                    )}
                </div>
            </div>

            {/* Price & Budget Configuration (Visible in both, but fields change) */}
            <div className="arena-card animate-slide-up">
                <h3 className="section-title">Budget & Price Control</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateStructure(config.feeStructureType); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="field-label">Hostel Rent ({feeInputs.hostelBillingCycle})</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    className="arena-input"
                                    value={feeInputs.hostelFee}
                                    onChange={e => setFeeInputs({ ...feeInputs, hostelFee: e.target.value })}
                                    placeholder="e.g. 30000"
                                    style={{ flex: 1 }}
                                />
                                <select
                                    className="arena-input"
                                    style={{ width: 'fit-content' }}
                                    value={feeInputs.hostelBillingCycle}
                                    onChange={e => setFeeInputs({ ...feeInputs, hostelBillingCycle: e.target.value })}
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                        {config.feeStructureType === 'Common' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="field-label">Fixed Mess Fee ({feeInputs.messBillingCycle})</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        className="arena-input"
                                        value={feeInputs.fixedMessFee}
                                        onChange={e => setFeeInputs({ ...feeInputs, fixedMessFee: e.target.value })}
                                        placeholder="e.g. 50000"
                                        style={{ flex: 1 }}
                                    />
                                    <select
                                        className="arena-input"
                                        style={{ width: 'fit-content' }}
                                        value={feeInputs.messBillingCycle}
                                        onChange={e => setFeeInputs({ ...feeInputs, messBillingCycle: e.target.value })}
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="field-label">Base Mess Utility Fee ({feeInputs.messBillingCycle})</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        className="arena-input"
                                        value={feeInputs.commonFoodFee}
                                        onChange={e => setFeeInputs({ ...feeInputs, commonFoodFee: e.target.value })}
                                        placeholder="e.g. 25000"
                                        style={{ flex: 1 }}
                                    />
                                    <select
                                        className="arena-input"
                                        style={{ width: 'fit-content' }}
                                        value={feeInputs.messBillingCycle}
                                        onChange={e => setFeeInputs({ ...feeInputs, messBillingCycle: e.target.value })}
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button type="submit" className="arena-btn" style={{ width: 'fit-content', padding: '0.8rem 2rem' }}>
                            💾 Save Pricing Constants
                        </button>
                    </div>
                </form>
            </div>

            {/* Daily Regular Menu Management - Always Visible */}
            <div className="arena-card animate-slide-up">
                <h3 className="section-title">Daily Regular Menu Management</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Set the regular main and side dishes for the current day. Students will see this in their Mess tab.
                </p>
                <form onSubmit={handleUpdateRegularMenu} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label className="field-label">Main Dish</label>
                            <input
                                type="text"
                                className="arena-input"
                                value={regularMenu.mainDish}
                                onChange={e => setRegularMenu({ ...regularMenu, mainDish: e.target.value })}
                                placeholder="e.g. Sambar Rice"
                                required
                            />
                        </div>
                        <div>
                            <label className="field-label">Side Dish</label>
                            <input
                                type="text"
                                className="arena-input"
                                value={regularMenu.sideDish}
                                onChange={e => setRegularMenu({ ...regularMenu, sideDish: e.target.value })}
                                placeholder="e.g. Potato Fry"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="arena-btn" style={{ width: 'fit-content', padding: '0.8rem 2rem' }}>
                        🍙 Publish Regular Menu
                    </button>
                </form>
            </div>

            {/* SEPARATE MODE ONLY: Scheduling & Tokens */}
            {config.feeStructureType === 'Separate' && (
                <>
                    {/* Master Food List Management */}
                    <div className="arena-card animate-slide-up">
                        <h3 className="section-title">Special Food Master List</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Add special foods here to make them available for scheduling.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                className="arena-input"
                                value={newFoodItem}
                                onChange={e => setNewFoodItem(e.target.value)}
                                placeholder="e.g. Chicken Biriyani, Fried Rice..."
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleAddFood} className="arena-btn" style={{ padding: '0 1.5rem' }}>Add Item</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {masterList.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items in master list.</p>
                            ) : masterList.map(item => (
                                <div key={item} style={{
                                    background: 'rgba(59,130,246,0.1)',
                                    color: 'var(--accent-blue)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(59,130,246,0.2)'
                                }}>
                                    {item}
                                    <span onClick={() => handleRemoveFood(item)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="arena-card animate-slide-up">
                        <h3 className="section-title">Special Food Set (Scheduling)</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setLoading(true);
                            try {
                                const res = await fetch('http://localhost:5000/api/student/config', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                                    },
                                    body: JSON.stringify(specialFood)
                                });
                                if (res.ok) {
                                    await fetchConfig();
                                    alert('Special Food Scheduled Successfully! 🍗');
                                }
                            } catch (err) { }
                            setLoading(false);
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="mobile-span-all" style={{ gridColumn: 'span 2' }}>
                                    <label className="field-label">Special Food Name</label>
                                    <select
                                        className="arena-input"
                                        value={specialFood.specialFoodName}
                                        onChange={e => setSpecialFood({ ...specialFood, specialFoodName: e.target.value })}
                                        required
                                    >
                                        <option value="">Select from Master List</option>
                                        {masterList.map(item => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="field-label">Registration Date (DD.MM.YYYY)</label>
                                    <input
                                        type="text"
                                        className="arena-input"
                                        value={specialFood.specialFoodDate}
                                        onChange={e => setSpecialFood({ ...specialFood, specialFoodDate: e.target.value })}
                                        placeholder="e.g. 17.02.2026"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Providing Date (DD.MM.YYYY)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="arena-input"
                                            value={specialFood.specialFoodProvidingDate}
                                            onChange={e => setSpecialFood({ ...specialFood, specialFoodProvidingDate: e.target.value })}
                                            placeholder="e.g. 18.02.2026"
                                            style={{ flex: 1 }}
                                            required
                                        />
                                        <input
                                            type="date"
                                            className="arena-input"
                                            style={{ width: '45px', padding: '0 5px' }}
                                            onChange={e => {
                                                const [y, m, d] = e.target.value.split('-');
                                                if (y && m && d) setSpecialFood({ ...specialFood, specialFoodProvidingDate: `${d}.${m}.${y}` });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="field-label">Session Type</label>
                                    <select
                                        className="arena-input"
                                        value={specialFood.specialFoodSession}
                                        onChange={e => setSpecialFood({ ...specialFood, specialFoodSession: e.target.value })}
                                        required
                                    >
                                        <option value="None">None (Deactivate)</option>
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                    </select>
                                </div>
                                <TimePickerIST
                                    label="Registration Start Time"
                                    value={specialFood.specialFoodStartTime}
                                    onChange={val => setSpecialFood({ ...specialFood, specialFoodStartTime: val })}
                                />
                                <TimePickerIST
                                    label="Registration End Time"
                                    value={specialFood.specialFoodEndTime}
                                    onChange={val => setSpecialFood({ ...specialFood, specialFoodEndTime: val })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="arena-btn" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? 'Propagating Logic...' : '📅 Set Special Food Window'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="arena-card animate-slide-up">
                        <h3 className="section-title">Token Billing Engine</h3>

                        <div className="arena-card" style={{ marginBottom: '2rem', background: 'rgba(59,130,246,0.05)', border: '1.5px solid #3b82f644' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Pricing Calculator (Batch Update)</h4>
                            <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="field-label">Total Spent (₹)</label>
                                    <input
                                        type="number"
                                        className="arena-input"
                                        value={stats.totalSpent}
                                        onChange={e => setStats({ ...stats, totalSpent: e.target.value })}
                                        placeholder="e.g. 5000"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Student Count</label>
                                    <input
                                        type="number"
                                        className="arena-input"
                                        value={stats.studentCount}
                                        onChange={e => setStats({ ...stats, studentCount: e.target.value })}
                                        placeholder="e.g. 100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Active Special Tokens ({activeTokens?.length || 0})</h4>
                            {(Array.isArray(activeTokens) ? activeTokens : []).length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No active tokens to process.</p>
                            ) : (
                                (Array.isArray(activeTokens) ? activeTokens : []).map(t => (
                                    <div key={t._id} className="arena-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-main)' }}>
                                        <div>
                                            <strong style={{ color: 'var(--accent-blue)' }}>{t.student?.name}</strong>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {t.student?.rollNo} | {t.tokenId}</p>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{t.tokenType}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handlePrintManualToken(t)}
                                                className="arena-btn btn-secondary"
                                                style={{ padding: '0.5rem', fontSize: '1.1rem', borderColor: '#a855f7', color: '#a855f7' }}
                                                title="Print Manual Token"
                                            >
                                                🖨️
                                            </button>
                                            <button
                                                onClick={() => handleCloseToken(t._id)}
                                                className="arena-btn"
                                                disabled={loading}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                                            >
                                                ✔ Close & Bill
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const FeesModule = ({ studentId, initialFees }) => {
    const [fees, setFees] = React.useState({
        balance: initialFees?.balance || 0,
        paid: initialFees?.paid || 0,
        pending: initialFees?.balance || 0,
        totalDue: 0,
        structure: 'Common',
        hostelBillingCycle: 'Yearly',
        messBillingCycle: 'Yearly'
    });
    const [history, setHistory] = React.useState([]);
    const [amount, setAmount] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [fetching, setFetching] = React.useState(true);

    const fetchSummary = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/fees/summary/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setFees({
                balance: data.feesPending,
                paid: data.feesPaid,
                pending: data.feesPending,
                totalDue: data.totalDue,
                structure: data.structure,
                hostelBillingCycle: data.hostelBillingCycle || 'Yearly',
                messBillingCycle: data.messBillingCycle || 'Yearly'
            });
        } catch (err) { }
    }, [studentId]);

    const fetchHistory = React.useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/fees/history/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                setHistory([]);
            }
        } catch (err) {
            setHistory([]);
        }
        setFetching(false);
    }, [studentId]);

    React.useEffect(() => {
        fetchSummary();
        fetchHistory();
    }, [fetchSummary, fetchHistory]);

    const handlePay = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/student/fees/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ studentId, amount })
            });
            if (res.ok) {
                setAmount('');
                fetchSummary();
                fetchHistory();
                alert('Payment Successful!');
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (err) { }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="arena-card" style={{ textAlign: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Fees Pending</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>₹{fees.pending}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Total Due: ₹{fees.totalDue} ({fees.structure})</p>
                    <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '4px' }}>
                        Hostel: {fees.hostelBillingCycle} | Mess: {fees.messBillingCycle}
                    </p>
                </div>
                <div className="arena-card" style={{ textAlign: 'center', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Fees Paid</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#22c55e' }}>₹{fees.paid}</p>
                </div>
            </div>

            <form onSubmit={handlePay} className="mobile-stack" style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                <div style={{ flex: 1 }}>
                    <label className="field-label" style={{ marginBottom: '8px', display: 'block' }}>Payment Gateway</label>
                    <input
                        type="number"
                        className="arena-input"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount to pay"
                        max={fees.pending}
                        required
                    />
                </div>
                <button type="submit" className="arena-btn" style={{ alignSelf: 'flex-end', height: '45px', whiteSpace: 'nowrap' }} disabled={loading || fees.pending <= 0}>
                    {loading ? 'Processing...' : 'Secure Pay Now'}
                </button>
            </form>

            <div className="arena-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Payment History
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{history.length} Transactions</span>
                </h4>

                {fetching ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</p>
                ) : history.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontStyle: 'italic' }}>No transactions recorded.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {Array.isArray(history) && history.map(item => (
                            <div key={item._id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>₹{item.amount}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {item.transactionId}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 8px',
                                        borderRadius: '40px',
                                        background: 'rgba(34,197,94,0.1)',
                                        color: '#22c55e',
                                        fontWeight: 'bold'
                                    }}>SUCCESS</span>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDateIST(item.paymentDate)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProfileItem = ({ label, value, valueColor = 'var(--text-main)' }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}:</span>
        <span style={{ color: valueColor, fontWeight: '500', fontSize: '0.85rem' }}>{value || '-'}</span>
    </div>
);

const StudentResidentModule = () => {
    const { user: currentUser } = useAuth(); // Access logged in user
    const [students, setStudents] = React.useState([]);
    const [editingStudent, setEditingStudent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const socket = useSocket();

    const fetchStudents = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/all-students', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setStudents(data);
            } else {
                setStudents([]);
            }
        } catch (err) {
            setStudents([]);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchStudents();
    }, []);

    React.useEffect(() => {
        if (!socket) return;
        socket.on('census_update', (data) => {
            console.log('Real-time Census update received:', data);
            fetchStudents();
        });
        return () => socket.off('census_update');
    }, [socket]);

    const groupedByBatch = (Array.isArray(students) ? students : []).reduce((acc, s) => {
        const batch = s.batch || 'Unassigned';
        if (!acc[batch]) acc[batch] = [];
        acc[batch].push(s);
        return acc;
    }, {});

    const stats = {
        total: (Array.isArray(students) ? students : []).length,
        present: (Array.isArray(students) ? students : []).filter(s => s.attendanceStatus === 'Present').length,
        out: (Array.isArray(students) ? students : []).filter(s => s.attendanceStatus === 'Out').length,
        absent: (Array.isArray(students) ? students : []).filter(s => s.attendanceStatus === 'Absent').length
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Attendance Dashboard */}
            <div className="arena-card" style={{ background: 'var(--grad-premium)', color: 'white' }}>
                <h3 style={{ marginBottom: '1rem', opacity: 0.9 }}>Live Attendance Census</h3>
                <div className="census-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.total}</span>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Residents</p>
                    </div>
                    <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.present}</span>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Present</p>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.out}</span>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Outpass</p>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.absent}</span>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Absent</p>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                        NET PRESENT IN HOSTEL: <span style={{ color: '#fbbf24', fontSize: '1.4rem' }}>{stats.present}</span> students
                    </p>
                    <button
                        onClick={async () => {
                            if (!window.confirm("CRITICAL ACTION: This will automatically BLOCK all students currently marked as 'Absent'. Proceed?")) return;
                            const res = await fetch('http://localhost:5000/api/student/block-absentees', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
                            });
                            const data = await res.json();
                            if (res.ok) {
                                alert(data.message);
                                fetchStudents();
                            }
                        }}
                        className="arena-btn"
                        style={{ marginTop: '1rem', width: '100%', background: '#ff000022', border: '1px solid #ef4444', color: '#ef4444' }}
                    >
                        🔒 Lock Nightly Census & Block Absentees
                    </button>
                </div>
            </div>

            {/* Student Directory */}
            <div className="arena-card">
                <h3 className="section-title">Batch-wise Resident Directory</h3>
                {Object.keys(groupedByBatch).sort().reverse().map(batch => (
                    <div key={batch} style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-main)', paddingBottom: '0.5rem' }}>
                            Batch: {batch} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({groupedByBatch[batch]?.length || 0} Students)</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {Array.isArray(groupedByBatch[batch]) && groupedByBatch[batch].map(s => (
                                <div key={s._id} className="arena-card" style={{ padding: '1rem', border: '1.5px solid var(--border-main)', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>{s.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room: {s.roomNo} | ID: {s.approvalNo || 'No ID'}</p>
                                            {s.lastAttendanceAt && (
                                                <p style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '4px' }}>
                                                    🕒 Last Seen: {formatDateTimeIST(s.lastAttendanceAt)}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            background: s.attendanceStatus === 'Present' ? '#166534' : s.attendanceStatus === 'Out' ? '#991b1b' : '#3f3f46',
                                            color: 'white'
                                        }}>
                                            {s.attendanceStatus?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem' }}>
                                        <button
                                            onClick={() => setEditingStudent(s)}
                                            className="arena-link"
                                            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm(`Are you sure you want to ${s.isBlocked ? 'unblock' : 'block'} this student?`)) return;
                                                const res = await fetch('http://localhost:5000/api/student/block-status', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                                                    },
                                                    body: JSON.stringify({ studentId: s._id, isBlocked: !s.isBlocked })
                                                });
                                                if (res.ok) fetchStudents();
                                            }}
                                            className="arena-link"
                                            style={{ fontSize: '0.75rem', color: s.isBlocked ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            {s.isBlocked ? '✅ Unblock' : '🚫 Block'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {editingStudent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="arena-card animate-zoom-in" style={{ maxWidth: '600px', width: '100%', maxHeight: '95vh', overflowY: 'auto', border: '1px solid var(--primary)' }}>
                        <h3 className="section-title">Modify Student Profile</h3>
                        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                            <div>
                                <label className="field-label">Full Name</label>
                                <input type="text" className="arena-input" defaultValue={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Approval No.</label>
                                <input type="text" className="arena-input" defaultValue={editingStudent.approvalNo} onChange={(e) => setEditingStudent({ ...editingStudent, approvalNo: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Room No.</label>
                                <input type="text" className="arena-input" defaultValue={editingStudent.roomNo} onChange={(e) => setEditingStudent({ ...editingStudent, roomNo: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Roll Number</label>
                                <input type="text" className="arena-input" defaultValue={editingStudent.rollNo} onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Batch</label>
                                <input type="text" className="arena-input" defaultValue={editingStudent.batch} onChange={(e) => setEditingStudent({ ...editingStudent, batch: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Status</label>
                                <select className="arena-input" defaultValue={editingStudent.attendanceStatus} onChange={(e) => setEditingStudent({ ...editingStudent, attendanceStatus: e.target.value })}>
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Out">Out on Leave</option>
                                </select>
                            </div>
                        </div>
                        <div className="mobile-stack" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={async () => {
                                    await fetch(`http://localhost:5000/api/student/student/${editingStudent._id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'x-user-id': currentUser._id,
                                            'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                                        },
                                        body: JSON.stringify(editingStudent)
                                    });
                                    setEditingStudent(null);
                                    fetchStudents();
                                }}
                                className="arena-btn" style={{ flex: 2 }}
                            >
                                Confirm Updates
                            </button>
                            <button onClick={() => setEditingStudent(null)} className="arena-btn btn-secondary" style={{ flex: 1 }}>Dismiss</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WardenComplaintModule = () => {
    const [complaints, setComplaints] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');

    const fetchAllComplaints = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/all-complaints', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setComplaints(data);
        } catch (err) { }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchAllComplaints();
        const interval = setInterval(fetchAllComplaints, 5000); // 5s Polling
        return () => clearInterval(interval);
    }, []);

    const handleStatusUpdate = async (complaintId, status) => {
        try {
            const res = await fetch('http://localhost:5000/api/student/complaint/status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ complaintId, status })
            });
            if (res.ok) fetchAllComplaints();
        } catch (err) { }
    };

    const filtered = (Array.isArray(complaints) ? complaints : []).filter(c =>
        c.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.student?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="arena-card animate-slide-up">
            <h3 className="section-title">Student Feedback & Complaints</h3>
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Search by student name, roll no or category..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="arena-input"
                    style={{ width: '100%', padding: '0.8rem 1rem' }}
                />
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Fetching student feedback...</p>
            ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No complaints found.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {filtered.map(c => (
                        <div key={c._id} className="arena-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid var(--border-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ color: 'var(--accent-blue)', margin: 0 }}>{c.student?.name}</h4>
                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', borderRadius: '4px' }}>
                                            {c.category}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0' }}>
                                        Roll: {c.student?.rollNo} | Room: {c.student?.roomNo} | Hostel: {c.student?.hostelName}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Submitted on: {formatDateIST(c.createdAt)}
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    background: c.status === 'Solved' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                                    color: c.status === 'Solved' ? '#22c55e' : '#eab308'
                                }}>
                                    {c.status.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>" {c.description} "</p>
                            </div>
                            {c.status === 'Not Solved' && (
                                <button
                                    onClick={() => handleStatusUpdate(c._id, 'Solved')}
                                    className="arena-btn"
                                    style={{ width: '100%', padding: '0.6rem', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                                >
                                    ✅ Mark as Solved
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const WardenFeesModule = () => {
    const [search, setSearch] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const handleSearch = async (val) => {
        setSearch(val);
        if (val.length >= 2) { // As requested: last two digits or more
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:5000/api/student/fees/search/${val}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
                });
                const data = await res.json();
                setResults(Array.isArray(data) ? data : []);
            } catch (err) { }
            setLoading(false);
        } else {
            setResults([]);
        }
    };

    return (
        <div className="arena-card animate-slide-up">
            <h3 className="section-title">Fee Audit Gateway</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}> Search by last 2+ digits or full Register/Roll Number </p>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Enter student Roll No or Register No..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="arena-input"
                    style={{ width: '100%', paddingLeft: '3rem', fontSize: '1rem', border: '1px solid var(--accent-blue)' }}
                />
                <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
            </div>

            {loading && <p style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--text-muted)' }}>Searching records...</p>}

            {!loading && search.length >= 2 && results.length === 0 && (
                <p style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--text-muted)' }}>No student records found for "{search}"</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {results.map(student => (
                    <div key={student._id} className="arena-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{student.name}</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Roll: {student.rollNo} | Reg: {student.registerNo}
                                </p>
                            </div>
                            <div style={{ width: '40px', height: '40px', background: 'var(--grad-premium)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {student.name[0]}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                            <div>
                                <p style={{ fontSize: '0.65rem', color: '#22c55e', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Paid</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>₹{student.feesPaid || 0}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.65rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 'bold' }}>Balance Due</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>₹{student.feesBalance || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LabourModule = () => {
    const [search, setSearch] = React.useState('');
    const [employees, setEmployees] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchEmployees = async (query = '') => {
        setLoading(true);
        try {
            const url = query
                ? `http://localhost:5000/api/student/labour/search/${query}`
                : `http://localhost:5000/api/student/labour/all`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) { }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchEmployees();
    }, []);

    const handleAttendance = async (employeeId, status) => {
        try {
            const res = await fetch('http://localhost:5000/api/student/labour/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({ employeeId, status, date: new Date() })
            });
            if (res.ok) alert(`Attendance marked as ${status}!`);
        } catch (err) { }
    };

    return (
        <div className="arena-card animate-slide-up">
            <h3 className="section-title">Labour Resource Management</h3>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Search by name, phone, or ID..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        fetchEmployees(e.target.value);
                    }}
                    className="arena-input"
                    style={{ width: '100%', paddingLeft: '3rem' }}
                />
                <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Synchronizing staff records...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {employees.map(emp => (
                        <div key={emp._id} className="arena-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--grad-premium)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {emp.name[0]}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0 }}>{emp.name}</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>{emp.employeeRole || emp.role}</p>
                                </div>
                            </div>
                            <div className="profile-grid" style={{ marginBottom: '1.5rem' }}>
                                <ProfileItem label="Phone" value={emp.studentMobile} />
                                <ProfileItem label="Place" value={emp.place} />
                                <ProfileItem label="Daily Rate" value={`₹${emp.salaryPerDay || 0}`} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button onClick={() => handleAttendance(emp._id, 'Present')} className="arena-btn" style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    ✋ Mark Present
                                </button>
                                <button onClick={() => handleAttendance(emp._id, 'Absent')} className="arena-btn" style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    ❌ Mark Leave
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SalaryModule = () => {
    const [employees, setEmployees] = React.useState([]);
    const [selectedEmp, setSelectedEmp] = React.useState(null);
    const [history, setHistory] = React.useState([]);
    const [calcData, setCalcData] = React.useState({ daysWorked: 0, amount: 0 });
    const [loading, setLoading] = React.useState(false);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/student/labour/all', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) { }
    };

    React.useEffect(() => {
        fetchEmployees();
    }, []);

    const loadEmpDetails = async (emp) => {
        setSelectedEmp(emp);
        setLoading(true);
        try {
            const now = new Date();
            const resSummary = await fetch(`http://localhost:5000/api/student/labour/attendance/summary/${emp._id}/${now.getMonth() + 1}/${now.getFullYear()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const summary = await resSummary.json();

            const resHistory = await fetch(`http://localhost:5000/api/student/labour/salary/history/${emp._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hms_token')}` }
            });
            const historyData = await resHistory.json();

            setCalcData({
                daysWorked: summary.daysWorked,
                amount: summary.daysWorked * emp.salaryPerDay
            });
            setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (err) { }
        setLoading(false);
    };

    const handlePayment = async () => {
        if (!selectedEmp) return;
        const now = new Date();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        try {
            const res = await fetch('http://localhost:5000/api/student/labour/salary/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hms_token')}`
                },
                body: JSON.stringify({
                    employeeId: selectedEmp._id,
                    month: monthNames[now.getMonth()],
                    year: now.getFullYear(),
                    amount: calcData.amount,
                    daysWorked: calcData.daysWorked
                })
            });
            if (res.ok) {
                alert('Salary payment recorded successfully! 💰');
                loadEmpDetails(selectedEmp);
            }
        } catch (err) { }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
            <div className="arena-card">
                <h3 className="section-title">Staff Directory</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    {employees.map(emp => (
                        <div
                            key={emp._id}
                            onClick={() => loadEmpDetails(emp)}
                            style={{
                                padding: '1rem',
                                background: selectedEmp?._id === emp._id ? 'var(--grad-premium)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{emp.name}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7 }}>{emp.employeeRole || emp.role}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="arena-card">
                {selectedEmp ? (
                    <div className="animate-slide-up">
                        <h3 className="section-title">Payroll Hub: {selectedEmp.name}</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="arena-card" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
                                <p style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Working This Month</p>
                                <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>{calcData.daysWorked} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>Days</span></p>
                                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Rate: ₹{selectedEmp.salaryPerDay}/day</p>
                            </div>
                            <div className="arena-card" style={{ background: 'var(--grad-premium)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Current Payable</p>
                                <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>₹{calcData.amount}</p>
                                <button onClick={handlePayment} className="arena-btn" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', background: 'white', color: 'black' }}>
                                    💳 Process Monthly Pay
                                </button>
                            </div>
                        </div>

                        <h4 className="sub-section-title">Salary Disbursement History</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.length === 0 ? (
                                <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No previous records found.</p>
                            ) : (
                                history.map(item => (
                                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>₹{item.amount}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.month} {item.year} | {item.daysWorked} Days Worked</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '40px', fontWeight: 'bold' }}>PAID</span>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>On {formatDateIST(item.paymentDate)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        <p>Select a staff member from the directory to view payroll details.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
