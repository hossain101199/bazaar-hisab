"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

interface DialogContextValue {
  open: boolean
  onClose: () => void
  titleId: string
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onClose: () => {},
  titleId: '',
})

interface DialogRootProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  modal?: boolean
}

function Dialog({ open = false, onOpenChange, children }: DialogRootProps) {
  const onClose = React.useCallback(() => onOpenChange?.(false), [onOpenChange])
  const titleId = React.useId()
  return (
    <DialogContext.Provider value={{ open, onClose, titleId }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, onClick, ...props }: React.ComponentProps<"button">) {
  return <button onClick={onClick} {...props}>{children}</button>
}

function DialogClose({ children, ...props }: React.ComponentProps<"button">) {
  const { onClose } = React.useContext(DialogContext)
  return (
    <button onClick={onClose} {...props}>
      {children}
    </button>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { open, onClose, titleId } = React.useContext(DialogContext)
  const [mounted, setMounted] = React.useState(false)
  // `shown` controls DOM presence; `entered` controls CSS transition state
  const [shown, setShown] = React.useState(false)
  const [entered, setEntered] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    if (!mounted) return
    if (open) {
      setShown(true)
      // Double rAF ensures initial render (shown=true, entered=false) paints
      // before the transition class is added — prevents instant-snap.
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setEntered(true))
      )
      return () => cancelAnimationFrame(id)
    } else {
      setEntered(false)
      const id = setTimeout(() => setShown(false), 220)
      return () => clearTimeout(id)
    }
  }, [open, mounted])

  // Escape key
  React.useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  // Scroll lock
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Auto-focus first focusable element when dialog opens
  React.useEffect(() => {
    if (!entered || !contentRef.current) return
    const focusable = contentRef.current.querySelector<HTMLElement>(
      'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  }, [entered])

  if (!mounted || !shown) return null

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
        entered ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 w-full max-w-sm rounded-xl bg-card p-5 text-sm shadow-xl ring-1 ring-border",
          "transition-all duration-200",
          entered ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-2",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />
  )
}

function DialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      className={cn(
        "-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = React.useContext(DialogContext)
  return (
    <h2
      id={titleId}
      className={cn("text-base font-semibold leading-none", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
