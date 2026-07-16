import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api/client.js'
import { logout } from './authSlice.js'

export const fetchCases = createAsyncThunk('data/fetchCases', async () => {
  return await api.getCases()
}, {
  condition: (force, { getState }) => {
    if (force) return true;
    const { casesStatus } = getState().data;
    if (casesStatus === 'loading' || casesStatus === 'succeeded') return false;
  }
})

export const fetchStats = createAsyncThunk('data/fetchStats', async () => {
  return await api.getStats()
}, {
  condition: (force, { getState }) => {
    if (force) return true;
    const { statsStatus } = getState().data;
    if (statsStatus === 'loading' || statsStatus === 'succeeded') return false;
  }
})

export const fetchGeminiStatus = createAsyncThunk('data/fetchGeminiStatus', async () => {
  const res = await api.getGeminiStatus()
  return res.gemini_configured
}, {
  condition: (_, { getState }) => {
    const { geminiStatus } = getState().data;
    if (geminiStatus === 'loading' || geminiStatus === 'succeeded') return false;
  }
})

export const fetchReviewQueue = createAsyncThunk('data/fetchReviewQueue', async () => {
  return await api.getReviewQueue()
}, {
  condition: (_, { getState }) => {
    const { reviewQueueStatus } = getState().data;
    if (reviewQueueStatus === 'loading' || reviewQueueStatus === 'succeeded') return false;
  }
})

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    cases: JSON.parse(localStorage.getItem('cases') || '[]'),
    casesStatus: localStorage.getItem('cases') ? 'succeeded' : 'idle',
    stats: JSON.parse(localStorage.getItem('stats') || 'null'),
    statsStatus: localStorage.getItem('stats') ? 'succeeded' : 'idle',
    geminiEnabled: localStorage.getItem('geminiEnabled') === 'true',
    geminiStatus: localStorage.getItem('geminiEnabled') !== null ? 'succeeded' : 'idle',
    reviewQueue: JSON.parse(localStorage.getItem('reviewQueue') || '[]'),
    reviewQueueStatus: localStorage.getItem('reviewQueue') ? 'succeeded' : 'idle',
  },
  reducers: {
    invalidateCases: (state) => {
      state.casesStatus = 'idle';
    },
    invalidateStats: (state) => {
      state.statsStatus = 'idle';
    },
    invalidateReviewQueue: (state) => {
      state.reviewQueueStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.cases = []
        state.casesStatus = 'idle'
        state.stats = null
        state.statsStatus = 'idle'
        state.geminiEnabled = false
        state.geminiStatus = 'idle'
        state.reviewQueue = []
        state.reviewQueueStatus = 'idle'
      })
      .addCase(fetchCases.pending, (state) => { state.casesStatus = 'loading' })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.casesStatus = 'succeeded'
        state.cases = action.payload
        localStorage.setItem('cases', JSON.stringify(action.payload))
      })
      .addCase(fetchCases.rejected, (state) => { state.casesStatus = 'failed' })
      
      .addCase(fetchStats.pending, (state) => { state.statsStatus = 'loading' })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded'
        state.stats = action.payload
        localStorage.setItem('stats', JSON.stringify(action.payload))
      })
      .addCase(fetchStats.rejected, (state) => { state.statsStatus = 'failed' })

      .addCase(fetchGeminiStatus.pending, (state) => { state.geminiStatus = 'loading' })
      .addCase(fetchGeminiStatus.fulfilled, (state, action) => {
        state.geminiStatus = 'succeeded'
        state.geminiEnabled = action.payload
        localStorage.setItem('geminiEnabled', action.payload)
      })
      .addCase(fetchGeminiStatus.rejected, (state) => { state.geminiStatus = 'failed' })

      .addCase(fetchReviewQueue.pending, (state) => { state.reviewQueueStatus = 'loading' })
      .addCase(fetchReviewQueue.fulfilled, (state, action) => {
        state.reviewQueueStatus = 'succeeded'
        state.reviewQueue = action.payload
        localStorage.setItem('reviewQueue', JSON.stringify(action.payload))
      })
      .addCase(fetchReviewQueue.rejected, (state) => { state.reviewQueueStatus = 'failed' })
  }
})

export const { invalidateCases, invalidateStats, invalidateReviewQueue } = dataSlice.actions;
export default dataSlice.reducer
