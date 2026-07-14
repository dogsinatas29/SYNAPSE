// ui/i18n.js
// Phase 1: Static UI Internationalization Foundation

const translations = {
    ko: {
        'menu.server_start': '서버 시작',
        'menu.server_connect': '서버 접속',
        'menu.account_manage': '계정 관리',
        'menu.reset_state': '🔄 상태 초기화',
        'panel.cluster_vis': '🗂 클러스터 가시성',
        'btn.clusters': '🗂 클러스터',
        'cluster.collapse_all': '모든 클러스터 -',
        'cluster.expand_roots': '루트만 보기',
        'cluster.expand_all': '모든 클러스터 +',
        'layer.title': '레이어 가시성',
        'layer.base': '기본 로직 (AI)',
        'layer.user': '사용자 커스텀 (User)',
        'layer.external': '외부 참조 (External)'
    },
    en: {
        'menu.server_start': 'Start Server',
        'menu.server_connect': 'Connect Server',
        'menu.account_manage': 'Manage Accounts',
        'menu.reset_state': '🔄 Reset State',
        'panel.cluster_vis': '🗂 Cluster Visibility',
        'btn.clusters': '🗂 Clusters',
        'cluster.collapse_all': 'Collapse All -',
        'cluster.expand_roots': 'Roots Only',
        'cluster.expand_all': 'Expand All +',
        'layer.title': 'Layer Visibility',
        'layer.base': 'Base Logic (AI)',
        'layer.user': 'User Custom',
        'layer.external': 'External Ref'
    }
};

let currentLanguage = 'en';

// 언어 초기화
function initI18n() {
    // 우선순위 1: VS Code extension environment (if provided)
    // 우선순위 2: 브라우저/OS 언어
    const envLang = window.VSCODE_LANGUAGE || navigator.language || 'en';
    const lang = envLang.toLowerCase();

    if (lang.startsWith('ko')) {
        currentLanguage = 'ko';
    } else {
        currentLanguage = 'en';
    }
}

// 번역 함수
function t(key) {
    const dict = translations[currentLanguage] || translations['en'];
    return dict[key] || translations['en'][key] || key;
}

// HTML 내 data-i18n 속성 치환
function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        
        if (el.children.length === 0) {
            el.textContent = t(key);
        } else {
            let replaced = false;
            for (let i = 0; i < el.childNodes.length; i++) {
                if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].nodeValue.trim().length > 0) {
                    let text = el.childNodes[i].nodeValue;
                    if (text.includes(' - ')) {
                        el.childNodes[i].nodeValue = t(key) + ' - ';
                    } else {
                        el.childNodes[i].nodeValue = t(key);
                    }
                    replaced = true;
                    break;
                }
            }
            if (!replaced) {
                el.insertBefore(document.createTextNode(t(key)), el.firstChild);
            }
        }
    });
}

// 초기화 즉시 실행
initI18n();

// 브라우저 환경에서는 DOMContentLoaded 시 자동 적용
document.addEventListener('DOMContentLoaded', applyTranslations);
