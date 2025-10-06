!function() {

  var today = moment();

  // Mapeamento de sintomas → ícones
  const SYMPTOM_ICONS = {
    "Cólica": "🥴",
    "Inchaço": "🤰",
    "Náusea": "🤢",
    "Dor de cabeça": "🤕",
    "Indisposição": "🔋",
    "Dores musculares": "💪",
    "Alteração de humor": "😡",
    "Acne": "🍔",
    "Diarreia": "🚽",
    "Aumento na frequência urinária": "🚻"
  };

  function Calendar(selector, events) {
    this.el = document.querySelector(selector);
    this.events = events;
    this.current = moment().date(1);
    this.draw();
    var current = document.querySelector('.today');
    if(current) {
      var self = this;
      window.setTimeout(function() {
        self.openDay(current);
      }, 500);
    }
    this.modal = document.getElementById('eventModal');
    this.closeButton = this.modal.querySelector('.close-button');
    this.saveButton = this.modal.querySelector('#saveDailyRecord');
    this.symptomsList = this.modal.querySelector('#symptomsList');
    this.medicationInput = this.modal.querySelector('#medicationInput');
    this.selectedDate = null;

    var self = this;
    this.closeButton.addEventListener('click', function() {
      self.closeModal();
    });

    window.addEventListener('click', function(event) {
      if (event.target == self.modal) {
        self.closeModal();
      }
    });

    this.saveButton.addEventListener('click', function() {
      self.saveDailyRecord();
    });
  }

  Calendar.prototype.draw = function() {
    this.drawHeader();
    this.drawMonth();
  }

  Calendar.prototype.drawHeader = function() {
    var self = this;
    if(!this.header) {
      this.header = createElement('div', 'header');
      this.title = createElement('h1');

      var right = createElement('div', 'right');
      right.addEventListener('click', function() { self.nextMonth(); });

      var left = createElement('div', 'left');
      left.addEventListener('click', function() { self.prevMonth(); });

      this.header.appendChild(this.title);
      this.header.appendChild(right);
      this.header.appendChild(left);

      // Inserir o header antes de qualquer outro filho do container
      if (this.el.firstChild) {
        this.el.insertBefore(this.header, this.el.firstChild);
      } else {
        this.el.appendChild(this.header);
      }

      /* Removida a criação do cabeçalho fixo dos dias da semana (weekdays) */
    }
    this.title.innerHTML = this.current.format('MMMM YYYY');
  }

  Calendar.prototype.drawMonth = function() {
    if (this.month) {
      this.month.remove();
    }
    this.month = createElement('div', 'month');
    this.el.appendChild(this.month);
    this.backFill();
    this.currentMonth();
    this.fowardFill();
  }

  Calendar.prototype.backFill = function() {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();
    if(!dayOfWeek) return;
    clone.subtract(dayOfWeek + 1, 'days');
    for(var i = dayOfWeek; i > 0 ; i--) {
      this.drawDay(clone.add(1, 'days'));
    }
  }

  Calendar.prototype.fowardFill = function() {
    var clone = this.current.clone().add(1, 'months').subtract(1, 'days');
    var dayOfWeek = clone.day();
    if(dayOfWeek === 6) return;
    for(var i = dayOfWeek; i < 6 ; i++) {
      this.drawDay(clone.add(1, 'days'));
    }
  }

  Calendar.prototype.currentMonth = function() {
    var clone = this.current.clone();
    while(clone.month() === this.current.month()) {
      this.drawDay(clone);
      clone.add(1, 'days');
    }
  }

  Calendar.prototype.getWeek = function(day) {
    if(!this.week || day.day() === 0) {
      this.week = createElement('div', 'week');
      this.month.appendChild(this.week);
    }
  }

  Calendar.prototype.drawDay = function(day) {
    var self = this;
    this.getWeek(day);
    var outer = createElement('div', this.getDayClass(day));

    this.events.forEach(function(ev) {
      if (ev.type === 'menstruation_period') {
        var endDate = ev.date.clone().add(ev.duration - 1, 'days');
        if (day.isSameOrAfter(ev.date, 'day') && day.isSameOrBefore(endDate, 'day')) {
          outer.classList.add('menstrual-period');
        }
      }
    });

    outer.addEventListener('click', function() {
      self.openDay(this);
    });

    var name = createElement('div', 'day-name', day.format('ddd')); // MANTIDO: Dia da semana dentro da célula
    var number = createElement('div', 'day-number', day.format('DD'));

    var eventsDisplay = createElement('div', 'day-events');
    this.drawEvents(day, eventsDisplay);

    outer.appendChild(name);
    outer.appendChild(number);
    outer.appendChild(eventsDisplay);
    this.week.appendChild(outer);
  }

  Calendar.prototype.drawEvents = function(day, element) {
    if(day.month() === this.current.month()) {
      var dailyRecords = this.events.filter(ev => ev.type === 'daily_record' && ev.date.isSame(day, 'day'));
      var menstruationStarts = this.events.filter(ev => ev.type === 'menstruation_period' && ev.date.isSame(day, 'day'));
      var menstruationEnds = this.events.filter(ev => ev.type === 'menstruation_period' && day.isSame(ev.date.clone().add(ev.duration - 1, 'days'), 'day'));
      
      menstruationStarts.forEach(() => {
        var evSpan = createElement('span', 'purple');
        element.appendChild(evSpan);
      });
      menstruationEnds.forEach(() => {
        var evSpan = createElement('span', 'green');
        element.appendChild(evSpan);
      });
      dailyRecords.forEach(ev => {
        var evSpan = createElement('span', ev.color);
        element.appendChild(evSpan);
      });
    }
  }

  Calendar.prototype.getDayClass = function(day) {
    var classes = ['day'];
    if(day.month() !== this.current.month()) {
      classes.push('other');
    } else if (today.isSame(day, 'day')) {
      classes.push('today');
    }
    return classes.join(' ');
  }

  Calendar.prototype.openDay = function(el) {
    document.querySelectorAll('.day.selected-day').forEach(d => d.classList.remove('selected-day'));
    el.classList.add('selected-day');

    var details;
    var dayNumber = +el.querySelectorAll('.day-number')[0].innerText || +el.querySelectorAll('.day-number')[0].textContent;
    var day = this.current.clone().date(dayNumber);
    this.selectedDate = day.format("YYYY-MM-DD");

    var currentOpened = document.querySelector('.details');
    if(currentOpened) {
      currentOpened.parentNode.removeChild(currentOpened);
    }
    
    details = createElement('div', 'details in');
    el.parentNode.appendChild(details);

    var closeBtn = createElement('span', 'details-close', '×');
    closeBtn.onclick = function() {
        details.parentNode.removeChild(details);
        el.classList.remove('selected-day');
    };
    details.appendChild(closeBtn);

    var todaysEvents = this.events.reduce(function(memo, ev) {
      if(ev.date.isSame(day, 'day') && ev.type !== 'menstruation_period') {
        memo.push(ev);
      }
      return memo;
    }, []);

    this.events.forEach(function(ev) {
      if (ev.type === 'menstruation_period') {
        var endDate = ev.date.clone().add(ev.duration - 1, 'days');
        if (day.isSame(ev.date, 'day')) {
          todaysEvents.push({ eventName: 'Início Menstruação', color: 'purple', type: 'menstruation_period' });
        } else if (day.isSame(endDate, 'day')) {
          todaysEvents.push({ eventName: 'Fim Menstruação (previsão)', color: 'green', type: 'menstruation_period' });
        } else if (day.isSameOrAfter(ev.date, 'day') && day.isSameOrBefore(endDate, 'day')) {
          todaysEvents.push({ eventName: 'Período Menstrual', color: 'no_display_color', type: 'menstruation_period' });
        }
      }
    });

    this.renderEvents(todaysEvents, details);

    var buttonWrapper = createElement('div', 'details-buttons');
    var self = this;
    var addRecordBtn = createElement('button', 'add-event-button', 'Adicionar Registro Diário');
    addRecordBtn.onclick = function() { self.openModal(); };
    buttonWrapper.appendChild(addRecordBtn);
    var addMenstruationBtn = createElement('button', 'add-menstruation-button', 'Registrar Menstruação');
    addMenstruationBtn.onclick = function() { self.registerMenstruation(); };
    buttonWrapper.appendChild(addMenstruationBtn);

    if (day.isAfter(moment(), 'day')) {
      addRecordBtn.style.display = 'none';
      addMenstruationBtn.style.display = 'none';
      var futureDateMessage = createElement('p', 'future-date-message', 'Não é possível adicionar registros para datas futuras.');
      buttonWrapper.appendChild(futureDateMessage);
    }

    details.appendChild(buttonWrapper);
  }

  Calendar.prototype.renderEvents = function(events, ele) {
    var currentWrapper = ele.querySelector('.events');
    var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));
    events.forEach(function(ev) {
      var div = createElement('div', 'event');
      var square = createElement('div', 'event-category ' + ev.color);

      if (ev.type === 'daily_record') {
        let wrapperDiv = createElement('div', 'daily-record-wrapper');
        let title = createElement('strong', '', 'Registro Diário');
        wrapperDiv.appendChild(title);

        let symptomsList = createElement('ul', 'symptoms-list');
        if (ev.symptoms && ev.symptoms.length > 0) {
          ev.symptoms.split(",").map(s => s.trim()).forEach(symptom => {
            let li = document.createElement('li');
            let icon = SYMPTOM_ICONS[symptom] || "•";
            li.textContent = `${icon} ${symptom}`;
            symptomsList.appendChild(li);
          });
        } else {
          let li = document.createElement('li');
          li.textContent = "Nenhum sintoma informado";
          symptomsList.appendChild(li);
        }
        wrapperDiv.appendChild(symptomsList);

        let med = createElement('p', '', `💊 Medicamento: ${ev.medication || '-'}`);
        wrapperDiv.appendChild(med);

        div.appendChild(square);
        div.appendChild(wrapperDiv);
      } else {
        let text = ev.eventName;
        if (ev.type === 'menstruation_period' && ev.eventName === 'Início Menstruação') text = "Início da Menstruação";
        if (ev.type === 'menstruation_period' && ev.eventName === 'Período Menstrual') text = "Período Menstrual";
        if (ev.type === 'menstruation_period' && ev.eventName === 'Fim Menstruação (previsão)') text = "Fim da Menstruação";
        var span = createElement('span', '', text);
        if (ev.color !== 'no_display_color') div.appendChild(square);
        div.appendChild(span);
      }
      wrapper.appendChild(div);
    });

    if(!events.length) {
      var div = createElement('div', 'event empty');
      var span = createElement('span', '', 'Sem eventos');
      div.appendChild(span);
      wrapper.appendChild(div);
    }
    if(currentWrapper) {
      currentWrapper.parentNode.removeChild(currentWrapper);
      ele.appendChild(wrapper);
    } else {
      ele.appendChild(wrapper);
    }
  }

  Calendar.prototype.openModal = function() {
    this.modal.classList.add('show');
    this.symptomsList.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  }

  Calendar.prototype.closeModal = function() {
    this.modal.classList.remove('show');
  }

  Calendar.prototype.saveDailyRecord = function() {
    var symptoms = Array.from(this.symptomsList.querySelectorAll('input:checked'))
      .map(cb => cb.value).join(', ');
    var medication = this.medicationInput.value;

    if (this.selectedDate) {
      var selectedMomentDate = moment(this.selectedDate, "YYYY-MM-DD");
      if (selectedMomentDate.isAfter(moment(), 'day')) {
        alert("Não é possível adicionar registros diários para datas futuras.");
        this.closeModal();
        return;
      }
      this.addEvent({
        eventName: 'Registro Diário',
        calendar: 'Saúde',
        color: 'blue',
        date: this.selectedDate,
        symptoms: symptoms,
        medication: medication,
        type: 'daily_record'
      });
      this.closeModal();
      var dayElement = document.querySelector('.day.selected-day');
      if (dayElement) this.openDay(dayElement);
    } else {
      alert("Por favor, selecione um dia no calendário primeiro.");
    }
  }

  Calendar.prototype.registerMenstruation = function() {
    if (this.selectedDate) {
      var selectedMomentDate = moment(this.selectedDate, "YYYY-MM-DD");
      if (selectedMomentDate.isAfter(moment(), 'day')) {
        alert("Não é possível registrar menstruação para datas futuras.");
        return;
      }
      this.addEvent({
        eventName: 'Início Menstruação',
        color: 'purple',
        date: this.selectedDate,
        type: 'menstruation_period',
        duration: 5
      });
      var dayElement = document.querySelector('.day.selected-day');
      if (dayElement) this.openDay(dayElement);
    } else {
      alert("Por favor, selecione um dia para registrar a menstruação.");
    }
  }

  Calendar.prototype.nextMonth = function() {
    this.current.add(1, 'months');
    this.draw();
  }
  Calendar.prototype.prevMonth = function() {
    this.current.subtract(1, 'months');
    this.draw();
  }

  Calendar.prototype.addEvent = function(event) {
    this.events.push({
      eventName: event.eventName || '',
      calendar: event.calendar || '',
      color: event.color || '',
      date: moment(event.date, "YYYY-MM-DD"),
      symptoms: event.symptoms || '',
      medication: event.medication || '',
      type: event.type || 'daily_record',
      duration: event.duration || 0
    });
    this.draw();
  };

  window.Calendar = Calendar;

  function createElement(tagName, className, innerText) {
    var ele = document.createElement(tagName);
    if(className) ele.className = className;
    if(innerText) ele.innerText = ele.textContent = innerText;
    return ele;
  }
}();

/* ------------------ Inicialização e UI (sidebar + carrossel) ------------------ */
document.addEventListener('DOMContentLoaded', function() {
  // inicializa calendário
  const calendar = new Calendar('#calendar', []);

  // CONTROLE DO SIDEBAR
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  toggle.addEventListener('click', function(e){
    e.stopPropagation();
    sidebar.classList.toggle('expanded');
  });
  // clique fora do sidebar fecha quando expandido
  document.addEventListener('click', function(e){
    if (!sidebar.contains(e.target) && sidebar.classList.contains('expanded')) {
      sidebar.classList.remove('expanded');
    }
  });

  // CARROSSEL SIMPLES
  const track = document.querySelector('.carousel-track');
  const prev = document.querySelector('.carousel-prev');
  const next = document.querySelector('.carousel-next');
  const dots = Array.from(document.querySelectorAll('.carousel-dot'));
  if (track) {
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    let index = 0;

    function updateCarousel() {
      const gap = 16; // deve espelhar o gap do CSS
      if (items.length === 0) return;

      // Obtém a largura computada, que agora é dinâmica (calc((100% - 32px) / 2.5))
      const itemWidth = items[0].getBoundingClientRect().width;
      
      const move = index * (itemWidth + gap);
      track.style.transform = `translateX(${-move}px)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
      
      // Lógica para desabilitar setas
      prev.disabled = index === 0;
      // Calcula o número máximo de itens visíveis para determinar o limite do next.
      // 2.5 é o número de itens visíveis na configuração desktop/maior
      // 1.5 é o número de itens visíveis na configuração mobile (<900px)
      const visibleItems = window.innerWidth > 900 ? 2.5 : 1.5;
      const maxIndex = Math.ceil(items.length - visibleItems); 
      next.disabled = index >= maxIndex; 
    }

    prev?.addEventListener('click', function() {
      if (index > 0) index--;
      updateCarousel();
    });
    next?.addEventListener('click', function() {
      // Re-calcula para garantir que não avance demais, usando a lógica do updateCarousel
      const visibleItems = window.innerWidth > 900 ? 2.5 : 1.5;
      const maxIndex = Math.ceil(items.length - visibleItems); 
      if (index < maxIndex) index++;
      updateCarousel();
    });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', function() {
        index = i;
        updateCarousel();
      });
    });

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
  }

  // Modal: fechar com Esc
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('eventModal');
      if (modal && modal.classList.contains('show')) modal.classList.remove('show');
    }
  });
});