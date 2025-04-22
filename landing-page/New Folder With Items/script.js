// ID: landingScript_v2.0

window.addEventListener('load', function () {
  const cards = document.querySelectorAll('.card');
  const detailPage = document.getElementById('detailPage');
  const detailContent = document.getElementById('detailContent');
  const cardSection = document.getElementById('cardSection');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const themeToggleCheckbox = document.getElementById('themeToggle');
  const siteLogo = document.getElementById('siteLogo');

  // === Dark Mode Toggle + Logo Swap ===
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

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

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setThemeMode(true);
  } else {
    setThemeMode(false);
  }

  themeToggleCheckbox.addEventListener('change', function () {
    setThemeMode(this.checked);
  });

  // === Hamburger Menu Toggle ===
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('show');
    });
  }

  // === Card Reset Animation ===
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
  

  // === Card Click → Detail View ===
  function onCardClick(e) {
    const clickedCard = e.currentTarget;
    const clickedIndex = Array.from(cards).indexOf(clickedCard);

    const icon = clickedCard.querySelector('.icon').outerHTML;
    const title = clickedCard.querySelector('h2').textContent;
    const paragraph = clickedCard.querySelector('p').textContent;

    const detailHTML = `
      <button class="close-btn" aria-label="Close">×</button>
      ${icon}
      <h2>${title}</h2>
      <p>${paragraph}</p>
    `;

    cards.forEach(function (card, index) {
      const delay = Math.abs(index - clickedIndex) * 150;
      setTimeout(function () {
        card.classList.add('slide-out');
      }, delay);
    });

    const maxDelay = (cards.length - 1) * 150 + 200;
    setTimeout(function () {
      detailPage.classList.add('show');
      detailContent.innerHTML = detailHTML;

      setTimeout(function () {
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            detailPage.classList.remove('show');
          
            // Reset inline styles before animating cards back in
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
          
        }
      }, 50);
    }, maxDelay);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', onCardClick);
  });

  // === Initial Animation
  animateCardsIn();
});
