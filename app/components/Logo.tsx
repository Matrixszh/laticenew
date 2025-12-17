export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        {/* Lattice grid logo: 3x3 grid with connections */}
        {/* Corner nodes */}
        <rect x="10" y="10" width="20" height="20" rx="4" fill="black"/>
        <rect x="90" y="10" width="20" height="20" rx="4" fill="black"/>
        <rect x="10" y="90" width="20" height="20" rx="4" fill="black"/>
        <rect x="90" y="90" width="20" height="20" rx="4" fill="black"/>
        
        {/* Side nodes */}
        <rect x="50" y="10" width="20" height="20" rx="4" fill="black"/>
        <rect x="10" y="50" width="20" height="20" rx="4" fill="black"/>
        <rect x="90" y="50" width="20" height="20" rx="4" fill="black"/>
        <rect x="50" y="90" width="20" height="20" rx="4" fill="black"/>
        
        {/* Center node */}
        <rect x="50" y="50" width="20" height="20" rx="4" fill="black"/>
        
        {/* Diagonal connections (X pattern) */}
        <line x1="20" y1="20" x2="50" y2="50" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="100" y1="20" x2="60" y2="50" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="20" y1="100" x2="50" y2="60" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="100" y1="100" x2="60" y2="60" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        
        {/* Horizontal/Vertical connections (+ pattern) */}
        <line x1="50" y1="20" x2="50" y2="50" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="60" y1="50" x2="60" y2="20" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="20" y1="50" x2="50" y2="50" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="60" y1="50" x2="90" y2="50" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="50" y1="60" x2="50" y2="90" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <line x1="60" y1="90" x2="60" y2="60" stroke="black" strokeWidth="4" strokeLinecap="round"/>
      </svg>
      <span className="text-xl font-semibold text-gray-900 tracking-tight">LATTICE</span>
    </div>
  )
}

