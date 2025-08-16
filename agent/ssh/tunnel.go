package ssh

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"sync"

	"github.com/creack/pty"
)

type SSHTunnel struct {
	cmd       *exec.Cmd
	pty       *os.File  // PTY master
	mu        sync.RWMutex
	connected bool
	onData    func([]byte) error // 回调函数，用于将输出发送到WebSocket
	onError   func(error)        // 错误回调
}

// NewSSHTunnel 创建新的终端隧道（不是真正的SSH，而是本地shell）
func NewSSHTunnel(localAddr, remoteAddr string) *SSHTunnel {
	return &SSHTunnel{}
}

// SetDataCallback 设置数据回调函数
func (t *SSHTunnel) SetDataCallback(callback func([]byte) error) {
	t.onData = callback
}

// SetErrorCallback 设置错误回调函数
func (t *SSHTunnel) SetErrorCallback(callback func(error)) {
	t.onError = callback
}

// Connect 启动本地shell
func (t *SSHTunnel) Connect() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.connected {
		return nil
	}

	// 根据操作系统选择shell
	var shell string
	var args []string
	
	switch runtime.GOOS {
	case "windows":
		// Windows 不支持 PTY，回退到普通模式
		shell = "cmd"
		args = []string{}
		return t.connectWithoutPTY(shell, args)
	case "darwin", "linux":
		shell = "/bin/bash"
		args = []string{"-i"} // 交互式shell
	default:
		shell = "/bin/sh"
		args = []string{"-i"}
	}

	log.Printf("Starting shell with PTY: %s %v", shell, args)

	// 创建命令
	t.cmd = exec.Command(shell, args...)
	
	// 设置环境变量
	t.cmd.Env = append(os.Environ(), 
		"TERM=xterm-256color",
		"LANG=en_US.UTF-8",
		"LC_ALL=en_US.UTF-8",
	)
	
	// 设置工作目录
	if homeDir, err := os.UserHomeDir(); err == nil {
		t.cmd.Dir = homeDir
	}
	
	// 使用 PTY 启动命令
	ptyFile, err := pty.Start(t.cmd)
	if err != nil {
		return fmt.Errorf("failed to start shell with PTY: %v", err)
	}
	t.pty = ptyFile

	// 设置初始终端大小
	if err := pty.Setsize(t.pty, &pty.Winsize{
		Rows: 40,
		Cols: 120,
	}); err != nil {
		log.Printf("Warning: failed to set initial terminal size: %v", err)
	}

	t.connected = true

	// 启动输出处理goroutine（PTY模式）
	go t.handlePTYOutput()
	
	// 监控进程状态
	go func() {
		if err := t.cmd.Wait(); err != nil {
			log.Printf("Shell process exited with error: %v", err)
		} else {
			log.Println("Shell process exited normally")
		}
		t.mu.Lock()
		t.connected = false
		t.mu.Unlock()
		if t.onError != nil {
			t.onError(fmt.Errorf("shell process exited"))
		}
	}()

	log.Println("Shell started successfully with PTY")
	return nil
}

// handlePTYOutput 处理PTY输出（合并了stdout和stderr）
func (t *SSHTunnel) handlePTYOutput() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PTY output handler panic: %v", r)
		}
	}()

	buffer := make([]byte, 4096)
	for {
		n, err := t.pty.Read(buffer)
		if err != nil {
			if err != io.EOF {
				log.Printf("PTY read error: %v", err)
				if t.onError != nil {
					t.onError(err)
				}
			}
			break
		}

		if n > 0 {
			// PTY输出不需要清理，直接发送原始数据
			data := make([]byte, n)
			copy(data, buffer[:n])
			
			// PTY输出正常，不需要详细日志
			if t.onData != nil {
				if err := t.onData(data); err != nil {
					log.Printf("Failed to send PTY output to WebSocket: %v", err)
					break
				}
			} else {
				log.Printf("Warning: onData callback is nil")
			}
		}
	}
}

// connectWithoutPTY Windows兼容性的回退方案
func (t *SSHTunnel) connectWithoutPTY(shell string, args []string) error {
	log.Printf("Starting shell without PTY: %s %v", shell, args)

	// 创建命令
	t.cmd = exec.Command(shell, args...)
	
	// 设置环境变量
	t.cmd.Env = append(os.Environ(), 
		"TERM=xterm",
		"PS1=$ ",
	)
	
	// 设置工作目录
	if homeDir, err := os.UserHomeDir(); err == nil {
		t.cmd.Dir = homeDir
	}
	
	// 使用标准输入输出（Windows回退模式）
	stdin, err := t.cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdin pipe: %v", err)
	}

	stdout, err := t.cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdout pipe: %v", err)
	}

	stderr, err := t.cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to get stderr pipe: %v", err)
	}

	// 启动命令
	if err := t.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start shell: %v", err)
	}

	// 创建一个伪PTY文件描述符来统一接口
	t.pty = stdin.(*os.File)
	t.connected = true

	// 启动输出处理goroutines（非PTY模式）
	go t.handleStandardOutput(stdout)
	go t.handleStandardError(stderr)
	
	// 监控进程状态
	go func() {
		if err := t.cmd.Wait(); err != nil {
			log.Printf("Shell process exited with error: %v", err)
		} else {
			log.Println("Shell process exited normally")
		}
		t.mu.Lock()
		t.connected = false
		t.mu.Unlock()
		if t.onError != nil {
			t.onError(fmt.Errorf("shell process exited"))
		}
	}()

	log.Println("Shell started successfully without PTY")
	return nil
}

// handleStandardOutput 处理标准输出（非PTY模式）
func (t *SSHTunnel) handleStandardOutput(stdout io.ReadCloser) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Shell output handler panic: %v", r)
		}
	}()

	buffer := make([]byte, 4096)
	for {
		n, err := stdout.Read(buffer)
		if err != nil {
			if err != io.EOF {
				log.Printf("Shell stdout read error: %v", err)
				if t.onError != nil {
					t.onError(err)
				}
			}
			break
		}

		if n > 0 {
			data := make([]byte, n)
			copy(data, buffer[:n])
			
			if t.onData != nil {
				if err := t.onData(data); err != nil {
					log.Printf("Failed to send shell output to WebSocket: %v", err)
					break
				}
			}
		}
	}
}

// handleStandardError 处理错误输出（非PTY模式）
func (t *SSHTunnel) handleStandardError(stderr io.ReadCloser) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Shell error handler panic: %v", r)
		}
	}()

	buffer := make([]byte, 4096)
	for {
		n, err := stderr.Read(buffer)
		if err != nil {
			if err != io.EOF {
				log.Printf("Shell stderr read error: %v", err)
			}
			break
		}

		if n > 0 && t.onData != nil {
			if err := t.onData(buffer[:n]); err != nil {
				log.Printf("Failed to send shell error to WebSocket: %v", err)
				break
			}
		}
	}
}

// SendInput 发送输入到shell
func (t *SSHTunnel) SendInput(data []byte) error {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if !t.connected || t.pty == nil {
		return fmt.Errorf("shell not connected")
	}

	// 记录控制字符以便调试
	if len(data) == 1 && data[0] == 3 {
		log.Printf("Ctrl+C signal sent to shell")
	}

	_, err := t.pty.Write(data)
	return err
}

// ResizeTerminal 调整终端大小
func (t *SSHTunnel) ResizeTerminal(width, height int) error {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if !t.connected || t.pty == nil {
		return fmt.Errorf("shell not connected")
	}

	// 使用PTY设置终端大小
	if err := pty.Setsize(t.pty, &pty.Winsize{
		Rows: uint16(height),
		Cols: uint16(width),
	}); err != nil {
		log.Printf("Failed to resize terminal to %dx%d: %v", width, height, err)
		return err
	}

	log.Printf("Terminal resized to %dx%d", width, height)
	return nil
}

// IsConnected 检查连接状态
func (t *SSHTunnel) IsConnected() bool {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.connected
}

// Close 关闭shell连接
func (t *SSHTunnel) Close() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if !t.connected {
		return nil
	}

	var errs []error

	if t.pty != nil {
		if err := t.pty.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if t.cmd != nil && t.cmd.Process != nil {
		if err := t.cmd.Process.Kill(); err != nil {
			errs = append(errs, err)
		}
		// 等待进程结束
		t.cmd.Wait()
	}

	t.connected = false
	log.Println("Shell closed")

	if len(errs) > 0 {
		return fmt.Errorf("errors closing shell: %v", errs)
	}

	return nil
}

// CheckLocalSSH 检查本地SSH服务是否可用（现在不需要了）
func CheckLocalSSH(addr string) error {
	// 不再需要检查SSH服务，因为我们直接使用本地shell
	log.Printf("Skipping SSH service check, using local shell instead")
	return nil
}