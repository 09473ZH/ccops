package alert

import (
	"sync"
	"time"
)

// AlertCheckState 告警检查状态
type AlertCheckState struct {
	TriggerStartTime time.Time // 首次触发时间
	LastCheckTime    time.Time // 最后检查时间
	CheckValues      []float64 // 最近的检查值记录
	RecoveryCount    int       // 恢复确认计数
	mutex            sync.RWMutex
}

const (
	// 恢复确认所需的连续正常次数
	minRecoveryChecks = 3
	// 保留最近的检查值数量
	maxCheckValues = 5
)

// AlertStateManager 告警状态管理器
type AlertStateManager struct {
	states map[string]*AlertCheckState // key: ruleId_hostId
	mutex  sync.RWMutex
}

var (
	stateManager *AlertStateManager
	stateOnce    sync.Once
)

// GetStateManager 获取告警状态管理器单例
func GetStateManager() *AlertStateManager {
	stateOnce.Do(func() {
		stateManager = &AlertStateManager{
			states: make(map[string]*AlertCheckState),
		}
	})
	return stateManager
}

// getOrCreateState 获取或创建检查状态
func (m *AlertStateManager) getOrCreateState(key string) *AlertCheckState {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if state, exists := m.states[key]; exists {
		return state
	}

	state := &AlertCheckState{
		CheckValues: make([]float64, 0, maxCheckValues),
	}
	m.states[key] = state
	return state
}

// CheckDuration 检查持续时间（优化后的逻辑）
func (m *AlertStateManager) CheckDuration(ruleKey string, duration uint64, value float64) bool {
	state := m.getOrCreateState(ruleKey)

	state.mutex.Lock()
	defer state.mutex.Unlock()

	now := time.Now()

	// 如果是首次触发或者已经重置
	if state.TriggerStartTime.IsZero() {
		state.TriggerStartTime = now
		state.LastCheckTime = now
		state.CheckValues = []float64{value}
		return false
	}

	// 更新检查时间和值
	state.LastCheckTime = now
	state.CheckValues = append(state.CheckValues, value)
	if len(state.CheckValues) > maxCheckValues {
		state.CheckValues = state.CheckValues[1:]
	}

	// 检查是否达到持续时间
	return now.Sub(state.TriggerStartTime).Seconds() >= float64(duration)
}

// ConfirmRecovery 确认恢复状态
func (m *AlertStateManager) ConfirmRecovery(ruleKey string, isNormal bool) bool {
	state := m.getOrCreateState(ruleKey)

	state.mutex.Lock()
	defer state.mutex.Unlock()

	if isNormal {
		state.RecoveryCount++
		if state.RecoveryCount >= minRecoveryChecks {
			// 确认恢复后重置状态
			m.ResetState(ruleKey)
			return true
		}
	} else {
		state.RecoveryCount = 0
	}

	return false
}

// ResetState 重置检查状态
func (m *AlertStateManager) ResetState(ruleKey string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	delete(m.states, ruleKey)
}

// CleanupStates 清理过期的状态
func (m *AlertStateManager) CleanupStates() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	now := time.Now()
	for key, state := range m.states {
		state.mutex.RLock()
		if now.Sub(state.LastCheckTime) > time.Hour {
			delete(m.states, key)
		}
		state.mutex.RUnlock()
	}
}
