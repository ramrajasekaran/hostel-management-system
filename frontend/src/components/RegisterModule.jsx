import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const RegisterModule = ({ onFinish, restrictedRoles = ['student', 'mess_employee', 'hostel_employee', 'warden'] }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: restrictedRoles[0] || 'student',
        employeeCategory: restrictedRoles.includes('mess_employee') ? 'Mess' : 'Hostel',
        employeeRole: restrictedRoles.includes('mess_employee') ? 'Server' : 'Hostel Warden',
        place: '',
        salaryPerDay: '',
        rollNo: '',
        gender: 'Male',
        fatherName: '',
        dob: '',
        studentMobile: '',
        fatherMobile: '',
        ivrNo: '',
        department: '',
        program: '',
        batch: '',
        admissionType: 'Hosteller',
        registerNo: '',
        hostelName: '',
        roomNo: '',
        fingerprintId: '',
        approvalNo: '',
        language: 'Tamil'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'rollNo') {
            setFormData({ ...formData, [name]: value, fingerprintId: value });
        } else if (name === 'approvalNo') {
            setFormData({ ...formData, [name]: value, fatherMobile: value });
        } else if (name === 'role') {
            // Auto-set category based on role choice
            let category = formData.employeeCategory;
            if (value === 'mess_employee') category = 'Mess';
            if (value === 'hostel_employee') category = 'Hostel';
            setFormData({ ...formData, [name]: value, employeeCategory: category });
        } else if (name === 'employeeRole') {
            // Synchronize role with specific employee role for RBAC
            let roleAdjustment = formData.role;
            if (value === 'Mess Warden') roleAdjustment = 'mess_warden';
            else if (value === 'Hostel Warden') roleAdjustment = 'hostel_warden';
            else {
                // If they was a warden but now chose a regular role, reset to base role
                if (formData.role === 'mess_warden') roleAdjustment = 'mess_employee';
                if (formData.role === 'hostel_warden') roleAdjustment = 'hostel_employee';
            }
            setFormData({ ...formData, [name]: value, role: roleAdjustment });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validation: Student and Parent phone numbers must be different
        if (formData.role === 'student' && formData.studentMobile === formData.fatherMobile) {
            setError('Student phone number and Parent phone number (Approval ID) cannot be the same.');
            setLoading(false);
            return;
        }

        const result = await register(formData);
        if (result.success) {
            setSuccess(`User ${formData.name} added successfully!`);
            setFormData({
                name: '', username: '', email: '', password: '', role: 'student',
                employeeCategory: 'Mess', employeeRole: 'Server', place: '', salaryPerDay: '',
                rollNo: '', gender: 'Male', fatherName: '', dob: '', studentMobile: '',
                fatherMobile: '', ivrNo: '', department: '', program: '', batch: '',
                admissionType: 'Hosteller', registerNo: '', hostelName: '', roomNo: '',
                fingerprintId: '', approvalNo: '', language: 'Tamil'
            });
            if (onFinish) onFinish();
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="arena-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3 className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Unified HMS Registration</h3>

            {error && <div className="error-alert">{error}</div>}
            {success && <div className="success-alert">{success}</div>}

            <form onSubmit={handleSubmit}>
                <h4 className="sub-section-title">Identity & Credentials</h4>
                <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {restrictedRoles.length > 1 && (
                        <div>
                            <label className="field-label">Category Type</label>
                            <select name="role" className="arena-input" value={formData.role} onChange={handleChange}>
                                {restrictedRoles.includes('student') && <option value="student">Student Resident</option>}
                                {restrictedRoles.includes('mess_employee') && <option value="mess_employee">Mess Employee</option>}
                                {restrictedRoles.includes('hostel_employee') && <option value="hostel_employee">Hostel Employee</option>}
                                {restrictedRoles.includes('warden') && <option value="warden">Main Warden (Admin)</option>}
                            </select>
                        </div>
                    )}

                    {/* Employee Specific Role Selection */}
                    {(formData.role === 'mess_employee' || formData.role === 'hostel_employee' || formData.role === 'mess_warden' || formData.role === 'hostel_warden') && (
                        <div>
                            <label className="field-label">Specific Role</label>
                            <select name="employeeRole" className="arena-input" value={formData.employeeRole} onChange={handleChange}>
                                {formData.employeeCategory === 'Mess' ? (
                                    <>
                                        <option value="Server">Server</option>
                                        <option value="Chef">Chef</option>
                                        <option value="Cleaner">Maintenance (Cleaning)</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Mess Warden">Mess Warden</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Hostel Warden">Hostel Warden</option>
                                        <option value="Room Cleaner">Room Cleaner</option>
                                        <option value="Plumber">Maintenance (Plumber)</option>
                                        <option value="Electrician">Maintenance (Electrician)</option>
                                        <option value="Laundry">Laundry</option>
                                    </>
                                )}
                            </select>
                        </div>
                    )}

                    {/* Employee Core Info (Grouped as requested) */}
                    {(formData.role !== 'student' && formData.role !== 'warden') && (
                        <>
                            <div>
                                <label className="field-label">Employee Full Name</label>
                                <input type="text" name="name" className="arena-input" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Employee Phone Number</label>
                                <input type="text" name="studentMobile" className="arena-input" value={formData.studentMobile} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Permanent Place</label>
                                <input type="text" name="place" className="arena-input" value={formData.place} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Salary Per Day (₹)</label>
                                <input type="number" name="salaryPerDay" className="arena-input" value={formData.salaryPerDay} onChange={handleChange} required />
                            </div>
                        </>
                    )}

                    {/* Login Credentials - Only for specific roles */}
                    {(['student', 'warden', 'admin', 'mess_warden', 'hostel_warden'].includes(formData.role)) && (
                        <>
                            {formData.role === 'warden' && (
                                <div>
                                    <label className="field-label">Full Name</label>
                                    <input type="text" name="name" className="arena-input" value={formData.name} onChange={handleChange} required />
                                </div>
                            )}
                            <div>
                                <label className="field-label">System Username (for Login)</label>
                                <input type="text" name="username" className="arena-input" value={formData.username} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Access Password</label>
                                <input type="password" name="password" className="arena-input" value={formData.password} onChange={handleChange} required />
                            </div>
                        </>
                    )}
                </div>

                {formData.role === 'student' && (
                    <>
                        <h4 className="sub-section-title">Academic & Program Details</h4>
                        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label className="field-label">Roll Number</label>
                                <input type="text" name="rollNo" className="arena-input" value={formData.rollNo} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Register Number</label>
                                <input type="text" name="registerNo" className="arena-input" value={formData.registerNo} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Department</label>
                                <select name="department" className="arena-input" value={formData.department} onChange={handleChange} required>
                                    <option value="">Select Department</option>
                                    <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science (AI&DS)</option>
                                    <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning (AI&ML)</option>
                                    <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                                    <option value="Computer Science and Business Systems">Computer Science and Business Systems (CSBS)</option>
                                    <option value="Information Technology">Information Technology (IT)</option>
                                    <option value="Electronics and Communication Engineering">Electronics and Communication Engineering (ECE)</option>
                                    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering (EEE)</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                    <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                                    <option value="Food Technology">Food Technology</option>
                                    <option value="Chemical Engineering">Chemical Engineering</option>
                                    <option value="Biotechnology">Biotechnology</option>
                                    <option value="Biomedical Engineering">Biomedical Engineering</option>
                                    <option value="Cyber Security">Cyber Security</option>
                                    <option value="Robotics and Automation">Robotics and Automation</option>
                                    <option value="Masters of Business Administration">Masters of Business Administration (MBA)</option>
                                    <option value="Masters of Computer Applications">Masters of Computer Applications (MCA)</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Program / Degree</label>
                                <select name="program" className="arena-input" value={formData.program} onChange={handleChange} required>
                                    <option value="">Select Program</option>
                                    <option value="B.E.">B.E.</option>
                                    <option value="B.Tech.">B.Tech.</option>
                                    <option value="M.E.">M.E.</option>
                                    <option value="M.Tech.">M.Tech.</option>
                                    <option value="MBA">MBA</option>
                                    <option value="MCA">MCA</option>
                                    <option value="PhD">PhD</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Batch (Year of Admission)</label>
                                <select name="batch" className="arena-input" value={formData.batch} onChange={handleChange} required>
                                    <option value="">Select Batch</option>
                                    <option value="2021-2025">2021-2025</option>
                                    <option value="2022-2026">2022-2026</option>
                                    <option value="2023-2027">2023-2027</option>
                                    <option value="2024-2028">2024-2028</option>
                                    <option value="2025-2029">2025-2029</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Admission Type</label>
                                <select name="admissionType" className="arena-input" value={formData.admissionType} onChange={handleChange} required>
                                    <option value="Hosteller">Hosteller</option>
                                    <option value="Temporary Hosteller">Temporary Hosteller</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">IVR No / Alt Number</label>
                                <input type="text" name="ivrNo" className="arena-input" value={formData.ivrNo} onChange={handleChange} placeholder="Secondary contact" />
                            </div>
                            <div>
                                <label className="field-label">Approval ID / Reference No</label>
                                <input type="text" name="approvalNo" className="arena-input" value={formData.approvalNo} onChange={handleChange} required />
                            </div>
                        </div>

                        <h4 className="sub-section-title">Personal & Family Info</h4>
                        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label className="field-label">Full Name</label>
                                <input type="text" name="name" className="arena-input" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Student Mobile / Phone</label>
                                <input type="text" name="studentMobile" className="arena-input" value={formData.studentMobile} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="field-label">Gender</label>
                                <select name="gender" className="arena-input" value={formData.gender} onChange={handleChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Date of Birth</label>
                                <input type="date" name="dob" className="arena-input" value={formData.dob} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="field-label">Father's Name</label>
                                <input type="text" name="fatherName" className="arena-input" value={formData.fatherName} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="field-label">Parent / Guardian Mobile (Approval ID)</label>
                                <input type="text" name="fatherMobile" className="arena-input" value={formData.fatherMobile} readOnly placeholder="Linked to Approval ID" />
                            </div>
                        </div>

                        <h4 className="sub-section-title">Hostel Assignment</h4>
                        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label className="field-label">Hostel Name</label>
                                <input type="text" name="hostelName" className="arena-input" value={formData.hostelName} onChange={handleChange} placeholder="e.g. Boys Hostel A" />
                            </div>
                            <div>
                                <label className="field-label">Room Number</label>
                                <input type="text" name="roomNo" className="arena-input" value={formData.roomNo} onChange={handleChange} placeholder="e.g. 101, B-202" />
                            </div>
                            <div>
                                <label className="field-label">Preferred Language</label>
                                <select name="language" className="arena-input" value={formData.language} onChange={handleChange}>
                                    <option value="Tamil">Tamil</option>
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                <button type="submit" className="arena-btn" style={{ width: '100%', padding: '1.2rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Processing Registration...' : 'Finalize Registration'}
                </button>
            </form>
        </div>
    );
}
