
'use client';

import { useEffect, useRef, useState } from 'react';

type RecognitionResult = {
  transcript: string;
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<RecognitionResult>>;
};

type RecognitionErrorEvent = {
  error: string;
};

type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionInstance;
  webkitSpeechRecognition?: new () => RecognitionInstance;
};

type Props = {
  language: 'en' | 'te';
  onTranscript: (transcript: string) => void;
};

export default function VoiceSearch({
  language,
  onTranscript,
}: Props) {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function startVoiceSearch() {
    if (!window.isSecureContext) {
      setMessage('Voice search requires a secure HTTPS connection.');
      return;
    }

    const speechWindow = window as SpeechWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(
        'Voice search is unavailable in this browser. Try a supported browser.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setListening(true);
        setMessage('Listening... Speak now.');
      };

      recognition.onresult = (event) => {
        let transcript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0]?.transcript || '';
        }

        if (transcript.trim()) {
          onTranscript(transcript.trim());
          setMessage('Voice recognized! Press Search to find songs.');
        }
      };

      recognition.onerror = (event) => {
        setListening(false);

        const messages: Record<string, string> = {
          'not-allowed':
            'Microphone access is blocked. Check your browser microphone permissions.',
          'service-not-allowed':
            'Your browser or device has blocked its speech recognition service. Try Safari again or use typed search.',
          'no-speech':
            'No speech detected. Please try speaking again.',
          network:
            'Speech recognition network error. Check your internet connection.',
          'audio-capture':
            'No microphone detected. Check your microphone settings.',
          'language-not-supported':
            'This language is not supported by speech recognition on this device.',
          aborted:
            'Voice search was stopped.',
        };

        setMessage(
          messages[event.error] ||
          `Voice search failed (${event.error}). Please use typed search.`
        );
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      setMessage('Unable to start voice search. Please try again.');
    }
  }

  function stopVoiceSearch() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={listening ? stopVoiceSearch : startVoiceSearch}
        aria-label={listening ? 'Stop voice search' : 'Start voice search'}
        aria-pressed={listening}
        className={`shrink-0 rounded-xl border px-4 py-3 font-semibold transition ${
          listening
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-[#D8B66C] bg-white text-[#32165C] hover:bg-[#FAF8F4]'
        }`}
      >
        {listening ? '■ Stop' : '🎙'}
      </button>

      {message && (
        <p
          className="max-w-xs text-center text-xs text-[#65409A]"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}
