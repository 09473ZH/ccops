import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useState, useRef, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { ITheme } from 'xterm';

import { cn } from '@/utils';

import { Terminal, TerminalRef } from './Terminal';

interface SplitTerminalProps {
  hostId: string;
  fontSize: number;
  fontFamily: string;
  theme: ITheme;
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
}

interface TerminalPane {
  id: string;
  hostId: string;
  children?: TerminalPane[];
  direction?: 'vertical' | 'horizontal';
}

const styles = {
  pane: {
    base: 'relative h-full p-3',
    active: 'ring-1 ring-blue-500/20',
    inactive: '',
  },
  controls: {
    container: 'absolute right-2 top-2 z-50 flex gap-1 transition-opacity',
    button:
      'flex h-6 w-6 items-center justify-center rounded bg-gray-800/90 text-gray-300 backdrop-blur-sm hover:bg-gray-700/90 hover:text-white',
  },
};
// TODO: 原生终端会受到分屏的影响，分屏关闭、打开、切换时，原生终端都会重新渲染

export const SplitTerminal = forwardRef<TerminalRef, SplitTerminalProps>(
  ({ hostId, fontSize, fontFamily, theme, onConnectionChange, className }, ref) => {
    const [rootPane, setRootPane] = useState<TerminalPane>({
      id: '1',
      hostId,
    });
    const mainTerminalRef = useRef<TerminalRef>(null);
    const [activePane, setActivePane] = useState<string>('1');

    // 创建一个 Map 来存储终端引用
    const terminalRefs = useRef<Map<string, TerminalRef>>(new Map());

    const handleSplitVertical = (paneId: string) => {
      setRootPane((current) => {
        if (!current.children) {
          // 第一次分屏
          return {
            id: 'root',
            hostId,
            direction: 'horizontal',
            children: [
              { id: current.id, hostId },
              { id: Date.now().toString(), hostId },
            ],
          };
        }
        // 在指定面板位置添加新的分屏
        return addPaneToTarget(current, paneId, 'horizontal');
      });
    };

    const handleSplitHorizontal = (paneId: string) => {
      setRootPane((current) => {
        if (!current.children) {
          return {
            id: 'root',
            hostId,
            direction: 'vertical',
            children: [
              { id: current.id, hostId },
              { id: Date.now().toString(), hostId },
            ],
          };
        }
        return addPaneToTarget(current, paneId, 'vertical');
      });
    };

    const addPaneToTarget = (
      root: TerminalPane,
      targetId: string,
      direction: 'vertical' | 'horizontal',
    ): TerminalPane => {
      if (!root.children) {
        if (root.id === targetId) {
          // 找到目标面板，创建新的分屏
          return {
            id: `split-${Date.now()}`,
            hostId,
            direction,
            children: [root, { id: Date.now().toString(), hostId }],
          };
        }
        return root;
      }

      // 递归处理子面板
      return {
        ...root,
        children: root.children.map((child) => addPaneToTarget(child, targetId, direction)),
      };
    };

    const removePane = (root: TerminalPane, targetId: string): TerminalPane | null => {
      // 如果是叶子节点，且不是目标节点，则保留
      if (!root.children) {
        return root.id === targetId ? null : root;
      }

      // 过滤掉目标节点，并递归处理其他节点
      const newChildren = root.children
        .map((child) => removePane(child, targetId))
        .filter(Boolean) as TerminalPane[];

      // 如果过滤后没有子节点了，返回 null
      if (newChildren.length === 0) {
        return null;
      }

      // 如果只剩一个子节点，直接返回这个子节点
      if (newChildren.length === 1) {
        return newChildren[0];
      }

      // 返回更新后的节点
      return {
        ...root,
        children: newChildren,
      };
    };

    const handleClose = (paneId: string) => {
      console.log('Closing pane:', paneId);
      if (paneId === '1') {
        return;
      }

      setRootPane((current) => {
        console.log('Current pane structure:', current);
        const result = removePane(current, paneId);
        console.log('New pane structure:', result);
        return result || { id: '1', hostId };
      });
      setActivePane('1');
    };

    const handleResize = useCallback(() => {
      // 遍历所有终端引用并触发 resize
      terminalRefs.current.forEach((terminal) => {
        if (terminal) {
          setTimeout(() => {
            // 这里假设我们在 TerminalRef 中添加了 fit 方法
            terminal.fit?.();
          }, 0);
        }
      });
    }, []);

    useEffect(() => {
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [handleResize]);

    const renderPane = (pane: TerminalPane): JSX.Element => {
      if (pane.children) {
        return (
          <Allotment vertical={pane.direction === 'vertical'}>
            {pane.children.map((child) => (
              <Allotment.Pane key={child.id} minSize={200} className="[&>div]:h-full">
                {renderPane(child)}
              </Allotment.Pane>
            ))}
          </Allotment>
        );
      }

      return (
        <div
          className={cn(
            styles.pane.base,
            'group relative',
            activePane === pane.id ? styles.pane.active : styles.pane.inactive,
          )}
          onClick={() => setActivePane(pane.id)}
        >
          <div className={styles.controls.container}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSplitVertical(pane.id);
              }}
              className={styles.controls.button}
              title="左右分屏"
            >
              ⎮
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSplitHorizontal(pane.id);
              }}
              className={styles.controls.button}
              title="上下分屏"
            >
              ―
            </button>
            {pane.id !== '1' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose(pane.id);
                }}
                className={styles.controls.button}
                title="关闭终端"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            )}
          </div>
          <Terminal
            ref={(terminalInstance) => {
              if (terminalInstance) {
                terminalRefs.current.set(pane.id, terminalInstance);
              } else {
                terminalRefs.current.delete(pane.id);
              }
              if (pane.id === '1') {
                mainTerminalRef.current = terminalInstance;
              }
            }}
            className="h-[calc(100vh-220px)]"
            hostId={pane.hostId}
            fontSize={fontSize}
            fontFamily={fontFamily}
            theme={theme}
            onConnectionChange={pane.id === '1' ? onConnectionChange : undefined}
          />
        </div>
      );
    };

    const handleReset = () => {
      setRootPane({
        id: '1',
        hostId,
      });
      setActivePane('1');
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        mainTerminalRef.current?.clear();
      },
      reconnect: () => {
        mainTerminalRef.current?.reconnect();
      },
      reset: handleReset,
    }));

    return (
      <div className={cn('flex h-full flex-col overflow-hidden', className)}>
        <div className="flex-1">{renderPane(rootPane)}</div>
      </div>
    );
  },
);

SplitTerminal.displayName = 'SplitTerminal';
