# Lyric Projector 🎤📺

> Fork/extensão complementar do [Better Lyrics](https://github.com/better-lyrics/better-lyrics) que captura as letras sincronizadas e projeta em uma segunda tela — só texto + fundo preto.

## O que faz

Captura a linha ativa do Better Lyrics (`div.blyrics--line.blyrics--animating`) e envia via `BroadcastChannel` para uma janela/aba de projeção limpa.

```
YouTube Music + Better Lyrics  ───▶  projection.html (fundo preto + 2 linhas)
       (Tab 1 / Tela 1)                      (Tab 2 / Tela 2)
```

## Como usar

### Desktop (HDMI)
1. Abre YouTube Music no Brave/Chrome com Better Lyrics
2. Clica **🖥️ Projetar** (ou `Ctrl+Shift+P`)
3. Arrasta a janela de projeção para a tela HDMI
4. `F11` para fullscreen

### Android (Screen Mirror)
1. Instala [Kiwi Browser](https://kiwibrowser.com/) (suporta extensões)
2. Instala Better Lyrics + esta extensão
3. Abre YouTube Music → toca música → clica **🖥️ Projetar**
4. Tab de projeção fica fullscreen → espelha tela via Miracast/Cast

### Atalhos
| Tecla | Ação |
|-------|------|
| `F` / `F11` | Fullscreen |
| `H` | Modo HUD espelhado (parabrisa) |
| `Esc` | Sair do fullscreen |
| `Ctrl+Shift+P` | Abrir projeção |

## Arquivos

```
lyric-projector/
├── manifest.json           ← Configuração da extensão
├── projection-observer.js  ← Content script (captura letras do DOM)
├── projection.html         ← Página de projeção (fundo preto + legendas)
├── icons/                  ← Ícones da extensão
└── docs/                   ← Documentação e prompts
```

## Licença

GNU GPLv3 — Baseado no [Better Lyrics](https://github.com/better-lyrics/better-lyrics)
