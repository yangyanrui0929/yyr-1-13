import { useEffect, useMemo, useState } from 'react'
import { Users, Coffee, AlertTriangle, Sparkles, X, Heart, Clock } from 'lucide-react'
import { useGameStore, getTeaLevel } from '@/store/useGameStore'
import Interruption from './Interruption'
import type { SeatTeaState, Customer, Seat, CustomerLeaveAlert } from '@/types'

function getMood(sat: number): string {
  if (sat >= 80) return '😍'
  if (sat >= 60) return '😊'
  if (sat >= 40) return '😐'
  if (sat >= 20) return '😕'
  return '😠'
}

function getTeaColor(temperature: number): string {
  if (temperature >= 85) return '#D13B1F'
  if (temperature >= 60) return '#C96A1E'
  if (temperature >= 35) return '#4A7C3A'
  if (temperature >= 15) return '#3A6E8C'
  return '#5A7B9C'
}

function getTeaEmoji(temperature: number): string {
  const level = getTeaLevel(temperature)
  switch (level) {
    case '滚烫': return '♨️'
    case '热': return '🍵'
    case '温': return '🫖'
    case '凉': return '🥤'
    case '冷': return '🧊'
  }
}

function isNearTurningPoint(progress: number): { near: boolean; range: string } {
  if (progress >= 18 && progress <= 32) return { near: true, range: '第一幕转折' }
  if (progress >= 43 && progress <= 57) return { near: true, range: '中场高潮' }
  if (progress >= 68 && progress <= 82) return { near: true, range: '终章转折' }
  return { near: false, range: '' }
}

interface PatienceFloat {
  id: string
  seatId: number
  value: number
  emotional: boolean
}

interface CustomerCardProps {
  customer: Customer
  seat: Seat | undefined
  teaState: SeatTeaState | undefined
  onRefill: (seatId: number) => void
  canAfford: boolean
  performanceActive: boolean
  onFloatComplete: (floatId: string) => void
  floats: PatienceFloat[]
}

function CustomerCard({ customer, seat, teaState, onRefill, canAfford, performanceActive, onFloatComplete, floats }: CustomerCardProps) {
  const temperature = teaState?.temperature ?? 0
  const teaLevel = getTeaLevel(temperature)
  const teaEmoji = getTeaEmoji(temperature)
  const teaColor = getTeaColor(temperature)
  const urgent = temperature < 35
  const emotional = teaState?.emotionalMatch
  const refillCount = teaState?.refillCount ?? 0
  const lastPatienceGain = teaState?.lastPatienceGain ?? 0
  const lastRefillEmotional = teaState?.lastRefillEmotional ?? false
  const patience = customer.patience

  const cardFloats = floats.filter((f) => f.seatId === customer.seatId)

  return (
    <div
      className={`card-ancient p-2 text-center transition-all relative ${
        customer.satisfaction < 40 ? 'animate-shake border-cinnabar' : ''
      } ${urgent ? 'ring-2 ring-cinnabar/50' : ''}`}
    >
      {emotional && (
        <div className="absolute -top-2 -right-2 text-lg animate-bounce z-10" title="情绪契合！">
          ✨
        </div>
      )}

      {cardFloats.map((float) => (
        <div
          key={float.id}
          className="absolute -top-4 left-1/2 -translate-x-1/2 animate-floatUp z-20 pointer-events-none"
          onAnimationEnd={() => onFloatComplete(float.id)}
        >
          <span className={`font-bold ${float.emotional ? 'text-gold' : 'text-tea'} text-sm whitespace-nowrap`}>
            ❤️耐心 +{float.value}
            {float.emotional && <span className="text-gold text-xs ml-1">✨</span>}
          </span>
        </div>
      ))}

      <div className="text-2xl">{customer.emoji}</div>
      <div className="text-xs font-song truncate">{customer.name}</div>
      <div className={`text-[10px] font-song ${seat?.tier === '贵宾' ? 'text-gold' : seat?.tier === '雅座' ? 'text-tea' : 'text-sandal'}`}>
        {seat?.tier}座
      </div>
      <div className="text-xl my-1">{getMood(customer.satisfaction)}</div>
      <div className="h-1.5 bg-paper-dark rounded-full overflow-hidden mb-1">
        <div
          className="h-full transition-all"
          style={{
            width: `${customer.satisfaction}%`,
            backgroundColor: customer.satisfaction > 60 ? '#6B8E5A' : customer.satisfaction > 40 ? '#C9A24B' : '#A83232',
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-1 mb-1" title={`耐心值：${patience}/10`}>
        <Heart className="w-3 h-3 text-cinnabar" fill="#D13B1F" />
        <span className="text-[10px] font-semibold text-cinnabar">耐心 {patience}</span>
      </div>

      <div className="flex items-center justify-center gap-1 mb-1" title={`茶温：${teaLevel}（${Math.round(temperature)}°）`}>
        <span className="text-base" style={{ filter: urgent ? 'drop-shadow(0 0 2px #A83232)' : 'none' }}>
          {teaEmoji}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: teaColor }}>
          {teaLevel}
        </span>
        {urgent && <AlertTriangle className="w-3 h-3 text-cinnabar" />}
      </div>

      <div className="h-1 bg-paper-dark rounded-full overflow-hidden mb-1">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${temperature}%`, backgroundColor: teaColor }}
        />
      </div>

      <button
        onClick={() => seat && onRefill(seat.id)}
        disabled={!performanceActive || !canAfford}
        className={`w-full text-[10px] font-song py-1 rounded border transition-all flex items-center justify-center gap-0.5 ${
          performanceActive && canAfford
            ? 'bg-tea/20 border-tea text-tea hover:bg-tea/30 active:scale-95'
            : 'bg-paper-dark/50 border-sandal/30 text-ink-light cursor-not-allowed'
        } ${urgent ? 'animate-pulse' : ''}`}
        title={`续茶（3文），已续${refillCount}次。上次续茶耐心+${lastPatienceGain}${lastRefillEmotional ? '（情绪契合）' : ''}`}
      >
        <Coffee className="w-3 h-3" />
        <span>续茶</span>
        <Clock className="w-2.5 h-2.5 ml-0.5 opacity-60" />
      </button>
    </div>
  )
}

interface LeaveAlertModalProps {
  alert: CustomerLeaveAlert
  onDismiss: () => void
}

function LeaveAlertModal({ alert, onDismiss }: LeaveAlertModalProps) {
  const tierColor = alert.seatTier === '贵宾' ? 'text-gold' : alert.seatTier === '雅座' ? 'text-tea' : 'text-sandal'
  const tierBg = alert.seatTier === '贵宾' ? 'bg-gold/15 border-gold/40' : alert.seatTier === '雅座' ? 'bg-tea/15 border-tea/40' : 'bg-sandal/15 border-sandal/40'

  return (
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className={`card-ancient max-w-md w-full animate-unroll p-6 border-4 ${tierBg}`}>
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">🚪💨</div>
          <h3 className="font-brush text-2xl text-cinnabar mb-2">客官愤然离席！</h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-paper-dark/50 rounded-lg">
            <span className="font-song text-ink-light">客人</span>
            <span className={`font-bold ${tierColor}`}>
              {alert.customerName}（{alert.customerType}）
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-paper-dark/50 rounded-lg">
            <span className="font-song text-ink-light">座位</span>
            <span className={`font-bold ${tierColor}`}>{alert.seatTier}座</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-cinnabar/10 rounded-lg border border-cinnabar/30">
            <span className="font-song text-ink-light">原因</span>
            <span className="font-bold text-cinnabar">{alert.reason}</span>
          </div>
        </div>

        <div className="p-3 bg-sandal/10 rounded-lg border border-sandal/30 mb-6 text-sm text-ink-light">
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-sandal flex-shrink-0 mt-0.5" />
            <span>
              茶水冰冷导致贵客流失！该座位收入将受到损失，并且影响茶楼声望。请务必注意及时为高等级座位续茶！
            </span>
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="w-full btn-cinnabar py-3 font-song text-lg"
        >
          知道了，我这就去招呼其他客人
        </button>
      </div>
    </div>
  )
}

export default function Performance() {
  const {
    customers,
    currentStory,
    currentBranch,
    storyProgress,
    performanceActive,
    currentInterruption,
    tickPerformance,
    handleInterruption,
    refillTea,
    seatTeaStates,
    seats,
    gold,
    performanceTick,
    customerLeaveAlerts,
    dismissLeaveAlert,
  } = useGameStore()

  const [patienceFloats, setPatienceFloats] = useState<PatienceFloat[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!performanceActive) return
    const timer = setInterval(tickPerformance, 800)
    return () => clearInterval(timer)
  }, [performanceActive, tickPerformance])

  const seated = customers.filter((c) => c.seatId !== null)
  const avgSat =
    seated.length > 0
      ? Math.round(seated.reduce((s, c) => s + c.satisfaction, 0) / seated.length)
      : 0

  const avgTemp = useMemo(() => {
    if (seatTeaStates.length === 0) return 0
    return Math.round(seatTeaStates.reduce((s, t) => s + t.temperature, 0) / seatTeaStates.length)
  }, [seatTeaStates])

  const avgPatience = useMemo(() => {
    if (seated.length === 0) return 0
    return Math.round(seated.reduce((s, c) => s + c.patience, 0) / seated.length * 10) / 10
  }, [seated])

  const turningInfo = isNearTurningPoint(storyProgress)
  const coldCount = seatTeaStates.filter((t) => getTeaLevel(t.temperature) === '冷').length
  const coolCount = seatTeaStates.filter((t) => getTeaLevel(t.temperature) === '凉').length
  const emotionalCount = seatTeaStates.filter((t) => t.emotionalMatch).length
  const canAffordRefill = gold >= 3

  const handleRefill = (seatId: number) => {
    const teaState = seatTeaStates.find((ts) => ts.seatId === seatId)
    if (!teaState) return
    const emotionalMatch = teaState.emotionalMatch || isNearTurningPoint(storyProgress).near
    const patienceGain = emotionalMatch ? 8 : 3
    const float: PatienceFloat = {
      id: `float-${Date.now()}-${Math.random()}`,
      seatId,
      value: patienceGain,
      emotional: emotionalMatch,
    }
    setPatienceFloats((prev) => [...prev, float])
    refillTea(seatId)
  }

  const handleFloatComplete = (floatId: string) => {
    setPatienceFloats((prev) => prev.filter((f) => f.id !== floatId))
  }

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId))
    dismissLeaveAlert(alertId)
  }

  const activeAlert = customerLeaveAlerts.find((a) => !dismissedAlerts.has(a.id))

  if (!performanceActive && storyProgress === 0) {
    return (
      <div className="scroll-panel text-center py-12">
        <span className="text-6xl mb-4 block">🎭</span>
        <div className="font-brush text-2xl text-sandal mb-2">等待开讲</div>
        <div className="text-ink-light">请先选择故事与分支</div>
        <div className="mt-6 text-sm text-ink-light">
          <div className="flex items-center justify-center gap-2">
            <Coffee className="w-4 h-4 text-tea" />
            <span>夜场提示：注意管理每桌茶温，在故事转折点前后续茶可获得耐心与满意度双重加成</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="scroll-panel">
      <h2 className="text-2xl font-brush text-sandal mb-4 flex items-center gap-2">
        <Users className="w-6 h-6" /> 开讲现场
      </h2>

      {currentInterruption && <Interruption event={currentInterruption} onChoose={handleInterruption} />}
      {activeAlert && <LeaveAlertModal alert={activeAlert} onDismiss={() => handleDismissAlert(activeAlert.id)} />}

      <div className="relative">
        <div className="text-center py-6 bg-gradient-to-b from-cinnabar/10 to-paper rounded-xl border-2 border-cinnabar/30 mb-6">
          <div className="text-7xl mb-2">🎙️</div>
          <div className="font-brush text-2xl text-cinnabar">{currentStory?.title}</div>
          <div className="text-ink-light mt-1">{currentBranch?.title}</div>
          <div className="text-sm text-sandal mt-3 font-song italic">
            {currentBranch?.content?.slice(0, Math.floor((storyProgress / 100) * currentBranch.content.length))}
            <span className="animate-pulse text-cinnabar">▊</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-song">说书进度</span>
              <span className="font-semibold text-sandal">{storyProgress}%</span>
            </div>
            <div className="h-3 bg-paper-dark rounded-full overflow-hidden border border-sandal/30 relative">
              <div
                className="h-full bg-gradient-to-r from-gold via-cinnabar to-sandal transition-all duration-500"
                style={{ width: `${storyProgress}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-tea/60"
                style={{ left: '25%' }}
                title="第一幕转折"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-tea/60"
                style={{ left: '50%' }}
                title="中场高潮"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-tea/60"
                style={{ left: '75%' }}
                title="终章转折"
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink-light mt-0.5">
              <span>开场</span>
              <span className="text-tea">第一转折</span>
              <span className="text-tea">中场</span>
              <span className="text-tea">终转折</span>
              <span>落幕</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-song flex items-center gap-1">
                <Coffee className="w-4 h-4" /> 平均茶温
                <span className="text-lg">{getTeaEmoji(avgTemp)}</span>
              </span>
              <span className="font-semibold" style={{ color: getTeaColor(avgTemp) }}>
                {getTeaLevel(avgTemp)} {avgTemp}°
              </span>
            </div>
            <div className="h-3 bg-paper-dark rounded-full overflow-hidden border border-sandal/30">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${avgTemp}%`,
                  backgroundColor: getTeaColor(avgTemp),
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: getTeaColor(10) }}>
              <span>冷</span>
              <span style={{ color: getTeaColor(25) }}>凉</span>
              <span style={{ color: getTeaColor(47) }}>温</span>
              <span style={{ color: getTeaColor(72) }}>热</span>
              <span style={{ color: getTeaColor(90) }}>滚烫</span>
            </div>
          </div>
        </div>

        {turningInfo.near && performanceActive && (
          <div className="mb-4 p-3 rounded-xl bg-gold/15 border-2 border-gold/40 flex items-center gap-3 animate-pulse">
            <Sparkles className="w-5 h-5 text-gold flex-shrink-0" />
            <div>
              <div className="font-brush text-lg text-gold">即将进入「{turningInfo.range}」！</div>
              <div className="text-xs text-ink-light">
                此时为客人们续上「热」或「温」的茶水，可触发<span className="text-tea font-semibold">情绪契合</span>效果，
                <span className="text-cinnabar font-semibold">耐心+8</span> + 满意度+17双重加成！
              </div>
            </div>
          </div>
        )}

        {performanceActive && (coldCount > 0 || coolCount > 0) && (
          <div className="mb-4 p-3 rounded-xl bg-cinnabar/10 border-2 border-cinnabar/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-cinnabar flex-shrink-0" />
            <div className="text-sm">
              {coldCount > 0 && (
                <span className="text-cinnabar font-semibold">
                  {coldCount} 桌茶水已冰冷！{coldCount >= 1 && '商贾可能催促，雅座/贵宾客有离席风险！'}
                </span>
              )}
              {coolCount > 0 && coldCount === 0 && (
                <span className="text-sandal font-semibold">
                  {coolCount} 桌茶水渐凉，建议尽快续茶
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap justify-between items-center gap-2 text-sm">
          <div className="text-ink-light">
            观众 <span className="font-semibold text-ink">{seated.length}</span> 人
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 text-ink-light">
              <span>平均满意度</span>
              <span className="text-2xl">{getMood(avgSat)}</span>
              <span className="font-bold text-lg" style={{ color: avgSat > 60 ? '#6B8E5A' : avgSat > 40 ? '#C9A24B' : '#A83232' }}>
                {avgSat}
              </span>
            </div>
            <div className="flex items-center gap-1 text-ink-light">
              <Heart className="w-4 h-4 text-cinnabar" fill="#D13B1F" />
              <span>平均耐心</span>
              <span className="font-bold text-lg text-cinnabar">{avgPatience}</span>
            </div>
            {emotionalCount > 0 && (
              <div className="flex items-center gap-1 text-gold">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">情绪契合 {emotionalCount} 桌</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-ink-light">
              <span>场次计时</span>
              <span className="font-semibold text-tea">第 {performanceTick} 拍</span>
            </div>
            <div className="flex items-center gap-1 text-ink-light">
              <Coffee className="w-4 h-4" />
              <span>续茶花费</span>
              <span className={`font-semibold ${canAffordRefill ? 'text-gold' : 'text-cinnabar'}`}>
                3 文/桌
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {seated.map((c) => {
            const seat = seats.find((s) => s.id === c.seatId)
            const tea = seatTeaStates.find((t) => t.seatId === c.seatId)
            return (
              <CustomerCard
                key={c.id}
                customer={c}
                seat={seat}
                teaState={tea}
                onRefill={handleRefill}
                canAfford={canAffordRefill}
                performanceActive={performanceActive}
                onFloatComplete={handleFloatComplete}
                floats={patienceFloats}
              />
            )
          })}
        </div>

        {performanceActive && (
          <div className="mt-4 text-center text-xs text-ink-light space-y-1">
            <p>💡 点击「续茶」可将对应桌茶水重置为滚烫。续茶时机越贴近故事转折点，耐心与满意度加成越大。</p>
            <p>💡 座位越尊贵，茶水降温速度越慢，但茶凉造成的损失也越大。❤️耐心值越高，客人越不容易催促或离席。</p>
          </div>
        )}
      </div>
    </div>
  )
}
