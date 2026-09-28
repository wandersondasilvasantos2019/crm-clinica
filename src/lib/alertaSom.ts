/**
 * Alarme de pedido novo, gerado com Web Audio API (sem arquivo de áudio).
 *
 * Navegadores só deixam um AudioContext tocar depois de uma interação do
 * usuário. O contexto é criado sob demanda (nunca na importação do módulo) e
 * compartilhado pela aplicação inteira, então sobrevive a trocas de rota.
 */

// ---- Parâmetros do alarme (ajuste aqui) ------------------------------------
/** Frequências da sirene, alternadas a cada tom. */
const FREQUENCIAS_HZ = [1000, 1600]
/** Duração de cada tom da sirene. */
const DURACAO_TOM_MS = 150
/** Duração aproximada da sirene em cada ciclo (arredondada para um nº inteiro de tons). */
const DURACAO_SIRENE_MS = 2500
/** Silêncio entre um ciclo e outro. */
const PAUSA_MS = 500
/** Volume geral (0 a 1). Passa por um compressor antes da saída. */
const VOLUME = 0.9
/** Volume da segunda voz (dente de serra, uma oitava acima), relativo ao VOLUME. */
const VOLUME_SEGUNDA_VOZ = 0.35
/** Ataque/soltura do envelope, curtos só pra não dar clique. */
const ENVELOPE_MS = 5
// -----------------------------------------------------------------------------

const TONS_POR_CICLO = Math.max(1, Math.round(DURACAO_SIRENE_MS / DURACAO_TOM_MS))
const DURACAO_SIRENE_S = (TONS_POR_CICLO * DURACAO_TOM_MS) / 1000
const DURACAO_CICLO_S = DURACAO_SIRENE_S + PAUSA_MS / 1000

type AudioContextCtor = typeof AudioContext

let ctx: AudioContext | null = null
let compressor: DynamicsCompressorNode | null = null
const listeners = new Set<() => void>()

function notificarListeners() {
  listeners.forEach((listener) => listener())
}

function obterContexto(): AudioContext | null {
  if (ctx) return ctx
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  ctx.addEventListener('statechange', notificarListeners)
  return ctx
}

/** Compressor/limitador compartilhado: deixa o alarme alto sem estourar. */
function obterCompressor(c: AudioContext): DynamicsCompressorNode {
  if (compressor) return compressor
  compressor = c.createDynamicsCompressor()
  compressor.threshold.value = -6
  compressor.knee.value = 0
  compressor.ratio.value = 20
  compressor.attack.value = 0.001
  compressor.release.value = 0.1
  compressor.connect(c.destination)
  return compressor
}

/** Cria uma saída própria (ganho → compressor). Desconectar silencia na hora. */
function criarSaida(c: AudioContext): GainNode {
  const saida = c.createGain()
  saida.gain.value = VOLUME
  saida.connect(obterCompressor(c))
  return saida
}

export function audioLiberado(): boolean {
  return ctx?.state === 'running'
}

/** Assina mudanças de estado do áudio (liberado/suspenso). Retorna o unsubscribe. */
export function onAudioStateChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Tenta liberar o áudio. Deve ser chamada dentro de um handler de clique/tecla
 * para funcionar em todos os navegadores.
 */
export async function desbloquearAudio(): Promise<boolean> {
  const c = obterContexto()
  if (!c) return false
  if (c.state === 'running') return true

  // Safari/iOS só libera de fato depois de tocar algo ainda dentro do gesto.
  const silencio = c.createBufferSource()
  silencio.buffer = c.createBuffer(1, 1, 22050)
  silencio.connect(c.destination)
  silencio.start(0)

  try {
    await c.resume()
  } catch {
    return false
  }
  notificarListeners()
  return audioLiberado()
}

/**
 * Agenda um ciclo de sirene a partir de `inicio`. Cada voz é um único
 * oscilador cuja frequência salta entre os tons — a troca de frequência mantém
 * a fase contínua, então não precisa de envelope por tom (só no ciclo).
 */
function agendarCicloSirene(c: AudioContext, saida: AudioNode, inicio: number) {
  const fim = inicio + DURACAO_SIRENE_S
  const envelopeS = ENVELOPE_MS / 1000

  const envelope = c.createGain()
  envelope.gain.setValueAtTime(0, inicio)
  envelope.gain.linearRampToValueAtTime(1, inicio + envelopeS)
  envelope.gain.setValueAtTime(1, fim - envelopeS)
  envelope.gain.linearRampToValueAtTime(0, fim)
  envelope.connect(saida)

  const vozes: { tipo: OscillatorType; multiplicador: number; volume: number }[] = [
    { tipo: 'square', multiplicador: 1, volume: 1 },
    { tipo: 'sawtooth', multiplicador: 2, volume: VOLUME_SEGUNDA_VOZ },
  ]

  for (const voz of vozes) {
    const osc = c.createOscillator()
    const ganhoVoz = c.createGain()
    osc.type = voz.tipo
    for (let i = 0; i < TONS_POR_CICLO; i++) {
      const freq = FREQUENCIAS_HZ[i % FREQUENCIAS_HZ.length] * voz.multiplicador
      osc.frequency.setValueAtTime(freq, inicio + (i * DURACAO_TOM_MS) / 1000)
    }
    ganhoVoz.gain.value = voz.volume
    osc.connect(ganhoVoz).connect(envelope)
    osc.start(inicio)
    osc.stop(fim + 0.01)
  }
}

/**
 * Toca um único ciclo do alarme (botão "Testar som"). Chamar dentro de um
 * clique: libera o áudio se ainda não estiver liberado.
 */
export async function tocarTesteAlarme(): Promise<void> {
  if (!(await desbloquearAudio()) || !ctx) return
  const saida = criarSaida(ctx)
  agendarCicloSirene(ctx, saida, ctx.currentTime + 0.05)
  setTimeout(() => saida.disconnect(), DURACAO_CICLO_S * 1000 + 500)
}

// Os ciclos são agendados no relógio do AudioContext com bastante antecedência:
// abas em segundo plano têm setInterval estrangulado (até 1x/min no Chrome), e
// o som não pode depender disso.
const HORIZONTE_AGENDAMENTO_S = 65

/**
 * Toca o alarme agora e repete continuamente (sirene + pausa) até a função
 * retornada ser chamada. Não faz nada se o áudio ainda não foi liberado.
 */
export function iniciarAlertaEmLoop(): () => void {
  const c = ctx
  if (!c || c.state !== 'running') return () => {}

  const saida = criarSaida(c)
  let proximo = c.currentTime + 0.05

  function completarAgenda() {
    if (!c) return
    if (proximo < c.currentTime) proximo = c.currentTime + 0.05
    while (proximo < c.currentTime + HORIZONTE_AGENDAMENTO_S) {
      agendarCicloSirene(c, saida, proximo)
      proximo += DURACAO_CICLO_S
    }
  }

  completarAgenda()
  const timer = setInterval(completarAgenda, 1000)

  return () => {
    clearInterval(timer)
    // Desconectar a saída silencia na hora tudo que já estava agendado.
    saida.disconnect()
  }
}
