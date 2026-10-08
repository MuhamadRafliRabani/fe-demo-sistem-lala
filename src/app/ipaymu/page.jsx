"use client";
import { useState } from "react";
import { getPaymentChannels } from "../action";

// Sesuaikan path import dengan lokasi server action kamu
// import { getPaymentChannels } from "../action";

// ─── Icon mapping per kategori ───────────────────────────────────────────────
const CATEGORY_ICONS = {
  cod: "🚚",
  cstore: "🏪",
  cc: "💳",
  debitonline: "🏧",
  ewallet: "👜",
  "ewallet-asia": "🌏",
  paylater: "🗓",
  qris: "📱",
  va: "🏦",
};

// ─── Format biaya transaksi ───────────────────────────────────────────────────
function formatFee(fee) {
  const { ActualFee, ActualFeeType, AdditionalFee } = fee;
  let label =
    ActualFeeType === "FLAT"
      ? `Rp ${ActualFee.toLocaleString("id-ID")}`
      : `${ActualFee}%`;
  if (AdditionalFee > 0) {
    label += ` + Rp ${AdditionalFee.toLocaleString("id-ID")}`;
  }
  return label;
}

// ─── Komponen: kartu satu channel ────────────────────────────────────────────
function ChannelCard({ channel, categoryCode }) {
  const [imgError, setImgError] = useState(false);
  const isOnline = channel.HealthStatus === "online";
  const isActive = channel.FeatureStatus === "active";

  return (
    <div className="channel-card">
      {/* Logo + nama */}
      <div className="channel-header">
        <div className="channel-logo">
          {channel.Logo && !imgError ? (
            <img
              src={channel.Logo}
              alt={channel.Name}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="channel-icon">
              {CATEGORY_ICONS[categoryCode] ?? "💰"}
            </span>
          )}
        </div>
        <span className="channel-name">{channel.Name}</span>
      </div>

      {/* Fee + status */}
      <div className="channel-footer">
        <span className="fee-badge">
          🏷 {formatFee(channel.TransactionFee)}
        </span>
        <span
          className={`status-badge ${isOnline && isActive ? "online" : "offline"}`}
        >
          <span className="status-dot" />
          {isOnline && isActive ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  );
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function PaymentChannels({ initialData = null }) {
  const [channels, setChannels] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // ─── Fetch dari iPaymu ─────────────────────────────────────────────────────
  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaymentChannels();
      if (!result?.Success) throw new Error("Gagal mengambil data channel");
      setChannels(result.Data);
      console.log("🚀 ~ handleFetch ~ result:", result);

      // Hapus baris dummy di bawah saat pakai server action sungguhan:
      //   await new Promise((r) => setTimeout(r, 800));
      //   setChannels(DUMMY_DATA);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Kalkulasi statistik ───────────────────────────────────────────────────
  const withChannels = (channels ?? []).filter(
    (c) => Array.isArray(c.Channels) && c.Channels.length > 0,
  );
  const totalChannels = withChannels.reduce(
    (sum, c) => sum + c.Channels.length,
    0,
  );
  const totalOnline = withChannels.reduce(
    (sum, c) =>
      sum + c.Channels.filter((ch) => ch.HealthStatus === "online").length,
    0,
  );

  // ─── Filter ────────────────────────────────────────────────────────────────
  const displayed =
    activeFilter === "all"
      ? withChannels
      : withChannels.filter((c) => c.Code === activeFilter);

  return (
    <>
      <style>{CSS}</style>

      <div className="pg-wrap">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="pg-header">
          <div>
            <h1 className="pg-title">Metode Pembayaran</h1>
            <p className="pg-subtitle">
              Pilih channel pembayaran yang tersedia via iPaymu
            </p>
          </div>
          <button
            className="fetch-btn"
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Memuat...
              </>
            ) : (
              "↻ Muat Ulang"
            )}
          </button>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* ── Konten utama ───────────────────────────────────────────────── */}
        {channels ? (
          <>
            {/* Statistik */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total channel</span>
                <span className="stat-value">{totalChannels}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Online</span>
                <span className="stat-value online">{totalOnline}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Kategori</span>
                <span className="stat-value">{withChannels.length}</span>
              </div>
            </div>

            {/* Filter kategori */}
            <div className="filter-row">
              <button
                className={`chip ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                Semua
              </button>
              {withChannels.map((cat) => (
                <button
                  key={cat.Code}
                  className={`chip ${activeFilter === cat.Code ? "active" : ""}`}
                  onClick={() => setActiveFilter(cat.Code)}
                >
                  {CATEGORY_ICONS[cat.Code] ?? "💰"} {cat.Name}
                  <span className="chip-count">{cat.Channels.length}</span>
                </button>
              ))}
            </div>

            {/* Daftar channel per kategori */}
            {displayed.map((cat) => (
              <section key={cat.Code} className="cat-section">
                <div className="cat-heading">
                  <span className="cat-icon">
                    {CATEGORY_ICONS[cat.Code] ?? "💰"}
                  </span>
                  <h2 className="cat-name">{cat.Name}</h2>
                  <span className="cat-count">
                    {cat.Channels.length} channel
                  </span>
                </div>
                <div className="channel-grid">
                  {cat.Channels.map((ch) => (
                    <ChannelCard
                      key={ch.Code}
                      channel={ch}
                      categoryCode={cat.Code}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          // Empty state
          <div className="empty-state">
            <p>
              Belum ada data. Klik {`${"Muat Ulang"}`} untuk mengambil channel.
            </p>
            <button
              className="fetch-btn"
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? "Memuat..." : "Muat Channel"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── CSS-in-JS ─────────────────────────────────────────────────────────────
const CSS = `
.pg-wrap { max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, sans-serif; }
.pg-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.pg-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #0f172a; }
.pg-subtitle { font-size: 14px; color: #64748b; margin: 0; }

.fetch-btn { background: #0f172a; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.15s; }
.fetch-btn:hover:not(:disabled) { background: #1e293b; }
.fetch-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 12px 16px; font-size: 14px; margin-bottom: 20px; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
.stat-value { display: block; font-size: 26px; font-weight: 600; color: #0f172a; }
.stat-value.online { color: #059669; }

.filter-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.chip { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 14px; font-size: 13px; color: #475569; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.12s; }
.chip:hover:not(.active) { background: #e2e8f0; }
.chip.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.chip-count { background: rgba(0,0,0,0.08); border-radius: 999px; padding: 1px 7px; font-size: 11px; }
.chip.active .chip-count { background: rgba(255,255,255,0.2); }

.cat-section { margin-bottom: 28px; }
.cat-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.cat-icon { font-size: 18px; }
.cat-name { font-size: 15px; font-weight: 600; margin: 0; color: #0f172a; }
.cat-count { font-size: 12px; color: #94a3b8; margin-left: 2px; }

.channel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.channel-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; transition: border-color 0.15s, box-shadow 0.15s; }
.channel-card:hover { border-color: #94a3b8; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.channel-header { display: flex; align-items: center; gap: 10px; }
.channel-logo { width: 38px; height: 38px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.channel-logo img { width: 34px; height: 34px; object-fit: contain; }
.channel-icon { font-size: 18px; line-height: 1; }
.channel-name { font-size: 13px; font-weight: 500; color: #0f172a; line-height: 1.35; }

.channel-footer { display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap; }
.fee-badge { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 3px 9px; font-size: 11px; color: #475569; white-space: nowrap; }
.status-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; }
.status-badge.online { color: #059669; }
.status-badge.offline { color: #dc2626; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.empty-state { text-align: center; padding: 60px 20px; color: #64748b; font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 16px; }

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .stats-grid > :last-child { grid-column: span 2; }
  .channel-grid { grid-template-columns: 1fr 1fr; }
}
`;
