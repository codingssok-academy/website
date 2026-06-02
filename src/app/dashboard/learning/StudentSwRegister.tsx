"use client";

import { useEffect } from "react";

export default function StudentSwRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw-student.js", { scope: "/dashboard/" });
        }
    }, []);

    return null;
}
