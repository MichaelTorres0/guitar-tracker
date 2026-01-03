# Guitar Tracker Enhancement Specification

## Executive Summary

This document provides a comprehensive review of the Taylor GS Mini Maintenance Tracker PWA from both guitar maintenance technician and software engineering perspectives. It includes identified issues, recommended enhancements, and a detailed test-driven development (TDD) specification for implementation.

**Target User Profile:** Hobbyist guitarist returning to playing after years away, owns a quality instrument (Taylor GS Mini Sapele), wants to maintain it properly without being overwhelmed.

---

## Part 1: Guitar Maintenance Technician Review

### 1.1 Current Implementation Assessment

#### What's Working Well ✅

1. **Humidity Management** - Target 45-50% RH with 40-55% safe range is correct for solid spruce top guitars
2. **Bridge Wing Monitoring** - Critical for GS Mini; this model is known for bridge lift issues at high humidity
3. **Humidipak System** - Proper two-way humidity control recommendation
4. **String Cleaning Priority** - Emphasizing post-session cleaning is correct for string longevity
5. **Product Safety Warnings** - Correct warnings about lemon oil, silicone, and furniture polish
6. **Taylor Refresh Service** - Good to include annual professional service

#### Issues & Inconsistencies ⚠️

1. **String Change Frequency Mismatch**
   - CLAUDE.md says "8-Week" cycle
   - index.html says "6-Week" cycle
   - README.md says "8 weeks" target
   - **Recommendation:** Standardize to 8 weeks for 2.5 hrs/week playing. 6 weeks is aggressive for a hobbyist.

2. **String Gauge Inconsistency**
   - Header shows: "EJ17 Medium (.013-.056)"
   - Equipment list shows: "D'Addario EJ17 Phosphor Bronze Medium (.013-.056)"
   - Bridge modal suggests: "EJ16 Light (.012-.053)" for bridge stress
   - **Recommendation:** For GS Mini with bridge lift concerns, EJ16 Lights should be the default recommendation. Medium gauge increases top stress.

3. **Fretboard Oil Frequency**
   - Current: "Every 2nd or 3rd change" (every 12-18 weeks)
   - **Issue:** For ebony fretboard, this may be too frequent
   - **Recommendation:** 2-3 times per year maximum, only when fretboard appears dry (grayish). Over-oiling ebony causes permanent darkening and can loosen frets.

4. **Missing Temperature Tracking**
   - Humidity alone doesn't tell the full story
   - Temperature affects how wood responds to humidity
   - **Recommendation:** Add temperature logging alongside humidity (already partially supported in form but not utilized)

5. **Seasonal Adjustment Guidance Missing**
   - No guidance for winter (typically low humidity) vs summer (high humidity)
   - **Recommendation:** Add seasonal tips and automatic alerts based on date/trends

### 1.2 Missing Maintenance Items

#### High Priority Additions

| Item | Frequency | Why It Matters |
|------|-----------|----------------|
| **Strap Button Tightness Check** | Monthly | Loose strap buttons can cause guitar drops - catastrophic damage |
| **Case Interior Inspection** | Quarterly | Mold, debris, or degraded foam affects humidity control |
| **Tuning Machine Lubrication** | Annual | Prevents gear wear and maintains smooth tuning |
| **Neck Relief Measurement Log** | Quarterly | Track changes over time to catch problems early |
| **Action Height Log** | Quarterly | Track action at 12th fret; changes indicate issues |
| **Intonation Check** | At string change | Ensures guitar plays in tune up the neck |

#### Medium Priority Additions

| Item | Frequency | Why It Matters |
|------|-----------|----------------|
| **Capo Pad Inspection** | Monthly (if used) | Worn pads cause string buzz and tuning issues |
| **Pick Guard Adhesion** | Quarterly | GS Mini pickguard can lift at edges |
| **Soundhole Edge Check** | At string change | Pick strikes cause finish wear |
| **Binding Inspection** | Quarterly | Catches separation early |
| **Case Hardware Check** | Quarterly | Latches and hinges can fail |

#### Electronics (If Applicable - GS Mini-e)

| Item | Frequency | Why It Matters |
|------|-----------|----------------|
| **Battery Check** | Monthly | Low battery causes signal issues |
| **Output Jack Cleaning** | Quarterly | Prevents crackling and dropouts |
| **Preamp Function Test** | Monthly | Catches issues before gigs/recordings |

### 1.3 Recommended Technique Clarifications

#### String Cleaning Enhancement
**Current:** "Apply String Fuel to microfiber cloth, wipe each string..."
**Enhanced:** 
- Clean strings BEFORE playing (removes dust/particles that cause abrasion)
- Clean strings AFTER playing (removes corrosive finger oils)
- Wipe in one direction (bridge to nut) to avoid grinding particles into string
- Clean underside of strings where they contact frets

#### Humidity Check Enhancement
**Current:** "Check Inkbird hygrometer before closing case"
**Enhanced:**
- Allow guitar to acclimate 15-30 minutes before reading (just-played guitar has different surface humidity)
- Check both case humidity AND room humidity
- Note if AC/heat/humidifier is running
- Record the season and recent weather (optional but useful for patterns)

#### Bridge Inspection Enhancement
**Current:** Basic visual and touch inspection
**Enhanced:**
- Use business card test: slide thin card under bridge wings - ANY entry indicates lift
- Take photo at same angle quarterly for comparison
- Measure bridge height with ruler at center vs wings
- Check bridge pins for equal seating depth

#### Fret Polishing Clarification
**Current:** "Rub back-and-forth until oxidation removes"
**Enhanced:**
- Work with the fret curve, not against it
- Use light pressure - more passes is better than heavy pressure
- Check fret height consistency after polishing (uneven wear = professional level/crown needed)
- Mask ebony fretboard well - FRINE can stain if not wiped immediately

### 1.4 Smart Recommendations System

The app should analyze inputs and provide contextual guidance:

#### Humidity-Based Recommendations

| Condition | Recommendation |
|-----------|----------------|
| RH < 35% for 3+ days | "CRITICAL: Add room humidifier immediately. Consider leaving guitar in case with fresh Humidipak until resolved." |
| RH 35-40% for 3+ days | "Low humidity detected. Monitor for fret sprout. Consider adding room humidity." |
| RH 40-45% | "Slightly low but acceptable. No immediate action needed." |
| RH 45-50% | "Optimal range. Guitar is happy!" |
| RH 50-55% | "Slightly high but acceptable. Ensure Humidipak is fresh." |
| RH 55-60% for 3+ days | "HIGH: Risk of bridge lift. Run dehumidifier. Keep guitar in case." |
| RH > 60% | "CRITICAL: Bridge lift imminent. Immediate action required. Replace Humidipak, run dehumidifier, keep in case." |
| 24h change > 15% | "Rapid change detected. Wood stress possible. Monitor for buzzing or tuning instability." |

#### Seasonal Recommendations

| Season | Auto-Alert |
|--------|------------|
| Nov-Feb (Winter) | "Winter drying season. Increase humidity monitoring frequency. Consider room humidifier if using forced-air heat." |
| Jun-Aug (Summer) | "Summer humidity season. Monitor for bridge lift. AC helps control humidity." |
| Spring/Fall | "Seasonal transition. Watch for rapid humidity changes as heating/cooling patterns shift." |

#### Playing Pattern Recommendations

| Pattern | Recommendation |
|---------|----------------|
| Playing increased 2x+ | "Increased playing detected. Consider moving string change schedule earlier." |
| No playing logged 2+ weeks | "Guitar idle for extended period. Loosen string tension slightly if storing 1+ month." |
| Cleaning compliance < 50% | "String cleaning compliance low. This significantly reduces string life and increases fret wear." |

### 1.5 Multi-Guitar Considerations

If adding multi-guitar support, each guitar profile should track:

1. **Guitar Specifications**
   - Make/Model/Year
   - Body type (solid top vs laminate)
   - Fretboard material (ebony, rosewood, richlite)
   - Scale length (affects string tension)
   - String gauge preference
   - Electronics (yes/no + type)
   - Serial number (for service records)

2. **Individual Care Variations**
   - Laminate guitars are MUCH less humidity sensitive
   - Rosewood needs more frequent oiling than ebony
   - 12-string guitars need different string change schedules
   - Classical guitars have different maintenance needs

3. **Per-Guitar Tracking**
   - Separate humidity logs (different storage locations)
   - Separate maintenance histories
   - Separate string change counters
   - Individual notes/issues

---

## Part 2: Technical/IT Review

### 2.1 Current Architecture Assessment

#### Strengths ✅

1. **Single-file PWA** - Simple deployment, easy to maintain
2. **Offline-capable** - localStorage persists without network
3. **Mobile-first** - Good responsive design
4. **Theme support** - Dark/light modes implemented
5. **Export capabilities** - CSV and JSON backup options

#### Technical Issues ⚠️

1. **No Service Worker**
   - App claims PWA but has no service worker
   - True offline capability not implemented
   - Install experience incomplete

2. **Global Scope Pollution**
   - All functions are global
   - Makes testing extremely difficult
   - Risk of naming collisions

3. **No Input Validation**
   - Humidity accepts any number 0-100 (what about 150% typo?)
   - No validation on temperature
   - No sanitization of inputs

4. **No Data Migration Strategy**
   - localStorage schema changes will break existing users
   - No version tracking in stored data
   - No migration path

5. **Mixed Date Handling**
   - Some ISO strings, some locale strings
   - Inconsistent timezone handling
   - Potential for date comparison bugs

6. **No Error Handling**
   - localStorage can throw (private browsing, quota)
   - No user feedback on failures
   - Silent failures possible

7. **Performance Concerns**
   - Full re-render on any change
   - No debouncing on frequent operations
   - Chart redraws entire canvas unnecessarily

8. **Accessibility Issues**
   - No ARIA labels
   - Color-only status indicators
   - No keyboard navigation support

### 2.2 Recommended Architecture Improvements

#### 2.2.1 Code Organization

Even within single HTML file, use module pattern:

```javascript
const GuitarTracker = (function() {
    // Private state
    const state = {
        guitars: [],
        activeGuitarId: null,
        maintenanceTasks: {},
        humidityReadings: [],
        settings: {}
    };
    
    // Private functions
    function validateHumidity(value) { ... }
    function calculateNextDue(task, frequency) { ... }
    
    // Public API
    return {
        init: function() { ... },
        addHumidityReading: function(data) { ... },
        toggleTask: function(taskId) { ... },
        // ... etc
    };
})();
```

#### 2.2.2 Data Schema with Versioning

```javascript
const DATA_VERSION = 2;

const dataSchema = {
    version: DATA_VERSION,
    guitars: [{
        id: 'uuid',
        name: 'Taylor GS Mini Sapele',
        make: 'Taylor',
        model: 'GS Mini',
        variant: 'Sapele',
        year: 2024,
        serialNumber: '',
        bodyType: 'solid-top', // solid-top | all-solid | laminate
        fretboardMaterial: 'ebony', // ebony | rosewood | richlite | maple
        scaleLength: 23.5,
        stringGauge: 'light', // light | medium | heavy
        hasElectronics: false,
        notes: '',
        createdAt: 'ISO date',
        settings: {
            targetHumidity: { min: 45, max: 50 },
            safeHumidity: { min: 40, max: 55 },
            stringChangeWeeks: 8,
            playingHoursPerWeek: 2.5
        }
    }],
    maintenanceRecords: [{
        id: 'uuid',
        guitarId: 'uuid',
        taskId: 'daily-1',
        completedAt: 'ISO date',
        notes: ''
    }],
    humidityReadings: [{
        id: 'uuid',
        guitarId: 'uuid',
        humidity: 48.5,
        temperature: 72,
        location: 'case', // case | room | out
        timestamp: 'ISO date',
        source: 'manual' // manual | govee | inkbird
    }],
    inspections: [{
        id: 'uuid',
        guitarId: 'uuid',
        type: 'bridge', // bridge | action | fret
        items: { bridgeCheck1: true, bridgeCheck2: true },
        completedAt: 'ISO date',
        result: 'pass', // pass | concern | fail
        notes: ''
    }],
    actionMeasurements: [{
        id: 'uuid',
        guitarId: 'uuid',
        highE12th: 1.8, // mm
        lowE12th: 2.2, // mm
        neckRelief: 0.2, // mm at 7th fret
        timestamp: 'ISO date',
        notes: ''
    }]
};
```

#### 2.2.3 Service Worker Addition

Create `sw.js` for true offline capability:
- Cache HTML, CSS, JS
- Handle offline data sync
- Enable install prompt

#### 2.2.4 Input Validation Module

```javascript
const Validators = {
    humidity: (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return { valid: false, error: 'Must be a number' };
        if (num < 0 || num > 100) return { valid: false, error: 'Must be 0-100%' };
        if (num > 85) return { valid: false, warning: 'Unusually high - verify reading' };
        return { valid: true, value: num };
    },
    temperature: (value) => {
        if (value === '' || value === null) return { valid: true, value: null }; // Optional
        const num = parseFloat(value);
        if (isNaN(num)) return { valid: false, error: 'Must be a number' };
        if (num < 32 || num > 120) return { valid: false, error: 'Temperature out of reasonable range' };
        return { valid: true, value: num };
    },
    // ... more validators
};
```

### 2.3 Feature Additions Specification

#### 2.3.1 Multi-Guitar Support

**Data Structure:** See schema above

**UI Changes:**
- Guitar selector dropdown in header
- "Add Guitar" button
- Guitar profile editing screen
- Per-guitar dashboard view
- Aggregate view option ("All Guitars")

**Behavior:**
- Default to single guitar (backward compatible)
- Prompt for guitar selection when adding readings/completing tasks
- Allow bulk operations across all guitars

#### 2.3.2 Smart Recommendations Engine

```javascript
const RecommendationEngine = {
    analyze: function(guitarId) {
        const recommendations = [];
        
        // Humidity analysis
        const humidityRecs = this.analyzeHumidity(guitarId);
        recommendations.push(...humidityRecs);
        
        // Maintenance compliance
        const maintenanceRecs = this.analyzeMaintenanceCompliance(guitarId);
        recommendations.push(...maintenanceRecs);
        
        // Seasonal
        const seasonalRecs = this.getSeasonalTips();
        recommendations.push(...seasonalRecs);
        
        // Sort by priority
        return recommendations.sort((a, b) => b.priority - a.priority);
    },
    
    analyzeHumidity: function(guitarId) {
        // Get last 72 hours of readings
        // Calculate average, trend, volatility
        // Return appropriate recommendations
    }
};
```

#### 2.3.3 Action/Relief Tracking

New inspection type with historical tracking:
- Measure at 12th fret (high E and low E)
- Measure neck relief (string fretted at 1st and last fret, gap at 7th)
- Graph changes over time
- Alert on significant changes (>0.5mm action change, >0.3mm relief change)

#### 2.3.4 Photo Documentation

Optional feature for:
- Bridge condition photos (same angle for comparison)
- Fret wear photos
- Issue documentation for luthier visits

Implementation: Store as base64 in IndexedDB (not localStorage due to size)

### 2.4 Performance Optimizations

1. **Debounced Updates**
   ```javascript
   const debounce = (fn, delay) => {
       let timeout;
       return (...args) => {
           clearTimeout(timeout);
           timeout = setTimeout(() => fn(...args), delay);
       };
   };
   
   const debouncedSave = debounce(saveData, 500);
   ```

2. **Selective Re-rendering**
   - Only update changed sections
   - Use data attributes to identify update targets
   - Batch DOM updates

3. **Lazy Chart Loading**
   - Only render chart when Humidity tab is visible
   - Use IntersectionObserver for visibility

---

## Part 3: Test-Driven Development Specification

### 3.1 Test Framework Setup

Use vanilla JavaScript testing (no external dependencies for single-file app):

```javascript
// test-runner.js - Simple test framework
const TestRunner = {
    tests: [],
    results: { passed: 0, failed: 0 },
    
    describe: function(name, fn) {
        console.group(name);
        fn();
        console.groupEnd();
    },
    
    it: function(description, fn) {
        try {
            fn();
            console.log(`✅ ${description}`);
            this.results.passed++;
        } catch (e) {
            console.error(`❌ ${description}`);
            console.error(`   ${e.message}`);
            this.results.failed++;
        }
    },
    
    expect: function(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected} but got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) throw new Error(`Expected truthy but got ${actual}`);
            },
            toBeFalsy: () => {
                if (actual) throw new Error(`Expected falsy but got ${actual}`);
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) throw new Error(`Expected ${actual} < ${expected}`);
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            },
            toThrow: () => {
                let threw = false;
                try { actual(); } catch (e) { threw = true; }
                if (!threw) throw new Error('Expected function to throw');
            }
        };
    },
    
    run: function() {
        console.log('🧪 Running tests...\n');
        this.tests.forEach(test => test());
        console.log(`\n📊 Results: ${this.results.passed} passed, ${this.results.failed} failed`);
    }
};
```

### 3.2 Test Categories & Cases

#### Category 1: Data Validation Tests

```javascript
TestRunner.describe('Humidity Validation', () => {
    TestRunner.it('should accept valid humidity in range 0-100', () => {
        TestRunner.expect(Validators.humidity(48.5).valid).toBe(true);
        TestRunner.expect(Validators.humidity(0).valid).toBe(true);
        TestRunner.expect(Validators.humidity(100).valid).toBe(true);
    });
    
    TestRunner.it('should reject humidity below 0', () => {
        TestRunner.expect(Validators.humidity(-5).valid).toBe(false);
    });
    
    TestRunner.it('should reject humidity above 100', () => {
        TestRunner.expect(Validators.humidity(105).valid).toBe(false);
    });
    
    TestRunner.it('should reject non-numeric humidity', () => {
        TestRunner.expect(Validators.humidity('abc').valid).toBe(false);
        TestRunner.expect(Validators.humidity('').valid).toBe(false);
        TestRunner.expect(Validators.humidity(null).valid).toBe(false);
    });
    
    TestRunner.it('should warn on unusually high humidity (>85%)', () => {
        const result = Validators.humidity(90);
        TestRunner.expect(result.valid).toBe(true);
        TestRunner.expect(result.warning).toBeTruthy();
    });
});

TestRunner.describe('Temperature Validation', () => {
    TestRunner.it('should accept valid temperature', () => {
        TestRunner.expect(Validators.temperature(72).valid).toBe(true);
    });
    
    TestRunner.it('should accept empty temperature (optional field)', () => {
        TestRunner.expect(Validators.temperature('').valid).toBe(true);
        TestRunner.expect(Validators.temperature(null).valid).toBe(true);
    });
    
    TestRunner.it('should reject extreme temperatures', () => {
        TestRunner.expect(Validators.temperature(150).valid).toBe(false);
        TestRunner.expect(Validators.temperature(-20).valid).toBe(false);
    });
});
```

#### Category 2: Humidity Status Tests

```javascript
TestRunner.describe('Humidity Status Determination', () => {
    TestRunner.it('should return OPTIMAL for 45-50%', () => {
        TestRunner.expect(HumidityAnalyzer.getStatus(47).level).toBe('optimal');
        TestRunner.expect(HumidityAnalyzer.getStatus(45).level).toBe('optimal');
        TestRunner.expect(HumidityAnalyzer.getStatus(50).level).toBe('optimal');
    });
    
    TestRunner.it('should return SAFE for 40-45% and 50-55%', () => {
        TestRunner.expect(HumidityAnalyzer.getStatus(42).level).toBe('safe');
        TestRunner.expect(HumidityAnalyzer.getStatus(52).level).toBe('safe');
    });
    
    TestRunner.it('should return WARNING for 35-40%', () => {
        TestRunner.expect(HumidityAnalyzer.getStatus(38).level).toBe('warning-low');
    });
    
    TestRunner.it('should return WARNING for 55-60%', () => {
        TestRunner.expect(HumidityAnalyzer.getStatus(57).level).toBe('warning-high');
    });
    
    TestRunner.it('should return DANGER for <35%', () => {
        TestRunner.expect(HumidityAnalyzer.getStatus(30).level).toBe('danger-low');
    });
    
    TestRunner.it('should return DANGER for >60%', () => {
        TestRunner.expect(HumidityAnalyzer.getStatus(65).level).toBe('danger-high');
    });
});

TestRunner.describe('Humidity Change Detection', () => {
    TestRunner.it('should calculate 24h change correctly', () => {
        const readings = [
            { humidity: 50, timestamp: new Date().toISOString() },
            { humidity: 45, timestamp: new Date(Date.now() - 24*60*60*1000).toISOString() }
        ];
        TestRunner.expect(HumidityAnalyzer.get24hChange(readings)).toBe(5);
    });
    
    TestRunner.it('should flag rapid change >10%', () => {
        const readings = [
            { humidity: 55, timestamp: new Date().toISOString() },
            { humidity: 42, timestamp: new Date(Date.now() - 20*60*60*1000).toISOString() }
        ];
        TestRunner.expect(HumidityAnalyzer.hasRapidChange(readings)).toBe(true);
    });
    
    TestRunner.it('should not flag normal change', () => {
        const readings = [
            { humidity: 48, timestamp: new Date().toISOString() },
            { humidity: 46, timestamp: new Date(Date.now() - 24*60*60*1000).toISOString() }
        ];
        TestRunner.expect(HumidityAnalyzer.hasRapidChange(readings)).toBe(false);
    });
});
```

#### Category 3: Task Management Tests

```javascript
TestRunner.describe('Task Completion', () => {
    TestRunner.it('should toggle task completion state', () => {
        const task = { id: 'daily-1', completed: false };
        TaskManager.toggleTask(task);
        TestRunner.expect(task.completed).toBe(true);
        TaskManager.toggleTask(task);
        TestRunner.expect(task.completed).toBe(false);
    });
    
    TestRunner.it('should set lastCompleted timestamp when completing', () => {
        const task = { id: 'daily-1', completed: false, lastCompleted: null };
        TaskManager.toggleTask(task);
        TestRunner.expect(task.lastCompleted).toBeTruthy();
    });
    
    TestRunner.it('should preserve lastCompleted when uncompleting', () => {
        const originalDate = '2025-01-01T00:00:00Z';
        const task = { id: 'daily-1', completed: true, lastCompleted: originalDate };
        TaskManager.toggleTask(task);
        TestRunner.expect(task.lastCompleted).toBe(originalDate);
    });
});

TestRunner.describe('Just Played Quick Action', () => {
    TestRunner.it('should complete all daily tasks', () => {
        const tasks = {
            daily: [
                { id: 'daily-1', completed: false },
                { id: 'daily-2', completed: false },
                { id: 'daily-3', completed: false }
            ]
        };
        TaskManager.justPlayed(tasks);
        TestRunner.expect(tasks.daily.every(t => t.completed)).toBe(true);
    });
    
    TestRunner.it('should set same timestamp for all daily tasks', () => {
        const tasks = {
            daily: [
                { id: 'daily-1', completed: false },
                { id: 'daily-2', completed: false }
            ]
        };
        TaskManager.justPlayed(tasks);
        TestRunner.expect(tasks.daily[0].lastCompleted).toBe(tasks.daily[1].lastCompleted);
    });
});

TestRunner.describe('Next Due Calculation', () => {
    TestRunner.it('should return ASAP for never-completed task', () => {
        const task = { id: 'daily-1', lastCompleted: null };
        TestRunner.expect(TaskManager.getNextDue(task, 'daily')).toBe('ASAP');
    });
    
    TestRunner.it('should calculate daily next due correctly', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const task = { id: 'daily-1', lastCompleted: yesterday.toISOString() };
        const result = TaskManager.getNextDue(task, 'daily');
        // Should be today or overdue
        TestRunner.expect(result === '0 days' || result.includes('OVERDUE')).toBe(true);
    });
    
    TestRunner.it('should calculate weekly next due correctly', () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const task = { id: 'weekly-1', lastCompleted: threeDaysAgo.toISOString() };
        const result = TaskManager.getNextDue(task, 'weekly');
        TestRunner.expect(result).toBe('4 days');
    });
    
    TestRunner.it('should mark overdue tasks correctly', () => {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const task = { id: 'weekly-1', lastCompleted: tenDaysAgo.toISOString() };
        const result = TaskManager.getNextDue(task, 'weekly');
        TestRunner.expect(result).toContain('OVERDUE');
    });
    
    TestRunner.it('should handle 8-week cycle correctly', () => {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const task = { id: '8w-1', lastCompleted: fourWeeksAgo.toISOString() };
        const result = TaskManager.getNextDue(task, 'eightweek');
        TestRunner.expect(result).toBe('28 days');
    });
});
```

#### Category 4: String Life Calculator Tests

```javascript
TestRunner.describe('String Life Calculator', () => {
    TestRunner.it('should calculate base string life correctly', () => {
        const stringChange = new Date();
        stringChange.setDate(stringChange.getDate() - 28); // 4 weeks ago
        const settings = { stringChangeWeeks: 8 };
        const result = StringLifeCalculator.calculate(stringChange, settings);
        TestRunner.expect(result.percentRemaining).toBe(50);
    });
    
    TestRunner.it('should show 0% when past due', () => {
        const stringChange = new Date();
        stringChange.setDate(stringChange.getDate() - 70); // 10 weeks ago
        const settings = { stringChangeWeeks: 8 };
        const result = StringLifeCalculator.calculate(stringChange, settings);
        TestRunner.expect(result.percentRemaining).toBe(0);
    });
    
    TestRunner.it('should show 100% for brand new strings', () => {
        const stringChange = new Date(); // Today
        const settings = { stringChangeWeeks: 8 };
        const result = StringLifeCalculator.calculate(stringChange, settings);
        TestRunner.expect(result.percentRemaining).toBe(100);
    });
    
    TestRunner.it('should adjust for poor cleaning habits', () => {
        const stringChange = new Date();
        stringChange.setDate(stringChange.getDate() - 28);
        const settings = { stringChangeWeeks: 8 };
        const cleaningCompliance = 0.3; // Only 30% cleaning compliance
        const result = StringLifeCalculator.calculate(stringChange, settings, cleaningCompliance);
        // Should reduce effective life, showing lower remaining percentage
        TestRunner.expect(result.percentRemaining).toBeLessThan(50);
    });
    
    TestRunner.it('should return correct status class', () => {
        const settings = { stringChangeWeeks: 8 };
        
        // Fresh strings
        let recent = new Date();
        recent.setDate(recent.getDate() - 14);
        TestRunner.expect(StringLifeCalculator.calculate(recent, settings).status).toBe('safe');
        
        // Getting old
        let older = new Date();
        older.setDate(older.getDate() - 49);
        TestRunner.expect(StringLifeCalculator.calculate(older, settings).status).toBe('warning');
        
        // Past due
        let overdue = new Date();
        overdue.setDate(overdue.getDate() - 63);
        TestRunner.expect(StringLifeCalculator.calculate(overdue, settings).status).toBe('danger');
    });
});
```

#### Category 5: Period Completion Tests

```javascript
TestRunner.describe('Period Completion Calculations', () => {
    TestRunner.it('should calculate 0% for no completed tasks', () => {
        const tasks = [
            { completed: false },
            { completed: false },
            { completed: false }
        ];
        TestRunner.expect(CompletionCalculator.getPercentage(tasks)).toBe(0);
    });
    
    TestRunner.it('should calculate 100% for all completed tasks', () => {
        const tasks = [
            { completed: true },
            { completed: true },
            { completed: true }
        ];
        TestRunner.expect(CompletionCalculator.getPercentage(tasks)).toBe(100);
    });
    
    TestRunner.it('should calculate partial completion correctly', () => {
        const tasks = [
            { completed: true },
            { completed: false },
            { completed: true },
            { completed: false }
        ];
        TestRunner.expect(CompletionCalculator.getPercentage(tasks)).toBe(50);
    });
    
    TestRunner.it('should handle empty task array', () => {
        TestRunner.expect(CompletionCalculator.getPercentage([])).toBe(0);
    });
    
    TestRunner.it('should round to whole number', () => {
        const tasks = [
            { completed: true },
            { completed: true },
            { completed: false }
        ];
        TestRunner.expect(CompletionCalculator.getPercentage(tasks)).toBe(67); // 66.67 rounded
    });
});

TestRunner.describe('Overall Completion', () => {
    TestRunner.it('should calculate across all categories', () => {
        const allTasks = {
            daily: [{ completed: true }, { completed: true }],
            weekly: [{ completed: false }, { completed: false }],
            eightweek: [{ completed: true }]
        };
        // 3 of 5 = 60%
        TestRunner.expect(CompletionCalculator.getOverall(allTasks)).toBe(60);
    });
});
```

#### Category 6: Data Persistence Tests

```javascript
TestRunner.describe('localStorage Operations', () => {
    TestRunner.it('should save and load maintenance data', () => {
        const testData = {
            daily: [{ id: 'daily-1', completed: true, lastCompleted: '2025-01-01' }]
        };
        DataStore.saveMaintenanceData(testData);
        const loaded = DataStore.loadMaintenanceData();
        TestRunner.expect(loaded.daily[0].completed).toBe(true);
    });
    
    TestRunner.it('should save and load humidity readings', () => {
        const readings = [
            { id: 1, humidity: 48, timestamp: '2025-01-01T12:00:00Z' }
        ];
        DataStore.saveHumidityReadings(readings);
        const loaded = DataStore.loadHumidityReadings();
        TestRunner.expect(loaded[0].humidity).toBe(48);
    });
    
    TestRunner.it('should return empty array when no humidity data exists', () => {
        localStorage.removeItem('humidityReadings');
        const loaded = DataStore.loadHumidityReadings();
        TestRunner.expect(loaded).toEqual([]);
    });
    
    TestRunner.it('should handle corrupted data gracefully', () => {
        localStorage.setItem('guitarMaintenanceData', 'not valid json');
        const loaded = DataStore.loadMaintenanceData();
        // Should return default/empty state, not throw
        TestRunner.expect(loaded).toBeTruthy();
    });
});

TestRunner.describe('Data Migration', () => {
    TestRunner.it('should migrate v1 data to v2 schema', () => {
        const v1Data = {
            // Old format without version
            daily: [{ id: 'daily-1', completed: true }]
        };
        localStorage.setItem('guitarMaintenanceData', JSON.stringify(v1Data));
        
        const migrated = DataMigrator.migrate();
        TestRunner.expect(migrated.version).toBe(2);
        TestRunner.expect(migrated.guitars).toBeTruthy();
        TestRunner.expect(migrated.guitars.length).toBeGreaterThan(0);
    });
    
    TestRunner.it('should not modify current version data', () => {
        const v2Data = {
            version: 2,
            guitars: [{ id: 'guitar-1', name: 'Test' }]
        };
        localStorage.setItem('guitarTrackerData', JSON.stringify(v2Data));
        
        const result = DataMigrator.migrate();
        TestRunner.expect(result.version).toBe(2);
        TestRunner.expect(result.guitars[0].name).toBe('Test');
    });
});
```

#### Category 7: Export Tests

```javascript
TestRunner.describe('CSV Export', () => {
    TestRunner.it('should generate valid CSV header', () => {
        const tasks = {
            daily: [{ name: 'Test Task', duration: '5 min', completed: true, lastCompleted: '2025-01-01' }]
        };
        const csv = Exporter.toCSV(tasks, []);
        TestRunner.expect(csv).toContain('MAINTENANCE TASKS');
        TestRunner.expect(csv).toContain('Test Task');
    });
    
    TestRunner.it('should escape commas in CSV fields', () => {
        const tasks = {
            daily: [{ name: 'Task, with comma', duration: '5 min', completed: false }]
        };
        const csv = Exporter.toCSV(tasks, []);
        TestRunner.expect(csv).toContain('"Task, with comma"');
    });
    
    TestRunner.it('should include humidity readings', () => {
        const readings = [
            { humidity: 48, temp: 72, timestamp: '2025-01-01T12:00:00Z', location: 'case' }
        ];
        const csv = Exporter.toCSV({}, readings);
        TestRunner.expect(csv).toContain('HUMIDITY LOG');
        TestRunner.expect(csv).toContain('48');
    });
});

TestRunner.describe('JSON Export', () => {
    TestRunner.it('should include export timestamp', () => {
        const json = Exporter.toJSON({}, []);
        const parsed = JSON.parse(json);
        TestRunner.expect(parsed.exportDate).toBeTruthy();
    });
    
    TestRunner.it('should be valid parseable JSON', () => {
        const tasks = { daily: [{ id: 'test' }] };
        const readings = [{ humidity: 48 }];
        const json = Exporter.toJSON(tasks, readings);
        
        let parsed;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            throw new Error('Invalid JSON output');
        }
        TestRunner.expect(parsed.tasks.daily[0].id).toBe('test');
    });
});
```

#### Category 8: Recommendations Engine Tests

```javascript
TestRunner.describe('Humidity Recommendations', () => {
    TestRunner.it('should recommend humidifier for low humidity', () => {
        const readings = [
            { humidity: 35, timestamp: new Date().toISOString() },
            { humidity: 34, timestamp: new Date(Date.now() - 24*60*60*1000).toISOString() },
            { humidity: 36, timestamp: new Date(Date.now() - 48*60*60*1000).toISOString() }
        ];
        const recs = RecommendationEngine.analyzeHumidity(readings);
        TestRunner.expect(recs.some(r => r.message.toLowerCase().includes('humidifier'))).toBe(true);
    });
    
    TestRunner.it('should recommend dehumidifier for high humidity', () => {
        const readings = [
            { humidity: 62, timestamp: new Date().toISOString() },
            { humidity: 60, timestamp: new Date(Date.now() - 24*60*60*1000).toISOString() }
        ];
        const recs = RecommendationEngine.analyzeHumidity(readings);
        TestRunner.expect(recs.some(r => r.message.toLowerCase().includes('dehumidifier'))).toBe(true);
    });
    
    TestRunner.it('should return no recommendations for optimal humidity', () => {
        const readings = [
            { humidity: 47, timestamp: new Date().toISOString() },
            { humidity: 48, timestamp: new Date(Date.now() - 24*60*60*1000).toISOString() }
        ];
        const recs = RecommendationEngine.analyzeHumidity(readings);
        const urgentRecs = recs.filter(r => r.priority === 'high');
        TestRunner.expect(urgentRecs.length).toBe(0);
    });
    
    TestRunner.it('should warn about rapid humidity change', () => {
        const readings = [
            { humidity: 55, timestamp: new Date().toISOString() },
            { humidity: 40, timestamp: new Date(Date.now() - 18*60*60*1000).toISOString() }
        ];
        const recs = RecommendationEngine.analyzeHumidity(readings);
        TestRunner.expect(recs.some(r => r.type === 'rapid-change')).toBe(true);
    });
});

TestRunner.describe('Seasonal Recommendations', () => {
    TestRunner.it('should give winter tips in winter months', () => {
        // Mock date to January
        const winterDate = new Date('2025-01-15');
        const recs = RecommendationEngine.getSeasonalTips(winterDate);
        TestRunner.expect(recs.some(r => r.message.toLowerCase().includes('winter') || 
                                        r.message.toLowerCase().includes('dry'))).toBe(true);
    });
    
    TestRunner.it('should give summer tips in summer months', () => {
        const summerDate = new Date('2025-07-15');
        const recs = RecommendationEngine.getSeasonalTips(summerDate);
        TestRunner.expect(recs.some(r => r.message.toLowerCase().includes('summer') || 
                                        r.message.toLowerCase().includes('humid'))).toBe(true);
    });
});

TestRunner.describe('Maintenance Compliance Recommendations', () => {
    TestRunner.it('should warn about low string cleaning compliance', () => {
        const tasks = {
            daily: [
                { id: 'daily-1', name: 'String Cleaning', completed: false, lastCompleted: null },
                { id: 'daily-1', name: 'String Cleaning', completed: false, lastCompleted: null }
            ]
        };
        const history = []; // No completion history
        const recs = RecommendationEngine.analyzeMaintenanceCompliance(tasks, history);
        TestRunner.expect(recs.some(r => r.message.includes('cleaning'))).toBe(true);
    });
    
    TestRunner.it('should warn about overdue string change', () => {
        const lastChange = new Date();
        lastChange.setDate(lastChange.getDate() - 70); // 10 weeks ago
        const settings = { stringChangeWeeks: 8 };
        const recs = RecommendationEngine.analyzeStringLife(lastChange, settings);
        TestRunner.expect(recs.some(r => r.priority === 'high')).toBe(true);
    });
});
```

#### Category 9: Multi-Guitar Tests

```javascript
TestRunner.describe('Multi-Guitar Support', () => {
    TestRunner.it('should create new guitar profile', () => {
        const guitar = GuitarManager.create({
            name: 'Taylor GS Mini',
            bodyType: 'solid-top',
            fretboardMaterial: 'ebony'
        });
        TestRunner.expect(guitar.id).toBeTruthy();
        TestRunner.expect(guitar.name).toBe('Taylor GS Mini');
    });
    
    TestRunner.it('should assign default settings to new guitar', () => {
        const guitar = GuitarManager.create({ name: 'Test Guitar' });
        TestRunner.expect(guitar.settings.targetHumidity.min).toBe(45);
        TestRunner.expect(guitar.settings.targetHumidity.max).toBe(50);
    });
    
    TestRunner.it('should filter readings by guitar ID', () => {
        const readings = [
            { guitarId: 'guitar-1', humidity: 48 },
            { guitarId: 'guitar-2', humidity: 52 },
            { guitarId: 'guitar-1', humidity: 47 }
        ];
        const filtered = GuitarManager.getReadingsForGuitar('guitar-1', readings);
        TestRunner.expect(filtered.length).toBe(2);
        TestRunner.expect(filtered.every(r => r.guitarId === 'guitar-1')).toBe(true);
    });
    
    TestRunner.it('should filter tasks by guitar ID', () => {
        const records = [
            { guitarId: 'guitar-1', taskId: 'daily-1' },
            { guitarId: 'guitar-2', taskId: 'daily-1' },
            { guitarId: 'guitar-1', taskId: 'daily-2' }
        ];
        const filtered = GuitarManager.getMaintenanceForGuitar('guitar-1', records);
        TestRunner.expect(filtered.length).toBe(2);
    });
    
    TestRunner.it('should maintain backward compatibility with single guitar', () => {
        // Old data format (no guitarId)
        const oldReadings = [
            { humidity: 48, timestamp: '2025-01-01' }
        ];
        const migrated = DataMigrator.migrateReadings(oldReadings, 'default-guitar');
        TestRunner.expect(migrated[0].guitarId).toBe('default-guitar');
    });
});
```

#### Category 10: UI Behavior Tests

```javascript
TestRunner.describe('Tab Switching', () => {
    TestRunner.it('should show only active tab content', () => {
        UIController.switchTab('humidity');
        const humidityTab = document.getElementById('humidity');
        const dashboardTab = document.getElementById('dashboard');
        TestRunner.expect(humidityTab.classList.contains('active')).toBe(true);
        TestRunner.expect(dashboardTab.classList.contains('active')).toBe(false);
    });
    
    TestRunner.it('should update tab button active state', () => {
        UIController.switchTab('maintenance');
        const buttons = document.querySelectorAll('.tab-btn');
        const activeButton = Array.from(buttons).find(b => b.classList.contains('active'));
        TestRunner.expect(activeButton.textContent).toContain('Maintenance');
    });
});

TestRunner.describe('Theme Toggle', () => {
    TestRunner.it('should toggle between light and dark themes', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        UIController.toggleTheme();
        TestRunner.expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        UIController.toggleTheme();
        TestRunner.expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
    
    TestRunner.it('should persist theme preference', () => {
        UIController.toggleTheme();
        const saved = localStorage.getItem('theme');
        TestRunner.expect(saved).toBeTruthy();
    });
});

TestRunner.describe('Modal Behavior', () => {
    TestRunner.it('should show modal when opened', () => {
        UIController.openModal('bridgeModal');
        const modal = document.getElementById('bridgeModal');
        TestRunner.expect(modal.classList.contains('show')).toBe(true);
    });
    
    TestRunner.it('should hide modal when closed', () => {
        UIController.openModal('bridgeModal');
        UIController.closeModal('bridgeModal');
        const modal = document.getElementById('bridgeModal');
        TestRunner.expect(modal.classList.contains('show')).toBe(false);
    });
});

TestRunner.describe('Form Feedback', () => {
    TestRunner.it('should show confirmation after humidity log', () => {
        // Simulate form submission
        document.getElementById('humidityValue').value = '48';
        UIController.submitHumidityForm();
        const confirmation = document.getElementById('logConfirmation');
        TestRunner.expect(confirmation.style.display).toBe('block');
    });
    
    TestRunner.it('should show error for invalid humidity', () => {
        document.getElementById('humidityValue').value = '150';
        const result = UIController.submitHumidityForm();
        TestRunner.expect(result.success).toBe(false);
        TestRunner.expect(result.error).toBeTruthy();
    });
});
```

### 3.3 Test File Structure

```
guitar-tracker/
├── index.html              # Main application
├── tests/
│   ├── test-runner.js      # Simple test framework
│   ├── test-data.js        # Mock data for tests
│   ├── validators.test.js  # Validation tests
│   ├── humidity.test.js    # Humidity logic tests
│   ├── tasks.test.js       # Task management tests
│   ├── string-life.test.js # String calculator tests
│   ├── completion.test.js  # Completion calculation tests
│   ├── persistence.test.js # Data storage tests
│   ├── export.test.js      # Export function tests
│   ├── recommendations.test.js # Smart recommendations tests
│   ├── multi-guitar.test.js # Multi-guitar support tests
│   └── ui.test.js          # UI behavior tests
└── test.html               # Test runner page
```

---

## Part 4: Implementation Roadmap

### Phase 1: Foundation (Critical)
1. Fix string change frequency inconsistency (standardize to 8 weeks)
2. Fix string gauge recommendation (EJ16 Light as default)
3. Add data versioning to localStorage schema
4. Implement input validation module
5. Refactor to module pattern (testable code)
6. Create test framework and initial test suite

### Phase 2: Core Improvements
1. Add service worker for true PWA offline support
2. Implement smart recommendations engine
3. Add temperature tracking utilization
4. Add seasonal awareness and tips
5. Improve accessibility (ARIA, keyboard nav)
6. Add action/relief measurement tracking

### Phase 3: Multi-Guitar Support
1. Implement guitar profile data structure
2. Add guitar selector UI
3. Migrate existing data to new schema
4. Update all functions to be guitar-aware
5. Add guitar management screens

### Phase 4: Enhanced Features
1. Add photo documentation capability
2. Add data visualization improvements
3. Add Govee/smart hygrometer API integration (optional)
4. Add backup/restore to cloud (optional)
5. Add iOS Shortcuts integration (optional)

---

## Part 5: Claude Code Implementation Prompt

The following prompt can be given to Claude Code to implement these changes:

---

### PROMPT FOR CLAUDE CODE:

```
I need to enhance my Guitar Tracker PWA based on a comprehensive specification document. 
Please read SPECIFICATION.md in this directory first.

The work should follow TDD methodology:
1. Write tests first
2. Implement code to pass tests
3. Refactor as needed

PHASE 1 PRIORITIES (implement in order):

1. **Fix Inconsistencies**
   - Change all "6-week" references to "8-week" for string change cycle
   - Update string gauge default to EJ16 Light (.012-.053)
   - Update the MAINTENANCE_TASKS.sixweek key to MAINTENANCE_TASKS.eightweek

2. **Add Data Versioning**
   - Add DATA_VERSION constant
   - Wrap all localStorage data in versioned schema
   - Implement migration function for version changes

3. **Refactor to Module Pattern**
   - Create GuitarTracker IIFE with private state
   - Create separate modules: Validators, HumidityAnalyzer, TaskManager, 
     StringLifeCalculator, CompletionCalculator, DataStore, Exporter, 
     RecommendationEngine, UIController
   - Expose only necessary public methods

4. **Implement Validation**
   - Add Validators module with humidity, temperature validation
   - Add form validation before submission
   - Add user-friendly error messages

5. **Create Test Infrastructure**
   - Create tests/ directory structure
   - Implement test-runner.js
   - Create test.html to run all tests
   - Implement all tests from SPECIFICATION.md Categories 1-6

Keep all code in single index.html file as per project constraints.
Ensure mobile-first design is maintained.
Test at 390px width.
Verify offline functionality still works.

After Phase 1, we'll proceed to Phase 2.
```

---

## Appendices

### Appendix A: Humidity Reference Chart

| RH % | Status | Risk | Action |
|------|--------|------|--------|
| < 30% | CRITICAL LOW | Severe cracking, fret sprout | Emergency humidification |
| 30-35% | DANGER LOW | Cracking risk | Add room humidifier immediately |
| 35-40% | WARNING LOW | Fret sprout possible | Increase humidity |
| 40-45% | SAFE LOW | Acceptable | Monitor |
| 45-50% | OPTIMAL | Perfect | Maintain |
| 50-55% | SAFE HIGH | Acceptable | Monitor |
| 55-60% | WARNING HIGH | Bridge lift risk | Reduce humidity |
| > 60% | DANGER HIGH | Bridge lift imminent | Emergency dehumidification |

### Appendix B: String Life Factors

| Factor | Effect on String Life |
|--------|----------------------|
| Base lifespan | 8 weeks (for EJ16 Light at 2.5 hrs/week) |
| >50% cleaning compliance | +2 weeks |
| <50% cleaning compliance | -2 weeks |
| Playing >5 hrs/week | -2 weeks |
| Playing <1 hr/week | +2 weeks |
| High humidity (>55%) | -1 week |
| Acidic sweat (if known) | -2 weeks |

### Appendix C: GS Mini Specific Notes

- 23.5" scale length (shorter than standard)
- Requires specific setup parameters
- Solid Sitka spruce top (humidity sensitive)
- Sapele back/sides (less sensitive than solid wood)
- Ebony fretboard (needs less oil than rosewood)
- Known issue: Bridge lift at high humidity
- Recommended string gauge: Light (EJ16) to reduce top stress
