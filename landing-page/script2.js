// ID: landingSlideTransition_v1.6

window.addEventListener('load', function () {
  var cards = document.querySelectorAll('.card');
  var detailPage = document.getElementById('detailPage');
  var detailContent = document.getElementById('detailContent');
  var cardSection = document.getElementById('cardSection');

  function animateCardsIn() {
    cards.forEach(function (card) {
      card.classList.remove('slide-out', 'show');
      card.classList.add('start');
    });

    void document.body.offsetHeight;

    cards.forEach(function (card, index) {
      setTimeout(function () {
        card.classList.remove('start');
        card.classList.add('show');
      }, index * 200);
    });
  }

  function onCardClick(e) {
    var clickedCard = e.currentTarget;
    var clickedIndex = Array.from(cards).indexOf(clickedCard);

    var icon = clickedCard.querySelector('.icon').outerHTML;
    var title = clickedCard.querySelector('h2').textContent;
    var paragraph = clickedCard.querySelector('p').textContent;

    var detailHTML = `
      <button class="close-btn" aria-label="Close">×</button>
      ${icon}
      <h2>${title}</h2>
      <p>${paragraph}</p>
    `;

    cards.forEach(function (card, index) {
      var delay = Math.abs(index - clickedIndex) * 150;
      setTimeout(function () {
        card.classList.add('slide-out');
      }, delay);
    });

    var maxDelay = (cards.length - 1) * 150 + 200;
    setTimeout(function () {
      detailPage.classList.add('show');
      detailContent.innerHTML = detailHTML;

      setTimeout(function () {
        var closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            detailPage.classList.remove('show');
            setTimeout(function () {
              animateCardsIn();
            }, 400);
          });
        }
      }, 50);
    }, maxDelay);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', onCardClick);
  });

  animateCardsIn();

  // === Switch-style Dark Mode Toggle ===
  const themeToggleCheckbox = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark');
    themeToggleCheckbox.checked = true;
  }

  themeToggleCheckbox.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  });
  // === Hamburger Menu Toggle ===
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', function () {
  mobileMenu.classList.toggle('show');
});

});
