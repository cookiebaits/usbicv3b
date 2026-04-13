import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  Bitcoin,
  User,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { clearToken } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Accounts', icon: CreditCard, href: '/dashboard/accounts' },
  { label: 'Transfers', icon: ArrowLeftRight, href: '/dashboard/transfers' },
  { label: 'Transactions', icon: Receipt, href: '/dashboard/transactions' },
  { label: 'Crypto', icon: Bitcoin, href: '/dashboard/crypto' },
  { label: 'Profile', icon: User, href: '/dashboard/profile' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const handleNav = (href: string) => {
    navigate(href);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">SecureBank</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={isActive ? 'nav-item-active w-full text-left' : 'nav-item w-full text-left'}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        <div
          className={`fixed left-0 top-0 bottom-0 w-72 bg-white shadow-modal z-50 lg:hidden transform transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen fixed left-0 top-0 bottom-0">
      {sidebarContent}
    </div>
  );
}
