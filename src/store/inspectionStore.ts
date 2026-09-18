import { create } from 'zustand'
import inspectionService from '../services/inspectionService'
import type {
  CreateInspectionInput,
  Inspection,
} from '../services/inspectionService'

interface InspectionStore {
  inspections: Inspection[]
  currentInspection: Inspection | null
  isLoading: boolean
  error: string | null

  createInspection: (input: CreateInspectionInput) => Promise<Inspection>
  getInspection: (id: string) => Promise<Inspection>
  listInspections: (userId: string) => Promise<Inspection[]>
  joinInspection: (sessionCode: string) => Promise<Inspection>
  updateInspection: (
    id: string,
    updates: Partial<Inspection>,
  ) => Promise<Inspection>

  clearError: () => void
  clearCurrentInspection: () => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export const useInspectionStore = create<InspectionStore>((set) => ({
  inspections: [],
  currentInspection: null,
  isLoading: false,
  error: null,

  createInspection: async (input) => {
    set({ isLoading: true, error: null })

    try {
      const inspection = await inspectionService.createInspection(input)

      set((state) => ({
        inspections: [inspection, ...state.inspections],
        currentInspection: inspection,
        isLoading: false,
      }))

      return inspection
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        isLoading: false,
        error: message,
      })

      throw error
    }
  },

  getInspection: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const inspection = await inspectionService.getInspection(id)

      set({
        currentInspection: inspection,
        isLoading: false,
      })

      return inspection
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        isLoading: false,
        error: message,
      })

      throw error
    }
  },

  listInspections: async (userId) => {
    set({ isLoading: true, error: null })

    try {
      const inspections = await inspectionService.listInspections(userId)

      set({
        inspections,
        isLoading: false,
      })

      return inspections
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        isLoading: false,
        error: message,
      })

      throw error
    }
  },

  joinInspection: async (sessionCode) => {
    set({ isLoading: true, error: null })

    try {
      const inspection = await inspectionService.joinInspection(sessionCode)

      set((state) => {
        const alreadyExists = state.inspections.some(
          (item) => item.id === inspection.id,
        )

        return {
          inspections: alreadyExists
            ? state.inspections.map((item) =>
                item.id === inspection.id ? inspection : item,
              )
            : [inspection, ...state.inspections],
          currentInspection: inspection,
          isLoading: false,
        }
      })

      return inspection
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        isLoading: false,
        error: message,
      })

      throw error
    }
  },

  updateInspection: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      const inspection = await inspectionService.updateInspection(
        id,
        updates,
      )

      set((state) => ({
        inspections: state.inspections.map((item) =>
          item.id === inspection.id ? inspection : item,
        ),
        currentInspection:
          state.currentInspection?.id === inspection.id
            ? inspection
            : state.currentInspection,
        isLoading: false,
      }))

      return inspection
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        isLoading: false,
        error: message,
      })

      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },

  clearCurrentInspection: () => {
    set({ currentInspection: null })
  },
}))