import * as Dialog from "@radix-ui/react-dialog";
import { X, Star } from "lucide-react";
import type { ReactNode } from "react";

export const avatarColors = [
  "#f7e3c3",
  "#e5ddfa",
  "#d8eee2",
  "#f5ded8",
  "#dce8f9",
  "#f6eabe",
];
export function Avatar({
  name,
  avatar = 0,
  size = "",
}: {
  name: string;
  avatar?: number;
  size?: string;
}) {
  return (
    <span
      className={`avatar ${size}`}
      style={{ background: avatarColors[avatar % avatarColors.length] }}
    >
      <span>
        {name
          .trim()
          .split(/\s+/)
          .map(n => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </span>
    </span>
  );
}
export function BrandMark() {
  return (
    <span className="brand-mark">
      <Star size={25} fill="currentColor" strokeWidth={1.6} />
      <Star className="little-star" size={12} fill="currentColor" />
    </span>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <Dialog.Title className="modal-title">{title}</Dialog.Title>
          <Dialog.Description
            className={description ? "modal-description" : "sr-only"}
          >
            {description || title}
          </Dialog.Description>
          <Dialog.Close className="modal-close" aria-label="Close">
            <X size={21} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Star size={32} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
