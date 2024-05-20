import { getUser } from "@/lib/auth"
import Nav from "@/app/dashboard/nav"

export default async function Layout({ children }) {
    const user = await getUser()
    return (
        <div className="flex flex-col h-[100vh]">
            <Nav variant="Compact" name={user?.username} />
            {children}
        </div>
    )
}

