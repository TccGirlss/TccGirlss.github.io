    let currentIndex = 0;
    const carousel = document.getElementById('carousel');
    const cardWidth = 500; // largura do card + margem

    function moveCarousel(direction) {
      const totalCards = carousel.children.length;
      currentIndex += direction;

      if (currentIndex < 0) currentIndex = 0;
      if (currentIndex > totalCards - 1) currentIndex = totalCards - 1;

      carousel.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }
