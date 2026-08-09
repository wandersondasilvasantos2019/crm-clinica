import type { ReactNode } from 'react'
import {
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  Clock,
  Dumbbell,
  LayoutDashboard,
  MessageCircle,
  PawPrint,
  PhoneOff,
  Scissors,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LogoWsantos from '@/components/LogoWsantos'
import ProductCarousel from '@/components/landing/ProductCarousel'

// Troque aqui o número que recebe o clique do botão CTA (formato DDI+DDD+número, sem símbolos).
const WHATSAPP_NUMBER = '5567992234078'
const WHATSAPP_MESSAGE = 'Quero testar a secretária inteligente'
const CTA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const PROBLEMS = [
  {
    icon: Clock,
    title: 'Cliente manda mensagem depois do horário.',
    text: 'Ninguém responde na hora e ele pode procurar outra empresa.',
  },
  {
    icon: PhoneOff,
    title: 'Você está atendendo e chegam várias mensagens.',
    text: 'Algumas conversas ficam para depois e oportunidades acabam esquecidas.',
  },
  {
    icon: CalendarX2,
    title: 'Um cliente marca horário, mas ninguém confirma.',
    text: 'Horários podem ficar vazios simplesmente porque não houve acompanhamento.',
  },
]

const SOLUTIONS = [
  {
    icon: MessageCircle,
    title: 'Atende no WhatsApp 24h',
    text: 'Responde seus clientes mesmo quando sua equipe está ocupada.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda automaticamente',
    text: 'Consulta disponibilidade e ajuda o cliente a encontrar um horário.',
  },
  {
    icon: BellRing,
    title: 'Organiza seus leads',
    text: 'Cada conversa pode virar uma oportunidade organizada para sua equipe.',
  },
  {
    icon: LayoutDashboard,
    title: 'Você acompanha tudo',
    text: 'Tenha uma visão organizada dos contatos e atendimentos.',
  },
]

const NICHES = [
  { icon: Stethoscope, label: 'Clínicas e consultórios' },
  { icon: Sparkles, label: 'Studios de beleza e estética' },
  { icon: Scissors, label: 'Barbearias e salões' },
  { icon: PawPrint, label: 'Petshops e banho e tosa' },
  { icon: Dumbbell, label: 'Personal trainers e estúdios' },
  { icon: CalendarClock, label: 'Negócios que trabalham com agendamento' },
]

const PRODUCT_SLIDES = [
  {
    src: 'https://ojdcadlezkzusrblhnau.supabase.co/storage/v1/object/public/Lading%20page%20wsantos%20AI/dashboard%20page.png',
    alt: 'Painel completo do negócio',
    caption: 'Painel completo do seu negócio',
  },
  {
    src: 'https://ojdcadlezkzusrblhnau.supabase.co/storage/v1/object/public/Lading%20page%20wsantos%20AI/agendamento%20page.png',
    alt: 'Agenda organizada do negócio',
    caption: 'Agenda sempre organizada',
  },
  {
    src: 'https://ojdcadlezkzusrblhnau.supabase.co/storage/v1/object/public/Lading%20page%20wsantos%20AI/atendimento%20page.png',
    alt: 'Conversas de atendimento em tempo real',
    caption: 'Veja as conversas em tempo real',
  },
  {
    src: 'https://ojdcadlezkzusrblhnau.supabase.co/storage/v1/object/public/Lading%20page%20wsantos%20AI/contato%20page.png',
    alt: 'Lista de contatos do negócio',
    caption: 'Todos os contatos num só lugar',
  },
  {
    src: 'https://ojdcadlezkzusrblhnau.supabase.co/storage/v1/object/public/Lading%20page%20wsantos%20AI/estatitica%20page.png',
    alt: 'Estatísticas de atendimento',
    caption: 'Acompanhe os resultados',
  },
]

const STEPS = [
  {
    title: 'Você nos conta como seu negócio funciona',
    text: 'Entendemos seus serviços, horários, profissionais e regras de atendimento.',
  },
  {
    title: 'Configuramos sua secretária',
    text: 'Adaptamos o atendimento para a realidade da sua empresa.',
  },
  {
    title: 'Você começa a receber os atendimentos',
    text: 'A secretária passa a cuidar do primeiro contato e dos agendamentos definidos para sua operação.',
  },
]

function CTAButton({
  size = 'lg',
  className = '',
  children,
}: {
  size?: 'lg' | 'md'
  className?: string
  children?: ReactNode
}) {
  const sizeClasses = size === 'lg' ? 'px-8 py-4 text-base sm:text-lg' : 'px-5 py-2.5 text-sm'
  return (
    <a
      href={CTA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary font-bold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-brand-secondary hover:shadow-xl active:translate-y-0 ${sizeClasses} ${className}`}
    >
      {children ?? 'CONVERSE COM A SECRETÁRIA AGORA'}
    </a>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-brand-light/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoWsantos size="sm" />
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/login" className="text-sm text-brand-gray transition hover:text-brand-dark">
              Entrar
            </Link>
            <CTAButton size="md" className="hidden sm:inline-flex">
              Converse com a Secretária
            </CTAButton>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-dark px-4 py-20 text-white sm:px-6 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-secondary/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Pare de perder clientes por demora no WhatsApp.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Sua secretária digital atende 24h, conversa com seus clientes, responde dúvidas e
            agenda horários automaticamente — enquanto você cuida do seu negócio.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <CTAButton />
            <span className="text-xs text-white/60">Teste uma conversa real com a secretária.</span>
          </div>
        </div>
      </section>

      {/* DOR */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Quantas dessas situações acontecem no seu negócio?
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {PROBLEMS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-brand-dark sm:text-base">{title}</p>
                <p className="mt-1.5 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECRETÁRIA DIGITAL */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
              E se seu negócio tivesse uma secretária que nunca dorme?
            </h2>
            <p className="mt-3 text-brand-gray">
              Ela cuida do primeiro atendimento enquanto você cuida do que realmente importa.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-brand-dark sm:text-base">{title}</p>
                <p className="mt-1.5 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <CTAButton />
          </div>
        </div>
      </section>

      {/* FEITO PARA */}
      <section className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
              Feito para negócios que vivem de agendamentos
            </h2>
            <p className="mt-3 text-brand-gray">
              Se seus clientes precisam conversar com você antes de marcar um horário, o wsantos
              pode assumir grande parte desse primeiro atendimento.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            {NICHES.map(({ icon: Icon, label }) => (
              <div key={label} className="card flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SISTEMA + PRODUTO */}
      <section className="bg-brand-light px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
            Veja sua secretária trabalhando
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-gray">
            Mais do que responder mensagens, ela ajuda a organizar o atendimento e os agendamentos
            do seu negócio.
          </p>
        </div>
        <div className="mt-10">
          <ProductCarousel slides={PRODUCT_SLIDES} />
        </div>
        <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium text-brand-dark">
            Veja funcionando antes de contratar.
          </p>
          <CTAButton />
        </div>
        <div className="mx-auto mt-14 max-w-2xl text-center">
          <h3 className="text-xl font-bold text-brand-dark sm:text-2xl">
            Tenha sua operação organizada em um só lugar
          </h3>
          <p className="mt-3 text-brand-gray">
            Acompanhe contatos, agendamentos e informações importantes sem depender de dezenas de
            conversas espalhadas pelo WhatsApp.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Como funciona
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ title, text }, i) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
                  {i + 1}
                </div>
                <p className="mt-4 text-sm font-semibold text-brand-dark sm:text-base">{title}</p>
                <p className="mt-1.5 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-brand-dark px-4 py-20 text-center text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-4xl">
            Pronto para parar de perder clientes por demora?
          </h2>
          <p className="mt-4 text-white/80">
            Converse com a secretária e veja como o atendimento inteligente pode funcionar no seu
            negócio.
          </p>
          <div className="mt-8 flex justify-center">
            <CTAButton />
          </div>
        </div>
      </section>

      <footer className="bg-brand-dark px-4 py-6 text-center text-xs text-white/50 sm:px-6">
        © {new Date().getFullYear()} wsantos. Todos os direitos reservados.
      </footer>
    </div>
  )
}
