import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server.js';

class FakeWordList {
    constructor(words, err = null) {
        this.words = words;
        this.err = err;
    }

    async addWord(_word) {
        // no-op for tests
    }

    async getWords() {
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

    it('word exists in long list with exact match', async () => {
        const wl = new FakeWordList(['hola', 'adios']);
        const app = createServer(wl);
        const res = await request(app).get('/exists/hola');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ exists: true });
    });

    it('word exists as prefix', async () => {
        const wl = new FakeWordList(['hola', 'adios']);
        const app = createServer(wl);
        const res = await request(app).get('/exists/ad');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ exists: true });
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
        const res = await request(app).get('/exists/hola');
        expect(res.status).toBe(400);
        expect(res.text).toBe('boom');
    });
});

describe('GET /matches/:prefix', () => {
    it('returns matches case-insensitively', async () => {
        const wl = new FakeWordList(['Hola', 'hombre', 'adios']);
        const app = createServer(wl);
        const res = await request(app).get('/matches/ho');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ matches: ['Hola', 'hombre'] });
    });

    it('returns empty list when no matches', async () => {
        const wl = new FakeWordList(['hola', 'adios']);
        const app = createServer(wl);
        const res = await request(app).get('/matches/zz');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ matches: [] });
    });

    it('GetWords error returns 400', async () => {
        const wl = new FakeWordList([], new Error('boom'));
        const app = createServer(wl);
        const res = await request(app).get('/matches/ho');
        expect(res.status).toBe(400);
        expect(res.text).toBe('boom');
    });
});

describe('GET /ping', () => {
    it('returns pong', async () => {
        const wl = new FakeWordList([]);
        const app = createServer(wl);
        const res = await request(app).get('/ping');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'pong' });
    });
});
