import { createRef, useState, useCallback } from 'react';

import type { HostInfo } from '@/api/services/hostService';

import type { TerminalRef } from '../components/x-term';

export interface TerminalSession {
  id: string;
  hostId: string;
  title: string;
  ref: React.RefObject<HTMLDivElement>;
  terminalRef: React.RefObject<TerminalRef>;
}

export function useTerminalSessions(initialId: string | undefined, hosts: HostInfo[] | undefined) {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  const getActiveSession = useCallback(() => {
    return sessions.find((s) => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  const handleActiveSession = useCallback(
    (action: (terminal: TerminalRef) => void) => {
      const activeSession = getActiveSession();
      if (activeSession?.terminalRef.current) {
        action(activeSession.terminalRef.current);
      }
    },
    [getActiveSession],
  );

  const createSession = (hostId: string) => {
    const host = hosts?.find((h: HostInfo) => h.id.toString() === hostId);
    const sameHostSessions = sessions.filter((s) => s.hostId === hostId);
    const sessionId = `${hostId}-${Date.now()}`;

    const newSession: TerminalSession = {
      id: sessionId,
      hostId,
      title: host
        ? `${host.name}@${host.hostServerUrl}${
            sameHostSessions.length ? ` (${sameHostSessions.length})` : ''
          }`
        : `终端${hostId}`,
      ref: createRef<HTMLDivElement>(),
      terminalRef: createRef<TerminalRef>(),
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(sessionId);
    return newSession;
  };

  const closeSession = (sessionId: string) => {
    if (sessionId === initialId) return;

    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        const closedIndex = prev.findIndex((s) => s.id === sessionId);
        if (newSessions.length > 0) {
          const nextSession = newSessions[closedIndex] || newSessions[closedIndex - 1];
          setActiveSessionId(nextSession.id);
        } else {
          setActiveSessionId('');
        }
      }
      return newSessions;
    });
  };

  const updateSessionTitles = useCallback(() => {
    if (hosts) {
      setSessions((prev) => {
        const updatedSessions = prev.map((session) => {
          const host = hosts.find((h) => h.id.toString() === session.hostId);
          if (!host) return session;

          const newTitle = `${host.name}@${host.hostServerUrl}`;
          return session.title !== newTitle
            ? {
                ...session,
                title: newTitle,
              }
            : session;
        });

        return prev.every((session, i) => session.title === updatedSessions[i].title)
          ? prev
          : updatedSessions;
      });
    }
  }, [hosts]);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    closeSession,
    updateSessionTitles,
    getActiveSession,
    handleActiveSession,
  };
}
