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
    text: 'Cliente manda mensagem às 22h. Ninguém responde. Ele marca no concorrente.',
  },
  {
    icon: PhoneOff,
    text: 'Você tenta atender o WhatsApp, o telefone e quem já está no local — e algo sempre fica pra trás.',
  },
  {
    icon: CalendarX2,
    text: 'Toda semana, alguns horários ficam vagos porque ninguém confirmou o agendamento a tempo.',
  },
]

const SOLUTIONS = [
  { icon: MessageCircle, text: 'Responde no WhatsApp 24h, todo dia' },
  { icon: CalendarCheck, text: 'Agenda sozinha, checando a agenda real dos profissionais' },
  { icon: BellRing, text: 'Confirma horários e reduz faltas' },
  { icon: LayoutDashboard, text: 'Você acompanha tudo num painel simples' },
]

const NICHES = [
  { icon: Stethoscope, label: 'Clínicas e consultórios' },
  { icon: Sparkles, label: 'Studios de beleza e estética' },
  { icon: Scissors, label: 'Barbearias e salões' },
  { icon: PawPrint, label: 'Petshops e banho & tosa' },
  { icon: Dumbbell, label: 'Personal trainers e estúdios' },
  { icon: CalendarClock, label: 'Qualquer negócio que agenda horário com cliente' },
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
  'Você fala com a gente e a gente configura seu negócio',
  'Testa 7 dias, de graça, funcionando de verdade',
  'Se curtir, continua. Se não, desliga sem custo',
]

function CTAButton({ size = 'lg', className = '' }: { size?: 'lg' | 'md'; className?: string }) {
  const sizeClasses = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'
  return (
    <a
      href={CTA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary font-bold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-brand-secondary hover:shadow-xl active:translate-y-0 ${sizeClasses} ${className}`}
    >
      Testar a Secretária Agora
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
            <CTAButton size="md" className="hidden sm:inline-flex" />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-dark px-4 py-20 text-white sm:px-6 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-primary/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-secondary/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Seu negócio nunca mais perde um cliente por demora no WhatsApp
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Uma secretária inteligente que responde, agenda e confirma horários 24 horas por
            dia — sem você precisar contratar ninguém.
          </p>
          <div className="mt-8 flex justify-center">
            <CTAButton />
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Isso já aconteceu no seu negócio esta semana
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {PROBLEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-gray-700 sm:text-base">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            E se seu negócio tivesse uma secretária que nunca dorme?
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map(({ icon: Icon, text }) => (
              <div key={text} className="card text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-700 sm:text-base">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <CTAButton />
          </div>
        </div>
      </section>

      {/* NICHOS ATENDIDOS */}
      <section className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Feito para quem vive de agenda cheia
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {NICHES.map(({ icon: Icon, label }) => (
              <div key={label} className="card flex flex-col items-center gap-3 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SLIDESHOW DO PRODUTO */}
      <section className="bg-brand-light px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
            Veja o sistema por dentro
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-gray">
            Tudo isso já está rodando, atendendo clientes de verdade.
          </p>
        </div>
        <div className="mt-10">
          <ProductCarousel slides={PRODUCT_SLIDES} />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Como funciona
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
                  {i + 1}
                </div>
                <p className="mt-4 text-sm font-medium text-brand-dark sm:text-base">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-brand-dark px-4 py-20 text-center text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-4xl">
            Pronto pra parar de perder cliente por demora?
          </h2>
          <p className="mt-4 text-white/80">
            Comece hoje e tenha uma secretária inteligente cuidando do seu negócio 24 horas por
            dia.
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
