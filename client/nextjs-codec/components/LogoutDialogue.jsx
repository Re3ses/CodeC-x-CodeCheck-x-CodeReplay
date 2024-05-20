import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "./ui/dialog"
import { Button, buttonVariants } from "./ui/button"
import { toast } from "@/components/ui/use-toast"
import { logoutUser } from "@/lib/auth"

export default function LogoutDialogue() {
    async function LogOut() {
        await logoutUser().then(() => {
            toast({
                title: "Hello"
            })
        })
    }
    return (
        <Dialog>
            <DialogTrigger
                className={`${buttonVariants({ variant: "destructive" })} w-fit`}
            >
                Log out account
            </DialogTrigger>
            <DialogContent className="flex flex-col justify-center align-middle m-auto text-center">
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                </DialogHeader>
                <Button variant="destructive" onClick={() => LogOut()}>
                    Log out
                </Button>
            </DialogContent>
        </Dialog>
    )
}

