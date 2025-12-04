!function () {

  var today = moment();

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

  const CYCLE_PHASES = {
    'menstrual': { name: 'Fase Menstrual', color: 'purple', icon: '🩸', class: 'phase-menstrual' },
    'folicular': { name: 'Fase Folicular', color: 'light-blue', icon: '🌱', class: 'phase-folicular' },
    'ovulatoria': { name: 'Fase Ovulatória', color: 'pink', icon: '🥚', class: 'phase-ovulatoria' },
    'lutea': { name: 'Fase Lútea', color: 'coral', icon: '💛', class: 'phase-lutea' }
  };

  const CYCLE_DURATIONS = {
    folicular: 6,
    ovulatoria: 2,
    lutea: 14
  };

  function Calendar(selector, usuario_id) {
    this.el = document.querySelector(selector);
    this.usuario_id = usuario_id;
    this.events = [];
    this.current = moment().date(1);
    this.userMenstruationDuration = 5;
    this.userCycleLength = 28;

    this.loadUserCycleInfo().then(() => {
      this.loadEvents().then(() => {
        this.draw();

        const todayPhase = this.events.find(ev =>
          ev.type === 'cycle_phase' && ev.date.isSame(moment(), 'day')
        );
        if (todayPhase && typeof showCycleAlert === "function") {
          showCycleAlert(
            `Novo período: ${todayPhase.eventName} ${CYCLE_PHASES[todayPhase.fase]?.icon || ''}`,
            "Descubra o que acontece nesta fase e como cuidar do seu corpo."
          );
        }
        var current = document.querySelector('.today');
        if (current) {
          var self = this;
          window.setTimeout(function () {
            self.openDay(current);
          }, 500);
        }
      });
    });

    this.modal = document.getElementById('eventModal');
    this.closeButton = this.modal.querySelector('.close-button');
    this.saveButton = this.modal.querySelector('#saveDailyRecord');
    this.symptomsList = this.modal.querySelector('#symptomsList');
    this.medicationInput = this.modal.querySelector('#medicationInput');
    this.selectedDate = null;

    var self = this;
    this.closeButton.addEventListener('click', function () {
      self.closeModal();
    });

    window.addEventListener('click', function (event) {
      if (event.target == self.modal) {
        self.closeModal();
      }
    });

    this.saveButton.addEventListener('click', function () {
      self.saveDailyRecord();
    });
  }

  Calendar.prototype.loadUserCycleInfo = function () {
    const self = this;
    return fetch('/api/usuario/info')
      .then(res => res.json())
      .then(usuarioInfo => {
        if (usuarioInfo.duracao_menstruacao) {
          this.userMenstruationDuration = usuarioInfo.duracao_menstruacao;
        }

        if (usuarioInfo.duracao_ciclo) {
          this.userCycleLength = usuarioInfo.duracao_ciclo;
        }

        console.log('Duração da menstruação:', this.userMenstruationDuration, 'dias');
        console.log('Duração do ciclo:', this.userCycleLength, 'dias');

        return usuarioInfo;
      })
      .catch(err => {
        console.error('Erro ao carregar informações do usuário:', err);
        return {};
      });
  }

  Calendar.prototype.loadEvents = function () {
    const self = this;
    const mes = this.current.format('MM');
    const ano = this.current.format('YYYY');

    return fetch(`/api/calendario/eventos?mes=${mes}&ano=${ano}`)
      .then(res => res.json())
      .then(events => {
        this.events = events.map(ev => ({
          id: ev.id,
          eventName: ev.tipo === 'registro_diario' ? 'Registro Diário' :
            ev.tipo === 'fase_ciclo' ? CYCLE_PHASES[ev.fase]?.name || 'Fase do Ciclo' : 'Menstruação',
          color: ev.cor || (ev.tipo === 'registro_diario' ? 'blue' : 'purple'),
          date: moment(ev.data_inicio),
          data_fim: ev.data_fim ? moment(ev.data_fim) : null,
          symptoms: ev.sintomas,
          medication: ev.medicamentos,
          type: ev.tipo === 'registro_diario' ? 'daily_record' :
            ev.tipo === 'fase_ciclo' ? 'cycle_phase' : 'menstruation_period',
          duration: ev.duracao_menstruacao || this.userMenstruationDuration,
          isPrevision: ev.cor === 'previsao',
          fase: ev.fase
        }));

        this.addCyclePhasePredictions();
      })
      .catch(err => {
        console.error('Erro ao carregar eventos:', err);
        this.events = [];
      });
  }

  Calendar.prototype.addCyclePhasePredictions = function () {
    const lastPeriod = this.events.find(ev =>
      ev.type === 'menstruation_period' && !ev.isPrevision
    );

    if (!lastPeriod) return;

    const cycleStart = lastPeriod.date.clone();
    const menstruationDuration = lastPeriod.duration || this.userMenstruationDuration;

    const menstruationEnd = cycleStart.clone().add(menstruationDuration - 1, 'days');

    const phaseStarts = {
      menstrual: cycleStart.clone(),
      folicular: menstruationEnd.clone().add(1, 'days'),
      ovulatoria: menstruationEnd.clone().add(1 + CYCLE_DURATIONS.folicular, 'days'),
      lutea: menstruationEnd.clone().add(1 + CYCLE_DURATIONS.folicular + CYCLE_DURATIONS.ovulatoria, 'days')
    };

    const nextMenstruationStart = cycleStart.clone().add(this.userCycleLength, 'days');
    const luteaEnd = nextMenstruationStart.clone().subtract(1, 'days');

    Object.entries(phaseStarts).forEach(([phase, startDate]) => {
      let duration = CYCLE_DURATIONS[phase];
      let endDate;

      if (phase === 'lutea') {
        endDate = luteaEnd;
        duration = endDate.diff(startDate, 'days') + 1;
      } else if (phase === 'menstrual') {
        duration = menstruationDuration;
        endDate = startDate.clone().add(duration - 1, 'days');
      } else {
        endDate = startDate.clone().add(duration - 1, 'days');
      }

      if (startDate.month() === this.current.month() || endDate.month() === this.current.month()) {
        const existingPhase = this.events.find(ev =>
          ev.type === 'cycle_phase' &&
          ev.fase === phase &&
          ev.date.isSame(startDate, 'day')
        );

        if (!existingPhase) {
          this.events.push({
            id: `phase_${phase}_${startDate.format('YYYY-MM-DD')}`,
            eventName: `${CYCLE_PHASES[phase].name} (Previsão)`,
            color: CYCLE_PHASES[phase].color,
            date: startDate,
            data_fim: endDate,
            type: 'cycle_phase',
            isPrevision: true,
            fase: phase,
            duration: duration,
            description: this.getPhaseDescription(phase)
          });
        }
      }
    });

    const nextMenstruationEnd = nextMenstruationStart.clone().add(menstruationDuration - 1, 'days');

    if (nextMenstruationStart.month() === this.current.month() ||
      nextMenstruationEnd.month() === this.current.month()) {
      
      // Verificar se a data da previsão NÃO é uma data de menstruação REAL
      const isRealMenstruationDate = this.events.some(ev =>
        ev.type === 'menstruation_period' &&
        !ev.isPrevision &&
        ev.date.isSame(nextMenstruationStart, 'day')
      );
      
      // Só criar previsão se NÃO for uma data de menstruação real
      if (!isRealMenstruationDate) {
        const existingPrevision = this.events.find(ev =>
          ev.type === 'menstruation_period' &&
          ev.isPrevision &&
          ev.date.isSame(nextMenstruationStart, 'day')
        );

        if (!existingPrevision) {
          this.events.push({
            id: `menstruation_next_${nextMenstruationStart.format('YYYY-MM-DD')}`,
            eventName: 'Próxima Menstruação (Previsão)',
            color: 'orange',
            date: nextMenstruationStart,
            data_fim: nextMenstruationEnd,
            type: 'menstruation_period',
            isPrevision: true,
            duration: menstruationDuration
          });
        }
      }
    }
  }

  Calendar.prototype.getPhaseDescription = function (phase) {
    const descriptions = {
      menstrual: 'Fase de descamação do endométrio.',
      folicular: 'Desenvolvimento dos folículos ovarianos. Preparação para ovulação.',
      ovulatoria: 'Liberação do óvulo maduro. Período mais fértil do ciclo.',
      lutea: 'Preparação do útero para possível implantação.'
    };
    return descriptions[phase] || '';
  }

  Calendar.prototype.draw = function () {
    this.drawHeader();
    this.drawMonth();
  }

  Calendar.prototype.drawHeader = function () {
    var self = this;
    if (!this.header) {
      this.header = createElement('div', 'header');
      this.title = createElement('h1');

      var right = createElement('div', 'right');
      right.addEventListener('click', function () { self.nextMonth(); });

      var left = createElement('div', 'left');
      left.addEventListener('click', function () { self.prevMonth(); });

      this.header.appendChild(this.title);
      this.header.appendChild(right);
      this.header.appendChild(left);

      if (this.el.firstChild) {
        this.el.insertBefore(this.header, this.el.firstChild);
      } else {
        this.el.appendChild(this.header);
      }
    }
    this.title.innerHTML = this.current.format('MMMM YYYY');
  }

  Calendar.prototype.drawMonth = function () {
    if (this.month) {
      this.month.remove();
    }
    this.month = createElement('div', 'month');
    this.el.appendChild(this.month);
    this.backFill();
    this.currentMonth();
    this.fowardFill();
  }

  Calendar.prototype.backFill = function () {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();
    if (!dayOfWeek) return;
    clone.subtract(dayOfWeek + 1, 'days');
    for (var i = dayOfWeek; i > 0; i--) {
      this.drawDay(clone.add(1, 'days'));
    }
  }

  Calendar.prototype.fowardFill = function () {
    var clone = this.current.clone().add(1, 'months').subtract(1, 'days');
    var dayOfWeek = clone.day();
    if (dayOfWeek === 6) return;
    for (var i = dayOfWeek; i < 6; i++) {
      this.drawDay(clone.add(1, 'days'));
    }
  }

  Calendar.prototype.currentMonth = function () {
    var clone = this.current.clone();
    while (clone.month() === this.current.month()) {
      this.drawDay(clone);
      clone.add(1, 'days');
    }
  }

  Calendar.prototype.getWeek = function (day) {
    if (!this.week || day.day() === 0) {
      this.week = createElement('div', 'week');
      this.month.appendChild(this.week);
    }
  }

  Calendar.prototype.drawDay = function (day) {
    var self = this;
    this.getWeek(day);
    var outer = createElement('div', this.getDayClass(day));

    var hasMenstruation = false;
    var hasPrevision = false;
    var hasPhase = false;
    var phaseClass = '';

    this.events.forEach(function (ev) {
      if (ev.type === 'menstruation_period') {
        const endDate = ev.data_fim || ev.date.clone().add(ev.duration - 1, 'days');
        
        if (day.isSameOrAfter(ev.date, 'day') && day.isSameOrBefore(endDate, 'day')) {
          if (ev.isPrevision) {
            hasPrevision = true;
          } else {
            hasMenstruation = true;
          }
        }
      }
      else if (ev.type === 'cycle_phase') {
        const endDate = ev.data_fim || ev.date.clone().add(ev.duration - 1, 'days');
        if (day.isSameOrAfter(ev.date, 'day') && day.isSameOrBefore(endDate, 'day')) {
          hasPhase = true;
          phaseClass = CYCLE_PHASES[ev.fase]?.class || '';
        }
      }
    });

    if (hasMenstruation) {
      outer.classList.add('phase-menstrual');
    } else if (hasPrevision) {
      outer.classList.add('prevision');
    } else if (hasPhase && phaseClass) {
      outer.classList.add(phaseClass);
    }

    outer.addEventListener('click', function () {
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

  Calendar.prototype.drawEvents = function (day, element) {
    if (day.month() === this.current.month()) {
      var dailyRecords = this.events.filter(ev =>
        ev.type === 'daily_record' && ev.date.isSame(day, 'day')
      );

      // Verificar se é início da menstruação
      var menstruationStart = false;
      // Verificar se é fim da menstruação
      var menstruationEnd = false;
      
      this.events.forEach(ev => {
        if (ev.type === 'menstruation_period' && !ev.isPrevision) {
          const endDate = ev.data_fim || ev.date.clone().add(ev.duration - 1, 'days');
          
          if (day.isSame(ev.date, 'day')) {
            menstruationStart = true;
          }
          if (endDate && day.isSame(endDate, 'day')) {
            menstruationEnd = true;
          }
        }
      });

      var cyclePhasesStart = this.events.filter(ev =>
        ev.type === 'cycle_phase' && ev.date.isSame(day, 'day') && ev.isPrevision
      );

      // Desenhar marcadores - Bolinha ROXA apenas no primeiro dia
      if (menstruationStart) {
        var purpleSpan = createElement('span', 'purple');
        element.appendChild(purpleSpan);
      }
      
      // Bolinha VERDE apenas no último dia
      if (menstruationEnd) {
        var greenSpan = createElement('span', 'green');
        element.appendChild(greenSpan);
      }

      // Registros diários
      dailyRecords.forEach(ev => {
        var evSpan = createElement('span', 'blue');
        element.appendChild(evSpan);
      });

      // Fases do ciclo
      if (cyclePhasesStart.length > 0) {
        var evSpan = createElement('span', CYCLE_PHASES[cyclePhasesStart[0].fase]?.color || 'gray');
        element.appendChild(evSpan);
      }
    }
  }

  Calendar.prototype.getDayClass = function (day) {
    var classes = ['day'];
    if (day.month() !== this.current.month()) {
      classes.push('other');
    } else if (today.isSame(day, 'day')) {
      classes.push('today');
    }
    return classes.join(' ');
  }

  Calendar.prototype.openDay = function (el) {
    document.querySelectorAll('.day.selected-day').forEach(d => d.classList.remove('selected-day'));
    el.classList.add('selected-day');

    var details;
    var dayNumber = +el.querySelectorAll('.day-number')[0].innerText || +el.querySelectorAll('.day-number')[0].textContent;
    var day = this.current.clone().date(dayNumber);
    this.selectedDate = day.format("YYYY-MM-DD");

    var currentOpened = document.querySelector('.details');
    if (currentOpened) {
      currentOpened.parentNode.removeChild(currentOpened);
    }

    details = createElement('div', 'details in');
    el.parentNode.appendChild(details);

    var closeBtn = createElement('span', 'details-close', '×');
    closeBtn.onclick = function () {
      details.parentNode.removeChild(details);
      el.classList.remove('selected-day');
    };
    details.appendChild(closeBtn);

    var todaysEvents = [];
    
    // Coletar eventos para este dia
    this.events.forEach(function (ev) {
      // Verificar se o evento é para este dia específico
      if (ev.date.isSame(day, 'day')) {
        // Se for menstruação REAL (não previsão), adiciona como início
        if (ev.type === 'menstruation_period' && !ev.isPrevision) {
          const alreadyExists = todaysEvents.some(e => 
            e.type === 'menstruation_period' && 
            !e.isPrevision && 
            e.date.isSame(day, 'day')
          );
          if (!alreadyExists) {
            todaysEvents.push({
              ...ev,
              eventName: 'Início Menstruação',
              isStart: true
            });
          }
        } 
        // Se for menstruação de PREVISÃO, NÃO mostrar quando já tem real
        else if (ev.type === 'menstruation_period' && ev.isPrevision) {
          // Verificar se já existe uma menstruação REAL neste dia
          const hasRealMenstruation = this.events.some(e =>
            e.type === 'menstruation_period' &&
            !e.isPrevision &&
            e.date.isSame(day, 'day')
          );
          
          // Só mostrar previsão se NÃO houver menstruação real neste dia
          if (!hasRealMenstruation) {
            const alreadyExists = todaysEvents.some(e => 
              e.type === 'menstruation_period' && 
              e.isPrevision && 
              e.date.isSame(day, 'day')
            );
            if (!alreadyExists) {
              todaysEvents.push(ev);
            }
          }
        }
        // Para outros tipos de eventos
        else {
          const alreadyExists = todaysEvents.some(e => e.id === ev.id);
          if (!alreadyExists) {
            todaysEvents.push(ev);
          }
        }
      }

      // Verificar se é fim da menstruação (para este dia específico)
      if (ev.type === 'menstruation_period' && !ev.isPrevision) {
        var endDate = ev.data_fim || ev.date.clone().add(ev.duration - 1, 'days');
        
        if (day.isSame(endDate, 'day')) {
          const alreadyExists = todaysEvents.some(e => e.isEnd && !e.isPrevision);
          if (!alreadyExists) {
            todaysEvents.push({
              eventName: 'Fim Menstruação',
              color: 'green',
              type: 'menstruation_period',
              isPrevision: false,
              isEnd: true,
              description: 'Último dia do período menstrual'
            });
          }
        }
      }
      
      // Verificar se é fim da previsão de menstruação
      if (ev.type === 'menstruation_period' && ev.isPrevision) {
        var endDate = ev.data_fim || ev.date.clone().add(ev.duration - 1, 'days');
        
        if (day.isSame(endDate, 'day')) {
          // Verificar se já existe uma menstruação REAL neste dia
          const hasRealMenstruation = this.events.some(e =>
            e.type === 'menstruation_period' &&
            !e.isPrevision &&
            (e.date.isSame(day, 'day') || 
             (e.data_fim && e.data_fim.isSame(day, 'day')))
          );
          
          // Só mostrar previsão de fim se NÃO houver menstruação real neste dia
          if (!hasRealMenstruation) {
            const alreadyExists = todaysEvents.some(e => e.isEnd && e.isPrevision);
            if (!alreadyExists) {
              todaysEvents.push({
                eventName: 'Previsão: Fim Menstruação',
                color: 'orange',
                type: 'menstruation_period',
                isPrevision: true,
                isEnd: true,
                description: 'Previsão do último dia do período menstrual'
              });
            }
          }
        }
      }
    }, this); // Passando 'this' como contexto

    this.renderEvents(todaysEvents, details);

    var buttonWrapper = createElement('div', 'details-buttons');
    var self = this;

    const hasMenstruation = this.events.some(ev =>
      ev.type === 'menstruation_period' &&
      !ev.isPrevision &&
      ev.date.isSame(day, 'day')
    );

    var addRecordBtn = createElement('button', 'add-event-button', 'Adicionar Registro Diário');
    addRecordBtn.onclick = function () { self.openModal(); };
    buttonWrapper.appendChild(addRecordBtn);

    var menstruationBtn = createElement('button',
      hasMenstruation ? 'remove-menstruation-button' : 'add-menstruation-button',
      hasMenstruation ? 'Remover Menstruação' : 'Registrar Menstruação'
    );

    if (hasMenstruation) {
      const menstruationEvent = this.events.find(ev =>
        ev.type === 'menstruation_period' &&
        !ev.isPrevision &&
        ev.date.isSame(day, 'day')
      );
      menstruationBtn.onclick = function () {
        self.removeMenstruation(menstruationEvent.id);
      };
    } else {
      menstruationBtn.onclick = function () { self.registerMenstruation(); };
    }

    buttonWrapper.appendChild(menstruationBtn);

    if (day.isAfter(moment(), 'day')) {
      addRecordBtn.style.display = 'none';
      menstruationBtn.style.display = 'none';
      var futureDateMessage = createElement('p', 'future-date-message', 'Não é possível adicionar registros para datas futuras.');
      buttonWrapper.appendChild(futureDateMessage);
    }

    details.appendChild(buttonWrapper);
  }

  Calendar.prototype.renderEvents = function (events, ele) {
    var currentWrapper = ele.querySelector('.events');
    var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));
    
    const sortedEvents = events.sort((a, b) => {
      if (a.type === 'menstruation_period' && !b.isPrevision) return -1;
      if (b.type === 'menstruation_period' && !a.isPrevision) return 1;
      return 0;
    });
    
    sortedEvents.forEach(function (ev) {
      var div = createElement('div', 'event');
      var square = createElement('div', 'event-category ' + ev.color);

      if (ev.type === 'daily_record') {
        let wrapperDiv = createElement('div', 'daily-record-wrapper');
        let title = createElement('strong', '', 'Registro Diário');
        wrapperDiv.appendChild(title);

        let symptomsList = createElement('ul', 'symptoms-list');
        if (ev.symptoms && ev.symptoms.length > 0 && ev.symptoms !== 'Previsão') {
          ev.symptoms.split(",").map(s => s.trim()).forEach(symptom => {
            let li = document.createElement('li');
            let icon = SYMPTOM_ICONS[symptom] || "•";
            li.textContent = `${icon} ${symptom}`;
            symptomsList.appendChild(li);
          });
        } else if (ev.symptoms === 'Previsão') {
          let li = document.createElement('li');
          li.textContent = "📅 Previsão automática";
          symptomsList.appendChild(li);
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
      } else if (ev.type === 'cycle_phase') {
        let wrapperDiv = createElement('div', 'cycle-phase-wrapper');
        let title = createElement('strong', '', ev.eventName);
        wrapperDiv.appendChild(title);

        let phaseInfo = createElement('p', 'phase-icon', `${CYCLE_PHASES[ev.fase]?.icon || '📅'} ${CYCLE_PHASES[ev.fase]?.name || 'Fase do ciclo'}`);
        wrapperDiv.appendChild(phaseInfo);

        if (ev.description) {
          let description = createElement('p', 'phase-description', ev.description);
          wrapperDiv.appendChild(description);
        }

        let durationInfo = createElement('p', 'phase-duration', `Duração: ${ev.duration} dia${ev.duration > 1 ? 's' : ''}`);
        wrapperDiv.appendChild(durationInfo);

        div.appendChild(square);
        div.appendChild(wrapperDiv);
      } else if (ev.type === 'menstruation_period') {
        let wrapperDiv = createElement('div', 'menstruation-wrapper');
        
        if (ev.isStart && !ev.isPrevision) {
          let title = createElement('strong', '', 'Início Menstruação');
          wrapperDiv.appendChild(title);
          let info = createElement('p', 'menstruation-info', '🩸 Início do período menstrual');
          wrapperDiv.appendChild(info);
        } else if (ev.isEnd && !ev.isPrevision) {
          let title = createElement('strong', '', 'Fim Menstruação');
          wrapperDiv.appendChild(title);
          let info = createElement('p', 'menstruation-info', '✅ Último dia do período menstrual');
          wrapperDiv.appendChild(info);
          if (ev.description) {
            let desc = createElement('p', 'menstruation-description', ev.description);
            wrapperDiv.appendChild(desc);
          }
        } else if (ev.isPrevision) {
          let title = createElement('strong', '', ev.eventName);
          wrapperDiv.appendChild(title);
          let info = createElement('p', 'menstruation-info', '📅 Previsão do período menstrual');
          wrapperDiv.appendChild(info);
        }

        div.appendChild(square);
        div.appendChild(wrapperDiv);
      } else {
        let text = ev.eventName;
        var span = createElement('span', '', text);
        if (ev.color !== 'no_display_color') div.appendChild(square);
        div.appendChild(span);
      }
      wrapper.appendChild(div);
    });

    if (!events.length) {
      var div = createElement('div', 'event empty');
      var span = createElement('span', '', 'Sem eventos');
      div.appendChild(span);
      wrapper.appendChild(div);
    }
    if (currentWrapper) {
      currentWrapper.parentNode.removeChild(currentWrapper);
      ele.appendChild(wrapper);
    } else {
      ele.appendChild(wrapper);
    }
  }

  Calendar.prototype.openModal = function () {
    this.modal.classList.add('show');
    this.symptomsList.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    this.medicationInput.value = '';
  }

  Calendar.prototype.closeModal = function () {
    this.modal.classList.remove('show');
  }

  Calendar.prototype.saveDailyRecord = function () {
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

      const evento = {
        tipo: 'registro_diario',
        data_inicio: this.selectedDate,
        sintomas: symptoms,
        medicamentos: medication,
        cor: 'blue'
      };

      fetch('/api/calendario/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
      })
        .then(res => res.json())
        .then(data => {
          if (data.sucesso) {
            this.loadEvents().then(() => {
              var dayElement = document.querySelector('.day.selected-day');
              if (dayElement) this.openDay(dayElement);

              const isToday = moment(this.selectedDate).isSame(moment(), 'day');
              if (isToday && typeof showCycleAlert === "function") {
                showCycleAlert(
                  "Hoje iniciou sua menstruação",
                  "Saiba mais sobre esse período e o que acontece no seu corpo."
                );
              }
            });
          }

        })
        .catch(err => {
          alert("Erro ao salvar registro.");
          console.error(err);
        });
    }
  }

  Calendar.prototype.registerMenstruation = function () {
    if (this.selectedDate) {
      var selectedMomentDate = moment(this.selectedDate, "YYYY-MM-DD");
      if (selectedMomentDate.isAfter(moment(), 'day')) {
        alert("Não é possível registrar menstruação para datas futuras.");
        return;
      }

      const existingPeriod = this.events.find(ev =>
        ev.type === 'menstruation_period' &&
        !ev.isPrevision &&
        ev.date.isSame(selectedMomentDate, 'day')
      );

      if (existingPeriod) {
        if (confirm('Já existe um registro de menstruação nesta data. Deseja removê-lo?')) {
          this.removeMenstruation(existingPeriod.id);
        }
        return;
      }

      const evento = {
        tipo: 'menstruacao',
        data_inicio: this.selectedDate,
        data_fim: moment(this.selectedDate).add(this.userMenstruationDuration - 1, 'days').format('YYYY-MM-DD'),
        sintomas: 'Início do período menstrual',
        medicamentos: '',
        cor: 'purple',
        duracao_menstruacao: this.userMenstruationDuration
      };

      fetch('/api/calendario/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
      })
        .then(res => res.json())
        .then(data => {
          if (data.sucesso) {
            this.loadEvents().then(() => {
              var dayElement = document.querySelector('.day.selected-day');
              if (dayElement) this.openDay(dayElement);
            });
          }
        })
        .catch(err => {
          alert("Erro ao registrar menstruação.");
          console.error(err);
        });
    }
  }


  Calendar.prototype.removeMenstruation = async function (eventId) {
    if (!eventId) return;

    const confirmado = await showConfirm(
      "Tem certeza?",
      "Deseja remover este registro de menstruação?"
    );

    if (!confirmado) return;

    try {
      const res = await fetch(`/api/calendario/eventos/${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.sucesso) {
        await this.loadEvents();
        this.draw();

        const dayElement = document.querySelector(".day.selected-day");
        if (dayElement) this.openDay(dayElement);

        alert("Registro de menstruação removido com sucesso!");
      } else {
        alert("Erro ao remover registro: " + (data.erro || "Erro desconhecido"));
      }
    } catch (err) {
      alert("Erro ao remover registro.");
      console.error(err);
    }
  };


  Calendar.prototype.nextMonth = function () {
    this.current.add(1, 'months');
    this.loadEvents().then(() => this.draw());
  }

  Calendar.prototype.prevMonth = function () {
    this.current.subtract(1, 'months');
    this.loadEvents().then(() => this.draw());
  }

  window.Calendar = Calendar;

  function createElement(tagName, className, innerText) {
    var ele = document.createElement(tagName);
    if (className) ele.className = className;
    if (innerText) ele.innerText = ele.textContent = innerText;
    return ele;
  }
}();

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

  const calendar = new Calendar('#calendar', localStorage.getItem('usuario_id'));

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

  const track = document.querySelector('.carousel-track');
  const prev = document.querySelector('.carousel-prev');
  const next = document.querySelector('.carousel-next');
  const dots = Array.from(document.querySelectorAll('.carousel-dot'));
  if (track) {
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    let index = 0;

    function updateCarousel() {
      const gap = 16;
      if (items.length === 0) return;

      const itemWidth = items[0].getBoundingClientRect().width;

      const move = index * (itemWidth + gap);
      track.style.transform = `translateX(${-move}px`;

      dots.forEach((d, i) => d.classList.toggle('active', i === index));

      prev.disabled = index === 0;
      const visibleItems = window.innerWidth > 900 ? 2.5 : 1.5;
      const maxIndex = Math.ceil(items.length - visibleItems);
      next.disabled = index >= maxIndex;
    }

    prev?.addEventListener('click', function () {
      if (index > 0) index--;
      updateCarousel();
    });
    next?.addEventListener('click', function () {
      const visibleItems = window.innerWidth > 900 ? 2.5 : 1.5;
      const maxIndex = Math.ceil(items.length - visibleItems);
      if (index < maxIndex) index++;
      updateCarousel();
    });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', function () {
        index = i;
        updateCarousel();
      });
    });

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('eventModal');
      if (modal && modal.classList.contains('show')) modal.classList.remove('show');
    }
  });
});