import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './AdminSidebar.module.scss';

function AdminSidebar() {
  return (
    <>
        <aside className={styles.adminSidebar}>
      <div className={styles.logo}>
        <Link to="/admin">Admin Panel</Link> {/* Логотип или название админки */}
      </div>
      <nav className={styles.navigation}>
        <ul>
          <li>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => isActive ? styles.activeLink : undefined}
            >
              Статистика
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/scripts"
              className={({ isActive }) => isActive ? styles.activeLink : undefined}
            >
              Управление скриптами
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => isActive ? styles.activeLink : undefined}
            >
              Пользователи
            </NavLink>
          </li>
          {/* Добавьте другие ссылки по мере необходимости */}
        </ul>
      </nav>
      {/* Здесь можно добавить кнопки выхода или другую информацию */}
    </aside>
    </>
  );
}

export default AdminSidebar;