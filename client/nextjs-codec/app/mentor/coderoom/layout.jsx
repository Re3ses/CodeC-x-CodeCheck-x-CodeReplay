import Nav from "@/app/dashboard/nav"
import { getUser } from "@/lib/auth"

export default async function Layout({ children }) {
    const user = await getUser()
    return (
        <div className="flex h-screen flex-col">
            <Nav variant="Compact" name={user?.auth.username} />
            {children}
        </div>
    )
}

