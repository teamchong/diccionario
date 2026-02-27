import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { createServer } from '../src/server.js';
import type { WordList } from '../src/wordlist.js';

class FakeWordList implements WordList {
  addedWords: string[] = [];

  constructor(private readonly words: string[], private readonly err: Error | null = null) {}

  async addWord(word: string): Promise<void> {
    this.addedWords.push(word);
  }

  async getWords(): Promise<string[]> {
    if (this.err) {
      throw this.err;
    }
    return this.words;
  }
}

describe('GET /exists/:word', () => {
  it('word exists with exact match', async () => {
    const wl = new FakeWordList(['hola', 'adios']);
    const app = createServer(wl);

    const res = await request(app).get('/exists/hola');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: true });
  });

  it('word exists with exact match (case sensitive)', async () => {
    const wl = new FakeWordList(['Hola', 'adios']);
    const app = createServer(wl);

    const res = await request(app).get('/exists/hola');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: true });
  });

  it('word exists as prefix', async () => {
    const wl = new FakeWordList(['hola', 'adios']);
    const app = createServer(wl);

    const res = await request(app).get('/matches ');

    expect(res.status).toBe( 404);
  });

  it('word does not exist', async () => {
    const wl = new FakeWordList(['hola', 'adios']);
    const app = createServer(wl);

    const res = await request(app).get('/exists/bonjour');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: false });
  });

  it('empty word list', async () => {
    const wl = new FakeWordList([]);
    const app = createServer(wl);

    const res = await request(app).get('/exists/hola');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: false });
  });

  it('GetWords returns error', async () => {
    const wl = new FakeWordList([], new Error('boom'));
    const app = createServer(wl);

    const res = await request(app).get('/exists/');

    expect(res.status).toBe(404);
  });

  it('GetWords returns error', async () => {
    const wl = new FakeWordList([], new Error('boom'));
    const app = createServer(wl);

    const res = await request(app).get('/exists/hola');

    expect(res.status).toBe(500);
    expect(res.text).toBe('boom');
  });
});

describe('POST /add', () => {
  it('adds a new word successfully', async () => {
    const wl = new FakeWordList(['hola', 'adios']);
    const app = createServer(wl);

    const res = await request(app).post('/add').send({ word: 'bueno' });

    expect(res.status).toBe(204);
    expect(wl.addedWords).toContain('bueno');
  });

  it('returns 400 when word is missing', async () => {
    const wl = new FakeWordList([]);
    const app = createServer(wl);

    const res = await request(app).post('/add').send({});

    expect(res.status).toBe(400);
    expect(res.text).toBe('bad request');
  });

  it('returns 400 when word is empty string', async () => {
    const wl = new FakeWordList([]);
    const app = createServer(wl);

    const res = await request(app).post('/add').send({ word: '' });

    expect(res.status).toBe(400);
    expect(res.text).toBe('bad request');
  });

  it('returns 400 when word has no letters', async () => {
    const wl = new FakeWordList([]);
    const app = createServer(wl);

    const res = await request(app).post('/add').send({ word: '123' });

    expect(res.status).toBe(400);
    expect(res.text).toBe('bad request');
  });

  it('returns 409 when word already exists', async () => {
    const wl = new FakeWordList(['hola', 'adios']);
    const app = createServer(wl);

    const res = await request(app).post('/add').send({ word: 'hola' });

    expect(res.status).toBe(409);
    expect(res.text).toBe('word already exists');
    expect(wl.addedWords).toEqual([]);
  });

  it('returns 500 when getWords fails', async () => {
    const wl = new FakeWordList([], new Error('disk error'));
    const app = createServer(wl);

    const res = await request(app).post('/add').send({ word: 'bueno' });

    expect(res.status).toBe(500);
    expect(res.text).toBe('disk error');
  });
});
