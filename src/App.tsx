import { useEffect, useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { supabase, supabaseConfigError } from "./lib/supabase";

function App() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );
  const [message, setMessage] = useState<string>("Memeriksa koneksi Supabase...");

  useEffect(() => {
    if (supabaseConfigError) {
      setStatus("error");
      setMessage(supabaseConfigError);
      return;
    }

    async function checkConnection() {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        setStatus("connected");
        setMessage("Supabase client berhasil diinisialisasi.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Gagal menghubungi Supabase."
        );
      }
    }

    checkConnection();
  }, []);

  return (
    <DashboardLayout>
      <section className="page">
        <h2>Selamat datang di E-Rapor Pondok</h2>
        <p>
          Status Supabase: <strong>{status}</strong>
        </p>
        <p>{message}</p>
        <div className="card">
          <h3>Kerangka Tampilan</h3>
          <p>
            Layout responsif dengan Navbar, Sidebar (desktop), dan Mobile Drawer
            (mobile) sudah aktif. Gunakan tombol menu pada layar kecil untuk
            membuka navigasi.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default App;
