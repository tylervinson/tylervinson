window.addEventListener('load', function () {
  const cards = document.querySelectorAll('.card');
  const detailPage = document.getElementById('detailPage');
  const detailContent = document.getElementById('detailContent');
  const cardSection = document.getElementById('cardSection');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const themeToggleCheckbox = document.getElementById('themeToggle');
  const siteLogo = document.getElementById('siteLogo');

  function setThemeMode(isDark) {
    if (isDark) {
      document.body.classList.add('dark');
      themeToggleCheckbox.checked = true;
      localStorage.setItem('theme', 'dark');
      if (siteLogo) siteLogo.src = 'logo-dark.svg';
    } else {
      document.body.classList.remove('dark');
      themeToggleCheckbox.checked = false;
      localStorage.setItem('theme', 'light');
      if (siteLogo) siteLogo.src = 'logo-light.svg';
    }
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setThemeMode(true);
  } else {
    setThemeMode(false);
  }

  themeToggleCheckbox.addEventListener('change', function () {
    setThemeMode(this.checked);
  });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('show');
    });
  }

  function animateCardsIn() {
    cards.forEach(function (card) {
      card.classList.remove('slide-out', 'show', 'start');
    });

    void document.body.offsetHeight;

    cards.forEach(function (card, index) {
      setTimeout(function () {
        card.classList.add('show');
      }, index * 200);
    });
  }

  function onCardClick(e) {
    const clickedCard = e.currentTarget;
    const clickedIndex = Array.from(cards).indexOf(clickedCard);
    const title = clickedCard.querySelector('h2').textContent;
    const dataPage = clickedCard.getAttribute('data-page');

    let closeBtn;

    if (title === 'Wellness') {
      const steps = document.querySelectorAll('.step-section');
      detailContent.innerHTML = '';
      steps.forEach(step => detailContent.appendChild(step.cloneNode(true)));
    } else {
      const detailBlock = document.getElementById('detail-' + dataPage);
      detailContent.innerHTML = detailBlock ? detailBlock.innerHTML : '';
    }

    cards.forEach(function (card, index) {
      const delay = Math.abs(index - clickedIndex) * 150;
      setTimeout(function () {
        card.classList.add('slide-out');
      }, delay);
    });

    const maxDelay = (cards.length - 1) * 150 + 200;
    setTimeout(function () {
      detailPage.classList.add('show');

      closeBtn = document.querySelector('.close-btn');
      if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '&times;';
        detailContent.appendChild(closeBtn);
      }

      closeBtn.addEventListener('click', function () {
        detailPage.classList.remove('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        cards.forEach(function (card) {
          card.classList.remove('show', 'slide-out');
          card.classList.add('start');
        });

        void document.body.offsetHeight;

        setTimeout(function () {
          cards.forEach(function (card, index) {
            setTimeout(function () {
              card.classList.remove('start');
              card.classList.add('show');
            }, index * 200);
          });
        }, 400);
      });
    }, maxDelay);
  }

  cards.forEach(function (card) {
    if (!card.classList.contains('disabled')) {
      card.addEventListener('click', onCardClick);
    }
  });

  animateCardsIn();
});

function goToStep(stepNumber) {
  const current = document.querySelector('.step-section:not([style*="display: none"])');
  const next = document.getElementById('step' + stepNumber);
  const prev = document.getElementById('step' + (stepNumber - 2));
  if (!next) return;

  const tooltip = current.querySelector('.stat-box');
  tooltip.style.animation = 'fadeOutDown 0.4s ease both';

  setTimeout(function () {
    current.style.display = 'none';
    next.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 400);
} // End landingScript_v2.5
