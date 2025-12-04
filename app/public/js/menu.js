document.addEventListener('DOMContentLoaded', function () {
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

  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');

  if (toggle) toggle.style.display = 'none';

  sidebar.addEventListener('mouseenter', () => {
    sidebar.classList.add('expanded');
  });

  sidebar.addEventListener('mouseleave', () => {
    sidebar.classList.remove('expanded');
  });

  const topbarFixed = document.querySelector('.topbar-fixed');
  const userProfileFixed = document.querySelector('.topbar-fixed .user-profile');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 100) {
      topbarFixed?.classList.add('sticky');
      userProfileFixed?.classList.add('sticky');
    } else {
      topbarFixed?.classList.remove('sticky');
      userProfileFixed?.classList.remove('sticky');
    }
  });
});

function logout() {
  Swal.fire({
    title: 'Sair da Girlslly?',
    text: 'Você tem certeza que deseja encerrar sua sessão?',
    iconHtml: '💜',
    showCancelButton: true,
    confirmButtonText: 'Sim, quero sair',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#7c6cff',
    cancelButtonColor: '#aaa',
    background: '#fff9f9',
    color: '#333',

  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('usuario_id');

      fetch('/logout', { method: 'POST' })
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Logout realizado com sucesso',
            showConfirmButton: false,
            timer: 1500,
            background: '#fff9f9',
            color: '#333'
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        })
        .catch(() => {
          Swal.fire({
            icon: 'error',
            title: 'Erro ao sair',
            text: 'Tente novamente mais tarde.',
            background: '#fff9f9',
            color: '#333'
          });
        });
    }
  });
}

