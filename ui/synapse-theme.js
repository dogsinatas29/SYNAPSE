/**
 * SYNAPSE Unified Theme & Visual Conventions
 * @version 0.3.22
 */

const SYNAPSE_THEME = {
    // Zoom Levels
    ZOOM: {
        SATELLITE_THRESHOLD: 0.4,
        DETAIL_THRESHOLD: 1.5,
        ICON_PLACEMENT: { x: 5, y: 5 }
    },

    // Core Visual Elements
    ICONS: {
        source: '📄',
        gate: '⛩️',
        service: '🤝',
        processor: '⚙️',
        data: '📋',
        doc: '📚',
        test: '🧪',
        logic: '🧩',
        folder: '📁',
        external: '☁️',
        ghost: '👻',
        terminal: '🖨️',
        loop: '↻',
        decision: '◈',
        output: '🖨️',
        signal: '📡',
        payload: '📊',
        async: '🕒',
        reference: '📝',
        db: '🛢️',
        fracture: '💥'
    },

    // Status Indicators
    STATUS: {
        ACTIVE: { icon: '✅', border: '#83a598', color: '#1d2021' },
        PROPOSED: { icon: '❓', border: '#fabd2f', color: '#1d2021' },
        LOCKED: { icon: '🔒', border: '#ebdbb2', color: '#3c3836' },
        GHOST: { icon: '👻', border: '#928374', color: '#282828' },
        DELETED: { icon: '❌', border: '#282828', color: '#1d2021' },
        WARNING: { icon: '⚠️', border: '#fb4934', color: '#1d2021' },
        NECROSIS: { icon: '💀', border: '#fb4934', color: '#1d2021' },
        TOMBSTONE: { icon: '🪦', border: '#1d2021', color: '#1d2021' },
        ERROR: { icon: '❌', border: '#fb4934', color: '#fb4934' },
        AI: { icon: '🤖', border: '#83a598', color: '#1d2021' },
        MINE: { icon: '💣', border: '#fb4934', color: '#fb4934' },
        DIRTY: { icon: '🔴', border: '#fb4934', color: '#fb4934' },
        FRACTURE: { icon: '💥', border: '#d3869b', color: '#d3869b' },
        APPROVAL: { icon: '⚡' },
        HIGH_DTR: { border: '#8a2be2', glow: '#8a2be2' }
    },

    // Special States
    SPECIAL: {
        BOTTLENECK: { color: '#fe8019', border: '#fe8019' },
        ARCH_VIOLATION: { color: '#fabd2f', border: '#fabd2f' },
        VIRTUAL_DEBUG: { color: '#83a598', border: '#83a598' },
        HIGHLIGHTED: { color: '#fabd2f', border: '#fabd2f' }
    },

    // Detail View Styles
    DETAILS: {
        DIVIDER: '#504945',
        LOGIC: '#fabd2f',
        DATA: '#83a598',
        EXTERNAL: '#fe8019',
        PROPOSED: '#a89984'
    },

    // Flow Renderer Styles
    FLOW: {
        TERMINAL: { bg: '#b8bb26', text: '#1d2021' },
        PROCESS: { bg: '#3c3836', border: '#ebdbb2' },
        DECISION: { bg: '#1d2021', border: '#fabd2f', text: '#fabd2f' },
        GROUP: { bg: 'rgba(250, 189, 47, 0.03)', border: 'rgba(250, 189, 47, 0.4)', text: 'rgba(250, 189, 47, 0.8)' },
        CONNECTION: {
            DEFAULT: '#665c54',
            API: '#8ec07c',
            DB: '#d3869b',
            LOOP: '#fe8019',
            HIGHLIGHT: '#fabd2f'
        }
    },

    // Node Type Styles
    TYPES: {
        CONFIG: { color: '#076678', border: '#83a598', icon: '📋', lineWidth: 4 },
        DATA:   { color: '#076678', border: '#83a598', icon: '📋', lineWidth: 4 },
        EXTERNAL: { color: 'rgba(40, 40, 40, 0.7)', border: '#8ec07c', dash: [5, 5] },
        SOURCE: { color: '#3c3836', border: '#a89984' }
    },

    // Edge Styles
    EDGES: {
        DEPENDENCY: { color: '#ebdbb2', thickness: 2, icon: '🔗', dash: [0, 0] },
        REFERENCE: { color: '#928374', thickness: 1.5, icon: '🔗', dash: [4, 4] },
        DATA_FLOW: { color: '#83a598', thickness: 3, icon: '📊', dash: [0, 0] },
        EVENT: { color: '#fe8019', thickness: 2, icon: '⚡', dash: [0, 0] },
        CONDITIONAL: { color: '#d3869b', thickness: 1, icon: '❓', dash: [0, 0] },
        ORIGIN: { color: '#d65d0e', thickness: 1.5, icon: '📍' },
        API_CALL: { color: '#8ec07c', thickness: 2, icon: '🌐', dash: [4, 4] },
        DB_QUERY: { color: '#d3869b', thickness: 3, icon: '🛢️', dash: [0, 0] },
        LOOP: { color: '#fe8019', thickness: 2, icon: '🔁', dash: [2, 4] },
        HIGHLIGHTED: { color: '#fabd2f', thickness: 5, icon: '➤', dash: [0, 0] }
    },

    // Color Palette
    COLORS: {
        GRID: '#333333',
        BACKGROUND: '#1d2021',
        TEXT: '#ebdbb2',
        ROLE: {
            'Orchestrator (fan-out)': '#FF8C00',
            'Controller (fan-in)':   '#4CAF50',
            'Hub (high connectivity)': '#2196F3',
            'Leaf node':         '#9E9E9E',
            'Standard component': '#ebdbb2'
        }
    },

    // Special Visual States
    SPECIAL: {
        VIRTUAL_DEBUG: { border: '#83a598', glow: 'rgba(131, 165, 152, 0.5)' },
        BOTTLENECK: { border: '#fb4934' },
        ARCH_VIOLATION: { border: '#fabd2f', glow: 'rgba(250, 189, 47, 0.4)' },
        HIGHLIGHTED: { border: '#fabd2f', color: '#fabd2f' },
        NECROSIS_GRADIENT: {
            start: '#000000',
            mid: 'rgba(138, 43, 226, 0.4)',
            end: 'rgba(251, 73, 52, 0)'
        }
    },

    // Animation & Flow Dynamics
    ANIMATION: {
        EDGE_FLOW_SPEED: 0.5,
        DASH_OFFSET_MULTIPLIER: 2.5,
        TRANSITION_DURATION: 3000,
        JITTER_SPEED: 180,
        SCAN_SPEED: 120
    },

    // Glow & Shadow Dynamics
    GLOW: {
        PULSE_SPEED: 250, // ms for one half-cycle
        BASE_BLUR: 12,
        PULSE_RANGE: 6,
        INTENSITY: 1.0,
        DTR_MULTIPLIER: 1.5
    },

    // UI Specific Colors & Layout
    UI: {
        TOOLTIP: { bg: '#3c3836', text: '#ebdbb2', border: '#fabd2f' },
        TOAST: { bg: '#282828', text: '#ebdbb2', success: '#b8bb26' },
        PRESSURE: { safe: '#b8bb26', warning: '#fabd2f', critical: '#fb4934' },
        STATS: { header: '#ebdbb2', label: '#a89984', error: '#fb4934', warning: '#fabd2f', fracture: '#d3869b' },
        FPS: { high: '#b8bb26', mid: '#fabd2f', low: '#fb4934', webgl: '#83a598', cache: '#d3869b' },
        MENU: { bg: '#3c3836', text: '#ebdbb2', hover: '#504945', border: '#fabd2f' },
        ICON_PLACEMENT: { x: 8, y: 8 }
    },

    // Node Detail Styles (Zoom > 1.5)
    DETAILS: {
        DIVIDER: '#504945',
        LABEL: '#ebdbb2',
        VALUE: '#fabd2f'
    },

    // Color Palette (Master Tokens)
    COLORS: {
        BACKGROUND: '#3c3836',
        BG_DARK: '#282828',
        BG_MEDIUM: '#504945',
        BORDER: '#a89984',
        TEXT: '#ebdbb2',
        TEXT_MUTED: '#928374',
        HIGHLIGHT: '#fabd2f',
        SUCCESS: '#b8bb26',
        ERROR: '#fb4934',
        WARNING: '#fabd2f',
        INFO: '#83a598',
        GRID: '#333333',
        ROLE: {
            'Logic': '#83a598',
            'Data': '#fabd2f',
            'External': '#fe8019',
            'Service': '#8ec07c',
            'Leaf node': '#928374'
        }
    },

    // Validation Status Colors
    VALIDATION: {
        VALID: '#b8bb26',
        WARNING: '#fabd2f',
        ERROR: '#fb4934',
        AI: '#83a598'
    },

    // Shader Normalized Colors (0.0 - 1.0)
    SHADERS: {
        SELECTION: [0.98, 0.74, 0.18, 1.0], // #fabd2f
        DTR_GLOW: [0.54, 0.17, 0.89, 1.0]   // #8a2be2
    },

    // Semantic Mapping Helper
    getNodeIcon: (type, fileName = '') => {
        const safeType = (type || '').toLowerCase();
        const fn = fileName.toLowerCase();

        if (safeType === 'external') {
            if (fn.includes('api')) return SYNAPSE_THEME.ICONS.external;
            if (fn.includes('db') || fn.includes('sql')) return '🗄️';
            return '🌐';
        }

        if (fn.includes('atomic') || fn.includes('core') || fn.includes('entry') || (safeType === 'logic' && fn.includes('main'))) return SYNAPSE_THEME.STATUS.APPROVAL.icon; // ⚡ Atomic Logic
        if (fn.endsWith('.md') || fn.endsWith('.txt')) return SYNAPSE_THEME.ICONS.doc;
        if (fn.includes('.test.') || fn.includes('_test')) return SYNAPSE_THEME.ICONS.test;
        if (fn.includes('router') || fn.includes('controller')) return SYNAPSE_THEME.ICONS.gate;
        if (fn.includes('service') || fn.includes('provider')) return SYNAPSE_THEME.ICONS.service;
        if (fn.includes('engine') || fn.includes('processor') || fn.includes('renderer')) return SYNAPSE_THEME.ICONS.processor;
        if (fn.includes('schema') || fn.includes('model') || fn.includes('table')) return SYNAPSE_THEME.ICONS.data;
        
        return SYNAPSE_THEME.ICONS[safeType] || SYNAPSE_THEME.ICONS.source;
    },

    getFullNodeStyle: (node, stats = null) => {
        const theme = SYNAPSE_THEME;
        const type = node.type || 'source';
        const isDTR = !!node.isDeterministicFracture || (node.intelligence && node.intelligence.dtr >= 0.7);
        const fileName = node.data?.file || '';
        
        // 1. Initial Defaults
        let style = {
            bgColor: node.data?.color || theme.COLORS.BACKGROUND,
            borderColor: theme.COLORS.BORDER,
            lineWidth: 2,
            icon: theme.getNodeIcon(type, fileName),
            shape: theme.getNodeShape(type, fileName, isDTR),
            opacity: node.visual?.opacity || 0.98,
            glow: false,
            statusType: 0.0, // Normal (Used by WebGL)
            typeLabel: type
        };

        // 2. Type-specific Base
        const typeStyleKey = type.toUpperCase();
        if (theme.TYPES[typeStyleKey]) {
            const ts = theme.TYPES[typeStyleKey];
            if (ts.color) style.bgColor = node.data?.color || ts.color;
            if (ts.border) style.borderColor = ts.border;
            if (ts.lineWidth) style.lineWidth = ts.lineWidth;
            if (ts.icon) style.icon = ts.icon;
            if (type === 'external') style.statusType = 6.0;
        }

        // 3. Role-based Overlays (Primary Identity)
        if (stats && stats.primaryRole) {
            const roleColor = theme.COLORS.ROLE[stats.primaryRole];
            if (roleColor) {
                style.borderColor = roleColor;
                if (stats.primaryRole !== 'Leaf node') {
                    style.glow = true;
                    style.lineWidth = 3.5;
                }
            }
        }

        // 4. Status-based Overrides (Highest Priority)
        if (node.status === 'active') {
            style.borderColor = theme.STATUS.ACTIVE.border || theme.STATUS.ACTIVE.color;
            style.opacity = 1.0;
            style.statusType = 1.0;
        } else if (node.status === 'ghost') {
            style.borderColor = theme.STATUS.GHOST.border;
            style.opacity = 0.6;
            style.statusType = 2.0;
        } else if (node.status === 'deleted') {
            style.borderColor = theme.STATUS.DELETED.border;
            style.bgColor = theme.STATUS.DELETED.color + '66';
            style.opacity = theme.STATUS.DELETED.opacity || 0.3;
            style.statusType = 3.0;
        } else if (node.status === 'warning' || node.isError) {
            style.borderColor = theme.STATUS.WARNING.border;
            style.glow = true;
            style.statusType = 4.0;
        } else if (node.status === 'error_necrosis' || node.status === 'error_tombstone') {
            const ns = theme.STATUS.NECROSIS;
            style.borderColor = ns.border;
            style.bgColor = ns.color;
            style.statusType = 5.0;
        }

        // 5. Special Logic Overrides
        const label = (node.data?.label || '').toLowerCase();
        if (label.startsWith('print:') || label.includes('console.log')) {
            style.icon = '🖨️';
        }

        return style;
    },

    getEdgeStyle: (type) => {
        const theme = SYNAPSE_THEME;
        const mapping = {
            'dependency': theme.EDGES.DEPENDENCY,
            'include': theme.EDGES.REFERENCE, // [v0.3.22.3] Spec Alignment: Soft inclusion is a reference
            'call': { ...theme.EDGES.EVENT, icon: theme.ICONS.signal }, // 📡
            'data_flow': theme.EDGES.DATA_FLOW,
            'reference': theme.EDGES.REFERENCE, // 📝 (Dashed, Gray)
            'event': theme.EDGES.EVENT,
            'conditional': theme.EDGES.CONDITIONAL,
            'api_call': theme.EDGES.API_CALL,
            'db_query': theme.EDGES.DB_QUERY,
            'loop_back': theme.EDGES.LOOP,
            'loop': theme.EDGES.LOOP,
            'broken_fracture': { color: theme.STATUS.ERROR.color, thickness: 3, dash: [2, 2], icon: theme.ICONS.fracture }
        };
        
        const style = mapping[type] || theme.EDGES.DEPENDENCY;
        return {
            color: style.color || '#ebdbb2',
            thickness: style.thickness || 2,
            dash: style.dash || [0, 0],
            icon: style.icon || '➤'
        };
    },

    getEdgeIcon: (type) => {
        return SYNAPSE_THEME.getEdgeStyle(type).icon;
    },

    getNodeShape: (type, fileName = '', isDTR = false) => {
        const fn = fileName.toLowerCase();
        const safeType = (type || '').toLowerCase();
        const isDecision = fn.includes('valid_') || fn.includes('validator') || 
                           fn.includes('checker') || fn.includes('router') || 
                           fn.startsWith('is_') || safeType === 'gate' || safeType === 'decision';
        
        // [v0.3.22.9] Simplicity First: No more forced parallelograms for external
        if (isDecision) return 'diamond';
        if (fn.includes('loop') || fn.includes('iter')) return 'hexagon';
        if (fn.startsWith('print:') || fn.includes('console.log')) return 'parallelogram';
        
        return 'box';
    },

    getEdgeBadgeStyle: (edge) => {
        const theme = SYNAPSE_THEME;
        const confirmStatus = edge.confirmStatus || (edge.status === 'pending' || edge.status === 'pending_confirm' ? 'pending_confirm' : (edge.status === 'confirmed' ? 'confirmed' : ''));
        const isPending = confirmStatus === 'pending_confirm' || edge.status === 'pending';
        
        // [v0.3.22] Multi-Icon Convergence: No limit on displayed icons
        const style = theme.getEdgeStyle(edge.type);
        const typeIcon = style.icon;
        const statusIcon = isPending ? theme.STATUS.PROPOSED.icon : theme.STATUS.ACTIVE.icon;
        
        const validation = window.engine?.edgeValidationCache?.get(edge.id);
        const aiIcon = (validation && validation.isAi) ? theme.STATUS.AI.icon : '';
        const hazardIcon = (validation && !validation.valid) ? theme.STATUS.ERROR.icon : '';
        
        // [v0.3.22.8] Unified Informational Stack: [Type] [AI] [Status] [Hazard]
        // Directional arrow is handled by the line renderer, not the badge capsule.
        const icons = [typeIcon, aiIcon, statusIcon, hazardIcon].filter(i => i !== '').join(' ');
        
        return {
            text: icons,
            bgColor: isPending ? 'rgba(40,40,40,0.95)' : theme.COLORS.BACKGROUND + 'B3',
            borderColor: isPending ? theme.STATUS.WARNING.border : theme.STATUS.ACTIVE.color,
            textColor: theme.COLORS.TEXT,
            isPending
        };
    },

    getValidationIcon: (status) => {
        const theme = SYNAPSE_THEME;
        if (status === 'error' || status === 'invalid') return theme.STATUS.ERROR.icon;
        if (status === 'warning') return theme.STATUS.WARNING.icon;
        if (status === 'ai') return theme.STATUS.AI.icon;
        return '';
    }
};

// [v0.3.22] Global Export for Webview
window.SYNAPSE_THEME = SYNAPSE_THEME;

// [v0.3.22] Freeze theme to prevent "Liars" (Hardcode overrides)
Object.freeze(SYNAPSE_THEME);
Object.freeze(SYNAPSE_THEME.ZOOM);
Object.freeze(SYNAPSE_THEME.ICONS);
Object.freeze(SYNAPSE_THEME.STATUS);
Object.freeze(SYNAPSE_THEME.TYPES);
Object.freeze(SYNAPSE_THEME.SPECIAL);
Object.freeze(SYNAPSE_THEME.DETAILS);
Object.freeze(SYNAPSE_THEME.FLOW);
Object.freeze(SYNAPSE_THEME.EDGES);
Object.freeze(SYNAPSE_THEME.COLORS);
Object.freeze(SYNAPSE_THEME.UI);
Object.freeze(SYNAPSE_THEME.VALIDATION);
Object.freeze(SYNAPSE_THEME.SHADERS);

console.log('[SYNAPSE] Theme Engine v0.3.22 Locked & Loaded');
