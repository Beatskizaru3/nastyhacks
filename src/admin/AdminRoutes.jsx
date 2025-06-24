import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Путь к вашему AuthContext
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import ScriptsList from './pages/ScriptsList/ScriptsList';
import ScriptForm from './pages/ScriptForm/ScriptForm';
import UsersList from './pages/UsersList/UsersList'
const API_BASE_URL = process.env.REACT_APP_API_URL;
const ProtectedAdminRoute = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {

        return <>Loading...</>
    }

    if (!user || user.Role !== 'admin'){

        return <Navigate to='/login' replace />;
    }

    return children;
};

function AdminRoutes(){
    return (
        <Routes>
            <Route path='/' element={
                <ProtectedAdminRoute>
                    <AdminLayout/>
                </ProtectedAdminRoute>
                }>

                <Route index element={<Dashboard/>} />
                <Route path='dashboard' element={<Dashboard/>}/>
                <Route path='scripts'element={<ScriptsList />}/>
                <Route path='scripts/new' element={<ScriptForm/>}/>
                <Route path='scripts/edit/:id' element={<ScriptForm/>}/>
                <Route path='users' element={<UsersList/>}/>
            </Route>
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />}/>
        </Routes>
    )
}

export default AdminRoutes;