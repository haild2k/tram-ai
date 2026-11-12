#!/usr/bin/env python3
"""Tổng hợp hiệu ứng âm thanh + nền pad cho style skill-motion (không bản quyền).
  python3 scripts/make_sfx.py   → public/sfx/*.wav
"""
import os, wave
import numpy as np
SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sfx")
rng = np.random.default_rng(7)

def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    st = np.stack([x, x], 1)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / r)

def lp(x, k):  # lọc thông thấp một cực, k 0..1
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y

def whoosh():
    n = int(0.55 * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    k = 0.02 + 0.25 * np.sin(np.pi * t / t[-1]) ** 2
    y = np.zeros(n); acc = 0.0
    for i in range(n):
        acc += k[i] * (noise[i] - acc); y[i] = acc
    return y * np.sin(np.pi * t / t[-1]) ** 1.5

def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 28) + 380
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.035)

def click():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) * 0.6 + rng.standard_normal(n) * 0.4) * env(n, 0.0005, 0.008)

def tick():
    n = int(0.18 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * env(n, 0.002, 0.05)

def type_():
    n = int(0.035 * SR)
    return lp(rng.standard_normal(n), 0.35) * env(n, 0.0005, 0.006)

def riser():
    n = int(1.2 * SR); t = np.arange(n) / SR
    f = 180 + 900 * (t / t[-1]) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    no = lp(rng.standard_normal(n), 0.08) * 0.7
    return (tone + no) * (t / t[-1]) ** 2

def hit():
    n = int(0.9 * SR); t = np.arange(n) / SR
    f = 120 * np.exp(-t * 6) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.25) + lp(rng.standard_normal(n), 0.2) * env(n, 0.001, 0.05) * 0.5

def pad(sec=64):
    n = int(sec * SR); t = np.arange(n) / SR
    chords = [[220.0, 261.63, 329.63, 392.0], [196.0, 246.94, 293.66, 369.99], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 392.0]]
    y = np.zeros(n); seg = n // len(chords)
    for ci, ch in enumerate(chords):
        a, b = ci * seg, (ci + 1) * seg if ci < len(chords) - 1 else n
        tt = t[a:b]; part = np.zeros(b - a)
        for j, f in enumerate(ch):
            part += np.sin(2 * np.pi * f * tt + j) * (0.6 if j else 1) + 0.15 * np.sin(2 * np.pi * f * 2.003 * tt)
        fade = np.minimum(1, np.minimum(tt - tt[0], tt[-1] - tt) / 2.0)
        y[a:b] += part * fade
    y *= 0.75 + 0.25 * np.sin(2 * np.pi * t / 8)
    return lp(y, 0.06)

os.makedirs(OUT, exist_ok=True)
for name, fn, g in [("whoosh", whoosh, 0.7), ("pop", pop, 0.6), ("click", click, 0.7), ("tick", tick, 0.5),
                    ("type", type_, 0.35), ("riser", riser, 0.6), ("hit", hit, 0.8), ("pad", pad, 0.5)]:
    save(name, fn(), g); print("✓", name)
