"use client";

import { useEffect } from "react";

export default function TeacherSwRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw-teacher.js", { scope: "/teacher/" });
        }
    }, []);

    return null;
}
