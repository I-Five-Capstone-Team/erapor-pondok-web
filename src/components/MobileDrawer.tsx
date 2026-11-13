import { useEffect } from "react";
import Sidebar from "./Sidebar";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  activeItem?: string;
  onSelect?: (label: string) => void;
};

export default function MobileDrawer({ open, onClose, activeItem, onSelect }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-overlay ${open ? "open" : ""}`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className={`mobile-drawer ${open ? "open" : ""}`}
        aria-hidden={!open}
        aria-label="Menu navigasi"
      >
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button
            type="button"
            className="drawer-close"
            aria-label="Tutup menu"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <Sidebar activeItem={activeItem} onSelect={onSelect} onNavigate={onClose} />
      </aside>
    </>
  );
}
