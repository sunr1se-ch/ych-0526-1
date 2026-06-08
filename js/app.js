(function() {
  'use strict';

  const state = {
    currentSegment: null,
    isPlaying: false,
    currentTime: 0,
    startTime: 0,
    pausedTime: 0,
    animationFrameId: null,
    targetRpm: 0,
    currentRpm: 0,
    streak: 0,
    bestStreak: 0,
    bestStreakBySegment: {},
    consecutiveBreaks: 0,
    judgments: [],
    segmentStats: [],
    lastKeyPressTime: 0,
    wheelRotation: 0,
    activeCheckpointIndex: -1
  };

  const elements = {};

  function init() {
    cacheElements();
    loadBestStreak();
    populateSegmentSelector();
    bindEvents();
    if (SEGMENT_DATA.length > 0) {
      selectSegment(SEGMENT_DATA[0].id);
    }
    renderInitialState();
  }

  function cacheElements() {
    elements.wheelInner = document.getElementById('wheelInner');
    elements.rpmValue = document.getElementById('rpmValue');
    elements.targetRpmValue = document.getElementById('targetRpmValue');
    elements.rpmCurve = document.getElementById('rpmCurve');
    elements.curveLine = document.getElementById('curveLine');
    elements.curveArea = document.getElementById('curveArea');
    elements.timeCursor = document.getElementById('timeCursor');
    elements.judgmentMarkers = document.getElementById('judgmentMarkers');
    elements.timeStart = document.getElementById('timeStart');
    elements.timeEnd = document.getElementById('timeEnd');
    elements.progressFill = document.getElementById('progressFill');
    elements.checkpointMarkers = document.getElementById('checkpointMarkers');
    elements.activeSegments = document.getElementById('activeSegments');
    elements.currentTime = document.getElementById('currentTime');
    elements.totalTime = document.getElementById('totalTime');
    elements.streakValue = document.getElementById('streakValue');
    elements.bestStreakValue = document.getElementById('bestStreakValue');
    elements.steadyRatio = document.getElementById('steadyRatio');
    elements.totalChecks = document.getElementById('totalChecks');
    elements.avgDeviation = document.getElementById('avgDeviation');
    elements.segmentStats = document.getElementById('segmentStats');
    elements.segmentSelect = document.getElementById('segmentSelect');
    elements.segmentInfo = document.getElementById('segmentInfo');
    elements.playBtn = document.getElementById('playBtn');
    elements.pauseBtn = document.getElementById('pauseBtn');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.judgmentList = document.getElementById('judgmentList');
    elements.flashOverlay = document.getElementById('flashOverlay');
    elements.toast = document.getElementById('toast');
  }

  function loadBestStreak() {
    try {
      const best = localStorage.getItem(STORAGE_KEYS.BEST_STREAK);
      state.bestStreak = best ? parseInt(best, 10) : 0;
      const bySegment = localStorage.getItem(STORAGE_KEYS.BEST_STREAK_BY_SEGMENT);
      state.bestStreakBySegment = bySegment ? JSON.parse(bySegment) : {};
    } catch (e) {
      state.bestStreak = 0;
      state.bestStreakBySegment = {};
    }
  }

  function saveBestStreak() {
    try {
      localStorage.setItem(STORAGE_KEYS.BEST_STREAK, state.bestStreak.toString());
      localStorage.setItem(STORAGE_KEYS.BEST_STREAK_BY_SEGMENT, JSON.stringify(state.bestStreakBySegment));
    } catch (e) {}
  }

  function populateSegmentSelector() {
    elements.segmentSelect.innerHTML = '';
    SEGMENT_DATA.forEach(segment => {
      const option = document.createElement('option');
      option.value = segment.id;
      option.textContent = segment.name;
      elements.segmentSelect.appendChild(option);
    });
  }

  function bindEvents() {
    elements.segmentSelect.addEventListener('change', (e) => selectSegment(e.target.value));
    elements.playBtn.addEventListener('click', play);
    elements.pauseBtn.addEventListener('click', pause);
    elements.resetBtn.addEventListener('click', reset);
    document.addEventListener('keydown', handleKeydown);
  }

  function selectSegment(segmentId) {
    const segment = SEGMENT_DATA.find(s => s.id === segmentId);
    if (!segment) return;
    state.currentSegment = segment;
    reset();
    renderSegmentInfo();
    renderCurve();
    renderCheckpointMarkers();
    renderActiveSegments();
    renderSegmentStats();
    elements.timeStart.textContent = '0s';
    elements.timeEnd.textContent = segment.duration + 's';
    elements.totalTime.textContent = segment.duration.toFixed(1) + 's';
  }

  function renderSegmentInfo() {
    if (!state.currentSegment) return;
    const bestForSegment = state.bestStreakBySegment[state.currentSegment.id] || 0;
    elements.segmentInfo.innerHTML = `
      <p class="segment-desc">${state.currentSegment.description}</p>
      <p class="segment-meta">
        <span>时长: ${state.currentSegment.duration}s</span>
        <span>检查点: ${state.currentSegment.checkpoints.length}个</span>
        <span>最佳: ${bestForSegment}</span>
      </p>
    `;
  }

  function renderInitialState() {
    updateStatsDisplay();
    elements.bestStreakValue.textContent = state.bestStreak;
  }

  function renderCurve() {
    if (!state.currentSegment) return;
    const curve = state.currentSegment.rpmCurve;
    const duration = state.currentSegment.duration;
    const maxRpm = Math.max(...curve.map(p => p.rpm)) * 1.2 || 100;
    const width = 600;
    const height = 200;
    const padding = 10;
    const points = curve.map(p => ({
      x: padding + (p.time / duration) * (width - 2 * padding),
      y: height - padding - (p.rpm / maxRpm) * (height - 2 * padding)
    }));
    const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(2) + ',' + p.y.toFixed(2)).join(' ');
    const areaPath = linePath + ` L${(width - padding).toFixed(2)},${(height - padding).toFixed(2)} L${padding.toFixed(2)},${(height - padding).toFixed(2)} Z`;
    elements.curveLine.setAttribute('d', linePath);
    elements.curveArea.setAttribute('d', areaPath);
  }

  function renderCheckpointMarkers() {
    if (!state.currentSegment) return;
    const duration = state.currentSegment.duration;
    elements.checkpointMarkers.innerHTML = '';
    state.currentSegment.checkpoints.forEach((cp, index) => {
      const marker = document.createElement('div');
      marker.className = 'checkpoint-marker';
      marker.style.left = ((cp.startTime / duration) * 100) + '%';
      marker.style.width = (((cp.endTime - cp.startTime) / duration) * 100) + '%';
      marker.dataset.index = index;
      elements.checkpointMarkers.appendChild(marker);
    });
  }

  function renderActiveSegments() {
    if (!state.currentSegment) return;
    const duration = state.currentSegment.duration;
    elements.activeSegments.innerHTML = '';
    const rpmCurve = state.currentSegment.rpmCurve;
    for (let i = 0; i < rpmCurve.length - 1; i++) {
      const p1 = rpmCurve[i];
      const p2 = rpmCurve[i + 1];
      if (p1.rpm === p2.rpm && p1.rpm > 0) {
        const segment = document.createElement('div');
        segment.className = 'active-segment';
        segment.style.left = ((p1.time / duration) * 100) + '%';
        segment.style.width = (((p2.time - p1.time) / duration) * 100) + '%';
        segment.setAttribute('data-rpm', p1.rpm);
        elements.activeSegments.appendChild(segment);
      }
    }
  }

  function renderSegmentStats() {
    if (!state.currentSegment) return;
    state.segmentStats = state.currentSegment.checkpoints.map((cp, index) => ({
      index,
      targetRpm: cp.targetRpm,
      startTime: cp.startTime,
      totalChecks: 0,
      steadyCount: 0,
      steadyRatio: 0,
      deviations: [],
      avgDeviation: 0
    }));
    renderSegmentStatsDisplay();
  }

  function renderSegmentStatsDisplay() {
    elements.segmentStats.innerHTML = '';
    state.segmentStats.forEach(stat => {
      const item = document.createElement('div');
      item.className = 'segment-stat-item';
      item.dataset.index = stat.index;
      const ratioClass = stat.totalChecks === 0 ? 'pending' : 
        stat.steadyRatio >= 80 ? 'good' : stat.steadyRatio >= 50 ? 'medium' : 'poor';
      item.innerHTML = `
        <div class="segment-stat-header">
          <span class="segment-rpm">${stat.targetRpm} RPM</span>
          <span class="segment-time">${stat.startTime}s</span>
        </div>
        <div class="segment-stat-body">
          <div class="segment-ratio-bar">
            <div class="segment-ratio-fill ${ratioClass}" style="width: ${stat.steadyRatio}%"></div>
          </div>
          <div class="segment-stat-numbers">
            <span class="stat-ratio">${stat.steadyRatio.toFixed(0)}%</span>
            <span class="stat-count">${stat.steadyCount}/${stat.totalChecks}</span>
            <span class="stat-deviation">±${stat.avgDeviation.toFixed(1)}%</span>
          </div>
        </div>
      `;
      elements.segmentStats.appendChild(item);
    });
  }

  function play() {
    if (state.isPlaying) return;
    if (!state.currentSegment) return;
    state.isPlaying = true;
    state.startTime = performance.now() - state.pausedTime * 1000;
    elements.playBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    elements.segmentSelect.disabled = true;
    animationLoop();
  }

  function pause() {
    if (!state.isPlaying) return;
    state.isPlaying = false;
    state.pausedTime = state.currentTime;
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    elements.playBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.segmentSelect.disabled = false;
  }

  function reset() {
    pause();
    state.currentTime = 0;
    state.pausedTime = 0;
    state.targetRpm = 0;
    state.currentRpm = 0;
    state.streak = 0;
    state.consecutiveBreaks = 0;
    state.judgments = [];
    state.wheelRotation = 0;
    state.activeCheckpointIndex = -1;
    elements.wheelInner.style.transform = 'rotate(0deg)';
    elements.progressFill.style.width = '0%';
    elements.timeCursor.setAttribute('x1', '0');
    elements.timeCursor.setAttribute('x2', '0');
    elements.currentTime.textContent = '0.0s';
    elements.judgmentMarkers.innerHTML = '';
    elements.judgmentList.innerHTML = '';
    renderSegmentStats();
    updateStatsDisplay();
    updateRpmDisplay();
    updateCheckpointHighlight();
  }

  function animationLoop() {
    if (!state.isPlaying) return;
    const now = performance.now();
    state.currentTime = (now - state.startTime) / 1000;
    if (state.currentTime >= state.currentSegment.duration) {
      state.currentTime = state.currentSegment.duration;
      updateDisplay();
      pause();
      showToast('训练完成！');
      return;
    }
    state.targetRpm = getTargetRpm(state.currentTime);
    state.currentRpm = calculateCurrentRpm();
    updateWheelRotation();
    updateDisplay();
    state.animationFrameId = requestAnimationFrame(animationLoop);
  }

  function getTargetRpm(time) {
    if (!state.currentSegment) return 0;
    const curve = state.currentSegment.rpmCurve;
    if (time <= curve[0].time) return curve[0].rpm;
    if (time >= curve[curve.length - 1].time) return curve[curve.length - 1].rpm;
    for (let i = 0; i < curve.length - 1; i++) {
      if (time >= curve[i].time && time <= curve[i + 1].time) {
        const t = (time - curve[i].time) / (curve[i + 1].time - curve[i].time);
        return curve[i].rpm + t * (curve[i + 1].rpm - curve[i].rpm);
      }
    }
    return 0;
  }

  function calculateCurrentRpm() {
    const variation = (Math.random() - 0.5) * 10;
    return Math.max(0, state.targetRpm + variation);
  }

  function updateWheelRotation() {
    const rpm = state.currentRpm;
    const degreesPerMs = (rpm * 360) / 60000;
    state.wheelRotation += degreesPerMs * 16.67;
    elements.wheelInner.style.transform = `rotate(${state.wheelRotation}deg)`;
    elements.wheelInner.style.animationDuration = Math.max(0.1, 60 / rpm) + 's';
  }

  function updateDisplay() {
    updateProgress();
    updateRpmDisplay();
    updateTimeCursor();
    updateCheckpointHighlight();
  }

  function updateProgress() {
    const progress = (state.currentTime / state.currentSegment.duration) * 100;
    elements.progressFill.style.width = progress + '%';
    elements.currentTime.textContent = state.currentTime.toFixed(1) + 's';
  }

  function updateRpmDisplay() {
    elements.rpmValue.textContent = Math.round(state.currentRpm);
    elements.targetRpmValue.textContent = Math.round(state.targetRpm);
  }

  function updateTimeCursor() {
    const duration = state.currentSegment.duration;
    const x = (state.currentTime / duration) * 600;
    elements.timeCursor.setAttribute('x1', x.toFixed(2));
    elements.timeCursor.setAttribute('x2', x.toFixed(2));
  }

  function updateCheckpointHighlight() {
    const markers = elements.checkpointMarkers.querySelectorAll('.checkpoint-marker');
    markers.forEach(marker => {
      marker.classList.remove('active', 'passed');
      const index = parseInt(marker.dataset.index, 10);
      const cp = state.currentSegment.checkpoints[index];
      if (state.currentTime >= cp.startTime && state.currentTime <= cp.endTime) {
        marker.classList.add('active');
        state.activeCheckpointIndex = index;
      } else if (state.currentTime > cp.endTime) {
        marker.classList.add('passed');
      }
    });
  }

  function handleKeydown(e) {
    if (e.code !== 'Space') return;
    e.preventDefault();
    const now = Date.now();
    if (now - state.lastKeyPressTime < 200) return;
    state.lastKeyPressTime = now;
    if (!state.isPlaying) {
      if (state.currentTime === 0) {
        play();
      }
      return;
    }
    processConfirmation();
  }

  function processConfirmation() {
    if (state.activeCheckpointIndex === -1) {
      showToast('不在有效检查时段内', 'warning');
      return;
    }
    const cp = state.currentSegment.checkpoints[state.activeCheckpointIndex];
    const judgment = createJudgment(cp.targetRpm);
    recordJudgment(judgment, state.activeCheckpointIndex);
    updateStreak(judgment);
    updateSegmentStats(judgment, state.activeCheckpointIndex);
    addJudgmentMarker(judgment);
    addJudgmentToList(judgment);
    updateStatsDisplay();
    flashJudgment(judgment.result);
  }
  function createJudgment(targetRpm) {
    const actualRpm = state.currentRpm;
    const deviation = Math.abs(actualRpm - targetRpm) / targetRpm * 100;
    let result;
    if (deviation <= JUDGMENT_THRESHOLDS.STEADY) {
      result = 'steady';
    } else if (deviation <= JUDGMENT_THRESHOLDS.DRIFT) {
      result = 'drift';
    } else {
      result = 'break';
    }
    return {
      time: state.currentTime,
      targetRpm,
      actualRpm: Math.round(actualRpm),
      deviation: parseFloat(deviation.toFixed(2)),
      result
    };
  }
  function recordJudgment(judgment, segmentIndex) {
    judgment.segmentIndex = segmentIndex;
    state.judgments.push(judgment);
  }
  function updateStreak(judgment) {
    if (judgment.result === 'steady') {
      state.streak += 1;
      state.consecutiveBreaks = 0;
      animateNumber(elements.streakValue, state.streak);
    } else if (judgment.result === 'drift') {
      state.consecutiveBreaks = 0;
    } else {
      state.consecutiveBreaks += 1;
      if (state.consecutiveBreaks >= 3) {
        state.streak = 0;
        state.consecutiveBreaks = 0;
        showToast('连续3次 Break，Streak 清零！', 'error');
        shakeElement(elements.streakValue);
      }
    }
    if (state.streak > state.bestStreak) {
      state.bestStreak = state.streak;
      elements.bestStreakValue.textContent = state.bestStreak;
      animateNumber(elements.bestStreakValue, state.bestStreak);
    }
    if (state.currentSegment) {
      const segmentBest = state.bestStreakBySegment[state.currentSegment.id] || 0;
      if (state.streak > segmentBest) {
        state.bestStreakBySegment[state.currentSegment.id] = state.streak;
      }
    }
    saveBestStreak();
  }
  function updateSegmentStats(judgment, segmentIndex) {
    const stat = state.segmentStats[segmentIndex];
    if (!stat) return;
    stat.totalChecks += 1;
    if (judgment.result === 'steady') {
      stat.steadyCount += 1;
    }
    stat.deviations.push(judgment.deviation);
    stat.steadyRatio = (stat.steadyCount / stat.totalChecks) * 100;
    stat.avgDeviation = stat.deviations.reduce((a, b) => a + b, 0) / stat.deviations.length;
    updateSegmentStatsDisplay();
  }
  function addJudgmentMarker(judgment) {
    if (!state.currentSegment) return;
    const duration = state.currentSegment.duration;
    const maxRpm = Math.max(...state.currentSegment.rpmCurve.map(p => p.rpm)) * 1.2 || 100;
    const x = (judgment.time / duration) * 600;
    const y = 200 - 10 - (judgment.targetRpm / maxRpm) * 180;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x.toFixed(2));
    circle.setAttribute('cy', y.toFixed(2));
    circle.setAttribute('r', '6');
    circle.setAttribute('class', `judgment-marker ${judgment.result}`);
    elements.judgmentMarkers.appendChild(circle);
  }
  function addJudgmentToList(judgment) {
    const item = document.createElement('div');
    item.className = `judgment-item ${judgment.result}`;
    const resultText = {
      steady: 'Steady',
      drift: 'Drift',
      break: 'Break'
    }[judgment.result];
    item.innerHTML = `
      <span class="judgment-time">${judgment.time.toFixed(1)}s</span>
      <span class="judgment-result">${resultText}</span>
      <span class="judgment-rpm">${judgment.actualRpm}/${judgment.targetRpm}</span>
      <span class="judgment-deviation">±${judgment.deviation}%</span>
    `;
    elements.judgmentList.insertBefore(item, elements.judgmentList.firstChild);
    while (elements.judgmentList.children.length > 10) {
      elements.judgmentList.removeChild(elements.judgmentList.lastChild);
    }
  }
  function updateStatsDisplay() {
    elements.streakValue.textContent = state.streak;
    const totalChecks = state.judgments.length;
    const steadyCount = state.judgments.filter(j => j.result === 'steady').length;
    const steadyRatio = totalChecks > 0 ? (steadyCount / totalChecks * 100) : 0;
    const avgDeviation = totalChecks > 0 
      ? state.judgments.reduce((sum, j) => sum + j.deviation, 0) / totalChecks 
      : 0;
    elements.steadyRatio.textContent = steadyRatio.toFixed(0);
    elements.totalChecks.textContent = totalChecks;
    elements.avgDeviation.textContent = avgDeviation.toFixed(1);
  }
  function flashJudgment(result) {
    const colors = {
      steady: 'rgba(46, 125, 50, 0.3)',
      drift: 'rgba(245, 124, 0, 0.3)',
      break: 'rgba(198, 40, 40, 0.3)'
    };
    elements.flashOverlay.style.backgroundColor = colors[result];
    elements.flashOverlay.style.opacity = '1';
    elements.wheelInner.classList.add('flash-' + result);
    setTimeout(() => {
      elements.flashOverlay.style.opacity = '0';
      elements.wheelInner.classList.remove('flash-' + result);
    }, 300);
  }
  function animateNumber(element, value) {
    element.classList.add('bounce');
    setTimeout(() => element.classList.remove('bounce'), 400);
  }
  function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
  }
  function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${type}`;
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2000);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
