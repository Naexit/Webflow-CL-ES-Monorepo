function initNavigation() {
  if (!initNavigation._hasResizeListener) {
    initNavigation._hasResizeListener = true;
    window.addEventListener('resize', debounce(initNavigation, 200));
  }

  const isMobile = window.innerWidth < 768;
  if (isMobile && initNavigation._lastMode !== 'mobile') {
    initMobileMenu();
    initNavigation._lastMode = 'mobile';
  } else if (!isMobile && initNavigation._lastMode !== 'desktop') {
    initDesktopDropdowns();
    initNavigation._lastMode = 'desktop';
  }
}

function debounce(fn, delay) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

function initMobileMenu() {
  const btn = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-menu-status]');
  if (!btn || !nav) return;

  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobile-navigation');
  nav.setAttribute('id', 'mobile-navigation');
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  if (!btn._mobileClick) {
    btn._mobileClick = true;
    btn.addEventListener('click', () => {
      const open = nav.dataset.menuStatus === 'open';
      nav.dataset.menuStatus = open ? 'closed' : 'open';
      btn.setAttribute('aria-expanded', !open);

      // Close all dropdowns when closing the menu
      if (open) {
        Array.from(document.querySelectorAll('[data-dropdown-toggle]')).forEach(toggle => {
          toggle.dataset.dropdownToggle = 'closed';
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  Array.from(document.querySelectorAll('[data-dropdown-toggle]')).forEach((toggle, i) => {
    const dd = toggle.nextElementSibling;
    if (!dd || !dd.classList.contains('nav-dropdown')) return;
    if (toggle._mobileDropdownInit) return;
    toggle._mobileDropdownInit = true;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-controls', `dropdown-${i}`);

    dd.setAttribute('id', `dropdown-${i}`);
    dd.setAttribute('role', 'menu');
    dd.querySelectorAll('.nav-dropdown__link')
      .forEach(link => link.setAttribute('role', 'menuitem'));

    toggle.addEventListener('click', () => {
      const open = toggle.dataset.dropdownToggle === 'open';
      Array.from(document.querySelectorAll('[data-dropdown-toggle]'))
        .forEach(other => {
          if (other !== toggle) {
            other.dataset.dropdownToggle = 'closed';
            other.setAttribute('aria-expanded', 'false');
            if (other === document.activeElement) other.blur();
          }
        });
      toggle.dataset.dropdownToggle = open ? 'closed' : 'open';
      toggle.setAttribute('aria-expanded', !open);
      if (open && toggle === document.activeElement) toggle.blur();
    });
  });
}

function initDesktopDropdowns() {
  const toggles = Array.from(document.querySelectorAll('[data-dropdown-toggle]'));
  const links = Array.from(document.querySelectorAll('.nav-link:not([data-dropdown-toggle])'));

  toggles.forEach((toggle, i) => {
    const dd = toggle.nextElementSibling;
    if (!dd || !dd.classList.contains('nav-dropdown') || toggle._desktopInit) return;
    toggle._desktopInit = true;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-controls', `desktop-dropdown-${i}`);

    dd.setAttribute('id', `desktop-dropdown-${i}`);
    dd.setAttribute('role', 'menu');
    dd.setAttribute('aria-hidden', 'true');
    dd.querySelectorAll('.nav-dropdown__link')
      .forEach(link => link.setAttribute('role', 'menuitem'));

    toggle.addEventListener('click', e => {
      e.preventDefault();
      toggles.forEach(other => {
        if (other !== toggle) {
          other.dataset.dropdownToggle = 'closed';
          other.setAttribute('aria-expanded', 'false');
          const otherDropdown = other.nextElementSibling;
          if (otherDropdown) otherDropdown.setAttribute('aria-hidden', 'true');
        }
      });
      const open = toggle.dataset.dropdownToggle !== 'open';
      toggle.dataset.dropdownToggle = 'open';
      toggle.setAttribute('aria-expanded', 'true');
      dd.setAttribute('aria-hidden', 'false');
      if (open) {
        const first = dd.querySelector('.nav-dropdown__link');
        if (first) first.focus();
      }
    });

    toggle.addEventListener('mouseenter', () => {
      const anyOpen = toggles.some(x => x.dataset.dropdownToggle === 'open');
      toggles.forEach(other => {
        if (other !== toggle) {
          other.dataset.dropdownToggle = 'closed';
          other.setAttribute('aria-expanded', 'false');
          const otherDropdown = other.nextElementSibling;
          if (otherDropdown) otherDropdown.setAttribute('aria-hidden', 'true');
        }
      });
      if (anyOpen) {
        setTimeout(() => {
          toggle.dataset.dropdownToggle = 'open';
          toggle.setAttribute('aria-expanded', 'true');
          dd.setAttribute('aria-hidden', 'false');
        }, 20);
      } else {
        toggle.dataset.dropdownToggle = 'open';
        toggle.setAttribute('aria-expanded', 'true');
        dd.setAttribute('aria-hidden', 'false');
      }
    });

    dd.addEventListener('mouseleave', () => {
      toggle.dataset.dropdownToggle = 'closed';
      toggle.setAttribute('aria-expanded', 'false');
      dd.setAttribute('aria-hidden', 'true');
    });

    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      } else if (e.key === 'Escape') {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        dd.setAttribute('aria-hidden', 'true');
        toggle.focus();
      }
    });

    dd.addEventListener('keydown', e => {
      const items = Array.from(dd.querySelectorAll('.nav-dropdown__link'));
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        dd.setAttribute('aria-hidden', 'true');
        toggle.focus();
      } else if (e.key === 'Tab' && !dd.contains(e.relatedTarget)) {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        dd.setAttribute('aria-hidden', 'true');
      }
    });
  });

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      toggles.forEach(toggle => {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        const dd = toggle.nextElementSibling;
        if (dd) dd.setAttribute('aria-hidden', 'true');
      });
    });
  });

  document.addEventListener('click', e => {
    const inside = toggles.some(toggle => {
      const dd = toggle.nextElementSibling;
      return toggle.contains(e.target) || (dd && dd.contains(e.target));
    });
    if (!inside) {
      toggles.forEach(toggle => {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        const dd = toggle.nextElementSibling;
        if (dd) dd.setAttribute('aria-hidden', 'true');
      });
    }
  });
}

// Initialize Multilevel Navigation
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});

gsap.registerPlugin(ScrollTrigger, SplitText)

function initHighlightText() {

  let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]")
  splitHeadingTargets.forEach((heading) => {

    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 70%"
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 55%"
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2 // Opacity of letter
    const staggerValue = heading.getAttribute("data-highlight-stagger") ||
      0.1 // Smoother reveal

    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            }
          })
          tl.from(self.chars, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          })
        });
        return ctx; // return our animations so GSAP can clean them up when onSplit fires
      }
    });
  });
}

// Initialize Highlight Text on Scroll
document.addEventListener("DOMContentLoaded", () => {
  initHighlightText();
});

gsap.registerPlugin(ScrollTrigger);

function initFooterParallax() {
  document.querySelectorAll('[data-footer-parallax]').forEach(el => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top bottom)',
        end: 'clamp(top top)',
        scrub: true
      }
    });

    const inner = el.querySelector('[data-footer-parallax-inner]');
    const dark = el.querySelector('[data-footer-parallax-dark]');

    if (inner) {
      tl.from(inner, {
        yPercent: -25,
        ease: 'linear'
      });
    }

    if (dark) {
      tl.from(dark, {
        opacity: 0.5,
        ease: 'linear'
      }, '<');
    }
  });
}
// Initialize Footer with Parallax Effect
document.addEventListener('DOMContentLoaded', () => {
  initFooterParallax();
});

// Initialize Locomotive Scroll
const locomotiveScroll = new LocomotiveScroll();

function initAdvancedFormValidation() {
  const forms = document.querySelectorAll('[data-form-validate]');

  forms.forEach((formContainer) => {
    const startTime = new Date().getTime();

    const form = formContainer.querySelector('form');
    if (!form) return;

    const validateFields = form.querySelectorAll('[data-validate]');
    const dataSubmit = form.querySelector('[data-submit]');
    if (!dataSubmit) return;

    const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
    if (!realSubmitInput) return;

    function isSpam() {
      const currentTime = new Date().getTime();
      return currentTime - startTime < 5000;
    }

    // Disable select options with invalid values on page load
    validateFields.forEach(function (fieldGroup) {
      const select = fieldGroup.querySelector('select');
      if (select) {
        const options = select.querySelectorAll('option');
        options.forEach(function (option) {
          if (
            option.value === '' ||
            option.value === 'disabled' ||
            option.value === 'null' ||
            option.value === 'false'
          ) {
            option.setAttribute('disabled', 'disabled');
          }
        });
      }
    });

    function validateAndStartLiveValidationForAll() {
      let allValid = true;
      let firstInvalidField = null;

      validateFields.forEach(function (fieldGroup) {
        const input = fieldGroup.querySelector('input, textarea, select');
        const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
        if (!input && !radioCheckGroup) return;

        if (input) input.__validationStarted = true;
        if (radioCheckGroup) {
          radioCheckGroup.__validationStarted = true;
          const inputs = radioCheckGroup.querySelectorAll(
            'input[type="radio"], input[type="checkbox"]');
          inputs.forEach(function (input) {
            input.__validationStarted = true;
          });
        }

        updateFieldStatus(fieldGroup);

        if (!isValid(fieldGroup)) {
          allValid = false;
          if (!firstInvalidField) {
            firstInvalidField = input || radioCheckGroup.querySelector('input');
          }
        }
      });

      if (!allValid && firstInvalidField) {
        firstInvalidField.focus();
      }

      return allValid;
    }

    function isValid(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll(
          'input[type="radio"], input[type="checkbox"]');
        const checkedInputs = radioCheckGroup.querySelectorAll('input:checked');
        const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
        const max = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;
        const checkedCount = checkedInputs.length;

        if (inputs[0].type === 'radio') {
          return checkedCount >= 1;
        } else {
          if (inputs.length === 1) {
            return inputs[0].checked;
          } else {
            return checkedCount >= min && checkedCount <= max;
          }
        }
      } else {
        const input = fieldGroup.querySelector('input, textarea, select');
        if (!input) return false;

        let valid = true;
        const min = parseInt(input.getAttribute('min')) || 0;
        const max = parseInt(input.getAttribute('max')) || Infinity;
        const value = input.value.trim();
        const length = value.length;

        if (input.tagName.toLowerCase() === 'select') {
          if (
            value === '' ||
            value === 'disabled' ||
            value === 'null' ||
            value === 'false'
          ) {
            valid = false;
          }
        } else if (input.type === 'email') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          valid = emailPattern.test(value);
        } else {
          if (input.hasAttribute('min') && length < min) valid = false;
          if (input.hasAttribute('max') && length > max) valid = false;
        }

        return valid;
      }
    }

    function updateFieldStatus(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll(
          'input[type="radio"], input[type="checkbox"]');
        const checkedInputs = radioCheckGroup.querySelectorAll('input:checked');

        if (checkedInputs.length > 0) {
          fieldGroup.classList.add('is--filled');
        } else {
          fieldGroup.classList.remove('is--filled');
        }

        const valid = isValid(fieldGroup);

        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          const anyInputValidationStarted = Array.from(inputs).some(input => input
            .__validationStarted);
          if (anyInputValidationStarted) {
            fieldGroup.classList.add('is--error');
          } else {
            fieldGroup.classList.remove('is--error');
          }
        }
      } else {
        const input = fieldGroup.querySelector('input, textarea, select');
        if (!input) return;

        const value = input.value.trim();

        if (value) {
          fieldGroup.classList.add('is--filled');
        } else {
          fieldGroup.classList.remove('is--filled');
        }

        const valid = isValid(fieldGroup);

        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          if (input.__validationStarted) {
            fieldGroup.classList.add('is--error');
          } else {
            fieldGroup.classList.remove('is--error');
          }
        }
      }
    }

    validateFields.forEach(function (fieldGroup) {
      const input = fieldGroup.querySelector('input, textarea, select');
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll(
          'input[type="radio"], input[type="checkbox"]');
        inputs.forEach(function (input) {
          input.__validationStarted = false;

          input.addEventListener('change', function () {
            requestAnimationFrame(function () {
              if (!input.__validationStarted) {
                const checkedCount = radioCheckGroup.querySelectorAll(
                  'input:checked').length;
                const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;

                if (checkedCount >= min) {
                  input.__validationStarted = true;
                }
              }

              if (input.__validationStarted) {
                updateFieldStatus(fieldGroup);
              }
            });
          });

          input.addEventListener('blur', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        });
      } else if (input) {
        input.__validationStarted = false;

        if (input.tagName.toLowerCase() === 'select') {
          input.addEventListener('change', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        } else {
          input.addEventListener('input', function () {
            const value = input.value.trim();
            const length = value.length;
            const min = parseInt(input.getAttribute('min')) || 0;
            const max = parseInt(input.getAttribute('max')) || Infinity;

            if (!input.__validationStarted) {
              if (input.type === 'email') {
                if (isValid(fieldGroup)) input.__validationStarted = true;
              } else {
                if (
                  (input.hasAttribute('min') && length >= min) ||
                  (input.hasAttribute('max') && length <= max)
                ) {
                  input.__validationStarted = true;
                }
              }
            }

            if (input.__validationStarted) {
              updateFieldStatus(fieldGroup);
            }
          });

          input.addEventListener('blur', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        }
      }
    });

    dataSubmit.addEventListener('click', function () {
      if (validateAndStartLiveValidationForAll()) {
        if (isSpam()) {
          alert('Form submitted too quickly. Please try again.');
          return;
        }
        realSubmitInput.click();
      }
    });

    form.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        if (validateAndStartLiveValidationForAll()) {
          if (isSpam()) {
            alert('Form submitted too quickly. Please try again.');
            return;
          }
          realSubmitInput.click();
        }
      }
    });
  });
}

// Initialize Advanced Form Validation
document.addEventListener('DOMContentLoaded', () => {
  initAdvancedFormValidation();
});

function initTabSystem() {
  const wrappers = document.querySelectorAll('[data-tabs="wrapper"]');

  wrappers.forEach((wrapper) => {
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');

    const autoplay = wrapper.dataset.tabsAutoplay === "true";
    const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000;

    let activeContent = null;
    let activeVisual = null;
    let isAnimating = false;
    let progressBarTween = null;

    // Set all visual items and content details to invisible before anything starts
    gsap.set(visualItems, { autoAlpha: 0 });

    let hasStarted = false;

    function startProgressBar(index) {
      if (progressBarTween) progressBarTween.kill();
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
      if (!bar) return;

      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      progressBarTween = gsap.to(bar, {
        scaleX: 1,
        duration: autoplayDuration / 1000,
        ease: "power1.inOut",
        onComplete: () => {
          if (!isAnimating) {
            const nextIndex = (index + 1) % contentItems.length;
            switchTab(nextIndex);
          }
        },
      });
    }

    function switchTab(index) {
      if (isAnimating || contentItems[index] === activeContent) return;

      isAnimating = true;
      if (progressBarTween) progressBarTween.kill();

      const outgoingContent = activeContent;
      const outgoingVisual = activeVisual;
      const outgoingBar = outgoingContent?.querySelector('[data-tabs="item-progress"]');

      const incomingContent = contentItems[index];
      const incomingVisual = visualItems[index];
      const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]');

      outgoingContent?.classList.remove("active");
      outgoingVisual?.classList.remove("active");
      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");

      const tl = gsap.timeline({
        defaults: { duration: 0.65, ease: "power3" },
        onComplete: () => {
          activeContent = incomingContent;
          activeVisual = incomingVisual;
          isAnimating = false;
          if (autoplay) startProgressBar(index);
        },
      });

      if (outgoingContent) {
        outgoingContent.classList.remove("active");
        outgoingVisual?.classList.remove("active");
        tl.set(outgoingBar, { transformOrigin: "right center" })
          .to(outgoingBar, { scaleX: 0, duration: 0.3 }, 0)
          .to(outgoingVisual, { autoAlpha: 0, xPercent: 3 }, 0)
          .to(outgoingContent.querySelector('[data-tabs="item-details"]'), { height: 0 }, 0);
      }

      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");
      tl.fromTo(incomingVisual, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0 },
          0.3)
        .fromTo(incomingContent.querySelector(
          '[data-tabs="item-details"]'), { height: 0 }, { height: "auto" }, 0)
        .set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0);
    }

    // Only start when the wrapper enters the viewport
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (!hasStarted) {
          hasStarted = true;
          switchTab(0);
        }
      }
    });

    contentItems.forEach((item, i) =>
      item.addEventListener("click", () => {
        if (item === activeContent) return;
        switchTab(i);
      })
    );

  });
}

// Initialize Tab System with Autoplay Option
document.addEventListener('DOMContentLoaded', () => {
  initTabSystem();
});

function initDirectionalListHover() {

  const directionMap = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  };

  document.querySelectorAll('[data-directional-hover]').forEach(container => {
    const type = container.getAttribute('data-type') || 'all';

    container.querySelectorAll('[data-directional-hover-item]').forEach(item => {
      const tile = item.querySelector('[data-directional-hover-tile]');
      if (!tile) return;

      item.addEventListener('mouseenter', e => {
        const dir = getDirection(e, item, type);
        tile.style.transition = 'none';
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
        void tile.offsetHeight;
        tile.style.transition = '';
        tile.style.transform = 'translate(0%, 0%)';
        item.setAttribute('data-status', `enter-${dir}`);
      });

      item.addEventListener('mouseleave', e => {
        const dir = getDirection(e, item, type);
        item.setAttribute('data-status', `leave-${dir}`);
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
      });
    });

    function getDirection(event, el, type) {
      const { left, top, width: w, height: h } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;

      if (type === 'y') return y < h / 2 ? 'top' : 'bottom';
      if (type === 'x') return x < w / 2 ? 'left' : 'right';

      const distances = {
        top: y,
        right: w - x,
        bottom: h - y,
        left: x
      };

      return Object.entries(distances).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    }
  });
}

// Initialize Directional List Hover
document.addEventListener('DOMContentLoaded', () => {
  initDirectionalListHover();
});

function initModalBasic() {

  const modalGroup = document.querySelector('[data-modal-group-status]');
  const modals = document.querySelectorAll('[data-modal-name]');
  const modalTargets = document.querySelectorAll('[data-modal-target]');

  // Open modal
  modalTargets.forEach((modalTarget) => {
    modalTarget.addEventListener('click', function () {
      const modalTargetName = this.getAttribute('data-modal-target');

      // Close all modals
      modalTargets.forEach((target) => target.setAttribute('data-modal-status',
        'not-active'));
      modals.forEach((modal) => modal.setAttribute('data-modal-status', 'not-active'));

      // Activate clicked modal
      document.querySelector(`[data-modal-target="${modalTargetName}"]`).setAttribute(
        'data-modal-status', 'active');
      document.querySelector(`[data-modal-name="${modalTargetName}"]`).setAttribute(
        'data-modal-status', 'active');

      // Set group to active
      if (modalGroup) {
        modalGroup.setAttribute('data-modal-group-status', 'active');
      }

      // Lock body scroll
      locomotiveScroll.stop();
    });
  });

  // Close modal
  document.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
    closeBtn.addEventListener('click', closeAllModals);
  });

  // Close modal on `Escape` key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });

  // Function to close all modals
  function closeAllModals() {
    modalTargets.forEach((target) => target.setAttribute('data-modal-status', 'not-active'));

    if (modalGroup) {
      modalGroup.setAttribute('data-modal-group-status', 'not-active');
    }

    // Restore body scroll
    locomotiveScroll.start();
  }
}

// Initialize Basic Modal
document.addEventListener('DOMContentLoaded', () => {
  initModalBasic();
  initModalPDFs();
});

function initModalPDFs() {
  const pdfMap = {
    'modal-a': 'https://cdn.prod.website-files.com/697a48a85eea599d8eb6fdc4/69b07f4b14c36e3fffea8338_iso-8859-1%27%27Certifikat_20ISO_203834.pdf',
    'modal-b': 'https://cdn.prod.website-files.com/697a48a85eea599d8eb6fdc4/69b07f4bbe67b522da11e646_Certifikat.pdf',
  };

  Object.entries(pdfMap).forEach(([modalName, pdfUrl]) => {
    const card = document.querySelector(`[data-modal-name="${modalName}"]`);
    if (!card) return;

    const content = card.querySelector('.modal__content');
    if (!content) return;

    // Replace text content with a full-size PDF iframe
    content.innerHTML = '';
    content.classList.add('modal__content--pdf');

    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.className = 'modal__pdf-iframe';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', modalName);
    content.appendChild(iframe);
  });
}

function initCascadingSlider() {

  const duration = 0.65;
  const ease = 'power3.inOut';

  const breakpoints = [
    { maxWidth: 479, activeWidth: 0.78, siblingWidth: 0.08 },
    { maxWidth: 767, activeWidth: 0.70, siblingWidth: 0.10 },
    { maxWidth: 991, activeWidth: 0.60, siblingWidth: 0.10 },
    { maxWidth: Infinity, activeWidth: 0.60, siblingWidth: 0.13 },
  ];

  const wrappers = document.querySelectorAll('[data-cascading-slider-wrap]');
  wrappers.forEach(setupInstance);

  function setupInstance(wrapper) {
    const viewport = wrapper.querySelector('[data-cascading-viewport]');
    const prevButton = wrapper.querySelector('[data-cascading-slider-prev]');
    const nextButton = wrapper.querySelector('[data-cascading-slider-next]');
    const slides = Array.from(viewport.querySelectorAll('[data-cascading-slide]'));
    let totalSlides = slides.length;

    if (totalSlides === 0) return;

    if (totalSlides < 9) {
      const originalSlides = slides.slice();
      while (slides.length < 9) {
        originalSlides.forEach(function(original) {
          const clone = original.cloneNode(true);
          clone.setAttribute('data-clone', '');
          viewport.appendChild(clone);
          slides.push(clone);
        });
      }
      totalSlides = slides.length;
    }

    let activeIndex = 0;
    let isAnimating = false;
    let slideWidth = 0;
    let slotCenters = {};
    let slotWidths = {};

    function readGap() {
      const raw = getComputedStyle(viewport).getPropertyValue('--gap').trim();
      if (!raw) return 0;
      const temp = document.createElement('div');
      temp.style.width = raw;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      viewport.appendChild(temp);
      const px = temp.offsetWidth;
      viewport.removeChild(temp);
      return px;
    }

    function getSettings() {
      const windowWidth = window.innerWidth;
      for (let i = 0; i < breakpoints.length; i++) {
        if (windowWidth <= breakpoints[i].maxWidth) return breakpoints[i];
      }
      return breakpoints[breakpoints.length - 1];
    }

    function getOffset(slideIndex, fromIndex) {
      if (fromIndex === undefined) fromIndex = activeIndex;
      let distance = slideIndex - fromIndex;
      const half = totalSlides / 2;
      if (distance > half) distance -= totalSlides;
      if (distance < -half) distance += totalSlides;
      return distance;
    }

    function measure() {
      const settings = getSettings();
      const viewportWidth = viewport.offsetWidth;
      const gap = readGap();

      const activeSlideWidth = viewportWidth * settings.activeWidth;
      const siblingSlideWidth = viewportWidth * settings.siblingWidth;
      const farSlideWidth = Math.max(0, (viewportWidth - activeSlideWidth - 2 * siblingSlideWidth - 4 * gap) / 2);

      slideWidth = activeSlideWidth;

      const visibleSlots = [
        { slot: -2, width: farSlideWidth },
        { slot: -1, width: siblingSlideWidth },
        { slot: 0, width: activeSlideWidth },
        { slot: 1, width: siblingSlideWidth },
        { slot: 2, width: farSlideWidth },
      ];

      let x = 0;
      visibleSlots.forEach(function(def, i) {
        slotCenters[String(def.slot)] = x + def.width / 2;
        slotWidths[String(def.slot)] = def.width;
        if (i < visibleSlots.length - 1) x += def.width + gap;
      });

      slotCenters['-3'] = slotCenters['-2'] - farSlideWidth / 2 - gap - farSlideWidth / 2;
      slotWidths['-3'] = farSlideWidth;
      slotCenters['3'] = slotCenters['2'] + farSlideWidth / 2 + gap + farSlideWidth / 2;
      slotWidths['3'] = farSlideWidth;

      slides.forEach(function(slide) {
        slide.style.width = slideWidth + 'px';
      });
    }

    function getSlideProps(offset) {
      const clamped = Math.max(-3, Math.min(3, offset));
      const slotWidth = slotWidths[String(clamped)];
      const clipAmount = Math.max(0, (slideWidth - slotWidth) / 2);
      const translateX = slotCenters[String(clamped)] - slideWidth / 2;

      return {
        x: translateX,
        '--clip': clipAmount,
        zIndex: 10 - Math.abs(clamped),
      };
    }

    function layout(animate, previousIndex) {
      slides.forEach(function(slide, index) {
        const offset = getOffset(index);

        if (offset < -3 || offset > 3) {
          if (animate && previousIndex !== undefined) {
            const previousOffset = getOffset(index, previousIndex);
            if (previousOffset >= -2 && previousOffset <= 2) {
              const exitSlot = previousOffset < 0 ? -3 : 3;
              gsap.to(slide, Object.assign({}, getSlideProps(exitSlot), {
                duration: duration,
                ease: ease,
                overwrite: true,
              }));
              return;
            }
          }

          const parkSlot = offset < 0 ? -3 : 3;
          gsap.set(slide, getSlideProps(parkSlot));
          return;
        }

        const props = getSlideProps(offset);
        slide.setAttribute('data-status', offset === 0 ? 'active' : 'inactive');

        if (animate) {
          gsap.to(slide, Object.assign({}, props, {
            duration: duration,
            ease: ease,
            overwrite: true,
          }));
        } else {
          gsap.set(slide, props);
        }
      });
    }

    function goTo(targetIndex) {
      const normalizedTarget = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
      if (isAnimating || normalizedTarget === activeIndex) return;
      isAnimating = true;

      const previousIndex = activeIndex;
      const travelDirection = getOffset(normalizedTarget, previousIndex) > 0 ? 1 : -1;

      slides.forEach(function(slide, index) {
        const currentOffset = getOffset(index, previousIndex);
        const nextOffset = getOffset(index, normalizedTarget);
        const wasInRange = currentOffset >= -3 && currentOffset <= 3;
        const willBeVisible = nextOffset >= -2 && nextOffset <= 2;

        if (!wasInRange && willBeVisible) {
          const entrySlot = travelDirection > 0 ? 3 : -3;
          gsap.set(slide, getSlideProps(entrySlot));
        }

        const wasInvisible = Math.abs(currentOffset) >= 3;
        const willBeStaging = Math.abs(nextOffset) === 3;
        const crossesSides = currentOffset * nextOffset < 0;
        if (wasInvisible && willBeStaging && crossesSides) {
          gsap.set(slide, getSlideProps(nextOffset > 0 ? 3 : -3));
        }
      });

      activeIndex = normalizedTarget;
      layout(true, previousIndex);
      gsap.delayedCall(duration + 0.05, function() { isAnimating = false; });
    }

    if (prevButton) prevButton.addEventListener('click', function() { goTo(activeIndex - 1); });
    if (nextButton) nextButton.addEventListener('click', function() { goTo(activeIndex + 1); });

    slides.forEach(function(slide, index) {
      slide.addEventListener('click', function() {
        if (index !== activeIndex) goTo(index);
      });
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    });

    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        measure();
        layout(false);
      }, 100);
    });

    measure();
    layout(false);
  }
}

// Initialize Cascading Slider
document.addEventListener('DOMContentLoaded', function() {
  initCascadingSlider();
});

function initAccordionCSS() {
  document.querySelectorAll('[data-accordion-css-init]').forEach((accordion) => {
    const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

    accordion.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-accordion-toggle]');
      if (!toggle) return; // Exit if the clicked element is not a toggle

      const singleAccordion = toggle.closest('[data-accordion-status]');
      if (!singleAccordion) return; // Exit if no accordion container is found

      const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
      singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');
      
      // When [data-accordion-close-siblings="true"]
      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== singleAccordion) sibling.setAttribute('data-accordion-status', 'not-active');
        });
      }
    });
  });
}

// Initialize Accordion CSS
document.addEventListener('DOMContentLoaded', () => {
  initAccordionCSS();
});

// ———— Quick News Feed ————
function initNewsFeed() {
  // Build the DOM — wrapper uses display:contents so it has no layout impact
  const feed = document.createElement('div');
  feed.style.display = 'contents';
  feed.dataset.newsFeed = 'closed';

  const trigger = document.createElement('button');
  trigger.className = 'news-feed__trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'news-feed-panel');
  trigger.setAttribute('aria-label', 'Öppna nyhetsflöde');
  trigger.innerHTML = '<span class="news-feed__trigger-arrow"></span>';

  const panel = document.createElement('div');
  panel.className = 'news-feed__panel';
  panel.id = 'news-feed-panel';

  const header = document.createElement('div');
  header.className = 'news-feed__header';
  header.innerHTML = '<h2 class="news-feed__title">Senaste nytt</h2>';

  const list = document.createElement('ul');
  list.className = 'news-feed__list';
  list.innerHTML = '<li class="news-feed__item" style="text-align:center;color:#999;">Laddar nyheter…</li>';

  panel.appendChild(header);
  panel.appendChild(list);
  feed.appendChild(trigger);
  feed.appendChild(panel);
  document.body.appendChild(feed);

  // Fetch real articles from the /news collection page
  fetchNewsFeedArticles(list);

  // ———— Helpers ————
  let closeTimer = null;
  const CLOSE_DELAY = 450; // ms – enough to move the cursor to the panel

  function openFeed() {
    clearTimeout(closeTimer);
    feed.dataset.newsFeed = 'open';
    trigger.setAttribute('aria-expanded', 'true');
  }

  function scheduleFeedClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      feed.dataset.newsFeed = 'closed';
      trigger.setAttribute('aria-expanded', 'false');
    }, CLOSE_DELAY);
  }

  // ———— Hover-to-expand (desktop) ————
  trigger.addEventListener('mouseenter', openFeed);
  trigger.addEventListener('mouseleave', scheduleFeedClose);
  panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  panel.addEventListener('mouseleave', scheduleFeedClose);

  // ———— Touch / click fallback (mobile) ————
  trigger.addEventListener('click', () => {
    const isOpen = feed.dataset.newsFeed === 'open';
    if (isOpen) {
      clearTimeout(closeTimer);
      feed.dataset.newsFeed = 'closed';
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      openFeed();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feed.dataset.newsFeed === 'open') {
      clearTimeout(closeTimer);
      feed.dataset.newsFeed = 'closed';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (feed.dataset.newsFeed === 'open' && !feed.contains(e.target)) {
      clearTimeout(closeTimer);
      feed.dataset.newsFeed = 'closed';
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

async function fetchNewsFeedArticles(listEl) {
  const MAX_ARTICLES = 5;

  try {
    const res = await fetch('/news');
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Webflow collection items or fall back to any link pointing at /article/
    const items = doc.querySelectorAll('.w-dyn-item');
    const articles = [];

    if (items.length) {
      items.forEach((item) => {
        const link = item.querySelector('a[href*="/article/"]');
        if (!link) return;
        const url = link.getAttribute('href');

        // Extract heading text (try h-tags first, then the link text itself)
        // Clone and strip date/time nodes so the date doesn't leak into the title
        const headingEl = item.querySelector('h1, h2, h3, h4, h5, h6');
        let title = '';
        if (headingEl) {
          const clone = headingEl.cloneNode(true);
          clone.querySelectorAll('time, [class*="date"]').forEach(el => el.remove());
          title = clone.textContent.trim();
        }
        if (!title) {
          const linkClone = link.cloneNode(true);
          linkClone.querySelectorAll('time, [class*="date"]').forEach(el => el.remove());
          title = linkClone.textContent.trim();
        }

        // Try to grab an image from the collection list item itself
        const imgEl = item.querySelector('img');
        const image = imgEl ? (imgEl.getAttribute('src') || '') : '';

        // Extract date — look for a time element or a date-like text outside headings
        const timeEl = item.querySelector('time');
        let date = '';
        if (timeEl) {
          date = timeEl.textContent.trim();
        } else {
          // Also check for an element with a date-related class
          const dateEl = item.querySelector('[class*="date"]');
          if (dateEl) {
            date = dateEl.textContent.trim();
          } else {
            const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, {
              acceptNode(node) {
                // Skip text inside headings to avoid confusing title text with dates
                if (node.parentElement && node.parentElement.closest('h1, h2, h3, h4, h5, h6')) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            });
            while (walker.nextNode()) {
              const txt = walker.currentNode.textContent.trim();
              if (/\b\d{4}\b/.test(txt) && /[A-Za-z]/.test(txt) && txt.length < 40) {
                date = txt;
                break;
              }
            }
          }
        }

        articles.push({ title, url, date, image });
      });
    } else {
      // Fallback: no .w-dyn-item — grab all unique /article/ links
      const seen = new Set();
      doc.querySelectorAll('a[href*="/article/"]').forEach((link) => {
        const url = link.getAttribute('href');
        if (seen.has(url)) return;
        seen.add(url);
        articles.push({
          title: link.textContent.trim(),
          url,
          date: '',
          image: '',
        });
      });
    }

    // Limit to latest 5
    const latest = articles.slice(0, MAX_ARTICLES);

    // Render immediately with whatever images are available from the collection list
    listEl.innerHTML = '';

    if (!latest.length) {
      listEl.innerHTML = '<li class="news-feed__item" style="color:#999;">Inga nyheter att visa.</li>';
      return;
    }

    const liElements = latest.map((a) => {
      const li = document.createElement('li');
      li.className = 'news-feed__item';

      const imgMarkup = a.image
        ? `<div class="news-feed__item-img-wrap"><img class="news-feed__item-img" src="${a.image}" alt="" loading="lazy"></div>`
        : '<div class="news-feed__item-img-wrap"></div>';

      li.innerHTML =
        `<a href="${a.url}" class="news-feed__item-link">`
        + imgMarkup
        + `<div class="news-feed__item-body">`
        + (a.date ? `<span class="news-feed__item-date">${a.date}</span>` : '')
        + `<h3 class="news-feed__item-heading">${a.title}</h3>`
        + `</div>`
        + `</a>`;

      listEl.appendChild(li);
      return li;
    });

    // Lazily backfill missing images without blocking the UI
    latest.forEach((a, i) => {
      if (a.image) return;
      fetch(a.url)
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(html => {
          const articleDoc = new DOMParser().parseFromString(html, 'text/html');
          const ogImg = articleDoc.querySelector('meta[property="og:image"]');
          let src = '';
          if (ogImg && ogImg.getAttribute('content')) {
            src = ogImg.getAttribute('content');
          } else {
            const heroImg = articleDoc.querySelector('.hero img, .subpage-hero img, [class*="hero"] img, article img, .w-richtext img');
            if (heroImg) src = heroImg.getAttribute('src') || '';
          }
          if (src) {
            const wrap = liElements[i].querySelector('.news-feed__item-img-wrap');
            if (wrap) wrap.innerHTML = `<img class="news-feed__item-img" src="${src}" alt="" loading="lazy">`;
          }
        })
        .catch(() => {});
    });
  } catch (err) {
    listEl.innerHTML =
      '<li class="news-feed__item" style="color:#999;">Kunde inte ladda nyheter.</li>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNewsFeed();
});

function initStickyStepsBasic() {
  const container = document.querySelector("[data-sticky-steps-init]");
  if (!container) return;

  const items = [...container.querySelectorAll("[data-sticky-steps-item]")];
  if (!items.length) return;

  function updateSteps() {
    const viewportCenter = window.innerHeight / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    items.forEach((item, index) => {
      const anchor = item.querySelector("[data-sticky-steps-anchor]");
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const anchorCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - anchorCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    items.forEach((item, index) => {
      let status = "active";

      if (index < closestIndex) status = "before";
      if (index > closestIndex) status = "after";

      item.setAttribute("data-sticky-steps-item-status", status);
    });
  }

  window.addEventListener("scroll", updateSteps);
  window.addEventListener("resize", updateSteps);

  requestAnimationFrame(updateSteps);
}

// Initialize Sticky Steps (Basic)
document.addEventListener('DOMContentLoaded', function () {
  initStickyStepsBasic();
});