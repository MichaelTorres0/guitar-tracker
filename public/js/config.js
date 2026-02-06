// DATA VERSIONING & STORAGE CONFIGURATION
// v1: Original separate keys (guitarMaintenanceData, humidityReadings, inspectionData)
// v2: Consolidated to guitarTrackerData with guitars array
// v3: Moved all v2.0 features (sessions, string history, onboarding) into versioned structure
// v4: Practice stopwatch, streak tracking, string health ring, consumables inventory, string change notes
// v5: Full consolidation - humidity readings and task states now in versioned structure (fixes data persistence)
// v6: Multi-guitar support - add PRS CE24 configuration and tasks
export const DATA_VERSION = 6;

export const STORAGE_KEYS = {
    mainData: 'guitarTrackerData',
    legacy: {
        maintenance: 'guitarMaintenanceData',
        humidity: 'humidityReadings',
        inspection: 'inspectionData',
        // v2.0 separate keys (now migrated into versioned structure)
        onboardingComplete: 'onboardingComplete',
        playingFrequency: 'playingFrequency',
        playingHoursPerWeek: 'playingHoursPerWeek',
        hasHygrometer: 'hasHygrometer',
        playingSessions: 'playingSessions',
        stringChangeHistory: 'stringChangeHistory'
    }
};

// DEFAULT DATA STRUCTURE (kept for backward compatibility)
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

// MULTI-GUITAR CONFIGURATIONS
export const GUITARS = {
    'gs-mini': {
        id: 'gs-mini',
        name: 'Taylor GS Mini Sapele',
        make: 'Taylor',
        model: 'GS Mini',
        variant: 'Sapele',
        type: 'acoustic',
        settings: {
            targetHumidity: { min: 45, max: 50 },
            safeHumidity: { min: 40, max: 55 },
            dangerHumidity: { low: 35, high: 60 },
            stringChangeWeeks: 8,
            playingHoursPerWeek: 2.5
        }
    },
    'prs-ce24': {
        id: 'prs-ce24',
        name: 'PRS SE CE24',
        make: 'PRS',
        model: 'SE CE24',
        variant: 'Standard Satin',
        type: 'electric',
        settings: {
            targetHumidity: { min: 40, max: 60 }, // Electric is less sensitive
            safeHumidity: { min: 30, max: 70 },
            dangerHumidity: { low: 20, high: 80 },
            stringChangeWeeks: 12, // Longer string life
            playingHoursPerWeek: 3.5
        }
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

// PRS CE24 MAINTENANCE TASKS (Electric Guitar)
export const PRS_MAINTENANCE_TASKS = {
    daily: [
        { id: 'prs-daily-1', name: 'String Cleaning', duration: '3 min', frequency: 'After each session', why: 'Nickel-wound strings oxidize quickly with finger oils.', how: 'Wipe each string with dry microfiber cloth from bridge to nut, both sides.' },
        { id: 'prs-daily-2', name: 'Body Wipedown', duration: '2 min', frequency: 'After each session', why: 'Sweat damages nitro finish and creates sticky feeling.', how: 'Use dry microfiber on body, especially neck back and forearm area.' }
    ],
    weekly: [
        { id: 'prs-weekly-1', name: 'Hardware Check', duration: '5 min', frequency: 'Once per week', why: 'Tuner screws and strap buttons can loosen from string tension.', how: 'Check all tuner screws, strap buttons, pickup screws. Tighten if loose.' },
        { id: 'prs-weekly-2', name: 'Tremolo Spring Inspection', duration: '3 min', frequency: 'Once per week', why: 'Spring tension changes affect tuning stability.', how: 'Check tremolo is parallel to body. Springs should feel firm but not over-tight.' },
        { id: 'prs-weekly-3', name: 'Fretboard Edge Check', duration: '2 min', frequency: 'Once per week', why: 'Fret sprout detection (less common on electric but still important).', how: 'Run finger along fretboard edges. Should feel smooth, no sharp fret ends.' }
    ],
    monthly: [
        { id: 'prs-monthly-1', name: 'Electronics Check', duration: '5 min', frequency: 'Once per month', why: 'Pots and switches accumulate dust causing crackling.', how: 'Turn all knobs through full range. Test pickup selector in all positions. Listen for crackling or dropouts.' },
        { id: 'prs-monthly-2', name: 'Output Jack Tightening', duration: '2 min', frequency: 'Once per month', why: 'Loose jacks cause signal loss and damage cables.', how: 'Unplug cable. Check if jack spins freely. Tighten nut with wrench if loose.' },
        { id: 'prs-monthly-3', name: 'Intonation Spot Check', duration: '5 min', frequency: 'Once per month', why: 'Temperature and string changes affect intonation.', how: 'Use tuner: check 12th fret harmonic vs fretted note on each string. Should match exactly.' }
    ],
    quarterly: [
        { id: 'prs-quarterly-1', name: 'Complete Restring & Setup', duration: '45 min', frequency: 'Every 12 weeks', why: 'Fresh strings and full maintenance cycle.', how: 'Remove all strings. Clean fretboard with F-ONE. Polish frets with FRINE. Lubricate nut. Install fresh strings. Stretch and tune.' },
        { id: 'prs-quarterly-2', name: 'Pot and Switch Cleaning', duration: '15 min', frequency: 'Every 12 weeks', why: 'DeoxIT removes oxidation preventing crackling.', how: 'Remove control cavity cover. Spray DeoxIT D5 into pot shafts and switch. Work controls through full range.' },
        { id: 'prs-quarterly-3', name: 'Tremolo Maintenance', duration: '20 min', frequency: 'Every 12 weeks', why: 'Smooth tremolo action prevents tuning issues.', how: 'Remove back cover. Check spring tension (should be balanced). Lubricate knife edges with graphite. Check spring claw screws.' },
        { id: 'prs-quarterly-4', name: 'Neck Relief Check', duration: '10 min', frequency: 'Every 12 weeks', why: 'Seasonal changes affect neck relief.', how: 'Capo 1st fret, fret last fret. Check gap at 8th fret (should be ~0.010"). Note if adjustment needed.' }
    ],
    annual: [
        { id: 'prs-annual-1', name: 'Professional Setup', duration: 'Professional', frequency: 'Once per year', why: 'Complete inspection and setup by qualified tech.', how: 'Schedule with PRS-experienced tech. Includes: action, intonation, truss rod, fret level/crown if needed, electronics test, deep clean.' }
    ]
};

// Merge both guitars' tasks for backward compatibility
export const ALL_GUITAR_TASKS = {
    'gs-mini': MAINTENANCE_TASKS,
    'prs-ce24': PRS_MAINTENANCE_TASKS
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
