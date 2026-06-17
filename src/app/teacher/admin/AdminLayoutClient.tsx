"use client";

import { type ReactNode } from "react";
import { AdminProvider } from "./context";
import AdminSidebar from "./components/AdminSidebar";
import TeacherSwRegister from "./TeacherSwRegister";

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
    return (
        <AdminProvider>
            <head>
                <link rel="manifest" href="/manifest-teacher.json" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="CodingSSok Admin" />
                <link rel="apple-touch-icon" href="/images/promo/logo-codingssok.png" />
            </head>
            <TeacherSwRegister />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
            <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff" }}>
                <AdminSidebar />
                <main
                    className="admin-main-content"
                    style={{ flex: 1, minHeight: "100vh" }}
                >
                    {children}
                </main>
            </div>
            <style>{`
                @media (min-width: 768px) {
                    .admin-main-content {
                        margin-left: 240px;
                        padding: 24px 32px;
                        transition: margin-left 180ms ease;
                    }
                    body.admin-sidebar-collapsed .admin-main-content {
                        margin-left: 76px;
                    }
                }
                @media (max-width: 767px) {
                    .admin-main-content {
                        margin-left: 0;
                        padding: calc(52px + env(safe-area-inset-top, 0px) + 16px) 16px calc(64px + env(safe-area-inset-bottom) + 8px);
                    }
                }
            `}</style>
        </AdminProvider>
    );
}
