import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { APP_VERSION, MODEL_DISCLAIMER } from '@/lib/constants';

const columns = [
  {
    title: 'Product',
    links: [
      { to: '/detect', label: 'Start Detection' },
      { to: '/history', label: 'Scan History' },
      { to: '/analytics', label: 'Analytics Dashboard' },
      { to: '/model-evaluation', label: 'Model Evaluation' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { to: '/diseases', label: 'Disease Library' },
      { to: '/about', label: 'About the System' },
      { to: '/diseases#capture-tips', label: 'Image Capture Tips' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Sign In' },
      { to: '/register', label: 'Create Account' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-forest text-white">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Logo tone="onDark" showTagline />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              BlightVision is a potato leaf blight classification system. A scikit-learn Random Forest, served by a Python
              FastAPI backend, classifies leaf photos as Early Blight or Late Blight from features extracted by a
              pretrained CNN and colour, shape, and texture descriptors.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm font-medium text-white/75 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-soft" aria-hidden />
          <div className="text-sm leading-relaxed text-white/70">
            <p className="font-bold text-white">Responsible AI disclaimer</p>
            <p className="mt-1">
              {MODEL_DISCLAIMER} The model recognises only Early Blight and Late Blight; it cannot identify healthy leaves,
              other diseases, or images that are not potato leaves.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} BlightVision · v{APP_VERSION}
          </p>
          <p>
            Photographs: Forest &amp; Kim Starr (CC BY 3.0), Linnea Stridh, Björn Andersson (SLU) and Armineaghayan (CC BY-SA 4.0), via
            Wikimedia Commons.
          </p>
        </div>
      </div>
    </footer>
  );
}
