import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterModule } from '../components/RegisterModule';

function Register() {
    const navigate = useNavigate();
    return (
        <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
            <RegisterModule onFinish={() => setTimeout(() => navigate('/dashboard'), 2000)} />
            <p style={{ marginTop: '2.5rem', textAlign: 'center', width: '100%' }}>
                <Link to="/dashboard" className="arena-link">← Back to Dashboard Overview</Link>
            </p>
        </div>
    );
}

export default Register;
