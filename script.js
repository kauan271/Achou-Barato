/* ============================================================
 *  script.js - Achou Barato (versão JSONbin)
 *  Agora os dados ficam online e são compartilhados.
 * ============================================================ */

// ⚙️ CONFIGURAÇÃO – COLOQUE AQUI SEU BIN ID E A CHAVE (SE FOR USAR ESCRITA)
const BIN_ID = '6a30b81bda38895dfec73dce';          // ex.: '67a1b5c0e41b4d34e4a1b5c0'
const API_KEY = '$2a$10$8/VdYNm1WjYWSywAZzLc/.Z3VcXLCcR5emk5Wn1hcbdENH.LS76iO';        // ex.: '$2b$10$...' (só para admin)

// URL base da API
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ============================================================
// FUNÇÕES DE ACESSO AO JSONBIN (SUBSTITUEM LOCALSTORAGE)
// ============================================================

/** Busca as promoções do JSONbin (leitura pública, sem chave) */
async function getPromotions() {
    try {
        const response = await fetch(`${BIN_URL}/latest`, {
        });
        if (!response.ok) throw new Error('Falha ao buscar dados');
        const data = await response.json();
        return data.record.promotions || [];
    } catch (error) {
        console.warn('Erro ao carregar promoções, usando array vazio:', error);
        return [];
    }
}

/** Salva as promoções no JSONbin (precisa da chave mestra) */
async function savePromotions(promotions) {
    try {
        const response = await fetch(BIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY       // necessário para escrita
            },
            body: JSON.stringify({ promotions })
        });
        if (!response.ok) throw new Error('Erro ao salvar');
        return true;
    } catch (error) {
        console.error('Erro ao salvar promoções:', error);
        alert('Erro ao salvar no servidor. Verifique sua conexão e a chave de API.');
        return false;
    }
}

// ============================================================
// AS DEMAIS FUNÇÕES PERMANECEM IGUAIS, MAS ALGUMAS SE TORNAM ASSÍNCRONAS
// ============================================================

const CONFIG = {
    WHATSAPP_NUMBER: '55999999999',   // Coloque seu número com código do país, sem espaços ou símbolos (ex.: '5511999999999')
    WHATSAPP_MESSAGE: 'Olá! Quero saber mais sobre as promoções do Achou Barato!',
    STORAGE_KEYS: {
        LIKES: 'achou_barato_likes',
        VIEWS: 'achou_barato_views',
        LIKED_BY_USER: 'achou_barato_liked_by_user',
        THEME: 'achou_barato_theme',
        VIEWED_SESSION: 'achou_barato_viewed_session'
    },
    // Não precisamos mais de SAMPLE_PROMOTIONS porque o bin pode começar vazio
};

// Utilitários
function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getPlaceholderImage() {
    return `data:image/svg+xml,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" fill="#e0e0e0"><rect width="400" height="250"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="#aaa">📷</text></svg>'
    )}`;
}

// Likes, views e tema continuam usando localStorage (são preferências locais)
function getLikes() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.LIKES) || '{}');
}
function saveLikes(likes) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LIKES, JSON.stringify(likes));
}
function getViews() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.VIEWS) || '{}');
}
function saveViews(views) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.VIEWS, JSON.stringify(views));
}
function getLikedByUser() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.LIKED_BY_USER) || '[]');
}
function saveLikedByUser(ids) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LIKED_BY_USER, JSON.stringify(ids));
}
function getViewedSession() {
    return JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.VIEWED_SESSION) || '[]');
}
function saveViewedSession(ids) {
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.VIEWED_SESSION, JSON.stringify(ids));
}
function getSavedTheme() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
}
function saveTheme(theme) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
}
function applyTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    saveTheme(theme);
}
function toggleTheme() {
    applyTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
}

function toggleLike(promoId) {
    const liked = getLikedByUser();
    const likes = getLikes();
    if (liked.includes(promoId)) {
        saveLikedByUser(liked.filter(id => id !== promoId));
        likes[promoId] = Math.max(0, (likes[promoId] || 1) - 1);
        saveLikes(likes);
        return { liked: false, count: likes[promoId] };
    } else {
        liked.push(promoId);
        saveLikedByUser(liked);
        likes[promoId] = (likes[promoId] || 0) + 1;
        saveLikes(likes);
        return { liked: true, count: likes[promoId] };
    }
}

function registerView(promoId) {
    const viewed = getViewedSession();
    if (!viewed.includes(promoId)) {
        viewed.push(promoId);
        saveViewedSession(viewed);
        const views = getViews();
        views[promoId] = (views[promoId] || 0) + 1;
        saveViews(views);
        return views[promoId];
    }
    return getViews()[promoId] || 0;
}

function filterPromotions(promotions, searchTerm, category) {
    return promotions.filter(p => {
        if (category && category !== 'todas' && p.category !== category) return false;
        if (searchTerm.trim()) {
            const t = searchTerm.toLowerCase().trim();
            if (!p.name.toLowerCase().includes(t) && !p.description.toLowerCase().includes(t)) return false;
        }
        return true;
    });
}

// ============================================================
// RENDERIZAÇÃO DO FEED (AGORA ASSÍNCRONA)
// ============================================================
async function renderFeed() {
    const feed = document.getElementById('promoFeed');
    const empty = document.getElementById('emptyState');
    const stats = document.getElementById('totalPromos');
    const clearBtn = document.getElementById('clearFiltersBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    // Buscar promoções do servidor
    const all = await getPromotions();
    const searchTerm = searchInput ? searchInput.value : '';
    const category = categoryFilter ? categoryFilter.value : 'todas';
    const likes = getLikes();
    const views = getViews();
    const likedByUser = getLikedByUser();

    let filtered = filterPromotions(all, searchTerm, category);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (stats) stats.textContent = `${filtered.length} promoção(ões)`;
    if (clearBtn) {
        clearBtn.style.display = (searchTerm.trim() || (category && category !== 'todas')) ? 'inline-flex' : 'none';
    }

    if (filtered.length === 0) {
        if (feed) feed.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (!feed) return;

    feed.innerHTML = '';
    filtered.forEach((promo, i) => {
        const viewCount = registerView(promo.id);
        const likeCount = likes[promo.id] || 0;
        const isLiked = likedByUser.includes(promo.id);
        const imgSrc = promo.imageUrl && promo.imageUrl.trim() ? promo.imageUrl : getPlaceholderImage();
        const imgHTML = promo.imageUrl && promo.imageUrl.trim()
            ? `<img src="${sanitize(promo.imageUrl)}" alt="${sanitize(promo.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-image-placeholder\\'>📷</div>'">`
            : `<div class="card-image-placeholder">📷</div>`;

        const card = document.createElement('article');
        card.className = 'promo-card';
        card.style.animationDelay = `${i * 0.05}s`;
        card.setAttribute('data-id', promo.id);
        card.innerHTML = `
            <div class="card-image-container">
                ${imgHTML}
                <span class="card-category-badge">${sanitize(promo.category)}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${sanitize(promo.name)}</h3>
                <p class="card-description">${sanitize(promo.description)}</p>
                <p class="card-price">${sanitize(promo.price)}</p>
                <span class="card-date">📅 ${formatDate(promo.date)}</span>
            </div>
            <div class="card-footer">
                <a href="${sanitize(promo.affiliateLink)}" class="btn-buy" target="_blank" rel="noopener noreferrer">🛒 Comprar Agora</a>
                <div class="card-actions">
                    <button class="btn-like ${isLiked ? 'liked' : ''}" data-id="${promo.id}">${isLiked ? '❤️' : '🤍'}</button>
                    <span class="like-count">${likeCount}</span>
                    <span class="view-count">👁️ ${viewCount}</span>
                </div>
            </div>
        `;
        feed.appendChild(card);
    });
}

// ============================================================
// EVENTOS COMUNS
// ============================================================
function initCommonEvents() {
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('searchInput')?.addEventListener('input', renderFeed);
    document.getElementById('categoryFilter')?.addEventListener('change', renderFeed);
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        const si = document.getElementById('searchInput');
        const cf = document.getElementById('categoryFilter');
        if (si) si.value = '';
        if (cf) cf.value = 'todas';
        renderFeed();
    });

    document.getElementById('promoFeed')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-like');
        if (btn) {
            const id = btn.dataset.id;
            const result = toggleLike(id);
            const countSpan = btn.nextElementSibling;
            if (countSpan?.classList.contains('like-count')) countSpan.textContent = result.count;
            btn.classList.toggle('liked', result.liked);
            btn.innerHTML = result.liked ? '❤️' : '🤍';
        }
    });

    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    const wa = document.querySelector('.whatsapp-float');
    if (wa) wa.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`;
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(getSavedTheme());
    initCommonEvents();
    await renderFeed();   // agora espera os dados online
});