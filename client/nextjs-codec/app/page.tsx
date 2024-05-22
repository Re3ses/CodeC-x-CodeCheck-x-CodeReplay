"use client";

import HomeNavbar from "@/components/HomeNavbar";
import HomeAboutSection from "@/components/HomeAboutSection";
import HomeContactsSection from "@/components/HomeContactsSection";
import HomeSection from "@/components/HomeSection";

export default function Home() {
    return (
        <div className="lg:ml-[25%] lg:mr-[25%] md:ml-[10%] md:mr-[10%]">
            <HomeNavbar />
            <HomeSection />
            <HomeAboutSection />
            <HomeContactsSection />
        </div>
    );
}
