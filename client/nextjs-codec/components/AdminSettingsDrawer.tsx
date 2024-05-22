import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

const _test_connectedData = [
    {
        name: "Alverxxt",
        email: "alverdfat@perx.cusz"
    },
    {
        name: "Alvjkkjert",
        email: "alvert@perx.cusz"
    },
    {
        name: "Alxxvert",
        email: "alvert@fadfperx.cusz"
    },
    {
        name: "Alvxaert",
        email: "alvert@pervx.cusz"
    },
    {
        name: "Alvedawdawkrt",
        email: "alvadsfsrt@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
    {
        name: "Alvertwd",
        email: "dafadalvert@perx.cusz"
    },
]

export default function AdminSettingsDrawer() {
    function createSession() {
        // create session
    }
    function addStudent() {
        // add student
    }
    function switchSession() {
        // switch session
    }
    return (
        <Drawer>
            <DrawerTrigger className="px-4 py-2 border rounded-lg bg-zinc-700 hover:bg-zinc-500">Admin settings</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Admin tools</DrawerTitle>
                    <DrawerDescription>Current session: {`<session-slug>`}</DrawerDescription>
                </DrawerHeader>
                <div className="flex gap-4 p-4">
                    <div className="border flex rounded-lg flex-1">
                        <div className="flex-1 border-r-4 border-zinc-900">
                            <p className="bg-zinc-900 text-lg p-4">here be admin settings</p>
                            <div className="flex gap-2 p-4">
                                <Button onClick={() => createSession()}>Create session</Button>
                                <Button onClick={() => addStudent()}>Add student</Button>
                                <Button onClick={() => switchSession()}>Switch session</Button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="bg-zinc-900 text-lg p-4">Session list</p>
                            <div className="p-4 overflow-scroll max-h-[20em]">
                                here be session list
                                {/*placeholder data*/}
                                {_test_connectedData.map((val, index) => {
                                    return (
                                        <div className="px-4 py-2" key={index}>
                                            <p className="text-md">{val.name}</p>
                                            <p className="text-sm text-zinc-500">{val.email}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="border rounded-lg overflow-scroll">
                        <p className="p-4 bg-zinc-900 rounded-t-lg text-lg sticky top-0">Current connected students</p>
                        <div className="max-h-[20em]">
                            {_test_connectedData.map((val, index) => {
                                return (
                                    <div className="px-4 py-2" key={index}>
                                        <p className="text-md">{val.name}</p>
                                        <p className="text-sm text-zinc-500">{val.email}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <DrawerFooter>
                    <DrawerClose>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
