import React from "react"
import Nav from "../dashboard/nav"

export default function layout({ children }) {
    return (
        <div className="flex flex-col h-screen">
            <Nav variant="Compact" />
            {children}
        </div>
    )
}

