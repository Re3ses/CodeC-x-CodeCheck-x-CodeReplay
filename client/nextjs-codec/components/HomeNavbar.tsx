import React from "react";

import { buttonVariants } from "./ui/button";

export default function HomeNavbar() {
    return (
        <nav className="flex justify-between sticky top-0">
            <a href="#home" className={buttonVariants({ variant: "link" })}>
                Home
            </a>
            <a href="#about" className={buttonVariants({ variant: "link" })}>
                About
            </a>
            <a href="#contacts" className={buttonVariants({ variant: "link" })}>
                Contacts
            </a>
        </nav>
    );
}
