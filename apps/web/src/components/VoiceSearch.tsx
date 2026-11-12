
'use client';

import { useEffect, useRef, useState } from 'react';

type RecognitionAlternative = {
  transcript: string;
};

type RecognitionResult = ArrayLike<RecognitionAlternative> & {
  isFinal: boolean;
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
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
  onTranscript: (transcript: string, isFinal: boolean) => void;
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
      recognitionRef.current = null;
    };
  }, []);

  function startVoiceSearch() {
    if (listening) return;

    if (!window.isSecureContext) {
      setMessage('Voice search requires HTTPS or localhost.');
      return;
    }

    const speechWindow = window as SpeechWindow;

    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(
        'Voice search is not supported in this browser. Try Google Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setListening(true);
        setMessage(
          language === 'te'
            ? 'వింటున్నాను... ఇప్పుడు మాట్లాడండి.'
            : 'Listening... Speak now.'
        );
      };

      recognition.onresult = (event) => {
        let transcript = '';

        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0]?.transcript || '';
        }

        const cleanedTranscript = transcript.trim();

        if (cleanedTranscript) {
          const lastResult = event.results[event.results.length - 1];
          const isFinal = Boolean(lastResult?.isFinal);

          onTranscript(cleanedTranscript, isFinal);

          setMessage(
            isFinal
              ? language === 'te'
                ? 'పాట కోసం వెతుకుతున్నాను...'
                : 'Searching for songs...'
              : language === 'te'
                ? 'మీ మాటలను గుర్తిస్తున్నాను...'
                : 'Recognizing your words...'
          );
        }
      };

      recognition.onerror = (event) => {
        setListening(false);

        const messages: Record<string, string> = {
          'not-allowed':
            'Microphone access is blocked. Allow microphone permission in your browser.',
          'service-not-allowed':
            'Speech recognition is blocked by your browser or device.',
          'no-speech':
            'No speech detected. Please try speaking again.',
          network:
            'Speech recognition network error. Check your internet connection.',
          'audio-capture':
            'No microphone detected. Check your microphone settings.',
          'language-not-supported':
            'This language is not supported on this device.',
          aborted: 'Voice search was stopped.',
        };

        setMessage(
          messages[event.error] ||
            `Voice search failed (${event.error}). Please try again.`
        );
      };

      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setMessage('Unable to start voice search. Please try again.');
    }
  }

  function stopVoiceSearch() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
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
