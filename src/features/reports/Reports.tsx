import { BarChart3, Download, TrendingDown, Calendar } from 'lucide-react';
import { Metric } from '@/components/Metric';
import { useToast } from '@/components/ToastContext';
import type { ReportRow, View } from '@/types';

type Props = {
  reports: ReportRow[];
  setView: (v: View) => void;
};

export function Reports({ reports, setView }: Props) {
  const { toast } = useToast();
  const avgSaving = reports.reduce((s, r) => s + r.saving, 0) / reports.length;
  const totalSaving = reports.reduce((s, r) => s + r.saving, 0);
  const avgEnergy = reports.reduce((s, r) => s + r.energy, 0) / reports.length;
  const avgCurrent = reports.reduce((s, r) => s + r.currentCost, 0) / reports.length;

  return (
    <main className="app-main">
      <section className="page-intro">
        <div>
          <div className="step-label">REPORTS · COST & SAVINGS HISTORY</div>
          <h1>Energy Reports</h1>
          <p>Daily and monthly electricity cost tracking, savings history, and energy consumption trends.</p>
        </div>
        <button className="secondary-button" onClick={() => toast('Full report exported as CSV.', 'success')}><Download size={16} /> Export All</button>
      </section>

      <section className="metric-grid">
        <Metric icon={<TrendingDown />} label="Avg Daily Saving" value={`Rs. ${avgSaving.toFixed(0)}`} note={`Over ${reports.length} days`} tone="green" />
        <Metric icon={<BarChart3 />} label="Total Saving" value={`Rs. ${totalSaving.toLocaleString()}`} note="Cumulative savings" tone="blue" />
        <Metric icon={<BarChart3 />} label="Avg Daily Energy" value={`${avgEnergy.toFixed(0)} kWh`} note="Consumption baseline" tone="amber" />
        <Metric icon={<TrendingDown />} label="Avg Current Cost" value={`Rs. ${avgCurrent.toFixed(0)}`} note="Before optimization" tone="red" />
      </section>

      <section className="table-card">
        <div className="table-head">
          <div><h2>Daily Report History <span>{reports.length} Records</span></h2><p>Electricity cost comparison and savings per day.</p></div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Date</th><th>Current Cost</th><th>Optimized Cost</th><th>Saving</th><th>Energy</th><th>Saving %</th></tr></thead>
            <tbody>
              {reports.map((r) => {
                const pct = ((r.saving / r.currentCost) * 100).toFixed(2);
                return (
                  <tr key={r.id}>
                    <td><div className="machine-name"><div className="machine-avatar blue"><Calendar size={14} /></div><div><b>{r.date}</b><small>{r.id}</small></div></div></td>
                    <td className="mono">Rs. {r.currentCost.toLocaleString()}</td>
                    <td className="mono"><b>Rs. {r.optimizedCost.toLocaleString()}</b></td>
                    <td className="mono"><span className="green-text">Rs. {r.saving}</span></td>
                    <td className="mono">{r.energy} kWh</td>
                    <td className="mono"><span className="green-text">{pct}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-note">
          <TrendingDown size={17} />
          <span><b>Consistent savings:</b> Average {((avgSaving / avgCurrent) * 100).toFixed(1)}% cost reduction maintained across all reporting days.</span>
          <code>1 unit = 1 kWh</code>
        </div>
      </section>

      <div className="bottom-actions">
        <span><span className="status-dot" /> {reports.length} daily reports available</span>
        <button className="secondary-button" onClick={() => setView('dashboard')}>Back to Dashboard</button>
        <button className="primary-button" onClick={() => toast('Monthly summary report generated.', 'success')}><Download size={16} /> Generate Monthly Summary</button>
      </div>
    </main>
  );
}
