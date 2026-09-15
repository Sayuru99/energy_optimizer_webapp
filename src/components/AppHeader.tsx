import { useState, type ReactNode } from 'react';
import { Bolt, LogOut, Menu } from 'lucide-react';
import { Brand } from './Brand';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './ToastContext';
import type { User, View } from '@/types';

type Props = {
  user: User;
  facilityName: string;
  facilityCode: string;
  view: View;
  setView: (v: View) => void;
  onSignOut: () => void;
  children: ReactNode;
};

const NAV_ITEMS: { key: View; label: string }[] = [
  { key: 'factory', label: 'Factory' },
  { key: 'machines', label: 'Machines' },
  { key: 'optimization', label: 'Optimization' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reports', label: 'Reports' },
];

export function AppHeader({ user, facilityName, facilityCode, view, setView, onSignOut, children }: Props) {
  const { toast } = useToast();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = () => { setConfirmSignOut(false); onSignOut(); toast('Signed out successfully', 'info'); };

  return (
    <div className="portal-shell">
      <header className="app-header">
        <div className="header-inner">
          <Brand compact />
          <div className="brand-subtitle">
            <b>SRI LANKA SME ENGINE</b>
            <span>Energy Optimization for SME Garment Factory</span>
          </div>
          <nav>
            {NAV_ITEMS.map((item) => (
              <button key={item.key} className={view === item.key ? 'active' : ''} onClick={() => setView(item.key)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="profile">
            <span className="status-dot" /> CEB Grid: Normal
            <div className="profile-name">
              <b>{user.name}</b>
              <small>{user.role} • {facilityName}</small>
            </div>
            <div className="avatar">{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
            <button className="signout-header-btn" title="Sign Out" onClick={() => setConfirmSignOut(true)}>
              <LogOut size={17} />
            </button>
            <button className="icon-button mobile-menu"><Menu size={19} /></button>
          </div>
        </div>
      </header>
      <div className="context-bar">
        <span><Bolt size={15} /> CEB INDUSTRIAL TARIFF (I-2 / I-3)</span>
        <i>•</i>
        <span>TOD SOLVER v2.4</span>
        <i>•</i>
        <b>FACILITY: {facilityCode}</b>
        <strong><span className="status-dot" /> Solver: Feasible Global Optimal Found</strong>
      </div>
      {children}
      <ConfirmDialog
        open={confirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of the facility portal?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        variant="primary"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
