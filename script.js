(() => {
    // DOM elements for navigation and interaction
    const DOM = (() => {
        const elements = {
            html: document.documentElement,
            header: document.getElementById('mainHeader'),
            drawer: document.getElementById('sideDrawer'),
            menuToggle: document.getElementById('menuToggle'),
            menuIcons: {
                bars: document.querySelector('.menu-bars'),
                close: document.querySelector('.menu-x')
            },
            overlay: document.getElementById('drawerOverlay')
        };

        // Validate all required elements exist
        const missingElements = Object.entries(elements).filter(([key, value]) => {
            if (key === 'menuIcons') {
                return !value.bars || !value.close;
            }
            return !value;
        });

        if (missingElements.length > 0) {
            console.warn('Missing DOM elements:', missingElements.map(([key]) => key));
            return null;
        }

        return Object.freeze(elements);
    })();

    // Exit if required DOM elements are not found
    if (!DOM) {
        console.error('Required DOM elements not found. Initialization aborted.');
        return;
    }

    // Use a single source of truth for state
    const state = {
        isDrawerOpen: false
    };

    // Use passive listeners where possible
    const eventOptions = { passive: true };

    // Optimized animation handling with requestAnimationFrame
    const animate = {
        drawer: (isOpen) => {
            if (!DOM.drawer || !DOM.overlay) return;
            
            cancelAnimationFrame(animate.drawer.frameId);
            animate.drawer.frameId = requestAnimationFrame(() => {
                // Use a single class for transition states
                DOM.drawer.classList.toggle('translate-x-full', !isOpen);
                DOM.drawer.classList.toggle('translate-x-0', isOpen);
                
                // Use data attributes for managing overlay state
                if (isOpen) {
                    DOM.overlay.classList.remove('invisible');
                    // Use setTimeout to ensure opacity transition works
                    setTimeout(() => {
                        DOM.overlay.classList.remove('opacity-0');
                    }, 10);
                } else {
                    DOM.overlay.classList.add('opacity-0');
                    // Wait for opacity transition before hiding
                    setTimeout(() => {
                        DOM.overlay.classList.add('invisible');
                    }, 300); // Match your transition duration
                }
                
                // Handle menu icons
                DOM.menuIcons.bars.classList.toggle('hidden', isOpen);
                DOM.menuIcons.close.classList.toggle('hidden', !isOpen);
                DOM.html.classList.toggle('overflow-hidden', isOpen);
            });
        }
    };

    // Only initialize header observer if header exists
    if (DOM.header) {
        const headerObserver = new IntersectionObserver(
            ([entry]) => {
                requestAnimationFrame(() => {
                    DOM.header.classList.toggle('shadow-md', !entry.isIntersecting);
                });
            },
            { threshold: 1, rootMargin: '-10px' }
        );

        // Create a sentinel element for header observation
        const sentinel = document.createElement('div');
        sentinel.className = 'pointer-events-none absolute top-0 h-1 w-full';
        document.body.prepend(sentinel);
        headerObserver.observe(sentinel);
    }

    // Event handlers with minimal processing
    const handlers = {
        toggleDrawer: () => {
            state.isDrawerOpen = !state.isDrawerOpen;
            animate.drawer(state.isDrawerOpen);
        },

        keyPress: (e) => {
            if (e.key === 'Escape' && state.isDrawerOpen) {
                handlers.toggleDrawer();
            }
        },

        smoothScroll: (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const targetId = link.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const headerOffset = DOM.header ? DOM.header.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

            window.scrollTo({
                top,
                behavior: 'smooth'
            });

            if (state.isDrawerOpen) {
                handlers.toggleDrawer();
            }
        }
    };

    // Initialize with minimal overhead
    const init = () => {
        // Event delegation for all click events
        document.addEventListener('click', handlers.smoothScroll, eventOptions);
        
        // Drawer controls - only add if elements exist
        if (DOM.menuToggle && DOM.overlay) {
            DOM.menuToggle.addEventListener('click', handlers.toggleDrawer, eventOptions);
            DOM.overlay.addEventListener('click', handlers.toggleDrawer, eventOptions);
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', handlers.keyPress);
    };

    // Start the app efficiently
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
