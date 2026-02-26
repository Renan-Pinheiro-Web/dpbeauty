// ============================================================
//  script.js — DP Beauty Gestão
//  MIGRADO: Supabase removido → API PHP (api.php)
// ============================================================

// ⚠️ Aponte para o seu arquivo api.php no servidor
// Se o api.php estiver na mesma pasta que o index.html, use './api.php'
const API_URL = './api.php';

document.addEventListener('DOMContentLoaded', () => {

    // 1. --- ANIMAÇÕES DE REVELAÇÃO (Scroll Reveal) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 2. --- CONTROLE DO MENU MOBILE ---
    const mobileBtn  = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon   = document.getElementById('menu-icon');
    const nav        = document.getElementById('navbar');

    function toggleMenu() {
        if (!mobileMenu || !menuIcon) return;
        const isOpen = mobileMenu.classList.contains('open');
        if (isOpen) {
            mobileMenu.classList.remove('open');
            menuIcon.classList.replace('fa-times', 'fa-bars');
        } else {
            mobileMenu.classList.add('open');
            menuIcon.classList.replace('fa-bars', 'fa-times');
        }
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }

    // 3. --- SCROLL SUAVE E FECHAMENTO DE MENU ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const isMobileMenuOpen = mobileMenu && mobileMenu.classList.contains('open');

                if (isMobileMenuOpen) {
                    mobileMenu.classList.remove('open');
                    if (menuIcon) menuIcon.classList.replace('fa-times', 'fa-bars');
                }

                setTimeout(() => {
                    const navHeight      = nav ? nav.offsetHeight : 0;
                    const bodyRect       = document.body.getBoundingClientRect().top;
                    const elementRect    = targetElement.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const finalOffset    = elementPosition - navHeight + (isMobileMenuOpen ? 420 : 2);
                    window.scrollTo({ top: finalOffset, behavior: 'smooth' });
                }, isMobileMenuOpen ? 50 : 0);
            }
        });
    });

    // 4. --- MÁSCARA DE TELEFONE ---
    const inputTel = document.getElementById('tel');
    if (inputTel) {
        inputTel.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    // 5. --- TOAST NOTIFICATION ---
    const toast        = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    const showToast = (nome) => {
        if (!toast || !toastMessage) return;
        toastMessage.innerText = `Parabéns, ${nome}!`;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 4000);
    };

    // 6. --- ENVIO DO FORMULÁRIO (LEADS) ---
    // Chamada para api.php — SEM Supabase
    const ebookForm = document.getElementById('form-ebooks');
    if (ebookForm) {
        ebookForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const inputs   = this.querySelectorAll('input');
            const nome     = inputs[0].value.trim();
            const email    = inputs[1].value.trim();
            const telefone = inputs[2].value.trim();
            const cidade   = inputs[3].value.trim();
            const btn      = this.querySelector('button');

            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
            btn.disabled  = true;

            try {
                const response = await fetch(`${API_URL}/leads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, telefone, cidade })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Erro desconhecido');

                // Gatilho de download dos PDFs (sem alteração)
                const links = [
                    './Do_Zero_ao_Topo_Ebook_Pronto.pdf',
                    './Ebook_Lucro_Revelado_COMPLETO.pdf',
                    './Liderar_e_Decidir_FINAL_v2.pdf'
                ];
                links.forEach((url, index) => {
                    setTimeout(() => {
                        const a = document.createElement('a');
                        a.href     = url;
                        a.download = url.split('/').pop();
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }, index * 500);
                });

                showToast(nome);
                btn.innerHTML = '<i class="fas fa-check mr-2"></i> Sucesso!';
                btn.classList.replace('bg-metallic', 'bg-green-600');
                btn.classList.add('text-white');
                this.reset();

            } catch (err) {
                console.error('Erro na API:', err);
                alert('Erro ao salvar dados. Verifique sua conexão.');
                btn.innerHTML = 'Tentar Novamente';
                btn.disabled  = false;
            }
        });
    }

});