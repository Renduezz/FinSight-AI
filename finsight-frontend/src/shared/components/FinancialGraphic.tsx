export default function FinancialGraphic() {
    return (
        <svg
            viewBox="0 0 400 700"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#EFF4FF" />
                    <stop offset="100%" stopColor="#DCE8FF" />
                </linearGradient>
                <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
            </defs>

        

            {/* Ondas de fondo, simulando el flujo de datos */}
            <path
                d="M -20 300 C 80 260, 150 340, 250 300 S 420 260, 480 300"
                stroke="#93C5FD"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
            />
            <path
                d="M -20 360 C 90 320, 160 400, 260 360 S 430 320, 480 360"
                stroke="#BFDBFE"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
            />

            {/* Puntos de "nodos de datos" */}
            <circle cx="90" cy="470" r="10" fill="#3B82F6" opacity="0.35" />
            <circle cx="230" cy="520" r="14" fill="#3B82F6" opacity="0.25" />
            <circle cx="320" cy="430" r="8" fill="#3B82F6" opacity="0.35" />

            {/* Barras ascendentes, como un mini dashboard financiero */}
            <g>
                <rect x="150" y="260" width="26" height="60" rx="4" fill="url(#bar-gradient)" />
                <rect x="184" y="230" width="26" height="90" rx="4" fill="url(#bar-gradient)" />
                <rect x="218" y="190" width="26" height="130" rx="4" fill="url(#bar-gradient)" />
                <rect x="252" y="150" width="26" height="170" rx="4" fill="url(#bar-gradient)" />
            </g>
        </svg>
    );
}