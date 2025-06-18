// src/admin/layout/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar/AdminSidebar.jsx'; // Убедитесь, что AdminSidebar экспортируется по умолчанию
import styles from './AdminLayout.module.scss'; 

function AdminLayout() {
  return (
    <div className={styles.adminLayout}> {/* или styles.admin__layout, используйте то, что в SCSS */}
      <AdminSidebar />
      <main className={styles.adminContent}> {/* или styles.admin__content */}
        <Outlet /> 
      </main>
    </div>
  );
}

export default AdminLayout;