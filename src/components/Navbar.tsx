type NavbarProps = {
  title: string;
  onLogout: () => void;
};

export default function Navbar({ title, onLogout }: NavbarProps) {
  return (
    <header className="role-topbar">
      <h1 className="role-topbar-title">{title}</h1>
      <button type="button" className="role-topbar-logout" onClick={onLogout}>
        Keluar
      </button>
    </header>
  );
}
