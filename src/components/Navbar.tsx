type NavbarProps = {
  title: string;
  onMenuClick: () => void;
};

export default function Navbar({ title, onMenuClick }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="menu-button"
          aria-label="Buka menu navigasi"
          onClick={onMenuClick}
        >
          <span className="menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <h1 className="navbar-title">{title}</h1>
      </div>
      <div className="navbar-right">
        <div className="profile" aria-label="Profil pengguna">
          <span className="profile-avatar">U</span>
          <span className="profile-name">Pengguna</span>
        </div>
      </div>
    </header>
  );
}
