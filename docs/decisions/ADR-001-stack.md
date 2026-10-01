# ADR-001: Стек — Electron + React + TypeScript + electron-vite + MUI

## Status
Accepted

## Date
2026-10-01

## Context
Учебный проект вырос до продукта: нужно десктоп-приложение с быстрым UI,
двумя процессами (main/renderer), строгой типизацией IPC-контракта и светлой/
тёмной темами. Команда из одного человека, важна скорость итераций.

## Decision
Electron для десктопа, React 19 + TypeScript, сборка через `electron-vite`
(три цели: main/preload/renderer, HMR), UI — Material UI v9 с двумя темами.

## Alternatives Considered
- **Tauri** — меньше бандл, но Rust-бэкенд и другой опыт; для обучения Electron выбран осознанно.
- **Ванильный JS + HTML** — проще старт, но хуже масштабируется и нет типов IPC.
- **Electron Forge** — больше конфигурации; `electron-vite` дал HMR и три таргета из коробки.

## Consequences
- Плюс: единый TS-контракт `src/shared/types.ts` для main/preload/renderer.
- Плюс: renderer — обычный React, переиспользуется в веб-версии и расширении.
- Минус: бандл ~120 МБ (Electron); подпись macOS/Windows платная (см. ADR-005).
