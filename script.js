// JavaScript код

// Рандомное перемешивание картинок в галерее
function shuffleGallery() {
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;
    
    const items = Array.from(gallery.children);
    
    // Перемешиваем массив элементов
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    
    // Очищаем галерею и добавляем элементы в новом порядке
    gallery.innerHTML = '';
    items.forEach(item => gallery.appendChild(item));
}

// Кастомный курсор для галереи zine: текст "1/N", кегль 24
function makeZinCursorUrl(current, total) {
    const text = `${current}/${total}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="40"><text x="0" y="32" font-size="32" fill="#FB0000" font-family="Alegreya, serif">${text}</text></svg>`;
    const encoded = encodeURIComponent(svg).replace(/#/g, '%23');
    return `url("data:image/svg+xml,${encoded}") 0 0, pointer`;
}

// Оставляем в галерее pillar только слайды с загрузившимися фото; остальные удаляем
function prunePillarGallery(gallery) {
    const firstSlide = gallery.querySelector('.zin-gallery-slide');
    if (!firstSlide?.src?.includes('pillar')) return Promise.resolve();
    const track = gallery.querySelector('.zin-gallery-track');
    if (!track) return Promise.resolve();
    const slides = Array.from(gallery.querySelectorAll('.zin-gallery-slide'));
    const promises = slides.map((slide) => {
        const img = slide.tagName === 'IMG' ? slide : slide.querySelector('img');
        if (!img) return Promise.resolve();
        return new Promise((resolve) => {
            if (img.complete) {
                resolve(img.naturalWidth > 0);
                return;
            }
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        }).then((loaded) => {
            if (!loaded) slide.remove();
        });
    });
    return Promise.all(promises);
}

function prunePillarGalleries() {
    const galleries = document.querySelectorAll('.zin-gallery');
    return Promise.all(Array.from(galleries).map(prunePillarGallery));
}

// Галерея (zine, pillar и др.): клик — следующее фото, свайп влево/вправо
function initOneZinGallery(gallery) {
    const track = gallery.querySelector('.zin-gallery-track');
    const slides = gallery.querySelectorAll('.zin-gallery-slide');
    const total = slides.length;
    if (!track || total === 0) return;
    
    if (total === 5) gallery.classList.add('zin-gallery--5');
    if (total === 6) gallery.classList.add('zin-gallery--6');
    if (total === 10) gallery.classList.add('zin-gallery--10');
    
    let index = 0;
    
    function updateCursor() {
        gallery.style.cursor = makeZinCursorUrl(index + 1, total);
    }
    
    function goTo(i) {
        index = ((i % total) + total) % total;
        track.style.transform = `translateX(-${(index / total) * 100}%)`;
        updateCursor();
    }
    
    function next() {
        goTo(index + 1);
    }
    
    gallery.addEventListener('mouseenter', updateCursor);
    gallery.addEventListener('click', next);
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    gallery.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    gallery.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        const minSwipe = 50;
        if (diff > minSwipe) next();
        else if (diff < -minSwipe) goTo(index - 1);
    }, { passive: true });
    
    updateCursor();
}

function initZinGallery() {
    document.querySelectorAll('.zin-gallery').forEach(initOneZinGallery);
}

// Мобильная версия: при скролле к кейсу с галереей сначала показываем количество фото, затем плавно галерею
function initOneZinGalleryMobileReveal(wrap) {
    const countEl = wrap.querySelector('.zin-gallery-count');
    const gallery = wrap.querySelector('.zin-gallery');
    const total = gallery ? gallery.querySelectorAll('.zin-gallery-slide').length : 0;
    
    if (!countEl || !total) return;
    
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    
    if (!isMobile()) {
        wrap.classList.add('gallery-loaded');
        return;
    }
    
    let done = false;
    const observer = new IntersectionObserver((entries) => {
        if (done) return;
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        done = true;
        observer.disconnect();
        countEl.textContent = total;
        setTimeout(() => {
            wrap.classList.add('gallery-loaded');
        }, 800);
    }, { rootMargin: '0px', threshold: 0.2 });
    
    observer.observe(wrap);
}

function initZinGalleryMobileReveal() {
    document.querySelectorAll('.zin-gallery-wrap').forEach(initOneZinGalleryMobileReveal);
}

// Кастомный курсор: картинка следует за мышью, при клике поворот; блок создаётся инлайном в HTML для отсутствия задержки при переходе
function initCustomCursor() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    let cursor = document.getElementById('custom-cursor');
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.id = 'custom-cursor';
        cursor.innerHTML = '<img src="img/cursor.svg" alt="" width="48" height="48">';
        document.body.appendChild(cursor);
        document.body.classList.add('has-custom-cursor');
        document.documentElement.classList.add('has-custom-cursor');
    }

    var savedX = sessionStorage.getItem('cursorX');
    var savedY = sessionStorage.getItem('cursorY');
    if (savedX !== null && savedY !== null) {
        cursor.style.left = savedX + 'px';
        cursor.style.top = savedY + 'px';
    }

    let x = savedX !== null ? Number(savedX) : 0;
    let y = savedY !== null ? Number(savedY) : 0;

    function move(e) {
        x = e.clientX;
        y = e.clientY;
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        sessionStorage.setItem('cursorX', String(x));
        sessionStorage.setItem('cursorY', String(y));
    }

    function press() {
        cursor.classList.add('custom-cursor--pressed');
    }

    function release() {
        cursor.classList.remove('custom-cursor--pressed');
    }

    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mousedown', press);
    document.addEventListener('mouseup', release);
    document.addEventListener('mouseleave', release);

    // над галереей скрываем кастомный курсор — виден курсор галереи (1/N)
    document.querySelectorAll('.zin-gallery').forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('custom-cursor--hidden'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('custom-cursor--hidden'));
    });
}

// Заставка при входе: 1 раз за сессию; rock 300px, «Click to see»; по клику — на главную
function initSplash() {
    if (sessionStorage.getItem('splash-seen')) return;

    const splash = document.createElement('div');
    splash.className = 'splash';
    splash.id = 'splash';
    splash.innerHTML = '<div class="splash-inner"><img src="img/rock.png" alt="" class="splash-img"><p class="splash-text">Click to see</p></div>';
    document.body.prepend(splash);

    function isMainPage() {
        const p = window.location.pathname;
        return p === '' || p === '/' || p.endsWith('/') || p.endsWith('index.html');
    }

    splash.addEventListener('click', () => {
        sessionStorage.setItem('splash-seen', '1');
        if (isMainPage()) {
            splash.classList.add('is-hidden');
            setTimeout(() => splash.remove(), 220);
        } else {
            window.location.href = 'index.html';
        }
    });
}

// Время по Москве в футере (формат HH:MM:SS am/pm)
function updateFooterMskTime() {
    const el = document.getElementById('footer-msk-time');
    if (!el) return;
    const now = new Date();
    const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    const h = msk.getHours();
    const m = msk.getMinutes();
    const s = msk.getSeconds();
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    el.textContent = [
        String(h12).padStart(2, '0'),
        String(m).padStart(2, '0'),
        String(s).padStart(2, '0')
    ].join(':') + ' ' + ampm;
}

function initFooterMskTime() {
    updateFooterMskTime();
    setInterval(updateFooterMskTime, 1000);
}

// Work page: 3 clicks on egg — усиливающаяся тряска, затем показ видео «You find Velociraptor»
function initWorkEgg() {
    const eggBlock = document.getElementById('work-egg-block');
    const egg = document.getElementById('work-egg');
    const videoBlock = document.getElementById('work-video-block');
    const video = videoBlock?.querySelector('.work-footer-video');
    if (!eggBlock || !egg || !videoBlock || !video) return;

    let clicks = 0;

    egg.addEventListener('click', () => {
        clicks += 1;
        const level = Math.min(clicks, 3);
        egg.classList.remove('work-egg-shake-1', 'work-egg-shake-2', 'work-egg-shake-3');
        void egg.offsetWidth; // reflow to restart animation
        egg.classList.add('work-egg-shake-' + level);

        setTimeout(() => {
            egg.classList.remove('work-egg-shake-1', 'work-egg-shake-2', 'work-egg-shake-3');
            if (clicks >= 3) {
                egg.classList.add('work-egg-exit');
                egg.addEventListener('animationend', function onExit() {
                    egg.removeEventListener('animationend', onExit);
                    egg.classList.remove('work-egg-exit');
                    eggBlock.classList.add('is-hidden');
                    videoBlock.classList.remove('is-hidden');
                    video.play().catch(() => {});
                });
            }
        }, 400);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    initCustomCursor();
    initFooterMskTime();
    initWorkEgg();
    shuffleGallery();
    prunePillarGalleries().then(() => {
        initZinGallery();
        initZinGalleryMobileReveal();
    });
});

