/* ============================================
   Coffee House — Interactive script
   ============================================ */

/* ---------- API helper ---------- */
const API = (() => {
    const base = '/api';
    async function request(path, options = {}) {
        const opts = {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        };
        if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
        const res = await fetch(base + path, opts);
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) {
            const message = data?.message || data?.error || `Request failed (${res.status})`;
            const err = new Error(message);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }
    return {
        getMenu:        (category) => request(`/menu${category ? `?category=${category}` : ''}`),
        getMenuItem:    (id)       => request(`/menu/${id}`),
        placeOrder:     (payload)  => request('/orders', { method: 'POST', body: payload }),
        sendContact:    (payload)  => request('/contact', { method: 'POST', body: payload }),
    };
})();

/* ---------- State ---------- */
const state = {
    cart: JSON.parse(localStorage.getItem('coffeecart') || '[]'),
    filter: 'all',
    theme: localStorage.getItem('coffeetheme') || 'light',
    menu: [],
    menuLoading: true,
    currency: '$',
};

/* ---------- DOM helpers ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================
   Mobile menu
   ============================================ */
const navLinks       = $$('.nav-menu .nav-link');
const menuOpenBtn    = $('#menu-open-button');
const menuCloseBtn   = $('#menu-close-button');

menuOpenBtn?.addEventListener('click', () => {
    document.body.classList.toggle('show-mobile-menu');
});

menuCloseBtn?.addEventListener('click', () => menuOpenBtn.click());

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (document.body.classList.contains('show-mobile-menu')) {
            menuOpenBtn.click();
        }
    });
});

/* ============================================
   Scroll progress bar
   ============================================ */
const scrollProgress = $('.scroll-progress');

function updateScrollProgress() {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

/* ============================================
   Back to top
   ============================================ */
const backToTop = $('#back-to-top');

function updateBackToTop() {
    if (window.scrollY > 400) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
}

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================
   Active nav link (scroll spy)
   ============================================ */
const sectionEls = $$('main section[id]');

function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    let currentId = sectionEls[0]?.id;

    sectionEls.forEach(sec => {
        if (sec.offsetTop <= scrollPos) currentId = sec.id;
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
}

/* ============================================
   Reveal on scroll
   ============================================ */
const revealEls = $$('.reveal');
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

revealEls.forEach(el => io.observe(el));

/* ============================================
   Throttled scroll handler
   ============================================ */
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            updateScrollProgress();
            updateBackToTop();
            updateActiveNav();
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });

/* ============================================
   Theme toggle
   ============================================ */
const themeToggle = $('#theme-toggle');
const themeIcon   = themeToggle?.querySelector('i');

function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    localStorage.setItem('coffeetheme', theme);
    state.theme = theme;
}

applyTheme(state.theme);

themeToggle?.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

/* ============================================
   Order section: render items + filter
   ============================================ */
const orderList = $('#order-list');
const orderTabs = $$('.order-tab');

function renderOrder() {
    if (!orderList) return;
    if (state.menuLoading) {
        orderList.innerHTML = '<li class="order-loading">Loading menu…</li>';
        return;
    }
    const items = state.menu.filter(item => state.filter === 'all' || item.cat === state.filter);
    if (items.length === 0) {
        orderList.innerHTML = '<li class="order-loading">No items in this category.</li>';
        return;
    }
    orderList.innerHTML = items.map(item => `
        <li class="order-item" data-cat="${item.cat}">
            <div class="order-item-info">
                <h3>${escapeHtml(item.name)}</h3>
                <p>${escapeHtml(item.desc || '')}</p>
            </div>
            <div class="order-item-action">
                <span class="price">${state.currency}${item.price.toFixed(2)}</span>
                <button class="add-btn" data-id="${item.id}" aria-label="Add ${escapeHtml(item.name)} to order">+</button>
            </div>
        </li>
    `).join('');

    $$('.add-btn', orderList).forEach(btn => {
        btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id, 10)));
    });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

/* Load menu from API on boot, fall back silently if backend is offline. */
(async function loadMenu() {
    try {
        const data = await API.getMenu();
        state.menu = data.items || [];
        state.menuLoading = false;
    } catch (err) {
        console.warn('Could not load menu from API:', err.message);
        state.menuLoading = false;
        if (orderList) {
            orderList.innerHTML = '<li class="order-loading">Menu unavailable. Please try again later.</li>';
        }
        return;
    }
    renderOrder();
})();

orderTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        orderTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        state.filter = tab.dataset.filter;
        renderOrder();
    });
});

renderOrder();

/* ============================================
   Cart
   ============================================ */
const cartToggle  = $('#cart-toggle');
const cartPanel   = $('#cart-panel');
const cartOverlay = $('#cart-overlay');
const cartClose   = $('#cart-close');
const cartItems   = $('#cart-items');
const cartCount   = $('#cart-count');
const cartTotalEl = $('#cart-total');
const checkoutBtn = $('#checkout-btn');

function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('visible');
    cartPanel.setAttribute('aria-hidden', 'false');
}

function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('visible');
    cartPanel.setAttribute('aria-hidden', 'true');
}

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCart();
        closeLightbox();
    }
});

function persistCart() {
    localStorage.setItem('coffeecart', JSON.stringify(state.cart));
}

function findMenuItem(id) {
    return state.menu.find(m => m.id === id);
}

function renderCart() {
    const totalQty = state.cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = totalQty;
    cartCount.classList.toggle('visible', totalQty > 0);

    if (state.cart.length === 0) {
        cartItems.innerHTML = '<li class="cart-empty">Your cart is empty. <br>Add something delicious ☕</li>';
        cartTotalEl.textContent = `${state.currency}0.00`;
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    let total = 0;
    cartItems.innerHTML = state.cart.map(line => {
        const item = findMenuItem(line.id);
        if (!item) return '';
        const lineTotal = item.price * line.qty;
        total += lineTotal;
        return `
            <li class="cart-item">
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <span class="cart-item-price">${state.currency}${item.price.toFixed(2)} × ${line.qty} = ${state.currency}${lineTotal.toFixed(2)}</span>
                </div>
                <div class="qty-control">
                    <button class="qty-btn qty-minus" data-id="${item.id}" aria-label="Decrease">−</button>
                    <span class="qty-value">${line.qty}</span>
                    <button class="qty-btn qty-plus" data-id="${item.id}" aria-label="Increase">+</button>
                </div>
            </li>
        `;
    }).join('');

    cartTotalEl.textContent = `${state.currency}${total.toFixed(2)}`;

    $$('.qty-minus', cartItems).forEach(b => {
        b.addEventListener('click', () => changeQty(parseInt(b.dataset.id, 10), -1));
    });
    $$('.qty-plus', cartItems).forEach(b => {
        b.addEventListener('click', () => changeQty(parseInt(b.dataset.id, 10), +1));
    });
}

function addToCart(id) {
    const item = findMenuItem(id);
    if (!item) {
        showToast('Sorry, that item is no longer available.');
        return;
    }
    const existing = state.cart.find(l => l.id === id);
    if (existing) existing.qty += 1;
    else state.cart.push({ id, qty: 1 });
    persistCart();
    renderCart();
    bumpCart();
    showToast(`Added <strong>${escapeHtml(item.name)}</strong> to your order`);
}

function changeQty(id, delta) {
    const line = state.cart.find(l => l.id === id);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) {
        state.cart = state.cart.filter(l => l.id !== id);
    }
    persistCart();
    renderCart();
}

function bumpCart() {
    cartCount.classList.remove('bump');
    void cartCount.offsetWidth; // restart animation
    cartCount.classList.add('bump');
}

checkoutBtn.addEventListener('click', async () => {
    if (state.cart.length === 0) return;
    const original = checkoutBtn.textContent;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Placing order…';

    const payload = {
        items: state.cart.map(l => ({ id: l.id, qty: l.qty })),
        type: 'pickup',
    };

    try {
        const order = await API.placeOrder(payload);
        showToast(`Order <strong>${order.id}</strong> placed! Total ${order.currency || state.currency}${order.total.toFixed(2)} 🎉`, 4500);
        state.cart = [];
        persistCart();
        renderCart();
        setTimeout(closeCart, 1500);
    } catch (err) {
        console.error('Order failed:', err);
        showToast(`Could not place order: ${escapeHtml(err.message)}`, 4000);
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = original;
    }
});

renderCart();

/* ============================================
   Toast
   ============================================ */
const toastEl = $('#toast');
let toastTimer = null;

function showToast(html, duration = 2400) {
    if (!toastEl) return;
    toastEl.innerHTML = `<i class="fa-solid fa-check-circle"></i><span>${html}</span>`;
    toastEl.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('visible'), duration);
}

/* ============================================
   Lightbox for gallery
   ============================================ */
const lightbox     = $('#lightbox');
const lightboxImg  = $('#lightbox-img');
const lightboxClose= $('#lightbox-close');

function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

$$('.gallery-image').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

/* ============================================
   Contact form
   ============================================ */
const form        = $('#contact-form');
const formError   = $('#form-error');

form?.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.textContent = '';

    const fd = new FormData(form);
    const name    = (fd.get('name')    || '').toString().trim();
    const email   = (fd.get('email')   || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    let valid = true;
    $$('.form-input', form).forEach(input => input.classList.remove('error'));

    if (name.length < 2) {
        flagError('name', 'Please enter your name (at least 2 characters).');
        valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        flagError('email', 'Please enter a valid email address.');
        valid = false;
    }
    if (message.length < 5) {
        flagError('message', 'Please write a short message (at least 5 characters).');
        valid = false;
    }

    if (!valid) return;

    const submitBtn = form.querySelector('.submit-button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
        await API.sendContact({ name, email, message });
        submitBtn.textContent = '✓ Message Sent!';
        submitBtn.classList.add('success');
        form.reset();
        showToast("Thanks! We'll get back to you soon ☕");
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('success');
            submitBtn.disabled = false;
        }, 2800);
    } catch (err) {
        console.error('Contact submit failed:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        formError.textContent = err.message || 'Could not send message. Please try again.';
    }
});

function flagError(field, msg) {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) input.classList.add('error');
    formError.textContent = msg;
}

/* ============================================
   Footer year
   ============================================ */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================
   Swiper (testimonials)
   ============================================ */
new Swiper('.slider-container.swiper', {
    loop: true,
    grabCursor: true,
    spaceBetween: 24,

    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
    },

    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },

    breakpoints: {
        0:    { slidesPerView: 1 },
        768:  { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    },

    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
});
