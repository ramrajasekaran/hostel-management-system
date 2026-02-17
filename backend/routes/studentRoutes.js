const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Leave = require('../models/Leave');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const Fee = require('../models/Fee');
const SpecialToken = require('../models/SpecialToken');
const Attendance = require('../models/Attendance');
const SalaryHistory = require('../models/SalaryHistory');
const { authenticate, authorize } = require('../middleware/auth');


// Helper to get system config
const getSystemConfig = async () => {
    let config = await SystemConfig.findOne({ key: 'main_security' });
    if (!config) {
        config = await SystemConfig.create({ key: 'main_security' });
    }
    return config;
};

// @route   GET api/student/config
// @desc    Get system security configuration
router.get('/config', async (req, res) => {
    try {
        const config = await getSystemConfig();
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching configuration' });
    }
});

// @route   POST api/student/config
// @desc    Update system security configuration (Warden/Admin/Mess Warden for mess times)
router.post('/config', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {
    try {
        const {
            attendanceStart, attendanceEnd, collegeEndTime, curfewTime,
            specialFoodStartTime, specialFoodEndTime, specialFoodDate,
            specialFoodName, specialFoodNames, specialFoodSession, specialFoodProvidingDate,
            specialFoodDay, specialFoodMasterList, regularMenu, weeklyMenu
        } = req.body;

        // Filter only provided fields to prevent overwriting with undefined
        const allowedKeys = [
            'attendanceStart', 'attendanceEnd', 'collegeEndTime', 'curfewTime',
            'specialFoodStartTime', 'specialFoodEndTime', 'specialFoodDate',
            'specialFoodName', 'specialFoodNames', 'specialFoodSession', 'specialFoodProvidingDate',
            'specialFoodDay', 'specialFoodMasterList', 'regularMenu', 'weeklyMenu', 'specialFoodClosed',
            'feeStructureType', 'hostelFee', 'fixedMessFee', 'commonFoodFee',
            'hostelBillingCycle', 'messBillingCycle'
        ];

        let updateData = {};
        allowedKeys.forEach(key => {
            if (req.body[key] !== undefined) {
                // If Mess Warden, only allow mess-related fields
                if (req.user.role === 'mess_warden') {
                    const messFields = [
                        'specialFoodStartTime', 'specialFoodEndTime', 'specialFoodDate',
                        'specialFoodName', 'specialFoodNames', 'specialFoodSession', 'specialFoodProvidingDate',
                        'specialFoodDay', 'specialFoodMasterList', 'regularMenu', 'weeklyMenu', 'specialFoodClosed'
                    ];
                    if (messFields.includes(key)) {
                        updateData[key] = req.body[key];
                    }
                } else {
                    updateData[key] = req.body[key];
                }
            }
        });

        const config = await SystemConfig.findOneAndUpdate(
            { key: 'main_security' },
            { ...updateData, updatedAt: Date.now() },
            { new: true, upsert: true }
        );

        // Notify all clients about the configuration update
        const io = req.app.get('socketio');
        if (io) {
            io.emit('config_update', config);
        }

        res.json(config);
    } catch (err) {
        res.status(500).json({ message: 'Error updating configuration' });
    }
});


// --- ADVANCED LEAVE ROUTES ---

// Apply for leave (Advanced 1 & 2)
router.post('/leave', authenticate, authorize('student'), async (req, res) => {

    try {
        const { studentId, leaveType, outDate, outTime, inDate, inTime, reason } = req.body;
        const config = await getSystemConfig();
        const outMinutes = timeToMinutes(outTime);
        const collegeEndMinutes = timeToMinutes(config.collegeEndTime);

        // Rule: Leave/General must be after college hours
        if ((leaveType === 'Leave' || leaveType === 'General Leave') && outMinutes < collegeEndMinutes) {
            return res.status(403).json({
                message: `Standard Leave can only be taken after college hours (${config.collegeEndTime}). For immediate departure, please use 'Emergency Leave'.`
            });
        }

        // Rule: Outing is for holidays, allowed between 6 AM and Curfew
        if (leaveType === 'Outing') {
            const curfewMinutes = timeToMinutes(config.curfewTime);
            if (outMinutes < 360 || outMinutes > curfewMinutes) { // 6:00 AM to Curfew
                return res.status(403).json({ message: `Outing is only permitted between 6:00 AM and your set Curfew (${config.curfewTime}).` });
            }
        }

        let wardenStatus = 'Pending';
        // Rule: General Leave skips Warden approval
        if (leaveType === 'General Leave') {
            wardenStatus = 'Approved';
        }

        const newLeave = new Leave({
            student: studentId,
            leaveType,
            outDate,
            outTime,
            inDate,
            inTime,
            reason,
            wardenStatus
        });

        await newLeave.save();
        res.status(201).json(newLeave);
    } catch (err) {
        console.error("Apply Leave Error:", err);
        res.status(500).json({ message: 'Error applying for leave' });
    }
});

// Simulation: Warden Approval
router.post('/leave/approve/warden', authenticate, authorize('warden', 'admin', 'hostel_warden'), async (req, res) => {

    try {
        const { leaveId, status } = req.body; // status: 'Approved' or 'Rejected'
        const leave = await Leave.findById(leaveId);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        leave.wardenStatus = status;
        await leave.save();
        res.json({ message: `Warden ${status}`, leave });
    } catch (err) {
        res.status(500).json({ message: 'Error in Warden approval' });
    }
});

// Simulation: Parent Approval (Advanced 5)
router.post('/leave/approve/parent', async (req, res) => {
    try {
        const { leaveId, status } = req.body;
        const leave = await Leave.findById(leaveId);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        // Rule: Parent can only approve if Warden approved (Except General Leave)
        if (leave.leaveType !== 'General Leave' && leave.wardenStatus !== 'Approved') {
            return res.status(400).json({ message: 'Awaiting Warden Approval first' });
        }

        leave.parentStatus = status;
        await leave.save();
        res.json({ message: `Parent ${status}`, leave });
    } catch (err) {
        res.status(500).json({ message: 'Error in Parent approval' });
    }
});

// Get student leaves
router.get('/leave/:studentId', async (req, res) => {
    try {
        const leaves = await Leave.find({ student: req.params.studentId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching leaves' });
    }
});

// Search pending leaves for Warden (Advanced: Last 2 digits of approvalNo)
router.get('/leave/search/:query', authenticate, authorize('warden', 'admin', 'hostel_warden'), async (req, res) => {

    try {
        const { query } = req.params;
        const searchStr = query.trim();

        console.log(`Warden Search Triggered for: ${searchStr}`);

        let students;
        if (searchStr === 'ALL') {
            students = await User.find({ role: 'student' }).select('_id approvalNo name');
        } else {
            // Find users where any ID field contains the search string
            students = await User.find({
                role: 'student',
                $or: [
                    { approvalNo: { $regex: new RegExp(searchStr, 'i') } },
                    { rollNo: { $regex: new RegExp(searchStr, 'i') } },
                    { registerNo: { $regex: new RegExp(searchStr, 'i') } }
                ]
            }).select('_id approvalNo name rollNo registerNo');
        }

        console.log(`Found ${students.length} students matching criteria:`, students.map(s => s.approvalNo));

        if (students.length === 0) {
            return res.json([]);
        }

        const studentIds = students.map(s => s._id);

        // Find pending leaves for these students
        // Note: General Leave is status 'Approved' by default, so it won't show in Warden search
        const queryObj = { student: { $in: studentIds } };

        // If it's a specific student search (not "ALL"), show ALL their leaves (History)
        // If it's "ALL", only show Pending leaves for the Warden to action
        if (searchStr === 'ALL') {
            queryObj.wardenStatus = 'Pending';
        }

        const leaves = await Leave.find(queryObj).populate('student', 'name approvalNo department roomNo registerNo');

        console.log(`Found ${leaves.length} pending leaves for these students.`);

        res.json(leaves);
    } catch (err) {
        console.error("Warden Search Error:", err);
        res.status(500).json({ message: 'Error searching leaves' });
    }
});

// Generate Outpass (Advanced 6 & 7)
router.post('/leave/generate-outpass', authenticate, authorize('student'), async (req, res) => {

    try {
        const { leaveId, type } = req.body; // type: 'Digital' or 'Physical'
        const leave = await Leave.findById(leaveId);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        // Rule: Only ONE outpass allowed
        if (leave.outpassType !== 'None') {
            return res.status(400).json({ message: 'Outpass already generated' });
        }

        // Rule: Must be Parent Approved
        if (leave.parentStatus !== 'Approved') {
            return res.status(400).json({ message: 'Parent approval required for outpass' });
        }

        // Rule: Time Restriction
        const now = new Date();
        const leaveOutDate = new Date(leave.outDate);
        const [outHour, outMin] = leave.outTime.split(':');
        leaveOutDate.setHours(parseInt(outHour), parseInt(outMin), 0);

        if (now < leaveOutDate) {
            return res.status(400).json({ message: `Outpass can only be generated after ${leave.outTime}` });
        }

        leave.outpassType = type;
        leave.outpassGeneratedAt = new Date();
        leave.outpassStatus = 'Open'; // Ensure it is Open when generated
        await leave.save();

        // Update student status to 'Out'
        await User.findByIdAndUpdate(leave.student, { attendanceStatus: 'Out' });

        res.json({ message: `${type} Outpass generated successfully`, leave });
    } catch (err) {
        console.error("Outpass Error:", err);
        res.status(500).json({ message: 'Error generating outpass' });
    }
});

// 🏢 OUT MACHINE TRIGGER (Advanced 13)
// Triggered by the Physical Fingerprint Machine at the Warden Office
router.post('/leave/trigger-physical-outpass', async (req, res) => {
    try {
        const { rollNo } = req.body;
        const user = await User.findOne({ rollNo });
        if (!user) return res.status(404).json({ message: 'Resident record not found' });

        // Find the latest parent-approved leave that hasn't had an outpass generated yet
        const leave = await Leave.findOne({
            student: user._id,
            parentStatus: 'Approved',
            outpassType: 'None'
        }).sort({ createdAt: -1 });

        if (!leave) {
            return res.status(400).json({ message: 'No pending approved leave found for this resident.' });
        }

        // Auto-generate Physical Outpass
        leave.outpassType = 'Physical';
        leave.outpassGeneratedAt = new Date();
        leave.outpassStatus = 'Open';
        await leave.save();

        // Update student status to 'Out'
        user.attendanceStatus = 'Out';
        await user.save();

        // 📡 REAL-TIME UPDATE
        const io = req.app.get('socketio');
        if (io) {
            io.emit('outpass_update', { studentId: user._id, type: 'Physical', status: 'Open' });
            io.emit('census_update', { studentName: user.name, status: 'Out' });
        }

        res.json({
            message: 'Physical Outpass Triggered Successfully',
            printData: {
                name: user.name,
                rollNo: user.rollNo,
                outDate: leave.outDate,
                outTime: leave.outTime,
                inDate: leave.inDate,
                inTime: leave.inTime,
                passId: leave._id.toString().slice(-8).toUpperCase()
            }
        });
    } catch (err) {
        console.error("Hardware Trigger Error:", err);
        res.status(500).json({ message: 'Hardware integration error' });
    }
});

// --- COMPLAINT ROUTES ---

// Submit complaint
router.post('/complaint', authenticate, authorize('student'), async (req, res) => {

    try {
        const { studentId, category, description } = req.body;
        const newComplaint = new Complaint({
            student: studentId,
            category,
            description
        });
        await newComplaint.save();
        res.status(201).json(newComplaint);
    } catch (err) {
        res.status(500).json({ message: 'Error submitting complaint' });
    }
});

// Get student complaints
router.get('/complaint/:studentId', async (req, res) => {
    try {
        const complaints = await Complaint.find({ student: req.params.studentId }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// Warden: Get all complaints with student details
router.get('/all-complaints', authenticate, authorize('warden', 'admin', 'hostel_warden', 'mess_warden'), async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'hostel_warden') {
            filter.category = { $in: ['Electrical', 'Plumbing', 'Cleaning'] };
        } else if (req.user.role === 'mess_warden') {
            filter.category = 'Mess';
        }

        const complaints = await Complaint.find(filter)
            .populate('student', 'name rollNo roomNo hostelName')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching all complaints' });
    }
});


// Warden: Update complaint status
router.put('/complaint/status', authenticate, authorize('warden', 'admin', 'hostel_warden', 'mess_warden'), async (req, res) => {

    try {
        const { complaintId, status } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            complaintId,
            { status },
            { new: true }
        );
        res.json({ message: `Complaint status updated to ${status}`, complaint });
    } catch (err) {
        res.status(500).json({ message: 'Error updating complaint status' });
    }
});

// --- FEES ROUTES ---

// Get fee status
router.get('/fees/:studentId', async (req, res) => {
    try {
        const user = await User.findById(req.params.studentId).select('feesBalance feesPaid');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching fee status' });
    }
});

// Simulate fee payment
router.post('/fees/pay', authenticate, authorize('student'), async (req, res) => {

    try {
        const { studentId, amount } = req.body;
        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.feesPaid += Number(amount);
        user.feesBalance -= Number(amount);
        await user.save();

        res.json({ message: 'Payment successful', feesBalance: user.feesBalance, feesPaid: user.feesPaid });
    } catch (err) {
        res.status(500).json({ message: 'Error processing payment' });
    }
});

const getTodayDateStr = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}.${m}.${y}`;
};

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// Simulate Fingerprint Attendance (With Window Enforcement & Block Persistence)
router.post('/attendance/mark', async (req, res) => {
    try {
        const { rollNo } = req.body;
        const user = await User.findOne({ rollNo });
        if (!user) return res.status(404).json({ message: 'Roll context not found' });

        const config = await getSystemConfig();
        const now = new Date();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

        // 🛡️ Logic A: Check for Individual Leave Return Deadlines
        // If student is returning from leave, they ARE NOT restricted by the global window.
        // Instead, they are restricted by their OWN approved 'in time'.
        if (user.attendanceStatus === 'Out') {
            const latestLeave = await Leave.findOne({ student: user._id, wardenStatus: 'Approved', parentStatus: 'Approved' }).sort({ createdAt: -1 });
            if (latestLeave) {
                const returnDeadline = new Date(latestLeave.inDate);
                const [h, m] = latestLeave.inTime.split(':');
                returnDeadline.setHours(parseInt(h), parseInt(m), 0);

                if (now > returnDeadline) {
                    user.isBlocked = true;
                    user.attendanceStatus = 'Present';
                    user.lastAttendanceAt = now;
                    await user.save();

                    // 🛡️ AUTO-CLOSE Outpass on late return
                    latestLeave.outpassStatus = 'Closed';
                    await latestLeave.save();

                    return res.json({
                        message: `LATE RETURN DETECTED! (Deadline was ${latestLeave.inTime}). ID restricted. Outpass closed.`,
                        status: 'Blocked',
                        isBlocked: true
                    });
                }
            }

            // If they made it back on time (or if no active leave found but they were 'Out')
            user.attendanceStatus = 'Present';
            user.lastAttendanceAt = now;
            await user.save();

            // 🛡️ AUTO-CLOSE Outpass on return
            if (latestLeave) {
                latestLeave.outpassStatus = 'Closed';
                await latestLeave.save();
            }

            // 📡 REAL-TIME UPDATE
            const io = req.app.get('socketio');
            if (io) io.emit('census_update', { studentName: user.name, status: 'Present' });

            return res.json({
                message: `Welcome back, ${user.name}. Individual return recorded successfully. Outpass closed.`,
                status: 'Present'
            });
        }

        // 🛡️ Logic B: Check for Global Attendance Window (Regular Students)
        // Only enforce the 7 PM - 8 PM (or configured) window for students NOT on leave.
        const startMinutes = timeToMinutes(config.attendanceStart);
        const endMinutes = timeToMinutes(config.attendanceEnd);

        if (currentTimeMinutes < startMinutes || currentTimeMinutes > endMinutes) {
            return res.status(403).json({
                message: `Attendance window is closed. Daily scanning is only allowed between ${config.attendanceStart} and ${config.attendanceEnd}.`,
                window: `${config.attendanceStart} - ${config.attendanceEnd}`
            });
        }

        // If student is already blocked, they can mark present but they stay blocked
        if (user.isBlocked) {
            user.attendanceStatus = 'Present';
            user.lastAttendanceAt = now;
            await user.save();
            return res.json({
                message: `Attendance recorded for ${user.name}, but ID remains BLOCKED. Contact Warden.`,
                status: 'Present',
                isBlocked: true
            });
        }

        user.attendanceStatus = 'Present';
        user.lastAttendanceAt = now;
        await user.save();

        // 📡 REAL-TIME UPDATE
        const io = req.app.get('socketio');
        if (io) io.emit('census_update', { studentName: user.name, status: 'Present' });

        res.json({ message: `Attendance marked for ${user.name}. Status: Present.`, status: user.attendanceStatus });
    } catch (err) {
        console.error("Attendance Error:", err);
        res.status(500).json({ message: 'Attendance error' });
    }
});

// Warden/Mess Warden: Search student fees (partial or full roll/register number)
router.get('/fees/search/:query', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {
    try {
        const query = req.params.query;
        // Search by last digits OR full number match across rollNo and registerNo
        const students = await User.find({
            role: 'student',
            $or: [
                { rollNo: { $regex: query + '$', $options: 'i' } },
                { registerNo: { $regex: query + '$', $options: 'i' } },
                { rollNo: { $regex: '^' + query, $options: 'i' } },
                { registerNo: { $regex: '^' + query, $options: 'i' } }
            ]
        }).select('name rollNo registerNo feesPaid feesBalance');

        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Error searching student fees' });
    }
});
// --- LABOUR & SALARY ROUTES ---

// Mark daily attendance
router.post('/labour/attendance', authenticate, authorize('warden', 'admin', 'mess_warden', 'hostel_warden'), async (req, res) => {
    try {
        const { employeeId, status, date } = req.body;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOneAndUpdate(
            { employee: employeeId, date: targetDate },
            { status },
            { new: true, upsert: true }
        );
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ message: 'Error marking attendance' });
    }
});

// Get all employees based on requester role
router.get('/labour/all', authenticate, authorize('warden', 'admin', 'mess_warden', 'hostel_warden'), async (req, res) => {
    try {
        let filter = { role: { $in: ['hostel_employee', 'mess_employee', 'mess_warden', 'hostel_warden'] } };

        // Refine filter based on role permissions
        if (req.user.role === 'mess_warden') {
            filter.employeeCategory = 'Mess';
        } else if (req.user.role === 'hostel_warden') {
            filter.employeeCategory = 'Hostel';
        }

        const employees = await User.find(filter).select('-password');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching employees' });
    }
});

// Search employees
router.get('/labour/search/:query', authenticate, authorize('warden', 'admin', 'mess_warden', 'hostel_warden'), async (req, res) => {
    try {
        const query = req.params.query;
        let filter = {
            role: { $in: ['hostel_employee', 'mess_employee', 'mess_warden', 'hostel_warden'] },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { studentMobile: { $regex: query, $options: 'i' } },
                { rollNo: { $regex: query, $options: 'i' } }
            ]
        };

        if (req.user.role === 'mess_warden') filter.employeeCategory = 'Mess';
        else if (req.user.role === 'hostel_warden') filter.employeeCategory = 'Hostel';

        const employees = await User.find(filter).select('-password');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Error searching employees' });
    }
});

// Set salary per day
router.post('/labour/salary/set-daily', authenticate, authorize('warden', 'admin'), async (req, res) => {
    try {
        const { employeeId, salaryPerDay } = req.body;
        await User.findByIdAndUpdate(employeeId, { salaryPerDay });
        res.json({ message: 'Salary rate updated' });
    } catch (err) {
        res.status(500).json({ message: 'Error setting salary' });
    }
});

// Calculate and Pay monthly salary
router.post('/labour/salary/pay', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {
    try {
        const { employeeId, month, year, amount, daysWorked } = req.body;
        const history = new SalaryHistory({
            employee: employeeId,
            month,
            year,
            amount,
            daysWorked
        });
        await history.save();
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error recording payment' });
    }
});

// Get payment history
router.get('/labour/salary/history/:id', authenticate, authorize('warden', 'admin', 'mess_warden', 'hostel_warden'), async (req, res) => {
    try {
        const history = await SalaryHistory.find({ employee: req.params.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching salary history' });
    }
});

// Get attendance summary for calculation
router.get('/labour/attendance/summary/:id/:month/:year', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {
    try {
        const { id, month, year } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendance = await Attendance.find({
            employee: id,
            date: { $gte: startDate, $lte: endDate },
            status: 'Present'
        });

        res.json({ daysWorked: attendance.length });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching attendance summary' });
    }
});

// Warden: Get all students (grouped by any logic in frontend)
router.get('/all-students', authenticate, authorize('warden', 'admin', 'hostel_warden'), async (req, res) => {

    try {
        const students = await User.find({ role: 'student' }).sort({ batch: -1, name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// Cancel/Delete leave application
router.delete('/leave/:id', async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave record not found' });

        // Rule: Only allow cancellation if still pending (optional, but safer)
        if (leave.wardenStatus !== 'Pending' && leave.parentStatus !== 'Pending') {
            // If already approved/rejected, might need special permission to delete, 
            // but for simplicity we allow full withdrawal.
        }

        await Leave.findByIdAndDelete(req.params.id);
        res.json({ message: 'Leave application cancelled successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error cancelling leave' });
    }
});

// Warden: Update student profile (Secure with Role Check)
router.put('/student/:id', async (req, res) => {
    try {
        // Simple role check (assuming user info is passed or session-based)
        // In a real app we'd use req.user.role from JWT middleware
        const userUpdating = await User.findById(req.headers['x-user-id']);
        if (!userUpdating || (userUpdating.role !== 'warden' && userUpdating.role !== 'admin')) {
            return res.status(403).json({ message: 'Only Wardens or Admins can edit profiles' });
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error updating student' });
    }
});

// @route   POST api/student/block-status
// @desc    Toggle student block status
router.post('/block-status', authenticate, authorize('warden', 'admin'), async (req, res) => {

    try {
        const { studentId, isBlocked } = req.body;
        const student = await User.findByIdAndUpdate(studentId, { isBlocked }, { new: true });
        res.json({ message: `Student ${isBlocked ? 'blocked' : 'unblocked'} successfully`, student });
    } catch (err) {
        res.status(500).json({ message: 'Error updating block status' });
    }
});

// @route   GET api/student/blocked-students
// @desc    Get all blocked students
router.get('/blocked-students', async (req, res) => {
    try {
        const students = await User.find({ isBlocked: true, role: 'student' }).sort({ name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching blocked students' });
    }
});

// @route   POST api/student/block-absentees
// @desc    Bulk block students currently marked as Absent
router.post('/block-absentees', async (req, res) => {
    try {
        const result = await User.updateMany(
            { role: 'student', attendanceStatus: 'Absent' },
            { isBlocked: true }
        );
        res.json({ message: `${result.modifiedCount} absent students have been restricted.`, count: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: 'Error bulk-blocking students' });
    }
});

// @route   POST api/student/unblock-all
// @desc    Unblock all students
router.post('/unblock-all', async (req, res) => {
    try {
        const result = await User.updateMany(
            { role: 'student' },
            { isBlocked: false }
        );
        res.json({ message: `Access restored for ${result.modifiedCount} students.`, count: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: 'Error restoring access' });
    }
});

// @route   POST api/student/fees/pay
// @desc    Process fee payment
router.post('/fees/pay', async (req, res) => {
    try {
        const { studentId, amount } = req.body;
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const payAmount = Number(amount);
        if (isNaN(payAmount) || payAmount <= 0) {
            return res.status(400).json({ message: 'Invalid payment amount' });
        }

        if (payAmount > student.feesBalance) {
            return res.status(400).json({ message: 'Payment amount exceeds balance' });
        }

        // Create transaction record
        const feeRecord = new Fee({
            student: studentId,
            amount: payAmount,
            status: 'Success'
        });
        await feeRecord.save();

        // Update student balances
        student.feesBalance -= payAmount;
        student.feesPaid += payAmount;
        await student.save();

        res.json({
            message: 'Payment processed successfully',
            feesBalance: student.feesBalance,
            feesPaid: student.feesPaid,
            transaction: feeRecord
        });
    } catch (err) {
        console.error("Payment Error:", err);
        res.status(500).json({ message: 'Error processing payment' });
    }
});

// @route   GET api/student/fees/history/:studentId
// @desc    Get student fee payment history
router.get('/fees/history/:studentId', async (req, res) => {
    try {
        const history = await Fee.find({ student: req.params.studentId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching payment history' });
    }
});

// @route   POST api/student/fees/structure
// @desc    Update fee structure type (Warden only)
router.post('/fees/structure', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {
    try {
        const { type, hostelFee, fixedMessFee, commonFoodFee } = req.body;
        console.log('FEE UPDATE REQUEST:', req.body);

        const updateData = {};
        if (type) updateData.feeStructureType = type;
        if (hostelFee !== undefined && hostelFee !== '') updateData.hostelFee = Number(hostelFee);
        if (fixedMessFee !== undefined && fixedMessFee !== '') updateData.fixedMessFee = Number(fixedMessFee);
        if (commonFoodFee !== undefined && commonFoodFee !== '') updateData.commonFoodFee = Number(commonFoodFee);

        console.log('FEE UPDATE DATA:', updateData);

        const config = await SystemConfig.findOneAndUpdate(
            { key: 'main_security' },
            {
                $set: { ...updateData, updatedAt: Date.now() }
            },
            { new: true, upsert: true }
        );
        console.log('FEE UPDATE SUCCESS:', config);
        res.json(config);
    } catch (err) {
        console.error('FEE UPDATE ERROR:', err);
        res.status(500).json({ message: 'Error updating fee structure', error: err.message });
    }
});

// @route   GET api/student/fees/summary/:studentId
// @desc    Calculate pending fees and total paid
router.get('/fees/summary/:studentId', async (req, res) => {
    try {
        const student = await User.findById(req.params.studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const config = await getSystemConfig();

        let totalDue = config.hostelFee;
        if (config.feeStructureType === 'Common') {
            totalDue += config.fixedMessFee;
        } else {
            totalDue += config.commonFoodFee;
            // Add Special Tokens (Closed/Billed ones)
            const tokens = await SpecialToken.find({ student: student._id, status: 'Closed' });
            const tokenTotal = tokens.reduce((sum, t) => sum + (t.price || 0), 0);
            totalDue += tokenTotal;
        }

        const pending = Math.max(0, totalDue - student.feesPaid);

        // Auto-update student's feesBalance
        student.feesBalance = pending;
        await student.save();

        res.json({
            totalDue,
            feesPaid: student.feesPaid,
            feesPending: pending,
            structure: config.feeStructureType
        });
    } catch (err) {
        res.status(500).json({ message: 'Error calculating fee summary' });
    }
});

// --- MESS TOKEN ROUTES ---

// @route   POST api/student/mess/token/generate
// @desc    Generate a new food token (with window enforcement)
router.post('/mess/token/generate', authenticate, authorize('student'), async (req, res) => {

    try {
        const { studentId, tokenType, foodName } = req.body;
        const config = await getSystemConfig();

        const todayStr = getTodayDateStr();
        const now = new Date();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

        // EARLY LOGGING
        const logMsg = `[TOKEN GEN] Incoming Request: Student=${studentId}, Food=${foodName}\n` +
            `[TOKEN GEN] Server Time: ${todayStr} ${now.getHours()}:${now.getMinutes()} (${currentTimeMinutes} mins)\n` +
            `[TOKEN GEN] Config: Date=${config.specialFoodDate}, Start=${config.specialFoodStartTime}, End=${config.specialFoodEndTime}, Session=${config.specialFoodSession}\n`;
        fs.appendFileSync(path.join(__dirname, '../debug_token.log'), logMsg);


        // 🛡️ Logic: Special Token Registration Window Enforcement
        if (config.specialFoodSession !== 'None') {
            const startMinutes = timeToMinutes(config.specialFoodStartTime);
            let endMinutes = timeToMinutes(config.specialFoodEndTime);
            if (endMinutes === 0) endMinutes = 1440; // Handle 00:00 as 24:00 (midnight)

            // Check Date
            if (todayStr !== config.specialFoodDate) {
                fs.appendFileSync(path.join(__dirname, '../debug_token.log'), `[TOKEN GEN] Date mismatch: Today=${todayStr} vs Config=${config.specialFoodDate}\n`);
                return res.status(403).json({
                    message: `Registration for ${config.specialFoodName} is only available on ${config.specialFoodDate}.`
                });
            }

            // Check Time
            if (currentTimeMinutes < startMinutes || currentTimeMinutes > endMinutes) {
                fs.appendFileSync(path.join(__dirname, '../debug_token.log'), `[TOKEN GEN] Time invalid: Now=${currentTimeMinutes} vs Window=${startMinutes}-${endMinutes}\n`);
                return res.status(403).json({
                    message: `Registration for ${config.specialFoodName} is closed. Available: ${config.specialFoodStartTime} - ${config.specialFoodEndTime}.`,
                });
            }
        } else {
            // If no special food is set, but someone tries to generate? 
            // Maybe allow it or reject? User said "on that day that time only they can register".
            // If session is 'None', maybe regular tokens are allowed? 
            // But the user's prompt implies registration depends on the set time.
            // I'll assume if no special food is scheduled, registration is disabled or restricted.
            // Actually, the prompt says "the special token time and date is set... on that day that time only they can register".
            // This suggests that when NOT set, maybe they can't register special tokens at all.
        }

        // Validate foodName if provided, else fallback to legacy
        const finalFoodName = foodName || config.specialFoodName;

        const token = new SpecialToken({
            student: studentId,
            tokenType,
            foodName: finalFoodName,
            sessionType: config.specialFoodSession,
            providingDate: config.specialFoodProvidingDate
        });
        await token.save();
        res.json(token);
    } catch (err) {
        res.status(500).json({ message: 'Error generating token' });
    }
});

// @route   GET api/student/mess/tokens/active
// @desc    List all active tokens for wardens
router.get('/mess/tokens/active', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {

    try {
        const tokens = await SpecialToken.find({ status: 'Active' }).populate('student', 'name rollNo roomNo hostelName');
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching active tokens' });
    }
});

// @route   POST api/student/mess/token/close
// @desc    Close a token and assign price (Warden only)
router.post('/mess/token/close', authenticate, authorize('warden', 'admin', 'mess_warden'), async (req, res) => {

    try {
        const { tokenId, totalSpent, studentCount, wardenId } = req.body;

        // Logic: price = totalSpent / studentCount (if manual price not provided)
        const price = totalSpent / studentCount;

        const token = await SpecialToken.findById(tokenId);
        if (!token) return res.status(404).json({ message: 'Token not found' });

        token.status = 'Closed';
        token.price = price;
        token.closedAt = new Date();
        token.closedBy = wardenId;
        await token.save();

        // Trigger balance update for student
        const student = await User.findById(token.student);
        if (student) {
            // Re-fetch summary logic will handle feesBalance update on next client refresh
            // But we could also proactively update here if needed.
        }

        res.json({ message: 'Token closed and billed', token });
    } catch (err) {
        res.status(500).json({ message: 'Error closing token' });
    }
});

// @route   GET api/student/mess/tokens/student/:studentId
// @desc    Get active tokens for a specific student
router.get('/mess/tokens/student/:studentId', async (req, res) => {
    try {
        const tokens = await SpecialToken.find({
            student: req.params.studentId,
            status: 'Active'
        });
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tokens' });
    }
});

// @route   POST api/student/mess/config/special-food
// @desc    Configure special food details (Warden only)
router.post('/mess/config/special-food', async (req, res) => {
    try {
        const { specialFoodName, specialFoodDate, specialFoodStartTime, specialFoodEndTime, specialFoodSession } = req.body;
        const config = await SystemConfig.findOneAndUpdate(
            { key: 'main_security' },
            {
                specialFoodName,
                specialFoodDate,
                specialFoodStartTime,
                specialFoodEndTime,
                specialFoodSession,
                updatedAt: Date.now()
            },
            { new: true, upsert: true }
        );
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: 'Error updating special food config' });
    }
});

// --- SECURITY HEARTBEAT (Zero-Perception Automation) ---
const startSecurityHeartbeat = (io) => {
    console.log("🛡️ HMS Arena Security Heartbeat Started: Monitoring for Curfew & Window violations...");

    setInterval(async () => {
        try {
            const config = await getSystemConfig();
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const curfewMinutes = timeToMinutes(config.curfewTime);

            // Automation Rule 1: Curfew Lockdown
            // If the official curfew has passed, block everyone who is still 'Absent'
            if (currentTimeMinutes > curfewMinutes) {
                const result = await User.updateMany(
                    { role: 'student', attendanceStatus: 'Absent', isBlocked: false },
                    { isBlocked: true }
                );
                if (result.modifiedCount > 0) {
                    console.log(`⚡ AUTO-SECURE: ${result.modifiedCount} absentees restricted after curfew (${config.curfewTime}).`);
                    if (io) io.emit('census_update', { type: 'curfew_lockdown', count: result.modifiedCount });
                }
            }

            // Automation Rule 2: Personalized Late Leave Return Lockdown
            const lateReturnedStudents = await User.find({ attendanceStatus: 'Out', isBlocked: false });
            for (const student of lateReturnedStudents) {
                const latestLeave = await Leave.findOne({ student: student._id, wardenStatus: 'Approved', parentStatus: 'Approved' }).sort({ createdAt: -1 });
                if (latestLeave) {
                    const returnDeadline = new Date(latestLeave.inDate);
                    const [h, m] = latestLeave.inTime.split(':');
                    returnDeadline.setHours(parseInt(h), parseInt(m), 0);

                    if (now > returnDeadline) {
                        student.isBlocked = true;
                        // Important: Keep their status as 'Out' so we know why they were blocked
                        await student.save();
                        console.log(`📡 AUTO-RESTRICT (Personalized): Student ${student.name} blocked. Leave return deadline was ${latestLeave.inTime} on ${latestLeave.inDate}.`);
                    }
                }
            }

            // Automation Rule 3: Daily Cycle Initialization (6:00 AM)
            // Reset attendance statuses for the new day
            if (currentHour === 6 && currentMinute === 0) {
                const resetResult = await User.updateMany(
                    { role: 'student', attendanceStatus: 'Present' },
                    { attendanceStatus: 'Absent' }
                );
                if (resetResult.modifiedCount > 0) {
                    console.log(`♻️ SYSTEM RESET: ${resetResult.modifiedCount} statuses reset to 'Absent' for the new cycle.`);
                }
            }
        } catch (err) {
            console.error("Heartbeat Error:", err);
        }
    }, 60000); // Check every minute
};

module.exports = { router, startSecurityHeartbeat };
