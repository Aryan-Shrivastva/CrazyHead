export const F1_TEAMS = [
  {
    id: 'ferrari',
    name: 'Scuderia Ferrari HP',
    shortName: 'Ferrari',
    badge: '🐎',
    logoText: 'FERRARI',
    color: '#E80020',
    accentColor: '#FFF200',
    subAccent: '#002D62',
    cockpitColor: '#C00018',
    haloColor: '#1A1A1A',
    gloveColor: '#FFFFFF',
    gloveAccent: '#E80020',
    teamPrincipal: 'FRÉDÉRIC VASSEUR',
    chassis: 'SF-25',
    base: 'MARANELLO, ITALY',
    engineSupplier: 'FERRARI',
    power: '1025+ BHP',
    country: 'Italy',
    drivers: [
      { id: 'leclerc', name: 'Charles LECLERC', number: '16', flag: '🇲🇨', code: 'LEC', rtg: 94, foc: 91, share: '51%', podiums: 41, wins: 8 },
      { id: 'hamilton', name: 'Lewis HAMILTON', number: '44', flag: '🇬🇧', code: 'HAM', rtg: 96, foc: 93, share: '49%', podiums: 201, wins: 105 }
    ],
    perks: [
      { name: '1st R&D Secret Upgrade', val: '35%', active: true },
      { name: '2 Simultaneous Upgrades', val: '40%', active: true },
      { name: 'R&D Rush', val: '45%', active: true },
      { name: '2nd R&D Secret Upgrade', val: '50%', active: true },
      { name: '3 Simultaneous Upgrades', val: '55%', active: false },
      { name: 'Power Unit Reliability Boost', val: '65%', active: false }
    ]
  },
  {
    id: 'mclaren',
    name: 'McLaren Formula 1 Team',
    shortName: 'McLaren',
    badge: '🟠',
    logoText: 'MCLAREN',
    color: '#FF8000',
    accentColor: '#00A3E0',
    subAccent: '#1E1E1E',
    cockpitColor: '#FF7000',
    haloColor: '#1A1A1A',
    gloveColor: '#FF8000',
    gloveAccent: '#00A3E0',
    teamPrincipal: 'ANDREA STELLA',
    chassis: 'MCL39',
    base: 'WOKING, UNITED KINGDOM',
    engineSupplier: 'MERCEDES-AMG',
    power: '1030+ BHP',
    country: 'United Kingdom',
    drivers: [
      { id: 'norris', name: 'Lando NORRIS', number: '4', flag: '🇬🇧', code: 'NOR', rtg: 93, foc: 89, share: '52%', podiums: 29, wins: 4 },
      { id: 'piastri', name: 'Oscar PIASTRI', number: '81', flag: '🇦🇺', code: 'PIA', rtg: 90, foc: 92, share: '48%', podiums: 10, wins: 2 }
    ],
    perks: [
      { name: 'Aero Efficiency Streamline', val: '35%', active: true },
      { name: 'Wind Tunnel Optimization', val: '40%', active: true },
      { name: 'Rapid Carbon Development', val: '48%', active: true },
      { name: 'Pitstop Speed Mastery', val: '50%', active: true },
      { name: 'Floor Ground Effect Surge', val: '60%', active: false }
    ]
  },
  {
    id: 'redbull',
    name: 'Oracle Red Bull Racing',
    shortName: 'Red Bull',
    badge: '🐂',
    logoText: 'RED BULL',
    color: '#3671C6',
    accentColor: '#FFC800',
    subAccent: '#CC1E4A',
    cockpitColor: '#0B162C',
    haloColor: '#111726',
    gloveColor: '#0B162C',
    gloveAccent: '#FFC800',
    teamPrincipal: 'CHRISTIAN HORNER',
    chassis: 'RB21',
    base: 'MILTON KEYNES, UK',
    engineSupplier: 'HONDA RBPT',
    power: '1030+ BHP',
    country: 'Austria',
    drivers: [
      { id: 'verstappen', name: 'Max VERSTAPPEN', number: '1', flag: '🇳🇱', code: 'VER', rtg: 97, foc: 96, share: '62%', podiums: 111, wins: 63 },
      { id: 'lawson', name: 'Liam LAWSON', number: '30', flag: '🇳🇿', code: 'LAW', rtg: 83, foc: 86, share: '38%', podiums: 0, wins: 0 }
    ],
    perks: [
      { name: 'High-Speed Downforce Secret', val: '35%', active: true },
      { name: 'DRS Wing Winglet Package', val: '42%', active: true },
      { name: 'Power Unit Map Precision', val: '48%', active: true },
      { name: 'Tire Degradation Shield', val: '52%', active: true },
      { name: 'Race Strategy Simulation AI', val: '65%', active: false }
    ]
  },
  {
    id: 'mercedes',
    name: 'Mercedes-AMG PETRONAS F1 Team',
    shortName: 'Mercedes',
    badge: '⭐',
    logoText: 'MERCEDES',
    color: '#00D2BE',
    accentColor: '#FFFFFF',
    subAccent: '#1A1A1A',
    cockpitColor: '#0D1515',
    haloColor: '#101010',
    gloveColor: '#FFFFFF',
    gloveAccent: '#00D2BE',
    teamPrincipal: 'TOTO WOLFF',
    chassis: 'W16',
    base: 'BRACKLEY, UNITED KINGDOM',
    engineSupplier: 'MERCEDES-AMG',
    power: '1025+ BHP',
    country: 'Germany',
    drivers: [
      { id: 'russell', name: 'George RUSSELL', number: '63', flag: '🇬🇧', code: 'RUS', rtg: 91, foc: 90, share: '54%', podiums: 14, wins: 3 },
      { id: 'antonelli', name: 'Kimi ANTONELLI', number: '12', flag: '🇮🇹', code: 'ANT', rtg: 84, foc: 88, share: '46%', podiums: 0, wins: 0 }
    ],
    perks: [
      { name: 'Suspension Dynamic Camber', val: '35%', active: true },
      { name: 'Simultaneous Telemetry Link', val: '40%', active: true },
      { name: 'ERS Harvesting Velocity', val: '45%', active: true },
      { name: 'Sidepod Venturi Channel', val: '55%', active: false }
    ]
  },
  {
    id: 'astonmartin',
    name: 'Aston Martin Aramco F1 Team',
    shortName: 'Aston Martin',
    badge: '🦅',
    logoText: 'ARAMCO',
    color: '#229971',
    accentColor: '#CEDC00',
    subAccent: '#0A1E17',
    cockpitColor: '#00594C',
    haloColor: '#121212',
    gloveColor: '#00594C',
    gloveAccent: '#CEDC00',
    teamPrincipal: 'MIKE KRACK',
    chassis: 'AMR25',
    base: 'SILVERSTONE, UK',
    engineSupplier: 'MERCEDES-AMG',
    power: '1020+ BHP',
    country: 'United Kingdom',
    drivers: [
      { id: 'alonso', name: 'Fernando ALONSO', number: '14', flag: '🇪🇸', code: 'ALO', rtg: 92, foc: 95, share: '58%', podiums: 106, wins: 32 },
      { id: 'stroll', name: 'Lance STROLL', number: '18', flag: '🇨🇦', code: 'STR', rtg: 81, foc: 82, share: '42%', podiums: 3, wins: 0 }
    ],
    perks: [
      { name: 'Veteran Racecraft Telemetry', val: '38%', active: true },
      { name: 'High-Downforce Wing Flap', val: '44%', active: true },
      { name: 'Silverstone HQ Aero Windmill', val: '52%', active: false }
    ]
  },
  {
    id: 'alpine',
    name: 'BWT Alpine F1 Team',
    shortName: 'Alpine',
    badge: '🏔️',
    logoText: 'ALPINE',
    color: '#0090FF',
    accentColor: '#FF87BC',
    subAccent: '#001A33',
    cockpitColor: '#0055AA',
    haloColor: '#1A1A1A',
    gloveColor: '#0090FF',
    gloveAccent: '#FF87BC',
    teamPrincipal: 'OLIVER OAKES',
    chassis: 'A525',
    base: 'ENSTONE, UNITED KINGDOM',
    engineSupplier: 'RENAULT',
    power: '1010+ BHP',
    country: 'France',
    drivers: [
      { id: 'gasly', name: 'Pierre GASLY', number: '10', flag: '🇫🇷', code: 'GAS', rtg: 86, foc: 87, share: '53%', podiums: 5, wins: 1 },
      { id: 'doohan', name: 'Jack DOOHAN', number: '7', flag: '🇦🇺', code: 'DOO', rtg: 80, foc: 82, share: '47%', podiums: 0, wins: 0 }
    ],
    perks: [
      { name: 'BWT Cooling Channel', val: '35%', active: true },
      { name: 'Aggressive Engine Mapping', val: '42%', active: true },
      { name: 'Chassis Weight Reduction', val: '50%', active: false }
    ]
  },
  {
    id: 'williams',
    name: 'Williams Racing',
    shortName: 'Williams',
    badge: '⚡',
    logoText: 'WILLIAMS',
    color: '#64C4FF',
    accentColor: '#041E42',
    subAccent: '#00A3E0',
    cockpitColor: '#041E42',
    haloColor: '#121212',
    gloveColor: '#041E42',
    gloveAccent: '#64C4FF',
    teamPrincipal: 'JAMES VOWLES',
    chassis: 'FW47',
    base: 'GROVE, UNITED KINGDOM',
    engineSupplier: 'MERCEDES-AMG',
    power: '1020+ BHP',
    country: 'United Kingdom',
    drivers: [
      { id: 'sainz', name: 'Carlos SAINZ', number: '55', flag: '🇪🇸', code: 'SAI', rtg: 89, foc: 92, share: '52%', podiums: 25, wins: 4 },
      { id: 'albon', name: 'Alex ALBON', number: '23', flag: '🇹🇭', code: 'ALB', rtg: 87, foc: 88, share: '48%', podiums: 2, wins: 0 }
    ],
    perks: [
      { name: 'Low Drag Straight Line Speed', val: '38%', active: true },
      { name: 'Chassis Torsional Rigidity', val: '45%', active: true },
      { name: 'Strategic Undercut Priority', val: '54%', active: false }
    ]
  },
  {
    id: 'rb',
    name: 'Visa Cash App RB F1 Team',
    shortName: 'RB Racing',
    badge: '🐂',
    logoText: 'VCARB',
    color: '#6692FF',
    accentColor: '#FFFFFF',
    subAccent: '#E10600',
    cockpitColor: '#102244',
    haloColor: '#151515',
    gloveColor: '#FFFFFF',
    gloveAccent: '#6692FF',
    teamPrincipal: 'LAURENT MEKIES',
    chassis: 'VCARB 02',
    base: 'FAENZA, ITALY',
    engineSupplier: 'HONDA RBPT',
    power: '1020+ BHP',
    country: 'Italy',
    drivers: [
      { id: 'tsunoda', name: 'Yuki TSUNODA', number: '22', flag: '🇯🇵', code: 'TSU', rtg: 85, foc: 86, share: '55%', podiums: 0, wins: 0 },
      { id: 'hadjar', name: 'Isack HADJAR', number: '6', flag: '🇫🇷', code: 'HAD', rtg: 80, foc: 84, share: '45%', podiums: 0, wins: 0 }
    ],
    perks: [
      { name: 'Brembo Brake Response Boost', val: '35%', active: true },
      { name: 'Fast Apex Agility Package', val: '44%', active: true },
      { name: 'Qualifying Engine Mode', val: '55%', active: false }
    ]
  },
  {
    id: 'sauber',
    name: 'Stake F1 Team Kick Sauber',
    shortName: 'Kick Sauber',
    badge: '🟢',
    logoText: 'STAKE',
    color: '#52E252',
    accentColor: '#000000',
    subAccent: '#1F1F1F',
    cockpitColor: '#051405',
    haloColor: '#0A0A0A',
    gloveColor: '#000000',
    gloveAccent: '#52E252',
    teamPrincipal: 'MATTIA BINOTTO',
    chassis: 'C45',
    base: 'HINWIL, SWITZERLAND',
    engineSupplier: 'FERRARI',
    power: '1015+ BHP',
    country: 'Switzerland',
    drivers: [
      { id: 'hulkenberg', name: 'Nico HÜLKENBERG', number: '27', flag: '🇩🇪', code: 'HUL', rtg: 86, foc: 89, share: '54%', podiums: 0, wins: 0 },
      { id: 'bortoleto', name: 'Gabriel BORTOLETO', number: '5', flag: '🇧🇷', code: 'BOR', rtg: 81, foc: 84, share: '46%', podiums: 0, wins: 0 }
    ],
    perks: [
      { name: 'Neon Aero Surface Polish', val: '35%', active: true },
      { name: 'Pit Equipment Overhaul', val: '45%', active: true },
      { name: 'Audi Tech Transition Prototype', val: '60%', active: false }
    ]
  },
  {
    id: 'haas',
    name: 'MoneyGram Haas F1 Team',
    shortName: 'Haas F1',
    badge: '🔴',
    logoText: 'HAAS',
    color: '#B6BABD',
    accentColor: '#E10600',
    subAccent: '#141414',
    cockpitColor: '#222222',
    haloColor: '#121212',
    gloveColor: '#FFFFFF',
    gloveAccent: '#E10600',
    teamPrincipal: 'AYAOKOMATSU',
    chassis: 'VF-25',
    base: 'KANNAPOLIS, USA',
    engineSupplier: 'FERRARI',
    power: '1015+ BHP',
    country: 'United States',
    drivers: [
      { id: 'ocon', name: 'Esteban OCON', number: '31', flag: '🇫🇷', code: 'OCO', rtg: 85, foc: 86, share: '51%', podiums: 4, wins: 1 },
      { id: 'bearman', name: 'Oliver BEARMAN', number: '87', flag: '🇬🇧', code: 'BEA', rtg: 82, foc: 88, share: '49%', podiums: 0, wins: 0 }
    ],
    perks: [
      { name: 'Ferrari Wind Tunnel Data Link', val: '36%', active: true },
      { name: 'Brake Cooling Shroud', val: '43%', active: true },
      { name: 'Race Pace Optimization', val: '52%', active: false }
    ]
  }
];
