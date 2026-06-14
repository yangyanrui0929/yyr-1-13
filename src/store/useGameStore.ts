import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GameState,
  Weather,
  Snack,
  Seat,
  Customer,
  Story,
  StoryBranch,
  InterruptionEvent,
  InterruptionOption,
  LedgerRecord,
  StoryRecord,
  ReputationHistory,
  Renovation,
  SeatTeaState,
  CustomerLeaveAlert,
} from '@/types'
import { STORIES } from '@/data/stories'
import { initSnacks } from '@/data/snacks'
import { initSeats } from '@/data/seats'
import { initRenovations, getUpgradeCost } from '@/data/renovations'
import { INTERRUPTIONS } from '@/data/interruptions'
import { generateRandomCustomers } from '@/data/customers'
import { calcSettlement } from '@/utils/settlement'

const WEATHERS: Weather[] = ['晴', '晴', '晴', '云', '云', '雨', '雪']

function randomWeather(): Weather {
  return WEATHERS[Math.floor(Math.random() * WEATHERS.length)]
}

export function getTeaLevel(temperature: number): '滚烫' | '热' | '温' | '凉' | '冷' {
  if (temperature >= 85) return '滚烫'
  if (temperature >= 60) return '热'
  if (temperature >= 35) return '温'
  if (temperature >= 15) return '凉'
  return '冷'
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

function isStoryTurningPoint(progress: number): boolean {
  return (progress >= 22 && progress <= 28) || (progress >= 47 && progress <= 53) || (progress >= 72 && progress <= 78)
}

function calcEmotionalMatch(temperature: number, progress: number): boolean {
  const level = getTeaLevel(temperature)
  const atTurning = isStoryTurningPoint(progress)
  if (atTurning && (level === '热' || level === '温')) return true
  return false
}

function initSeatTeaStates(seats: Seat[]): SeatTeaState[] {
  return seats.filter(s => s.occupied).map(s => ({
    seatId: s.id,
    temperature: 90,
    lastRefillTick: 0,
    refillCount: 0,
    emotionalMatch: false,
    promptedUrge: false,
    promptedLeave: false,
    lastPatienceGain: 0,
    lastRefillEmotional: false,
  }))
}

function pickRandomStories(count: number): Story[] {
  const pool = [...STORIES]
  const result: Story[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

function uid(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const initialState: GameState = {
  day: 1,
  phase: 'day',
  gold: 200,
  reputation: 30,
  weather: '晴',
  snacks: initSnacks(),
  seats: initSeats(),
  renovations: initRenovations(),
  customers: [],
  currentStory: null,
  currentBranch: null,
  storyProgress: 0,
  availableStories: [],
  interruptions: INTERRUPTIONS,
  currentInterruption: null,
  performanceActive: false,
  ledger: [],
  storyHistory: [],
  reputationHistory: [],
  lastStoryDay: {},
  storyScores: {},
  isSettlement: false,
  lastSettlement: null,
  seatTeaStates: [],
  performanceTick: 0,
  customerLeaveAlerts: [],
}

interface GameActions {
  buySnack: (snackId: string, qty: number) => void
  moveSeat: (seatId: number, x: number, y: number) => void
  upgradeRenovation: (renoId: string) => void
  switchToNight: () => void
  selectStory: (storyId: string, branchId: string) => void
  startPerformance: () => void
  tickPerformance: () => void
  handleInterruption: (option: InterruptionOption) => void
  doSettlement: () => void
  nextDay: () => void
  resetGame: () => void
  addLedgerRecord: (type: LedgerRecord['type'], category: string, amount: number, note: string) => void
  refillTea: (seatId: number) => void
  dismissLeaveAlert: (alertId: string) => void
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      buySnack: (snackId: string, qty: number) => {
        const state = get()
        const snack = state.snacks.find((s) => s.id === snackId)
        if (!snack) return
        const totalCost = snack.cost * qty
        if (state.gold < totalCost) return
        const newStock = Math.min(snack.maxStock, snack.stock + qty)
        const actualQty = newStock - snack.stock
        if (actualQty <= 0) return
        const actualCost = snack.cost * actualQty

        set((s) => ({
          gold: s.gold - actualCost,
          snacks: s.snacks.map((x) =>
            x.id === snackId ? { ...x, stock: newStock } : x
          ),
        }))
        get().addLedgerRecord('支出', '茶点采购', actualCost, `采购${snack.name} x${actualQty}`)
      },

      moveSeat: (seatId: number, x: number, y: number) => {
        set((s) => ({
          seats: s.seats.map((seat) =>
            seat.id === seatId ? { ...seat, x, y } : seat
          ),
        }))
      },

      upgradeRenovation: (renoId: string) => {
        const state = get()
        const reno = state.renovations.find((r) => r.id === renoId)
        if (!reno || reno.level >= reno.maxLevel) return
        const cost = getUpgradeCost(reno)
        if (state.gold < cost) return

        const repGain = reno.bonusReputation

        set((s) => ({
          gold: s.gold - cost,
          reputation: Math.min(100, s.reputation + repGain),
          renovations: s.renovations.map((r) =>
            r.id === renoId ? { ...r, level: r.level + 1 } : r
          ),
          reputationHistory: [
            ...s.reputationHistory,
            {
              day: s.day,
              value: Math.min(100, s.reputation + repGain),
              delta: repGain,
              reason: `装修升级：${reno.name}`,
            },
          ],
        }))
        get().addLedgerRecord('支出', '装修升级', cost, `升级${reno.name}至${reno.level + 1}级`)
      },

      switchToNight: () => {
        const state = get()
        const weather = state.weather
        let customerCount = 6
        if (weather === '雨') customerCount = Math.max(2, customerCount - 3)
        if (weather === '雪') customerCount = Math.max(2, customerCount - 4)
        if (weather === '云') customerCount = Math.max(3, customerCount - 1)
        if (state.reputation > 50) customerCount += 2
        if (state.reputation > 80) customerCount += 2

        const customers = generateRandomCustomers(customerCount)
        const seats = [...state.seats].map((s) => ({ ...s, occupied: false }))
        const sortedSeats = [...seats].sort((a, b) => {
          const order: Record<Seat['tier'], number> = { 贵宾: 0, 雅座: 1, 普通: 2 }
          return order[a.tier] - order[b.tier]
        })
        for (let i = 0; i < Math.min(customers.length, sortedSeats.length); i++) {
          const seat = sortedSeats[i]
          customers[i].seatId = seat.id
          const idx = seats.findIndex((s) => s.id === seat.id)
          if (idx >= 0) seats[idx].occupied = true
        }

        const availableStories = pickRandomStories(3)

        set({
          phase: 'night',
          customers,
          seats,
          availableStories,
          currentStory: null,
          currentBranch: null,
          storyProgress: 0,
          performanceActive: false,
          currentInterruption: null,
          seatTeaStates: initSeatTeaStates(seats),
          performanceTick: 0,
          customerLeaveAlerts: [],
        })
      },

      selectStory: (storyId: string, branchId: string) => {
        const state = get()
        const story = state.availableStories.find((s) => s.id === storyId)
        const branch = story?.branches.find((b) => b.id === branchId)
        if (!story || !branch) return
        set({ currentStory: story, currentBranch: branch, storyProgress: 0 })
      },

      startPerformance: () => {
        const state = get()
        if (!state.currentStory || !state.currentBranch) return
        const refreshedTeaStates = state.seatTeaStates.map(ts => ({
          ...ts,
          temperature: 90,
          lastRefillTick: 0,
          refillCount: 0,
          emotionalMatch: false,
          promptedUrge: false,
          promptedLeave: false,
          lastPatienceGain: 0,
          lastRefillEmotional: false,
        }))
        set({
          performanceActive: true,
          storyProgress: 0,
          performanceTick: 0,
          seatTeaStates: refreshedTeaStates,
          customerLeaveAlerts: [],
        })
      },

      tickPerformance: () => {
        const state = get()
        if (!state.performanceActive) return

        const newProgress = Math.min(100, state.storyProgress + 4)
        const newTick = state.performanceTick + 1

        const seatedCustomers = state.customers.filter((c) => c.seatId !== null)

        let updatedTeaStates = state.seatTeaStates.map((ts) => {
          const seat = state.seats.find((s) => s.id === ts.seatId)
          let coolRate = 4
          if (seat?.tier === '雅座') coolRate = 3.5
          if (seat?.tier === '贵宾') coolRate = 3
          const newTemp = Math.max(0, ts.temperature - coolRate)
          const emotionalMatch = calcEmotionalMatch(newTemp, newProgress) || ts.emotionalMatch
          return {
            ...ts,
            temperature: newTemp,
            emotionalMatch,
          }
        })

        let triggeredInterruption: InterruptionEvent | null = null
        let customersToRemove: string[] = []

        for (const ts of updatedTeaStates) {
          const customer = state.customers.find((c) => c.seatId === ts.seatId)
          if (!customer) continue
          const teaLevel = getTeaLevel(ts.temperature)

          if (teaLevel === '凉' || teaLevel === '冷') {
            if (customer.type === '商贾' && !ts.promptedUrge && !state.currentInterruption) {
              if (Math.random() < 0.45) {
                updatedTeaStates = updatedTeaStates.map((x) =>
                  x.seatId === ts.seatId ? { ...x, promptedUrge: true } : x
                )
                const urgeEvents = state.interruptions.filter(
                  (i) => i.id === 'i-tea-urge-merchant' || (i.customerType === '商贾' && i.id === 'i3')
                )
                const pool = urgeEvents.length > 0 ? urgeEvents : state.interruptions
                triggeredInterruption = pool[Math.floor(Math.random() * pool.length)]
                break
              }
            }
          }

          if (teaLevel === '冷') {
            const seat = state.seats.find((s) => s.id === ts.seatId)
            if (seat?.tier === '雅座' && !ts.promptedLeave) {
              if (Math.random() < 0.25) {
                updatedTeaStates = updatedTeaStates.map((x) =>
                  x.seatId === ts.seatId ? { ...x, promptedLeave: true } : x
                )
                customersToRemove.push(customer.id)
                const alert: CustomerLeaveAlert = {
                  id: uid(),
                  customerName: customer.name,
                  customerType: customer.type,
                  seatTier: seat.tier,
                  reason: '茶水冰冷，不堪忍受',
                  timestamp: Date.now(),
                }
                set((s) => ({
                  customerLeaveAlerts: [...s.customerLeaveAlerts, alert],
                }))
              }
            }
            if (seat?.tier === '贵宾' && !ts.promptedLeave) {
              if (Math.random() < 0.12) {
                updatedTeaStates = updatedTeaStates.map((x) =>
                  x.seatId === ts.seatId ? { ...x, promptedLeave: true } : x
                )
                customersToRemove.push(customer.id)
                const alert: CustomerLeaveAlert = {
                  id: uid(),
                  customerName: customer.name,
                  customerType: customer.type,
                  seatTier: seat.tier,
                  reason: '茶凉待客失礼，有损贵客颜面',
                  timestamp: Date.now(),
                }
                set((s) => ({
                  customerLeaveAlerts: [...s.customerLeaveAlerts, alert],
                }))
              }
            }
          }
        }

        if (!state.currentInterruption && !triggeredInterruption && Math.random() < 0.12 && state.storyProgress > 10 && state.storyProgress < 90) {
          if (seatedCustomers.length > 0) {
            const remainingSeated = seatedCustomers.filter((c) => !customersToRemove.includes(c.id))
            if (remainingSeated.length > 0) {
              const c = remainingSeated[Math.floor(Math.random() * remainingSeated.length)]
              const matching = state.interruptions.filter((i) => i.customerType === c.type)
              const pool = matching.length > 0 ? matching : state.interruptions
              triggeredInterruption = pool[Math.floor(Math.random() * pool.length)]
            }
          }
        }

        let customers = state.customers.map((c) => {
          if (c.seatId === null) return c
          const ts = updatedTeaStates.find((t) => t.seatId === c.seatId)
          let delta = Math.random() < 0.7 ? 1 : -1
          if (state.currentStory && state.currentBranch) {
            const match = state.currentBranch.tags.some((t) => c.preferenceTags.includes(t))
            if (match) delta += 1
          }
          if (ts) {
            const teaLevel = getTeaLevel(ts.temperature)
            if (teaLevel === '热' || teaLevel === '温') delta += 1
            if (teaLevel === '凉') delta -= 1
            if (teaLevel === '冷') delta -= 2
            if (ts.emotionalMatch) delta += 2
          }
          if (customersToRemove.includes(c.id)) {
            return { ...c, seatId: null, satisfaction: Math.max(0, c.satisfaction - 25) }
          }
          return { ...c, satisfaction: Math.max(0, Math.min(100, c.satisfaction + delta)) }
        })

        let updatedSeats = state.seats
        if (customersToRemove.length > 0) {
          updatedSeats = state.seats.map((s) => {
            const c = state.customers.find((cust) => cust.seatId === s.id)
            if (c && customersToRemove.includes(c.id)) {
              return { ...s, occupied: false }
            }
            return s
          })
        }

        const finalInterruption = state.currentInterruption || triggeredInterruption

        if (newProgress >= 100) {
          set({
            performanceActive: false,
            storyProgress: 100,
            customers,
            seatTeaStates: updatedTeaStates,
            performanceTick: newTick,
            seats: updatedSeats,
          })
          setTimeout(() => get().doSettlement(), 600)
        } else {
          set({
            storyProgress: newProgress,
            customers,
            seatTeaStates: updatedTeaStates,
            performanceTick: newTick,
            seats: updatedSeats,
            currentInterruption: finalInterruption,
          })
        }
      },

      refillTea: (seatId: number) => {
        const state = get()
        if (!state.performanceActive) return
        const teaState = state.seatTeaStates.find((ts) => ts.seatId === seatId)
        if (!teaState) return
        const refillCost = 3

        if (state.gold < refillCost) return

        const emotionalMatch = calcEmotionalMatch(90, state.storyProgress) || teaState.emotionalMatch

        let patienceGain = 3
        let satisfactionGain = 5
        if (emotionalMatch) {
          patienceGain += 5
          satisfactionGain += 12
        }

        const updatedTeaStates = state.seatTeaStates.map((ts) =>
          ts.seatId === seatId
            ? {
                ...ts,
                temperature: 90,
                lastRefillTick: state.performanceTick,
                refillCount: ts.refillCount + 1,
                emotionalMatch,
                promptedUrge: false,
                lastPatienceGain: patienceGain,
                lastRefillEmotional: emotionalMatch,
              }
            : ts
        )

        const customers = state.customers.map((c) =>
          c.seatId === seatId
            ? {
                ...c,
                satisfaction: Math.max(0, Math.min(100, c.satisfaction + satisfactionGain)),
                patience: Math.max(0, Math.min(10, c.patience + patienceGain)),
              }
            : c
        )

        set({
          gold: state.gold - refillCost,
          seatTeaStates: updatedTeaStates,
          customers,
        })

        get().addLedgerRecord('支出', '续茶服务', refillCost, `为第${seatId}号桌续茶${emotionalMatch ? '（情绪契合，耐心+' + patienceGain + '）' : '（耐心+' + patienceGain + '）'}`)
      },

      dismissLeaveAlert: (alertId: string) => {
        set((s) => ({
          customerLeaveAlerts: s.customerLeaveAlerts.filter((a) => a.id !== alertId),
        }))
      },

      handleInterruption: (option: InterruptionOption) => {
        const state = get()
        if (!state.currentInterruption) return

        const customers = state.customers.map((c) => ({
          ...c,
          satisfaction: Math.max(0, Math.min(100, c.satisfaction + option.satisfactionEffect)),
        }))

        const newReputation = Math.max(0, Math.min(100, state.reputation + option.reputationEffect))

        set({
          currentInterruption: null,
          customers,
          gold: state.gold + option.goldEffect,
          reputation: newReputation,
        })

        if (option.goldEffect !== 0) {
          get().addLedgerRecord(
            option.goldEffect > 0 ? '收入' : '支出',
            '插话应对',
            Math.abs(option.goldEffect),
            option.text.slice(0, 20)
          )
        }

        if (option.reputationEffect !== 0) {
          set((s) => ({
            reputationHistory: [
              ...s.reputationHistory,
              {
                day: s.day,
                value: newReputation,
                delta: option.reputationEffect,
                reason: option.reputationEffect > 0 ? '插话应对得当' : '插话处理失当',
              },
            ],
          }))
        }
      },

      doSettlement: () => {
        const state = get()
        if (!state.currentStory || !state.currentBranch) return

        const result = calcSettlement(
          state.day,
          state.currentStory,
          state.currentBranch,
          state.customers,
          state.seats,
          state.renovations,
          state.storyHistory,
          state.lastStoryDay,
          state.storyScores,
          state.reputation,
          state.snacks,
          state.seatTeaStates
        )

        const storyRecord: StoryRecord = {
          day: state.day,
          storyId: state.currentStory.id,
          branchId: state.currentBranch.id,
          audienceCount: result.audienceCount,
          earnings: result.totalEarnings,
          avgSatisfaction: result.avgSatisfaction,
        }

        const newStoryScores = { ...state.storyScores }
        if (!newStoryScores[state.currentStory.id]) {
          newStoryScores[state.currentStory.id] = []
        }
        newStoryScores[state.currentStory.id] = [
          ...newStoryScores[state.currentStory.id],
          result.avgSatisfaction,
        ].slice(-10)

        const newRep = Math.max(0, Math.min(100, state.reputation + result.reputationDelta))

        const repHistory: ReputationHistory = {
          day: state.day,
          value: newRep,
          delta: result.reputationDelta,
          reason: result.reputationDelta >= 0 ? '说书好评' : '差评影响',
        }

        set((s) => ({
          isSettlement: true,
          lastSettlement: result,
          gold: s.gold + result.totalEarnings,
          reputation: newRep,
          storyHistory: [...s.storyHistory, storyRecord],
          lastStoryDay: { ...s.lastStoryDay, [state.currentStory!.id]: state.day },
          storyScores: newStoryScores,
          reputationHistory: [...s.reputationHistory, repHistory],
        }))

        get().addLedgerRecord('收入', '基础门票', result.baseEarnings, '晚场门票')
        if (result.tasteMatchBonus > 0)
          get().addLedgerRecord('收入', '口味匹配', result.tasteMatchBonus, '故事对味')
        if (result.seatViewBonus > 0)
          get().addLedgerRecord('收入', '视野加成', result.seatViewBonus, '座位优良')
        if (result.storyHeatBonus > 0)
          get().addLedgerRecord('收入', '热度加成', result.storyHeatBonus, '故事热门')
        if (result.serialExpectBonus > 0)
          get().addLedgerRecord('收入', '连载期待', result.serialExpectBonus, '观众期待')
        if (result.tips > 0)
          get().addLedgerRecord('收入', '客人打赏', result.tips, '客人满意打赏')
        if (result.snackRevenue > 0)
          get().addLedgerRecord('收入', '茶点售卖', result.snackRevenue, '消费茶点')
        if (result.teaCareBonus > 0)
          get().addLedgerRecord('收入', '茶温好评', result.teaCareBonus, '温度贴心，客人满意')
        if (result.badReviewPenalty > 0)
          get().addLedgerRecord('支出', '差评损失', result.badReviewPenalty, '客人不满索赔')
        if (result.teaNeglectPenalty > 0)
          get().addLedgerRecord('支出', '茶温怠慢', result.teaNeglectPenalty, '茶水凉透伤客')
        if (result.leftCustomerLoss > 0)
          get().addLedgerRecord('支出', '客人离席损失', result.leftCustomerLoss, '贵宾/雅座客愤然离席')
      },

      nextDay: () => {
        set((s) => ({
          day: s.day + 1,
          phase: 'day',
          weather: randomWeather(),
          customers: [],
          currentStory: null,
          currentBranch: null,
          storyProgress: 0,
          availableStories: [],
          performanceActive: false,
          currentInterruption: null,
          isSettlement: false,
          seats: s.seats.map((seat) => ({ ...seat, occupied: false })),
          seatTeaStates: [],
          performanceTick: 0,
          customerLeaveAlerts: [],
        }))
      },

      resetGame: () => {
        set({ ...initialState, weather: randomWeather() })
      },

      addLedgerRecord: (type, category, amount, note) => {
        set((s) => ({
          ledger: [
            ...s.ledger,
            {
              day: s.day,
              id: uid(),
              type,
              category,
              amount,
              note,
              timestamp: Date.now(),
            },
          ],
        }))
      },
    }),
    {
      name: 'teahouse-storyteller-save',
      partialize: (s) => ({
        day: s.day,
        phase: s.phase,
        gold: s.gold,
        reputation: s.reputation,
        weather: s.weather,
        snacks: s.snacks,
        seats: s.seats,
        renovations: s.renovations,
        customers: s.customers,
        currentStory: s.currentStory,
        currentBranch: s.currentBranch,
        storyProgress: s.storyProgress,
        availableStories: s.availableStories,
        performanceActive: s.performanceActive,
        seatTeaStates: s.seatTeaStates,
        performanceTick: s.performanceTick,
        customerLeaveAlerts: s.customerLeaveAlerts,
        ledger: s.ledger,
        storyHistory: s.storyHistory,
        reputationHistory: s.reputationHistory,
        lastStoryDay: s.lastStoryDay,
        storyScores: s.storyScores,
        isSettlement: s.isSettlement,
        lastSettlement: s.lastSettlement,
      }),
    }
  )
)
