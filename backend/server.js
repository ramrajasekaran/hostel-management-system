const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hostel Management System Backend - Fresh Start');
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
const { router: studentRoutes, startSecurityHeartbeat } = require('./routes/studentRoutes');
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', studentRoutes);

// Socket Control Logic
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket:', socket.id);
    socket.on('disconnect', () => console.log('User disconnected'));
});

// Attach io to the app for use in routes
app.set('socketio', io);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management')
    .then(() => {
        console.log("MongoDB Connected");
        http.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            startSecurityHeartbeat(io); // Pass io to heartbeat
        });
    })
    .catch(err => console.log(err));
