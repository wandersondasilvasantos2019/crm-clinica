import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { supabasePublic } from '@/lib/supabasePublic'
import { maskPhoneInput } from '@/lib/phone'
import PublicShell from '@/components/public/PublicShell'
import ProgressBar from '@/components/public/ProgressBar'
import StepServico from '@/components/public/StepServico'
import StepProfissional from '@/components/public/StepProfissional'
import StepDataHorario from '@/components/public/StepDataHorario'
import StepConfirmacao from '@/components/public/StepConfirmacao'
import SuccessScreen from '@/components/public/SuccessScreen'
import type { ConfigCliente, Profissional, Servico } from '@/types/database'

type Step = 1 | 2 | 3 | 4 | 'success'

export default function AgendarPublico() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()

  const [clinicLoading, setClinicLoading] = useState(true)
  const [clinicError, setClinicError] = useState(false)
  const [clinic, setClinic] = useState<ConfigCliente | null>(null)

  const [catalogLoading, setCatalogLoading] = useState(true)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])

  const [step, setStep] = useState<Step>(1)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0)
  const [slotTakenNotice, setSlotTakenNotice] = useState(false)

  const [leadId, setLeadId] = useState<string | null>(null)
  const [prefillNome, setPrefillNome] = useState('')
  const [prefillTelefone, setPrefillTelefone] = useState('')

  const [successInfo, setSuccessInfo] = useState<{ nome: string; dataHora: Date } | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function loadClinic() {
      setClinicLoading(true)
      const { data, error } = await supabasePublic
        .from('config_cliente')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setClinicError(true)
        setClinicLoading(false)
        return
      }
      setClinic(data)
      setClinicLoading(false)
    }

    loadClinic()
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!clinic) return
    let cancelled = false

    async function loadCatalog() {
      setCatalogLoading(true)
      const [servicosRes, profissionaisRes] = await Promise.all([
        supabasePublic
          .from('servicos')
          .select('*')
          .eq('instance_id', clinic!.instance_id)
          .eq('ativo', true)
          .order('nome'),
        supabasePublic.from('profissionais').select('*').eq('instance_id', clinic!.instance_id).order('nome'),
      ])

      if (cancelled) return
      setServicos(servicosRes.data ?? [])
      setProfissionais(profissionaisRes.data ?? [])
      setCatalogLoading(false)
    }

    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [clinic])

  useEffect(() => {
    if (!clinic) return
    const leadParam = searchParams.get('lead')
    if (!leadParam) return
    let cancelled = false

    supabasePublic
      .from('leads_pacientes')
      .select('*')
      .eq('id', leadParam)
      .eq('instance_id', clinic.instance_id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        setLeadId(data.id)
        setPrefillNome(data.nome ?? '')
        setPrefillTelefone(maskPhoneInput(data.telefone.replace(/^55/, '')))
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic])

  function handleSelectServico(servico: Servico) {
    setSelectedServico(servico)
    if (profissionais.length === 1) {
      setSelectedProfissional(profissionais[0])
      setStep(3)
    } else {
      setStep(2)
    }
  }

  function handleSelectProfissional(profissional: Profissional) {
    setSelectedProfissional(profissional)
    setStep(3)
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlotTakenNotice(false)
  }

  function handleSelectSlot(slot: string) {
    setSelectedSlot(slot)
    setStep(4)
  }

  function handleBack() {
    setSlotTakenNotice(false)
    if (step === 4) {
      setStep(3)
      return
    }
    if (step === 3) {
      if (profissionais.length === 1) {
        setSelectedProfissional(null)
        setStep(1)
      } else {
        setStep(2)
      }
      return
    }
    if (step === 2) {
      setStep(1)
    }
  }

  function handleSlotTaken() {
    setSelectedSlot(null)
    setSlotTakenNotice(true)
    setSlotsRefreshKey((k) => k + 1)
    setStep(3)
  }

  if (clinicLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (clinicError || !clinic) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Link inválido ou expirado</h1>
        <p className="text-sm text-gray-500">
          Verifique o link recebido ou entre em contato com a clínica para obter um novo.
        </p>
      </div>
    )
  }

  return (
    <PublicShell nomeEmpresa={clinic.nome_empresa} logoUrl={clinic.logo_url} corPrimaria={clinic.cor_primaria}>
      {step !== 'success' && <ProgressBar step={step} />}

      {step === 1 && (
        <StepServico servicos={servicos} loading={catalogLoading} onSelect={handleSelectServico} />
      )}

      {step === 2 && (
        <StepProfissional
          profissionais={profissionais}
          loading={catalogLoading}
          onSelect={handleSelectProfissional}
        />
      )}

      {step === 3 && selectedServico && selectedProfissional && (
        <div className="space-y-3">
          <button onClick={handleBack} className="text-sm font-medium text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          {slotTakenNotice && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário abaixo.
            </p>
          )}
          <StepDataHorario
            key={slotsRefreshKey}
            instanceId={clinic.instance_id}
            profissionalId={selectedProfissional.id}
            duracaoMinutos={selectedServico.duracao_minutos}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onSelectSlot={handleSelectSlot}
          />
        </div>
      )}

      {step === 4 && selectedServico && selectedProfissional && selectedDate && selectedSlot && (
        <StepConfirmacao
          instanceId={clinic.instance_id}
          servico={selectedServico}
          profissional={selectedProfissional}
          date={selectedDate}
          slot={selectedSlot}
          leadId={leadId}
          initialNome={prefillNome}
          initialTelefoneMasked={prefillTelefone}
          onBack={handleBack}
          onConfirmed={(info) => {
            setSuccessInfo(info)
            setStep('success')
          }}
          onSlotTaken={handleSlotTaken}
        />
      )}

      {step === 'success' && successInfo && selectedServico && selectedProfissional && (
        <SuccessScreen
          nome={successInfo.nome}
          servico={selectedServico}
          profissional={selectedProfissional}
          dataHora={successInfo.dataHora}
        />
      )}

      {step === 2 && (
        <button
          onClick={handleBack}
          className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Voltar
        </button>
      )}
    </PublicShell>
  )
}
