# Show da Química

Quiz de **ligações químicas** no formato de show de perguntas, para o 9º ano do ensino fundamental.
16 perguntas, escada de prêmios até 1 milhão de pontos, apresentador em pixel art, voz e efeitos sonoros.

## Como jogar
- Escolha A, B, C ou D (clique ou tecla da letra). Enter avança depois da explicação.
- Ajudas: **50/50**, **Universitários** (opinião da plateia) e **Pular** (3 vezes).
- **Parar** leva o prêmio atual. Ao errar, leva o último patamar seguro.
- Cronômetro de 30 s (pode ser desligado no início).

## Banco de perguntas
Está em [`js/questions.js`](js/questions.js): mais de 100 perguntas em 3 níveis (fácil, médio, difícil).
Formato de cada item: `{ n, q, o: [correta, errada, errada, errada], e }`.
A primeira alternativa é sempre a correta; o jogo embaralha na hora.
Para acrescentar perguntas, basta incluir novos objetos no array.

## Rodar localmente
Não precisa de instalação. Abra `index.html` no navegador, ou rode um servidor simples:

```
npx serve .
```

Atalho para testes: `?debug=16` abre direto na última pergunta.

## Publicar no Vercel
1. Entre em [vercel.com](https://vercel.com) com a conta do GitHub.
2. **Add New… → Project** e importe este repositório.
3. Framework preset: **Other**. Não precisa de build command nem output directory.
4. **Deploy**. Pronto, o site fica no ar em um endereço `*.vercel.app`.

## Observações
- A voz usa a síntese de voz do próprio navegador (pt-BR). Se o computador tiver uma voz em português instalada, ela é usada automaticamente.
- Música e efeitos são gerados no navegador (Web Audio API), sem arquivos de terceiros.
- O apresentador **Seu Valêncio** é um personagem original.
