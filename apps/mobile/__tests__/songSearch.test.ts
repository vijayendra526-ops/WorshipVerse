/// <reference types="jest" />
import {
  normalizeSongSearch,
  getSearchCandidates,
  scoreSearchSong,
} from '../src/lib/songSearch';

describe('WorshipVerse song search', () => {
  test('normalizes English text and extra spaces', () => {
    expect(normalizeSongSearch('  JESUS   LOVES ME!  '))
      .toBe('jesus loves me');
  });

  test('preserves Telugu characters', () => {
    expect(normalizeSongSearch('  యేసు   ప్రేమ  '))
      .toBe('యేసు ప్రేమ');
  });

  test('creates a plain English search candidate', () => {
    expect(getSearchCandidates('Jesus')).toContain('jesus');
  });

  test('ranks exact song titles highest', () => {
    const candidates = getSearchCandidates('Amazing Grace');

    expect(scoreSearchSong({
      title: 'Amazing Grace',
      language: 'en',
    }, candidates)).toBe(5);
  });

  test('matches part of a song title', () => {
    const candidates = getSearchCandidates('Grace');

    expect(scoreSearchSong({
      title: 'Amazing Grace',
      language: 'en',
    }, candidates)).toBeGreaterThan(0);
  });

  test('matches artist names', () => {
    const candidates = getSearchCandidates('David');

    expect(scoreSearchSong({
      title: 'Worship Song',
      artist: 'David',
    }, candidates)).toBeGreaterThan(0);
  });

  test('does not match unrelated songs', () => {
    const candidates = getSearchCandidates('Hallelujah');

    expect(scoreSearchSong({
      title: 'Amazing Grace',
      artist: 'John',
    }, candidates)).toBe(0);
  });
});
