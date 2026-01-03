// DATA VERSIONING & STORAGE CONFIGURATION
export const DATA_VERSION = 2;

export const STORAGE_KEYS = {
    mainData: 'guitarTrackerData',
    legacy: {
        maintenance: 'guitarMaintenanceData',
        humidity: 'humidityReadings',
        inspection: 'inspectionData'
    }
};

// DEFAULT DATA STRUCTURE
export const DEFAULT_GUITAR = {
    id: 'default',
    name: 'Taylor GS Mini Sapele',
    make: 'Taylor',
    model: 'GS Mini',
    variant: 'Sapele',
    settings: {
        targetHumidity: { min: 45, max: 50 },
        safeHumidity: { min: 40, max: 55 },
        dangerHumidity: { low: 35, high: 60 },
        stringChangeWeeks: 8,
        playingHoursPerWeek: 2.5
    }
};

// HUMIDITY THRESHOLDS
export const HUMIDITY_THRESHOLDS = {
    TARGET_MIN: 45,
    TARGET_MAX: 50,
    SAFE_MIN: 40,
    SAFE_MAX: 55,
    DANGER_LOW: 35,
    DANGER_HIGH: 60
};

// MAINTENANCE TASKS
export const MAINTENANCE_TASKS = {
    daily: [
        { id: 'daily-1', name: 'String Cleaning', duration: '5 min', frequency: 'After each session', why: 'Corrosion from finger oils creates abrasive particles that accelerate fret wear 3-5x. This doubles or triples string life.', how: 'Apply String Fuel to microfiber cloth, wipe each string from bridge to nut, both top and bottom. Clean under strings at fretboard surface.' },
        { id: 'daily-2', name: 'Body Wipedown', duration: '5 min', frequency: 'After each session', why: 'Sweat is acidic and damages finish over time.', how: 'Use dry microfiber cloth on body, especially forearm rest area and back where guitar contacts your body.' },
        { id: 'daily-3', name: 'Humidity Check & Case Storage', duration: '2 min', frequency: 'Before every case storage', why: 'Bridge lifting occurs when RH exceeds 55-60%. Early detection prevents catastrophic failure.', how: 'Check Inkbird hygrometer before closing case. Target: 45-50% RH. If above 55%, replace Humidipak packets immediately—don\'t wait.' }
    ],
    weekly: [
        { id: 'weekly-1', name: 'Hardware Oxidation Check', duration: '5 min', frequency: 'Once per week', why: 'Early-stage tarnish wipes off easily; advanced oxidation compromises tuner function.', how: 'Inspect chrome tuners for white/green discoloration. Wipe with Guitar ONE Detailer on microfiber cloth if present.' },
        { id: 'weekly-2', name: 'Bridge Wing Monitoring', duration: '3 min', frequency: 'Once per week', why: 'Visible gaps indicate humidity problems requiring immediate professional attention.', how: 'Look closely at bridge wings where they meet the top. Any lifting at the tips = emergency situation.' },
        { id: 'weekly-3', name: 'Humidipak Packet Check', duration: '2 min', frequency: 'Once per week', why: 'Hard packets = no moisture = your guitar is drying out.', how: 'Squeeze packets through pouches—should feel gel-like/soft. Hard = replace immediately.' }
    ],
    eightweek: [
        { id: '8w-1', name: 'String Removal & Fret Inspection', duration: '15 min', frequency: 'Every 8 weeks', why: 'Inspection during string change catches issues early.', how: 'Use GRIP String Winder and Cutter to remove old strings. Inspect all 20 frets for tarnish (dull appearance) or roughness.' },
        { id: '8w-2', name: 'Fret Polishing (FRINE Kit)', duration: '20 min', frequency: 'Every 8 weeks', why: 'Tarnished frets cause gritty feeling during bends and damage strings.', how: 'Place GRIP fretboard guard over fret. Apply pea-sized FRINE polish. Rub back-and-forth until oxidation removes. Wipe residue. Repeat all 20 frets.' },
        { id: '8w-3', name: 'Fretboard Conditioning (F-ONE)', duration: '5 min', frequency: 'Every 2nd or 3rd change', why: 'Prevents fret lift and buzzing.', how: 'Apply small amount F-ONE to cloth, wipe onto bare fretboard, let sit 3-5 min, wipe excess. ⚠️ WARNING: Over-oiling darkens ebony permanently.' },
        { id: '8w-4', name: 'Nut & Saddle Lubrication', duration: '10 min', frequency: 'Every 8 weeks', why: 'Prevents tuning instability and string "ping".', how: 'Apply Tune-It lubricant to all 6 nut slots with toothpick amounts. Lubricate saddle both sides of each string. Clean old lubricant first.' },
        { id: '8w-5', name: 'Bridge Pin Cleaning', duration: '5 min', frequency: 'Every 8 weeks', why: 'Dirty pins affect tone transfer and make removal difficult.', how: 'Remove with GRIP Puller, wipe down, or wash with mild soap if sticky. Dry completely before reinstalling.' },
        { id: '8w-6', name: 'Full Body Detailing', duration: '10 min', frequency: 'Every 8 weeks', why: 'Removes accumulated sweat, oils, fingerprints that damage finish.', how: 'Spray Guitar ONE Detailer on microfiber cloth (never directly on guitar). Wipe entire body in circular motions. Pay special attention to forearm rest area.' },
        { id: '8w-7', name: 'Hardware Polish', duration: '5 min', frequency: 'Every 8 weeks', why: 'Prevents corrosion that can seize tuners.', how: 'Wipe tuners, bridge pins, chrome parts with Guitar ONE Detailer or chrome polish if oxidation present.' },
        { id: '8w-8', name: 'Restring', duration: '15 min', frequency: 'Every 8 weeks', why: 'Fresh strings maintain tone and playability.', how: 'Use GRIP String Winder for efficient installation. Stretch strings gently after installation. Retune multiple times over 24 hours.' }
    ],
    quarterly: [
        { id: 'q-1', name: 'Humidipak Replacement', duration: '5 min', frequency: 'Every 12 weeks', why: 'Packets effective for 2-6 months. Don\'t push beyond effective life.', how: 'Replace both saddle pouch and headstock pouch packets. Monitor replacement frequency based on how quickly they harden.' },
        { id: 'q-2', name: 'Truss Rod Observation', duration: '5 min', frequency: 'Every 12 weeks', why: 'Seasonal humidity changes affect neck relief.', how: 'Fret low E string at 1st and 14th frets simultaneously, observe gap at 7th fret. Tiny gap (business card thickness) = normal. Large gap or buzzing = needs professional adjustment.' },
        { id: 'q-3', name: 'Complete Structural Inspection', duration: '10 min', frequency: 'Every 12 weeks', why: 'Early detection of problems prevents expensive repairs.', how: 'Check: all body joints (neck heel, bridge, binding) for cracks/separations, finish checking, soundhole for pick strike damage, fret sprout.' }
    ],
    annual: [
        { id: 'annual-1', name: 'Taylor Refresh Service', duration: 'Professional', frequency: 'Once per year', why: 'The 23.5" scale length requires specific setup parameters. Professional service ensures optimal results.', how: 'Schedule with Taylor-authorized service center. Includes: humidity stabilization, fretboard cleaning, strings, truss rod adjustment, action optimization, detail, polish, intonation check. Cost: $115.' }
    ]
};

// EQUIPMENT ITEMS
export const EQUIPMENT_ITEMS = [
    'MusicNomad MN290 Ultimate Work Station (36" x 17" mat with gel cradle)',
    'Guitar ONE Polish & Cleaner',
    'F-ONE Fretboard Oil & Cleaner',
    'String Fuel string cleaner',
    'FRINE Fret Polishing Kit (5-piece micro-fine kit)',
    'Tune-It nut/saddle lubricant',
    'GRIP String Winder, Cutter, and Puller',
    '26-piece guitar tech screwdriver/wrench set',
    'Premium microfiber cloths',
    'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)',
    'Kyser Quick-Change Capo (KG6BA)',
    'Levy\'s MSSC8 Cotton Strap + D\'Addario Flex Lock Blocks',
    'Gator GC-GSMINI Molded Case',
    'D\'Addario Humidipak Restore Kit',
    'Inkbird ITH-10 Hygrometer'
];
