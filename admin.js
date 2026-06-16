/* ============================================================
 *  admin.js - Painel administrativo (com senha)
 * ============================================================ */

// ⚠️ DEFINA SUA SENHA AQUI (pode mudar quando quiser)
const ADMIN_PASSWORD = '10903040k12';

// Verifica se já está autenticado na sessão
if (sessionStorage.getItem('adminAuth') !== 'true') {
    // Mostra a tela de login
    document.getElementById('loginBlock').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';

    document.getElementById('loginBtn').addEventListener('click', () => {
        const senha = document.getElementById('passwordInput').value;
        if (senha === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminAuth', 'true');
            document.getElementById('loginBlock').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            // Inicializa a interface normalmente
            iniciarAdmin();
        } else {
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('passwordInput').value = '';
        }
    });
} else {
    // Já está autenticado, esconde o login e mostra o conteúdo
    document.getElementById('loginBlock').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    iniciarAdmin();
}

// Função que contém toda a lógica original do admin.js
function iniciarAdmin() {

    /* ============================================================
     *  admin.js - Painel administrativo (versão JSONbin)
     * ============================================================ */

    const promoModal = document.getElementById('promoModal');
    const promoForm = document.getElementById('promoForm');
    const promoIdInput = document.getElementById('promoId');
    const promoNameInput = document.getElementById('promoName');
    const promoDescriptionInput = document.getElementById('promoDescription');
    const promoPriceInput = document.getElementById('promoPrice');
    const promoImageUrlInput = document.getElementById('promoImageUrl');
    const promoAffiliateLinkInput = document.getElementById('promoAffiliateLink');
    const promoCategoryInput = document.getElementById('promoCategory');
    const modalTitle = document.getElementById('promoModalTitle');
    const savePromoBtn = document.getElementById('savePromoBtn');

    function openPromoModal(id = null) {
        promoForm.reset();
        promoIdInput.value = '';
        if (id) {
            modalTitle.textContent = '✏️ Editar Promoção';
            // Como getPromotions agora é async, precisamos tratar
            getPromotions().then(promotions => {
                const promo = promotions.find(p => p.id === id);
                if (promo) {
                    promoIdInput.value = promo.id;
                    promoNameInput.value = promo.name;
                    promoDescriptionInput.value = promo.description;
                    promoPriceInput.value = promo.price;
                    promoImageUrlInput.value = promo.imageUrl || '';
                    promoAffiliateLinkInput.value = promo.affiliateLink;
                    promoCategoryInput.value = promo.category;
                }
            });
            savePromoBtn.textContent = '💾 Atualizar';
        } else {
            modalTitle.textContent = '➕ Nova Promoção';
            savePromoBtn.textContent = '💾 Salvar';
        }
        promoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closePromoModal() {
        promoModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    async function saveFromForm() {
        const id = promoIdInput.value;
        const data = {
            name: promoNameInput.value.trim(),
            description: promoDescriptionInput.value.trim(),
            price: promoPriceInput.value.trim(),
            imageUrl: promoImageUrlInput.value.trim(),
            affiliateLink: promoAffiliateLinkInput.value.trim(),
            category: promoCategoryInput.value
        };

        if (!data.name || !data.description || !data.price || !data.affiliateLink || !data.category) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        const promotions = await getPromotions();

        if (id) {
            const idx = promotions.findIndex(p => p.id === id);
            if (idx !== -1) {
                promotions[idx] = { ...promotions[idx], ...data };
            }
        } else {
            const newPromo = {
                id: generateId(),
                ...data,
                date: new Date().toISOString()
            };
            promotions.unshift(newPromo);
        }

        const salvou = await savePromotions(promotions);
        if (salvou) {
            closePromoModal();
            await renderFeed();
        }
    }

    // Eventos do modal
    document.getElementById('addNewPromoBtn').addEventListener('click', () => openPromoModal());
    document.getElementById('closePromoModal').addEventListener('click', closePromoModal);
    document.getElementById('cancelPromoBtn').addEventListener('click', closePromoModal);
    promoModal.addEventListener('click', (e) => { if (e.target === promoModal) closePromoModal(); });
    promoForm.addEventListener('submit', (e) => { e.preventDefault(); saveFromForm(); });

    // Estender renderFeed para incluir botões de admin (agora async)
    const originalRender = renderFeed;
    renderFeed = async function () {
        await originalRender();
        document.querySelectorAll('.promo-card').forEach(card => {
            const id = card.dataset.id;
            const footer = card.querySelector('.card-footer');
            if (footer && !footer.querySelector('.card-admin-actions')) {
                const div = document.createElement('div');
                div.className = 'card-admin-actions';
                div.innerHTML = `<button class="btn-edit-card" data-id="${id}">✏️</button>
                             <button class="btn-delete-card" data-id="${id}">🗑️</button>`;
                footer.appendChild(div);
            }
        });
    };

    // Delegação de cliques nos botões admin
    document.getElementById('promoFeed').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-card');
        if (editBtn) {
            openPromoModal(editBtn.dataset.id);
            return;
        }
        const delBtn = e.target.closest('.btn-delete-card');
        if (delBtn) {
            if (confirm('Excluir esta promoção?')) {
                const id = delBtn.dataset.id;
                let promotions = await getPromotions();
                promotions = promotions.filter(p => p.id !== id);
                await savePromotions(promotions);
                await renderFeed();
            }
        }
    });

    // Inicialização
    document.addEventListener('DOMContentLoaded', async () => {
        await renderFeed();
    });

    // No final, chame a renderização inicial:
    document.addEventListener('DOMContentLoaded', async () => {
        await renderFeed();
    });
}
