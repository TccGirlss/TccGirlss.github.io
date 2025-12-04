function logout() {
  localStorage.removeItem("usuario_id");
  window.location.href = '/logout';
}

const style = document.createElement('style');
style.textContent = `
      .menu-link {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        color: inherit;
        width: 100%;
        padding: 8px 8px;
      }
      
      .menu-link:hover {
        background: rgba(0,0,0,0.03);
        border-radius: 8px;
      }
    `;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function () {
  const topbarFixed = document.querySelector('.topbar-fixed');
  const userProfileFixed = document.querySelector('.topbar-fixed .user-profile');

  if (topbarFixed) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 100) {
        topbarFixed.classList.add('sticky');
        if (userProfileFixed) userProfileFixed.classList.add('sticky');
      } else {
        topbarFixed.classList.remove('sticky');
        if (userProfileFixed) userProfileFixed.classList.remove('sticky');
      }
    });
  }

  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');

  if (toggle && overlay) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('expanded');
    });

    overlay.addEventListener('click', function () {
      sidebar.classList.remove('expanded');
    });

    document.querySelectorAll('.menu li').forEach(item => {
      item.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('expanded');
        }
      });
    });
  }

  fetch('/api/usuario/info')
    .then(res => res.json())
    .then(usuario => {
      if (usuario.nome) {
        document.querySelectorAll('.user-text .name').forEach(el => {
          el.textContent = usuario.nome;
        });
      }
    })
    .catch(err => {
      console.error('Erro ao carregar informações do usuário:', err);
      document.querySelectorAll('.user-text .name').forEach(el => {
        el.textContent = 'Usuária';
      });
    });
});