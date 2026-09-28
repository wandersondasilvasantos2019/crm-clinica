/**
 * Alerta sonoro de pedido novo, gerado com Web Audio API (sem arquivo de áudio).
 *
 * Navegadores só deixam um AudioContext tocar depois de uma interação do
 * usuário. O contexto é criado sob demanda (nunca na importação do módulo) e
 * compartilhado pela aplicação inteira, então sobrevive a trocas de rota.
 */
import type { AlertaSom, ConfigCliente } from '@/types/database'

// ---- Parâmetros dos sons (ajuste aqui) -------------------------------------
// Alarme: sirene alternando entre frequências agudas.
const ALARME_FREQUENCIAS_HZ = [1000, 1600]
const ALARME_DURACAO_TOM_MS = 150
/** Duração aproximada da sirene (arredondada para um nº inteiro de tons). */
const ALARME_DURACAO_SIRENE_MS = 2500
const ALARME_PAUSA_MS = 500
/** Segunda voz (dente de serra, uma oitava acima), relativa à voz principal. */
const ALARME_VOLUME_SEGUNDA_VOZ = 0.35

// Campainha: ding-dong forte em onda triangular.
const CAMPAINHA_NOTAS_HZ = [988, 784]
const CAMPAINHA_ATRASO_SEGUNDA_NOTA_MS = 400
const CAMPAINHA_DURACAO_NOTA_MS = 1100
const CAMPAINHA_CICLO_MS = 2500

// Bipe: estilo maquininha/iFood.
const BIPE_FREQUENCIA_HZ = 2000
const BIPE_QUANTIDADE = 3
const BIPE_DURACAO_MS = 120
const BIPE_ESPACO_MS = 80
const BIPE_CICLO_MS = 1500

// Suave: o ding-dong senoidal original.
const SUAVE_NOTAS_HZ = [880, 660]
const SUAVE_CICLO_MS = 3000

/** Ataque/soltura dos envelopes, curtos só pra não dar clique. */
const ENVELOPE_MS = 5

// Keep-alive (ver iniciarKeepAlive). O Chrome considera silêncio abaixo de
// ~-72 dBFS, então o ganho não pode ser menor que isso ou a aba não conta como
// "tocando áudio". 0.001 ≈ -60 dBFS numa senoide de 30 Hz: inaudível na prática.
const KEEP_ALIVE_GANHO = 0.001
const KEEP_ALIVE_FREQUENCIA_HZ = 30
// -----------------------------------------------------------------------------

export interface ConfigAlerta {
  som: AlertaSom
  /** 0.1 a 1.0 */
  volume: number
  /** Pausa extra entre ciclos, em segundos. */
  intervaloS: number
}

export const SONS_ALERTA: AlertaSom[] = ['alarme', 'campainha', 'bipe', 'suave']
export const CONFIG_ALERTA_PADRAO: ConfigAlerta = { som: 'alarme', volume: 0.9, intervaloS: 0 }

/** Lê a config de alerta do config_cliente, com fallback pro padrão se vier nula/inválida. */
export function configAlertaDoCliente(cliente: ConfigCliente | undefined): ConfigAlerta {
  const som = SONS_ALERTA.includes(cliente?.alerta_som as AlertaSom)
    ? (cliente!.alerta_som as AlertaSom)
    : CONFIG_ALERTA_PADRAO.som
  const volume = Number(cliente?.alerta_volume)
  const intervaloS = Number(cliente?.alerta_intervalo_s)
  return {
    som,
    volume: Number.isFinite(volume) && volume > 0 ? Math.min(1, Math.max(0.1, volume)) : CONFIG_ALERTA_PADRAO.volume,
    intervaloS: Number.isFinite(intervaloS) && intervaloS > 0 ? intervaloS : CONFIG_ALERTA_PADRAO.intervaloS,
  }
}

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

/** Compressor/limitador compartilhado: deixa o alerta alto sem estourar. */
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
function criarSaida(c: AudioContext, volume: number): GainNode {
  const saida = c.createGain()
  saida.gain.value = volume
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

interface Nota {
  tipo: OscillatorType
  freq: number
  inicio: number
  duracaoS: number
  pico: number
  /** true: decai exponencialmente (sino); false: sustenta e corta (bipe). */
  decai: boolean
}

function agendarNota(c: AudioContext, saida: AudioNode, nota: Nota) {
  const envelopeS = ENVELOPE_MS / 1000
  const fim = nota.inicio + nota.duracaoS
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = nota.tipo
  osc.frequency.setValueAtTime(nota.freq, nota.inicio)
  gain.gain.setValueAtTime(0, nota.inicio)
  gain.gain.linearRampToValueAtTime(nota.pico, nota.inicio + envelopeS)
  if (nota.decai) {
    gain.gain.exponentialRampToValueAtTime(0.0001, fim)
  } else {
    gain.gain.setValueAtTime(nota.pico, fim - envelopeS)
    gain.gain.linearRampToValueAtTime(0, fim)
  }
  osc.connect(gain).connect(saida)
  osc.start(nota.inicio)
  osc.stop(fim + 0.01)
}

const ALARME_TONS = Math.max(1, Math.round(ALARME_DURACAO_SIRENE_MS / ALARME_DURACAO_TOM_MS))
const ALARME_SIRENE_S = (ALARME_TONS * ALARME_DURACAO_TOM_MS) / 1000

/**
 * Sirene: cada voz é um único oscilador cuja frequência salta entre os tons —
 * a troca mantém a fase contínua, então só precisa de envelope no ciclo.
 */
function agendarAlarme(c: AudioContext, saida: AudioNode, inicio: number) {
  const fim = inicio + ALARME_SIRENE_S
  const envelopeS = ENVELOPE_MS / 1000

  const envelope = c.createGain()
  envelope.gain.setValueAtTime(0, inicio)
  envelope.gain.linearRampToValueAtTime(1, inicio + envelopeS)
  envelope.gain.setValueAtTime(1, fim - envelopeS)
  envelope.gain.linearRampToValueAtTime(0, fim)
  envelope.connect(saida)

  const vozes: { tipo: OscillatorType; multiplicador: number; volume: number }[] = [
    { tipo: 'square', multiplicador: 1, volume: 1 },
    { tipo: 'sawtooth', multiplicador: 2, volume: ALARME_VOLUME_SEGUNDA_VOZ },
  ]

  for (const voz of vozes) {
    const osc = c.createOscillator()
    const ganhoVoz = c.createGain()
    osc.type = voz.tipo
    for (let i = 0; i < ALARME_TONS; i++) {
      const freq = ALARME_FREQUENCIAS_HZ[i % ALARME_FREQUENCIAS_HZ.length] * voz.multiplicador
      osc.frequency.setValueAtTime(freq, inicio + (i * ALARME_DURACAO_TOM_MS) / 1000)
    }
    ganhoVoz.gain.value = voz.volume
    osc.connect(ganhoVoz).connect(envelope)
    osc.start(inicio)
    osc.stop(fim + 0.01)
  }
}

function agendarCampainha(c: AudioContext, saida: AudioNode, inicio: number) {
  CAMPAINHA_NOTAS_HZ.forEach((freq, i) => {
    const inicioNota = inicio + (i * CAMPAINHA_ATRASO_SEGUNDA_NOTA_MS) / 1000
    const duracaoS = CAMPAINHA_DURACAO_NOTA_MS / 1000
    agendarNota(c, saida, { tipo: 'triangle', freq, inicio: inicioNota, duracaoS, pico: 1, decai: true })
    // Oitava acima, mais fraca, pra dar brilho e cortar o barulho ambiente.
    agendarNota(c, saida, { tipo: 'triangle', freq: freq * 2, inicio: inicioNota, duracaoS, pico: 0.3, decai: true })
  })
}

function agendarBipe(c: AudioContext, saida: AudioNode, inicio: number) {
  for (let i = 0; i < BIPE_QUANTIDADE; i++) {
    agendarNota(c, saida, {
      tipo: 'square',
      freq: BIPE_FREQUENCIA_HZ,
      inicio: inicio + (i * (BIPE_DURACAO_MS + BIPE_ESPACO_MS)) / 1000,
      duracaoS: BIPE_DURACAO_MS / 1000,
      pico: 1,
      decai: false,
    })
  }
}

function agendarSuave(c: AudioContext, saida: AudioNode, inicio: number) {
  const [ding, dong] = SUAVE_NOTAS_HZ
  // Fundamental + um harmônico mais fraco, pra soar como campainha e não como bip.
  for (const [mult, pico] of [
    [1, 0.5],
    [2, 0.15],
  ] as const) {
    agendarNota(c, saida, { tipo: 'sine', freq: ding * mult, inicio, duracaoS: 0.6, pico, decai: true })
    agendarNota(c, saida, { tipo: 'sine', freq: dong * mult, inicio: inicio + 0.35, duracaoS: 0.9, pico, decai: true })
  }
}

interface Preset {
  /** Duração de um ciclo (som + pausa própria do preset), em segundos. */
  cicloS: number
  agendar: (c: AudioContext, saida: AudioNode, inicio: number) => void
}

const PRESETS: Record<AlertaSom, Preset> = {
  alarme: { cicloS: ALARME_SIRENE_S + ALARME_PAUSA_MS / 1000, agendar: agendarAlarme },
  campainha: { cicloS: CAMPAINHA_CICLO_MS / 1000, agendar: agendarCampainha },
  bipe: { cicloS: BIPE_CICLO_MS / 1000, agendar: agendarBipe },
  suave: { cicloS: SUAVE_CICLO_MS / 1000, agendar: agendarSuave },
}

/**
 * Toca um único ciclo do som (botões "Testar"). Chamar dentro de um clique:
 * libera o áudio se ainda não estiver liberado.
 */
export async function tocarTesteAlarme(config: ConfigAlerta): Promise<void> {
  if (!(await desbloquearAudio()) || !ctx) return
  const preset = PRESETS[config.som]
  const saida = criarSaida(ctx, config.volume)
  preset.agendar(ctx, saida, ctx.currentTime + 0.05)
  setTimeout(() => saida.disconnect(), preset.cicloS * 1000 + 500)
}

// Os ciclos são agendados no relógio do AudioContext com bastante antecedência:
// abas em segundo plano têm setInterval estrangulado (até 1x/min no Chrome), e
// o som não pode depender disso.
const HORIZONTE_AGENDAMENTO_S = 65

/**
 * Toca o alerta agora e repete continuamente até a função retornada ser
 * chamada. Não faz nada se o áudio ainda não foi liberado. Como os ciclos já
 * ficam agendados, pra trocar a config é preciso parar e iniciar de novo.
 */
export function iniciarAlertaEmLoop(config: ConfigAlerta): () => void {
  const c = ctx
  if (!c || c.state !== 'running') return () => {}

  const preset = PRESETS[config.som]
  const cicloS = preset.cicloS + config.intervaloS
  const saida = criarSaida(c, config.volume)
  let proximo = c.currentTime + 0.05

  function completarAgenda() {
    if (!c) return
    if (proximo < c.currentTime) proximo = c.currentTime + 0.05
    while (proximo < c.currentTime + HORIZONTE_AGENDAMENTO_S) {
      preset.agendar(c, saida, proximo)
      proximo += cicloS
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

/**
 * Keep-alive anti-congelamento: um oscilador contínuo, grave e praticamente
 * mudo, ligado direto no destination.
 *
 * Por quê: a "Economia de memória" do Chrome descarta/congela abas em segundo
 * plano, e uma aba congelada não recebe o realtime nem toca o alerta. Abas que
 * estão tocando áudio ficam isentas, então mantemos a aba sempre "tocando".
 * Vai direto no destination (sem o compressor, que aplicaria ganho de
 * compensação e poderia tornar o tom audível). Efeito colateral: a aba mostra o
 * ícone de alto-falante — se alguém silenciar a aba por ali, o alerta também
 * fica mudo.
 */
export function iniciarKeepAlive(): () => void {
  const c = ctx
  if (!c || c.state !== 'running') return () => {}

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = KEEP_ALIVE_FREQUENCIA_HZ
  gain.gain.value = KEEP_ALIVE_GANHO
  osc.connect(gain).connect(c.destination)
  osc.start()

  return () => {
    osc.stop()
    gain.disconnect()
  }
}
