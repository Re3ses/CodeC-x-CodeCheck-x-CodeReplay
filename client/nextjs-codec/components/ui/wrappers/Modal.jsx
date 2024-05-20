import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

import React from "react"
import { buttonVariants } from "@/components/ui/button"

export default function Modal({ children, label, title, description }) {
  return (
    <div className={buttonVariants({ variant: "default" })}>
      <Dialog>
        <DialogTrigger>{label}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  )
}

