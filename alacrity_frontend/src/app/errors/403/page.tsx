'use client';
import { useAuth } from "@/libs/auth";

import React from "react";

export default function Forbidden() {
    const { user, loading } = useAuth();

    console.log(user);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            you are not supposed to be here   go awayyyyyyyyty
        </div>
    );
}