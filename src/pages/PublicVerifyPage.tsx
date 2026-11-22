import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { normalizeVerificationHash } from "../utils/verificationHash";

export default function PublicVerifyPage() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [manualHash, setManualHash] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const normalizedHash = normalizeVerificationHash(hash);

  const handleManualVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedHash = normalizeVerificationHash(manualHash);
    if (!normalizedHash) {
      setInputError("Masukkan kode SHA-256 yang valid (64 karakter).");
      return;
    }
    setInputError(null);
    navigate(`/verify/${normalizedHash}`);
  };

  return (
    <main className="verify-page">
      <section className="verify-card" aria-labelledby="verify-title">
        <div className="verify-brand">
          <span className="verify-brand-mark" aria-hidden="true">✦</span>
          <span>PESANTREN NURUL HUDA</span>
        </div>
        <p className="verify-badge">VERIFIKASI RAPOR PUBLIK</p>
        <h1 className="verify-title" id="verify-title">Portal Verifikasi Rapor</h1>
        <p className="verify-desc">
          Periksa status keaslian dan pengesahan rapor tanpa perlu masuk ke akun.
        </p>

        {!hash && (
          <p className="verify-notice" role="status">
            Pindai QR Code pada rapor atau masukkan kode verifikasi untuk melihat
            pratinjau halaman.
          </p>
        )}

        {hash && !normalizedHash && (
          <p className="verify-notice invalid" role="alert">
            Format kode tidak valid. Kode SHA-256 harus terdiri dari 64 karakter
            heksadesimal.
          </p>
        )}

        {hash && normalizedHash && (
          <section className="verify-result" aria-label="Pratinjau halaman verifikasi">
            <div className="verify-valid-status preview">
              <span className="verify-status-icon" aria-hidden="true">i</span>
              <div>
                <strong>PRATINJAU HALAMAN</strong>
                <span>
                  Tampilan ini belum memeriksa keaslian atau mengambil data rapor.
                </span>
              </div>
            </div>

            <h2>Identitas Santri</h2>
            <dl className="verify-identity">
              <div><dt>Nama santri</dt><dd>—</dd></div>
              <div><dt>Nomor peserta</dt><dd>—</dd></div>
              <div><dt>Kelas</dt><dd>—</dd></div>
              <div><dt>Tanggal pengesahan</dt><dd>—</dd></div>
            </dl>

            <h2>Rekap Capaian Nilai</h2>
            <dl className="verify-scores">
              <div><dt>Total nilai</dt><dd>—</dd></div>
              <div><dt>Rata-rata</dt><dd>—</dd></div>
              <div><dt>Peringkat</dt><dd>—</dd></div>
            </dl>
          </section>
        )}

        <form className="verify-form" onSubmit={handleManualVerify}>
          <label htmlFor="verification-hash">Kode verifikasi SHA-256</label>
          <div className="verify-input-row">
            <input
              id="verification-hash"
              type="text"
              value={manualHash}
              onChange={(event) => {
                setManualHash(event.target.value);
                setInputError(null);
              }}
              placeholder="Tempel kode 64 karakter"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit">Verifikasi</button>
          </div>
          {inputError && <p className="verify-input-error" role="alert">{inputError}</p>}
        </form>

        {hash && normalizedHash && (
          <div className="verify-hash">
            <span className="verify-hash-label">Kode yang diperiksa</span>
            <code>{normalizedHash}</code>
          </div>
        )}

        <Link to="/login" className="verify-back">Kembali ke halaman masuk</Link>
        <p className="verify-disclaimer">
          Informasi ini hanya menampilkan ringkasan rapor yang telah disahkan.
        </p>
      </section>
    </main>
  );
}
