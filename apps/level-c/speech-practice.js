/* Sentence listening, temporary local recording, and automatic browser word checking. */
function normalizeSpokenSentence(value) {
  return value.toLowerCase().replace(/\bit['’]s\b/g,'it is').replace(/\b(can['’]?t|cannot)\b/g,'can not').replace(/['’]/g,'').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
let activeVoiceSession = null;
const VOICE_SILENCE_MS = 3000;
const VOICE_FIRST_WORD_MS = 15000;
const VOICE_MAX_RECORDING_MS = 60000;
document.querySelectorAll('[data-trace-sentence]').forEach(row => {
  const sentence = row.dataset.traceSentence;
  const listen = row.querySelector('[data-speak]');
  const record = row.querySelector('[data-record]');
  const stop = row.querySelector('[data-stop]');
  const audio = row.querySelector('[data-recording]');
  const remove = row.querySelector('[data-delete-recording]');
  const status = row.querySelector('.voice-status');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recordingURL = null;
  if (!Recognition) {
    row.querySelector('[data-speech-note]').textContent = '🎤 Say it, then listen to yourself! Word checking isn’t available here.';
  }
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    listen.disabled = true;
    status.textContent = 'Sentence listening is unavailable in this browser.';
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    record.disabled = true;
    status.textContent = 'Recording needs a browser with microphone support and an HTTPS connection.';
  }
  listen.onclick = () => {
    if (activeVoiceSession) { status.textContent = 'Stop your recording before listening.'; return; }
    audio.pause();
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
    utterance.onerror = () => { status.textContent = 'Could not play the sentence. Please try again.'; };
    speechSynthesis.speak(utterance);
  };
  const clearRecording = () => {
    audio.pause(); audio.removeAttribute('src'); audio.load(); audio.hidden = true;
    remove.hidden = true;
    if (recordingURL) URL.revokeObjectURL(recordingURL);
    recordingURL = null;
  };
  remove.onclick = () => { clearRecording(); status.textContent = 'Ready to record again.'; };
  record.onclick = async () => {
    if (activeVoiceSession) { status.textContent = 'Finish the other recording first.'; return; }
    record.disabled = true;
    status.textContent = 'Allow the microphone to record your sentence.';
    const session = { stop: () => {}, cancel: () => {}, stream: null, recognition: null, context: null, cancelled: false };
    activeVoiceSession = session;
    let recorder, recognitionError = false, finished = false, chunks = [];
    let stopping = false, recordingDone = false, recognitionEnded = true, graceExpired = false;
    let recognitionDisabled = false, startFailures = 0, cleanedUp = false;
    let monitor, restartTimer, graceTimer, maxTimer, source, analyser, samples;
    let startedAt = 0, lastSpeechAt = 0, heardVoice = false, loudSince = null, noiseFloor = .003;
    let recognitionSpeaking = false, stopReason = 'manual';
    const recognitionRuns = [];
    const transcript = () => recognitionRuns.map(run => run.text).filter(Boolean).join(' ').trim();
    const closeAnalysis = () => {
      clearInterval(monitor);
      source?.disconnect();
      analyser?.disconnect();
      if (session.context && session.context.state !== 'closed') session.context.close().catch(() => {});
    };
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearTimeout(maxTimer); clearTimeout(restartTimer); clearTimeout(graceTimer);
      closeAnalysis();
      session.stream?.getTracks().forEach(track => track.stop());
      try { session.recognition?.abort(); } catch (_) { /* Already ended. */ }
      if (activeVoiceSession === session) {
        activeVoiceSession = null;
        document.body.classList.remove('voice-recording');
      }
      stop.hidden = true; stop.disabled = false; record.hidden = false; record.disabled = false;
      listen.disabled = !window.speechSynthesis || !window.SpeechSynthesisUtterance;
    };
    const feedback = () => {
      const spoken = transcript();
      const heard = normalizeSpokenSentence(spoken);
      if (heard && heard === normalizeSpokenSentence(sentence)) {
        window.gpFeedbackSounds?.correct();
        status.textContent = `🌟 Great speaking! The words match! I heard: “${spoken}”`;
      } else if (stopReason === 'no-speech' && !heardVoice && !heard) {
        status.textContent = '🎤 I didn’t hear a voice yet. Tap My turn and try again.';
      } else if (!Recognition || recognitionError) {
        status.textContent = Recognition ? '🎧 Your voice is saved! Word checking could not finish. Listen to your voice and try again.' : '🎧 Your turn is saved! Listen to your voice.';
      } else if (heard) {
        window.gpFeedbackSounds?.wrong();
        status.textContent = `I heard: “${spoken}”. 🔊 Listen, then try again!`;
      } else {
        status.textContent = '🎧 Your voice is saved! I couldn’t hear the words clearly. Let’s try again!';
      }
    };
    const finish = () => {
      if (finished || session.cancelled || !recordingDone || (!recognitionEnded && !graceExpired)) return;
      finished = true;
      cleanup();
      feedback();
    };
    const noteSpeech = () => {
      heardVoice = true;
      lastSpeechAt = performance.now();
    };
    const startRecognition = () => {
      if (!Recognition || recognitionDisabled || stopping || session.cancelled || finished) return;
      try {
        const recognition = new Recognition();
        const run = {text: '', ended: false};
        recognitionRuns.push(run);
        session.recognition = recognition;
        recognitionEnded = false;
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onspeechstart = () => { recognitionSpeaking = true; noteSpeech(); };
        recognition.onspeechend = () => { recognitionSpeaking = false; noteSpeech(); };
        recognition.onresult = event => {
          if (finished || session.cancelled) return;
          // Each result list replaces this run's interim text; a restart adds a new run.
          run.text = Array.from(event.results, result => result[0].transcript).join(' ').trim();
          startFailures = 0;
          recognitionError = false;
          if (run.text) noteSpeech();
          if (!stopping && run.text) status.textContent = `🎤 I hear: “${transcript()}” Keep going!`;
          // A recognized word is progress, not a signal to stop the microphone.
        };
        recognition.onerror = event => {
          if (finished || session.cancelled || stopping) return;
          recognitionSpeaking = false;
          if (event.error === 'no-speech' || event.error === 'aborted') return;
          recognitionError = true;
          recognitionDisabled = true;
          // Local voice detection and the recording continue if word checking disconnects.
        };
        recognition.onend = () => {
          if (run.ended || finished || session.cancelled) return;
          run.ended = true;
          recognitionEnded = true;
          recognitionSpeaking = false;
          if (stopping) finish();
          else if (!recognitionDisabled) restartTimer = setTimeout(startRecognition, 250);
        };
        recognition.start();
      } catch (_) {
        recognitionEnded = true;
        recognitionError = true;
        if (++startFailures < 3) restartTimer = setTimeout(startRecognition, 250);
        else recognitionDisabled = true;
      }
    };
    session.cancel = () => {
      session.cancelled = true;
      finished = true;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      if (recordingDone) clearRecording();
      status.textContent = 'Recording stopped. Tap My turn to try again.';
      // Retain the permission-request lock until its stream resolves or rejects.
      if (session.stream || recorder) cleanup();
      else closeAnalysis();
    };
    try {
      window.speechSynthesis?.cancel(); audio.pause();
      // Open Web Audio in the button gesture so phone browsers can unlock it.
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        try {
          session.context = new AudioContext();
          session.context.resume().catch(() => {});
        } catch (_) { /* Recognition or All done still works without local metering. */ }
      }
      session.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      if (session.cancelled) { cleanup(); return; }
      recorder = new MediaRecorder(session.stream);
      clearRecording();
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        if (session.cancelled || finished) return;
        recordingDone = true;
        const blob = new Blob(chunks,{type:recorder.mimeType || chunks[0]?.type || 'audio/webm'});
        if (blob.size) {
          recordingURL = URL.createObjectURL(blob); audio.src = recordingURL;
          audio.hidden = false; remove.hidden = false;
        }
        finish();
      };
      session.stop = (reason = 'manual') => {
        if (stopping || finished || session.cancelled) return;
        stopping = true; stopReason = reason;
        clearTimeout(maxTimer); clearTimeout(restartTimer);
        closeAnalysis();
        stop.disabled = true;
        status.textContent = '🎧 Saving your turn…';
        // A final recognition result can arrive after MediaRecorder's stop event.
        graceTimer = setTimeout(() => { graceExpired = true; finish(); }, 1000);
        if (recorder.state !== 'inactive') recorder.stop();
        try { session.recognition?.stop(); } catch (_) { /* Already stopped. */ }
      };
      stop.onclick = () => session.stop();
      if (session.context) {
        try {
          source = session.context.createMediaStreamSource(session.stream);
          analyser = session.context.createAnalyser();
          analyser.fftSize = 2048;
          samples = new Float32Array(analyser.fftSize);
          source.connect(analyser);
        } catch (_) { analyser = null; }
      }
      recorder.onerror = () => { finished = true; cleanup(); status.textContent = 'Recording failed. Please try again.'; };
      recorder.start();
      startedAt = performance.now();
      document.body.classList.add('voice-recording');
      record.hidden = true; stop.hidden = false; listen.disabled = true;
      status.textContent = (analyser || Recognition) ? '🎤 I’m listening! Take your time. I’ll finish after you stop speaking.' : '🎤 I’m listening! Say it, then tap All done!';
      monitor = setInterval(() => {
        if (stopping || finished || session.cancelled) return;
        const now = performance.now();
        const metering = analyser && session.context?.state === 'running';
        if (metering) {
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
          const threshold = Math.max(.008, noiseFloor * 2.5);
          if (rms > threshold) {
            if (loudSince === null) loudSince = now;
            // Ignore a brief click or microphone pop before the child starts.
            if (heardVoice || now - loudSince >= 150) noteSpeech();
          } else {
            loudSince = null;
            noiseFloor = Math.min(.025, noiseFloor * .95 + rms * .05);
          }
        } else if (recognitionSpeaking) noteSpeech();
        // Do not interpret a suspended audio context as silence.
        const canDetect = metering || (!analyser && Recognition && !recognitionDisabled);
        if (canDetect && heardVoice && now - lastSpeechAt >= VOICE_SILENCE_MS) session.stop('silence');
        else if (canDetect && !heardVoice && now - startedAt >= VOICE_FIRST_WORD_MS) session.stop('no-speech');
      }, 100);
      maxTimer = setTimeout(() => session.stop('limit'), VOICE_MAX_RECORDING_MS);
      startRecognition();
    } catch (error) {
      finished = true;
      cleanup();
      if (session.cancelled) return;
      status.textContent = error.name === 'NotAllowedError' ? 'Microphone permission was not granted. Allow it in your browser to record.' : 'Could not access the microphone. Check that it is connected and try again.';
    }
  };
});
function cancelVoicePractice() {
  if (activeVoiceSession) {
    const session = activeVoiceSession;
    session.cancel();
  }
  window.speechSynthesis?.cancel();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelVoicePractice();
});
window.addEventListener('pagehide', cancelVoicePractice);
