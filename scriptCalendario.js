!function() {

  var today = moment(); // Obtém o dia atual

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
    this.symptomsInput = this.modal.querySelector('#symptomsInput'); // Novo input
    this.medicationInput = this.modal.querySelector('#medicationInput'); // Novo input
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
      this.header.className = 'header';

      this.title = createElement('h1');

      var right = createElement('div', 'right');
      right.addEventListener('click', function() { self.nextMonth(); });

      var left = createElement('div', 'left');
      left.addEventListener('click', function() { self.prevMonth(); });

      this.header.appendChild(this.title);
      this.header.appendChild(right);
      this.header.appendChild(left);
      this.el.appendChild(this.header);
    }

    this.title.innerHTML = this.current.format('MMMMYYYY');
  }

  Calendar.prototype.drawMonth = function() {
    var self = this;

    if(this.month) {
      this.oldMonth = this.month;
      this.oldMonth.className = 'month out ' + (self.next ? 'next' : 'prev');
      this.oldMonth.addEventListener('webkitAnimationEnd', function() {
        self.oldMonth.parentNode.removeChild(self.oldMonth);
        self.month = createElement('div', 'month');
        self.backFill();
        self.currentMonth();
        self.fowardFill();
        self.el.appendChild(self.month);
        window.setTimeout(function() {
          self.month.className = 'month in ' + (self.next ? 'next' : 'prev');
        }, 16);
      });
    } else {
        this.month = createElement('div', 'month');
        this.el.appendChild(this.month);
        this.backFill();
        this.currentMonth();
        this.fowardFill();
        this.month.className = 'month new';
    }
  }

  Calendar.prototype.backFill = function() {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();

    if(!dayOfWeek) { return; }

    clone.subtract(dayOfWeek + 1, 'days');

    for(var i = dayOfWeek; i > 0 ; i--) {
      this.drawDay(clone.add(1, 'days'));
    }
  }

  Calendar.prototype.fowardFill = function() {
    var clone = this.current.clone().add(1, 'months').subtract(1, 'days');
    var dayOfWeek = clone.day();

    if(dayOfWeek === 6) { return; }

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

    // Lógica para adicionar círculo branco para dias de menstruação
    this.events.forEach(function(ev) {
      if (ev.type === 'menstruation_period') {
        var endDate = ev.date.clone().add(ev.duration - 1, 'days');
        if (day.isSameOrAfter(ev.date, 'day') && day.isSameOrBefore(endDate, 'day')) {
          outer.classList.add('circled-day');
        }
      }
    });

    outer.addEventListener('click', function() {
      self.openDay(this);
    });

    var name = createElement('div', 'day-name', day.format('ddd'));
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
      var todaysEvents = this.events.reduce(function(memo, ev) {
        // EXCLUSÃO AQUI: Exclua 'menstruation_period' da lista inicial para evitar duplicidade.
        if(ev.date.isSame(day, 'day') && ev.type !== 'menstruation_period') {
          memo.push(ev);
        }
        return memo;
      }, []);

      // Adiciona marcadores de menstruação ao início e fim do período
      this.events.forEach(function(ev) {
        if (ev.type === 'menstruation_period') {
          var endDate = ev.date.clone().add(ev.duration - 1, 'days');
          // Adiciona um evento temporário para o marcador roxo APENAS se for o dia de início ou fim
          if (day.isSame(ev.date, 'day') || day.isSame(endDate, 'day')) {
            todaysEvents.push({ eventName: ev.eventName, color: 'purple', isMenstruationMarker: true });
          }
        }
      });

      todaysEvents.forEach(function(ev) {
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
    var details, arrow;
    var dayNumber = +el.querySelectorAll('.day-number')[0].innerText || +el.querySelectorAll('.day-number')[0].textContent;
    var day = this.current.clone().date(dayNumber);
    this.selectedDate = day.format("YYYY-MM-DD");

    var currentOpened = document.querySelector('.details');

    if(currentOpened && currentOpened.parentNode === el.parentNode) {
      details = currentOpened;
      arrow = document.querySelector('.arrow');
      details.innerHTML = '';
      details.appendChild(arrow);
    } else {
      if(currentOpened) {
        currentOpened.addEventListener('animationend', function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.className = 'details out';
      }

      details = createElement('div', 'details in');
      arrow = createElement('div', 'arrow');

      details.appendChild(arrow);
      el.parentNode.appendChild(details);
    }

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
          todaysEvents.push({ eventName: 'Início Menstruação', color: 'purple' });
        } else if (day.isSame(endDate, 'day')) {
          todaysEvents.push({ eventName: 'Fim Menstruação', color: 'purple' });
        } else if (day.isSameOrAfter(ev.date, 'day') && day.isSameOrBefore(endDate, 'day')) {
          todaysEvents.push({ eventName: 'Período Menstrual', color: 'no_display_color' });
        }
      }
    });

    this.renderEvents(todaysEvents, details);

    arrow.style.left = el.offsetLeft - el.parentNode.offsetLeft + 27 + 'px';

    var buttonWrapper = createElement('div', 'details-buttons');
    var self = this;

    var addRecordBtn = createElement('button', 'add-event-button', 'Adicionar Registro Diário');
    addRecordBtn.onclick = function() {
      self.openModal();
    };
    buttonWrapper.appendChild(addRecordBtn);

    var addMenstruationBtn = createElement('button', 'add-menstruation-button', 'Registrar Menstruação');
    addMenstruationBtn.onclick = function() {
      self.registerMenstruation();
    };
    buttonWrapper.appendChild(addMenstruationBtn);

    // Lógica para ocultar botões em datas futuras
    if (day.isAfter(moment(), 'day')) { // Compara com o 'today' global
        addRecordBtn.style.display = 'none';
        addMenstruationBtn.style.display = 'none';
        var futureDateMessage = createElement('p', 'future-date-message', 'Não é possível adicionar registros para datas futuras.');
        buttonWrapper.appendChild(futureDateMessage);
    } else {
        addRecordBtn.style.display = 'block'; // Garante que estejam visíveis para datas passadas/atuais
        addMenstruationBtn.style.display = 'block';
    }


    details.appendChild(buttonWrapper);
  }

  Calendar.prototype.renderEvents = function(events, ele) {
    var currentWrapper = ele.querySelector('.events');
    var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));

    events.forEach(function(ev) {
      var div = createElement('div', 'event');
      var square = createElement('div', 'event-category ' + ev.color);

      var spanText = '';
      if (ev.symptoms || ev.medication) {
        spanText = (ev.symptoms ? 'Sintomas: ' + ev.symptoms : '') +
                   (ev.symptoms && ev.medication ? ', ' : '') +
                   (ev.medication ? 'Medicamento: ' + ev.medication : '');
      } else if (ev.eventName) {
        spanText = ev.eventName;
      }

      var span = createElement('span', '', spanText);

      if (ev.color !== 'no_display_color') {
        div.appendChild(square);
      }
      div.appendChild(span);
      wrapper.appendChild(div);
    });

    if(!events.length) {
      var div = createElement('div', 'event empty');
      var span = createElement('span', '', 'No Events');

      div.appendChild(span);
      wrapper.appendChild(div);
    }

    if(currentWrapper) {
      currentWrapper.className = 'events out';
      currentWrapper.addEventListener('animationend', function() {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
    } else {
      ele.appendChild(wrapper);
    }
  }

  Calendar.prototype.openModal = function() {
    this.modal.classList.add('show');
    this.symptomsInput.value = '';
    this.medicationInput.value = '';
  }

  Calendar.prototype.closeModal = function() {
    this.modal.classList.remove('show');
  }

  Calendar.prototype.saveDailyRecord = function() {
    var symptoms = this.symptomsInput.value;
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
        medication: medication
      });
      this.closeModal();
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
        eventName: 'Período Menstrual',
        color: 'purple',
        date: this.selectedDate,
        type: 'menstruation_period',
        duration: 5
      });
    } else {
      alert("Por favor, selecione um dia para registrar a menstruação.");
    }
  }

  Calendar.prototype.nextMonth = function() {
    this.current.add(1, 'months');
    this.next = true;
    this.draw();
  }

  Calendar.prototype.prevMonth = function() {
    this.current.subtract(1, 'months');
    this.next = false;
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
    if(className) {
      ele.className = className;
    }
    if(innerText) {
      ele.innerText = ele.textContent = innerText;
    }
    return ele;
  }

}();
