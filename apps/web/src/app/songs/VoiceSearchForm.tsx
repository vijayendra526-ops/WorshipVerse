
'use client';

import { useRef, useState } from 'react';

type RecognitionResult = {
  transcript: string;
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<RecognitionResult> & { isFinal?: boolean }>;
};

type RecognitionErrorEvent = {
  error: string;
  message?: string;
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
  abort: () => void;
};

type RecognitionConstructor = new () => RecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

type Props = {
  language: 'te' | 'en';
  initialQuery: string;
};

export default function VoiceSearchForm({
  language,
  initialQuery,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  const recognitionRef = useRef<RecognitionInstance | null>(null);

  const startVoiceSearch = () => {
    const speechWindow = window as SpeechWindow;

    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(
        'Voice search is not supported. Please use the latest Google Chrome.'
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
          setQuery(transcript.trim());
          setMessage('Voice recognized! Press Search to find songs.');
        }
      };

      recognition.onerror = (event) => {
        setListening(false);

        const errors: Record<string, string> = {
          'no-speech': 'No speech detected. Please speak closer to your microphone.',
          'not-allowed': 'Microphone permission denied. Allow microphone access in Chrome.',
          'service-not-allowed': 'Speech recognition service is blocked.',
          'network': 'Network error. Check your internet connection and try again.',
          'audio-capture': 'Microphone not detected. Check your microphone connection.',
          'language-not-supported': `Speech recognition does not support ${language === 'te' ? 'Telugu' : 'English'} in this browser.`,
          'aborted': 'Voice search was stopped.',
        };

        setMessage(
          errors[event.error] ||
          `Voice recognition error: ${event.error}. ${event.message || 'Please try again.'}`
        );
      };

      recognition.onend = () => {
        setListening(false);
        setMessage((previous) =>
          previous.startsWith('Listening...')
            ? 'No speech detected. Please try again.'
            : previous
        );
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setListening(false);
      setMessage(
        error instanceof Error
          ? `Unable to start voice search: ${error.message}`
          : 'Unable to start voice search. Check microphone permissions.'
      );
    }
  };

  const stopVoiceSearch = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div>
      <form action="/songs" method="GET" className="mt-8 flex flex-wrap gap-2">
        <input type="hidden" name="language" value={language} />

        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            language === 'te'
              ? 'పాట పేరు ద్వారా వెతకండి...'
              : 'Search songs by title...'
          }
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#32165C]"
        />

        <button
          type="button"
          onClick={listening ? stopVoiceSearch : startVoiceSearch}
          aria-label={listening ? 'Stop voice search' : 'Start voice search'}
          className={`rounded-xl px-4 py-3 font-semibold ${
            listening
              ? 'bg-red-600 text-white'
              : 'border border-[#32165C] bg-white text-[#32165C]'
          }`}
        >
          {listening ? '■ Stop' : '🎙 Mic'}
        </button>

        <button
          type="submit"
          className="rounded-xl bg-[#32165C] px-5 py-3 font-semibold text-white"
        >
          Search
        </button>
      </form>

      {message && (
        <p className="mt-2 text-sm text-[#65409A]" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
