
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
  const transcriptRef = useRef('');
  const submittedRef = useRef(false);
  const errorRef = useRef('');

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
        'Voice search is not supported in this browser. Please try Google Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      transcriptRef.current = '';
      submittedRef.current = false;
      errorRef.current = '';

      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setListening(true);
        setMessage(
          language === 'te'
            ? 'వింటున్నాను... ఇప్పుడు మాట్లాడండి.'
            : 'Listening... Speak now.'
        );
      };

      recognition.onresult = (event) => {
        const finalParts: string[] = [];
        const interimParts: string[] = [];

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript?.trim();

          if (!text) continue;

          if (result.isFinal) {
            finalParts.push(text);
          } else {
            interimParts.push(text);
          }
        }

        const finalTranscript = finalParts.join(' ').trim();
        const interimTranscript = interimParts.join(' ').trim();

        const displayTranscript = [
          finalTranscript,
          interimTranscript,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (!displayTranscript) return;

        transcriptRef.current = displayTranscript;

        const isFinal =
          finalParts.length > 0 && interimParts.length === 0;

        onTranscript(displayTranscript, isFinal);

        setMessage(
          isFinal
            ? language === 'te'
              ? 'పాట కోసం వెతుకుతున్నాను...'
              : 'Searching for songs...'
            : language === 'te'
              ? 'మీ మాటలను గుర్తిస్తున్నాను...'
              : 'Recognizing your words...'
        );

        if (isFinal) {
          submittedRef.current = true;
        }
      };

      recognition.onerror = (event) => {
        errorRef.current = event.error;

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
            'Telugu or English recognition is not supported by this device.',
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

        const finalTranscript = transcriptRef.current.trim();

        // Submit the last recognized words if the browser ended
        // recognition before sending a final result event.
        if (finalTranscript && !submittedRef.current) {
          submittedRef.current = true;
          onTranscript(finalTranscript, true);

          setMessage(
            language === 'te'
              ? 'పాట కోసం వెతుకుతున్నాను...'
              : 'Searching for songs...'
          );
          return;
        }

        if (!finalTranscript && !errorRef.current) {
          setMessage(
            language === 'te'
              ? 'మాటలు గుర్తించబడలేదు. మళ్లీ ప్రయత్నించండి.'
              : 'No speech detected. Please try again.'
          );
        }
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
    if (!recognitionRef.current) return;

    setMessage(
      language === 'te'
        ? 'విన్న మాటలను పూర్తి చేస్తున్నాను...'
        : 'Finishing your voice search...'
    );

    recognitionRef.current.stop();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={listening ? stopVoiceSearch : startVoiceSearch}
        aria-label={listening ? 'Stop voice search' : 'Start voice search'}
        aria-pressed={listening}
        className={`relative flex h-12 min-w-14 items-center justify-center gap-2 rounded-xl border px-4 font-semibold transition ${
          listening
            ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-200'
            : 'border-[#D8B66C] bg-white text-[#32165C] hover:bg-[#FAF8F4]'
        }`}
      >
        {listening && (
          <span className="absolute inset-0 animate-ping rounded-xl border-2 border-red-400 opacity-30" />
        )}

        <span className="relative text-xl">
          {listening ? '■' : '🎙'}
        </span>

        <span className="relative">
          {listening ? 'Stop' : 'Voice'}
        </span>
      </button>

      {listening && (
        <div className="flex items-center gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((bar) => (
            <span
              key={bar}
              className="h-3 w-1 animate-pulse rounded-full bg-[#9B7A3C]"
              style={{
                animationDelay: `${bar * 100}ms`,
                height: `${10 + (bar % 3) * 5}px`,
              }}
            />
          ))}
        </div>
      )}

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
